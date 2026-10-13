// Parses the text of a Common App application PDF (Common App → "Preview" / "Download PDF")
// or text pasted from the Common App dashboard into an AdmitLens profile.
//
// Common App does not offer a public API for third-party apps to read a student's
// application, so import works from the student's own exported PDF. Nothing leaves the
// browser unless the student chooses AI-assisted parsing.
import { COMMON_APP_PROMPTS } from "./essay";
import { EMPTY_FUNDING, type Activity, type Award, type AwardLevel, type FundingExtras, type ImpactLevel, type Profile } from "./types";

export interface ParseResult {
  profile: Partial<Profile>;
  /** Scholarship-eligibility details found in the application (citizenship, visa, city, age). */
  funding: Partial<FundingExtras>;
  found: string[];
  missing: string[];
  /** Things the student should check: fields the PDF didn't contain, or values we had to infer. */
  warnings: string[];
}

// Lines that are part of the printout, not the application: the "PREVIEW" watermark, page
// numbers, running headers/footers, browser print stamps, URLs and Common App IDs.
const NOISE: RegExp[] = [
  /^(?:print\s+)?preview$/i,
  /^(?:draft|sample|not submitted|this is a preview.*)$/i,
  /^page\s*\d+(?:\s*(?:of|\/)\s*\d+)?$/i,
  /^\d+\s*(?:of|\/)\s*\d+$/,
  /^(?:https?:\/\/|www\.)\S+$/i,
  /^\S*commonapp\.org\S*$/i,
  /^\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?:\s*[ap]\.?m\.?)?.*$/i,
  /^(?:caid|common app id|applicant id)\s*[:#]?\s*\d+$/i,
  /^common app(?:lication)?(?:\s+\d{4}\s*[-–]\s*\d{4})?(?:\s+preview)?$/i,
  /^(?:©|copyright).*common app.*$/i,
];
// Same pieces when they share a printed line with real content.
const INLINE_NOISE: RegExp[] = [
  /\s*\bpage\s+\d+\s+of\s+\d+\b\s*/gi,
  /\s*\b(?:caid|common app id)\s*[:#]?\s*\d{5,}\b\s*/gi,
  /\s*\bhttps?:\/\/\S*commonapp\.org\S*\s*/gi,
  /\s*\b\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}\s*(?:[ap]\.?m\.?)?\s*/gi,
  /(?:^|\s+)PREVIEW(?=\s|$)/g,
];

/** Removes printout artifacts. Lone numbers and lines repeated on most pages are dropped only
 *  near the top or bottom of a page, where running headers, footers and page numbers sit. */
export function cleanText(raw: string): string {
  // A page break is not a paragraph break: trim blank lines at the edges of each page.
  const pages = raw.split("\f").map((pg) =>
    pg
      .replace(/^\s*\n|\n\s*$/g, "")
      .split("\n")
      .map((l) => {
        let t = l.trim();
        for (const re of INLINE_NOISE) t = t.replace(re, " ").trim();
        return t;
      }),
  );
  const edge = (i: number, n: number) => i < 3 || i >= n - 3;
  const counts = new Map<string, number>();
  for (const pg of pages) for (const l of new Set(pg.filter((_, i) => edge(i, pg.length)))) counts.set(l, (counts.get(l) ?? 0) + 1);
  const repeated = (l: string) => pages.length >= 3 && (counts.get(l) ?? 0) >= Math.max(3, pages.length * 0.5);
  return pages
    .map((pg) => pg.filter((t, i) => !t || (!NOISE.some((re) => re.test(t)) && !(edge(i, pg.length) && (repeated(t) || /^\d{1,3}$/.test(t))))).join("\n"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n"); // blank lines are paragraph breaks; keep at most one
}

const COUNTRY_CODES: Record<string, string> = {
  india: "IN", mexico: "MX", china: "CN", philippines: "PH", nigeria: "NG", pakistan: "PK", bangladesh: "BD", "south korea": "KR", korea: "KR",
  vietnam: "VN", canada: "CA", "united kingdom": "GB", nepal: "NP", "sri lanka": "LK", brazil: "BR", colombia: "CO", "el salvador": "SV",
  guatemala: "GT", honduras: "HN", venezuela: "VE", cuba: "CU", "dominican republic": "DO", haiti: "HT", jamaica: "JM", ethiopia: "ET",
  ghana: "GH", kenya: "KE", egypt: "EG", iran: "IR", iraq: "IQ", afghanistan: "AF", ukraine: "UA", russia: "RU", poland: "PL", germany: "DE",
  france: "FR", italy: "IT", spain: "ES", japan: "JP", taiwan: "TW", "hong kong": "HK", israel: "IL", turkey: "TR", "saudi arabia": "SA",
  "united arab emirates": "AE", indonesia: "ID", thailand: "TH", malaysia: "MY", singapore: "SG", peru: "PE", ecuador: "EC", argentina: "AR",
  chile: "CL", somalia: "SO", syria: "SY", myanmar: "MM", burma: "MM", cameroon: "CM", "south africa": "ZA", australia: "AU", ireland: "IE",
};

/** Maps Common App's citizenship answers onto the scholarship filter's status options. */
function statusFrom(citizenship: string | null, visa: string | null): string | null {
  const c = (citizenship ?? "").toLowerCase();
  const v = (visa ?? "").toUpperCase().replace(/\s+/g, "");
  if (/u\.?s\.? citizen|dual citizen|u\.?s\.? national/.test(c)) return /national/.test(c) && !/citizen/.test(c) ? "national" : "citizen";
  if (/permanent resident/.test(c)) return "pr";
  if (/refugee|asylee/.test(c)) return /asylee/.test(c) && !/refugee/.test(c) ? "asylee" : "refugee";
  if (/daca/.test(c)) return "daca";
  if (v) {
    const map: Record<string, string> = { "F-1": "f1", F1: "f1", "J-1": "j1", J1: "j1", "H-4": "h4", H4: "h4", "L-2": "l2", L2: "l2", TPS: "tps", "T-1": "t_visa", T1: "t_visa" };
    if (map[v]) return map[v];
    if (/^(?:A|E|G|H|L|O|R|TN|TD)-?\d?$/.test(v) || /DEPENDENT/.test(v)) return "other_dependent";
  }
  return null;
}

const num = (s: string | undefined | null) => (s == null ? null : Number(s.replace(/,/g, "")));

function grab(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

function levelFromText(s: string): AwardLevel {
  const t = s.toLowerCase();
  if (t.includes("international")) return "international";
  if (t.includes("national")) return "national";
  if (t.includes("state")) return "state";
  if (t.includes("regional")) return "regional";
  return "school";
}

function impactFromText(s: string): ImpactLevel {
  const t = s.toLowerCase();
  if (/international|global|worldwide/.test(t)) return "international";
  if (/national|nationwide|usa |u\.s\./.test(t)) return "national";
  if (/state|statewide|all-state/.test(t)) return "state";
  if (/regional|city|county|district|community|local/.test(t)) return "local";
  return "school";
}

/** PDF text has a hard break at every printed line. Rejoin lines into paragraphs: a short
 *  line ending a sentence closes a paragraph; everything else continues it. */
function reflow(block: string) {
  const out: string[] = [];
  // Blank lines (extra space between rows in the PDF) are paragraph breaks.
  for (const part of block.split(/\n\s*\n/)) {
    const lines = part.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const full = Math.max(...lines.map((l) => l.length));
    let cur = "";
    for (const l of lines) {
      cur = cur ? `${cur} ${l}` : l;
      if (/[.!?"”]$/.test(l) && l.length < full * 0.7) {
        out.push(cur);
        cur = "";
      }
    }
    if (cur) out.push(cur);
  }
  return out.join("\n\n");
}

// Every Common App question label we read, so a value never runs into the next question.
const LABELS = [
  "Activity type",
  "Position/leadership description(?: and organization name)?",
  "Organization name",
  "Please describe this activity(?:,?\\s*including what you accomplished and any recognition you received,?\\s*etc\\.?)?",
  "Participation grade levels?",
  "Timing of participation",
  "Hours spent per week",
  "Weeks spent per year",
  "I intend to participate in a similar activity in college\\.?",
  "Activity \\d+",
  "Honor \\d+",
  "Honors? title",
  "Grade levels?",
  "Level\\(s\\) of recognition",
  "Course title",
  "Course level",
  "Course scheduling",
  "Course",
].join("|");

/** Value of a labeled field inside a chunk of text, stopping at the next known label. */
function fieldIn(chunk: string, label: string): string | null {
  const m = new RegExp(`(?:^|\\s)(?:${label})\\s*:?\\s*([\\s\\S]*?)(?=\\s+(?:${LABELS})\\s*:|\\s*\\n\\s*(?:${LABELS})\\b|$)`, "i").exec(chunk);
  const v = m?.[1]?.replace(/\s+/g, " ").trim();
  return v ? v : null;
}

/** Value on the same line as a label ("Label: value"), for the line-per-field text pdfToText produces. */
function lineField(text: string, label: string): string | null {
  const m = new RegExp(`^\\s*(?:${label})\\s*:?[ \\t]*(.+)$`, "im").exec(text);
  const v = m?.[1]?.trim();
  return v ? v : null;
}

const HEADINGS = /^(?:Profile|Personal information|Demographics|Family|Education|Grades|Current or most recent year courses|Courses(?: & grades)?|Testing|Honors|Activities|Community-based organizations|Future plans|Writing|Personal essay|Additional information|Community disruption|Disciplinary history|Signature|College questions|Contact details)\b/i;

/** Text between a section heading and the next top-level heading. */
function section(text: string, start: RegExp, endWords: string): string | null {
  const m = start.exec(text);
  if (!m) return null;
  const rest = text.slice(m.index + m[0].length);
  const end = new RegExp(`\\n\\s*(?:${endWords})\\s*(?:\\n|$)`, "i").exec(rest);
  return end ? rest.slice(0, end.index) : rest;
}

const ADVANCED = /\b(?:AP|A\.P\.|Advanced Placement|IB|International Baccalaureate|HL|SL|Dual[- ]Enrollment|Dual Credit|Concurrent Enrollment|College Credit|AICE|A-Level)\b/i;

export function parseCommonApp(raw: string): ParseResult {
  // Normalize: unify line endings, collapse spaces, drop printout artifacts, re-join hyphenated words.
  const text = cleanText(raw.replace(/\r/g, "").replace(/[ \t]+/g, " "))
    .replace(/([a-z])-\n([a-z])/g, "$1-$2")
    // Stacked layouts put the answer on the line under its question: "Question:\nAnswer" → "Question: Answer".
    .replace(/^([^\n]{2,140}?:)[ \t]*\n(?!\s*\n)(?![^\n]*:[ \t]*$)/gm, "$1 ");
  const flat = text.replace(/\n+/g, " ");
  const found: string[] = [];
  const missing: string[] = [];
  const warnings: string[] = [];
  const profile: Partial<Profile> = { importedFrom: "Common App" };
  const funding: Partial<FundingExtras> = {};
  const get = (label: string, flatRe?: RegExp) => lineField(text, label) ?? (flatRe ? grab(flat, flatRe) : null);

  // Name
  const firstRaw = get("First\\s*\\/?\\s*given name", /First\s*\/?\s*given name:?\s*([A-Z][\w'-]+)/i);
  const lastRaw = get("Last\\s*\\/?\\s*family\\s*\\/?\\s*surname", /Last\s*\/?\s*family\s*\/?\s*surname:?\s*([A-Z][\w'-]+)/i);
  const first = firstRaw?.match(/^[A-Z][\w'-]+(?:[ -][A-Z][\w'-]+)?/)?.[0] ?? null;
  const last = lastRaw?.match(/^[A-Z][\w'-]+(?:[ -][A-Z][\w'-]+)?/)?.[0] ?? null;
  if (first || last) {
    profile.name = [first, last].filter(Boolean).join(" ");
    found.push("Name");
  }

  // State and city from the home address
  const address = get("(?:Permanent home address|Home address|Address)");
  const st = (address ?? flat).match(/,\s*([A-Z]{2})\s+\d{5}/)?.[1] ?? grab(flat, /State\/Province:?\s*([A-Z]{2})\b/);
  if (st) {
    profile.state = st;
    found.push("State");
  }
  const city = (address ?? flat).match(/,\s*([A-Z][A-Za-z .'-]{1,40}),\s*[A-Z]{2}\s+\d{5}/)?.[1];
  if (city) funding.city = city.trim();

  // School
  const hs = lineField(text, "(?:Current or most recent secondary\\/high school|Current school)") ?? grab(flat, /(?:Current or most recent secondary\/high school|Current school):?\s*([A-Z][^:]{3,80}?)(?=\s+(?:Date|Address|CEEB|Entry|Is this|School type))/i);
  if (hs) {
    profile.highSchool = hs.replace(/\s+(?:CEEB|Address|Date of entry).*$/i, "").slice(0, 100);
    found.push("High school");
  }

  // Graduation year → current grade
  const grad = (get("Graduation date") ?? "").match(/20\d\d/)?.[0] ?? grab(flat, /Graduation date:?\s*(?:\w+\s+)?(20\d\d)/i);
  if (grad) {
    const now = new Date();
    const seniorYear = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
    profile.grade = Math.max(9, Math.min(12, 12 - (Number(grad) - seniorYear)));
    found.push("Graduation year");
  }

  // GPA (any scale, converted to 4.0 when needed)
  const gpaStr = (get("Cumulative GPA") ?? "").match(/\d{1,3}(?:\.\d{1,3})?/)?.[0] ?? grab(flat, /Cumulative GPA:?\s*(\d{1,3}(?:\.\d{1,3})?)/i);
  const scale = (get("GPA scale") ?? "").match(/\d{1,3}/)?.[0] ?? grab(flat, /GPA scale:?\s*([0-9]{1,3})/i);
  const weighting = (get("GPA weighting") ?? get("Weighting") ?? "").match(/Unweighted|Weighted/i)?.[0] ?? grab(flat, /(?:GPA )?weighting:?\s*(Weighted|Unweighted)/i);
  if (gpaStr) {
    let g = Number(gpaStr);
    const sc = scale ? Number(scale) : g > 5 ? 100 : 4;
    if (sc === 100 || sc === 10 || sc === 12) g = (g / sc) * 4;
    const weighted = weighting ? /^weighted/i.test(weighting) : g > 4.0;
    if (weighted) profile.gpaWeighted = Math.round(g * 100) / 100;
    else profile.gpaUnweighted = Math.round(Math.min(4, g) * 100) / 100;
    found.push(`GPA (${gpaStr}${scale ? ` on a ${scale} scale` : ""}${weighting ? `, ${weighting.toLowerCase()}` : ""})`);
  } else missing.push("GPA");

  // Class rank
  const rank = num((get("Class rank") ?? "").match(/^[0-9,]+/)?.[0] ?? grab(flat, /Class rank:?\s*([0-9,]+)/i));
  const size = num((get("Graduating class size(?:\\s*\\(approx\\.?\\))?") ?? "").match(/[0-9,]+/)?.[0] ?? grab(flat, /Graduating class size(?:\s*\(approx\.?\))?:?\s*([0-9,]+)/i));
  if (rank && size && rank <= size) {
    profile.classRankPercent = Math.max(1, Math.round((rank / size) * 100));
    found.push(`Class rank (${rank} of ${size})`);
  } else {
    const decile = grab(flat, /Class rank(?: reporting)?:?\s*(?:Top\s*)?([0-9]{1,2})\s*%/i);
    if (decile) {
      profile.classRankPercent = Number(decile);
      found.push(`Class rank (top ${decile}%)`);
    }
  }

  // SAT / ACT
  const satTotal = num(grab(flat, /(?:Highest )?SAT (?:total|composite)(?: score)?:?\s*(1[0-6]\d0|[4-9]\d0)\b/i));
  const ebrw = num(grab(flat, /(?:Highest )?evidence-based reading and writing score:?\s*([2-8]\d0)\b/i));
  const math = num(grab(flat, /(?:Highest )?math score:?\s*([2-8]\d0)\b/i));
  if (satTotal) profile.sat = satTotal;
  else if (ebrw && math) profile.sat = ebrw + math;
  if (profile.sat) found.push(`SAT (${profile.sat})`);
  const act = num(grab(flat, /(?:Highest )?(?:ACT )?composite score:?\s*([1-3]?\d)\b/i));
  if (act && act >= 1 && act <= 36) {
    profile.act = act;
    found.push(`ACT (${act})`);
  }
  if (!profile.sat && !profile.act) missing.push("Test scores (fine if applying test-optional)");

  // Courses: count AP / IB / dual-enrollment and honors from the course list, and AP exams from testing.
  const courses = section(text, /(?:^|\n)\s*(?:Current or most recent year courses|Courses & grades|Current year courses)\s*\n/i, "Testing|Honors|Activities|Community-based organizations|Future plans|Writing|Additional information|Family|Demographics");
  const advanced = new Set<string>();
  let honorsCourses = 0;
  let courseCount = 0;
  if (courses) {
    const entries = /Course title/i.test(courses)
      ? courses.split(/Course title\s*:?/i).slice(1).map((e) => ({ title: fieldIn(`Course title: ${e}`, "Course title") ?? e.trim(), level: fieldIn(`Course title: ${e}`, "Course level") ?? "" }))
      : courses.split("\n").map((l) => ({ title: l.replace(/^\s*Course\s*:?\s*/i, "").trim(), level: "" })).filter((e) => e.title.length > 2);
    for (const e of entries) {
      // A line can list several courses ("AP Calculus BC, AP Biology").
      const named = e.title.match(/\b(?:AP|IB(?: HL| SL)?)[ \t]+[A-Z][\w&:]*(?:[ \t]+[A-Z][\w&:]*)*/g) ?? [];
      if (named.length) for (const n of named) advanced.add(n.trim().toLowerCase());
      else if (ADVANCED.test(e.level) || ADVANCED.test(e.title)) advanced.add(e.title.toLowerCase());
      else if (/\bhonors?\b/i.test(`${e.title} ${e.level}`)) honorsCourses++;
      courseCount += Math.max(1, named.length);
    }
  }
  const testing = section(text, /(?:^|\n)\s*Testing\s*\n/i, "Honors|Activities|Community-based organizations|Future plans|Writing|Additional information|Education|Grades|Current or most recent year courses");
  const apExams = new Set<string>();
  if (testing) {
    for (const m of testing.matchAll(/AP (?:subject|exam)\s*:?\s*([A-Z][A-Za-z&:' ]{2,40}?)\s*(?:\n|$)/gi)) apExams.add(`ap ${m[1].trim().toLowerCase()}`);
    for (const m of testing.matchAll(/\bAP\s+([A-Z][A-Za-z&:']+(?:\s[A-Z][A-Za-z&:']+)*)\s*(?:[:-]\s*)?(?:Score\s*:?\s*)?[1-5]\b/g)) apExams.add(`ap ${m[1].trim().toLowerCase()}`);
  }
  const subject = (s: string) => s.replace(/^(?:ap|ib(?: hl| sl)?)\s+/, "").trim();
  const allAdvanced = new Set([...[...advanced].map(subject), ...[...apExams].map(subject)]);
  if (allAdvanced.size) {
    profile.apCount = allAdvanced.size;
    found.push(`${allAdvanced.size} AP/IB/dual-enrollment course${allAdvanced.size === 1 ? "" : "s"}${apExams.size ? ` (incl. ${apExams.size} AP exam${apExams.size === 1 ? "" : "s"})` : ""}`);
  }
  if (honorsCourses) profile.honorsCount = honorsCourses;
  if (courses && (courseCount >= 3 || advanced.size >= 1)) {
    const n = advanced.size;
    profile.rigor = n >= 5 ? 5 : n >= 3 ? 4 : n >= 1 ? 3 : 2;
    found.push(`Schedule rigor (${n} of ${Math.max(courseCount, n)} current courses are AP/IB/dual enrollment)`);
  } else if (!courses) missing.push("Course list (rigor)");

  // Honors: each entry has a title, grade level(s) and level(s) of recognition.
  const awards: Award[] = [];
  for (const chunk of flat.split(/Honors? title\s*:?/i).slice(1)) {
    const c = `Honors title: ${chunk}`;
    const title = fieldIn(c, "Honors? title")?.replace(/\s+Honor \d+$/i, "");
    if (!title) continue;
    const rec = fieldIn(c, "Level\\(s\\) of recognition");
    if (!rec) warnings.push(`Honor "${title.slice(0, 40)}": level of recognition not found; set to School. Check it in Honors.`);
    awards.push({ id: `ca-h-${awards.length}`, name: title.slice(0, 100), level: rec ? levelFromText(rec.slice(0, 60)) : "school" });
  }
  if (awards.length) {
    profile.awards = awards;
    found.push(`${awards.length} honor${awards.length === 1 ? "" : "s"}`);
  } else missing.push("Honors");

  // Activities: one entry per "Activity type".
  const activities: Activity[] = [];
  for (const chunk of flat.split(/Activity type\s*:?/i).slice(1)) {
    const c = `Activity type: ${chunk}`;
    const n = activities.length + 1;
    const category = fieldIn(c, "Activity type") ?? "Other";
    const role = fieldIn(c, "Position\\/leadership description(?: and organization name)?") ?? "";
    const org = fieldIn(c, "(?<!and )Organization name") ?? "";
    const desc = fieldIn(c, "Please describe this activity(?:,?\\s*including what you accomplished and any recognition you received,?\\s*etc\\.?)?") ?? "";
    const levels = fieldIn(c, "Participation grade levels?") ?? "";
    const hours = num(fieldIn(c, "Hours spent per week")?.match(/[0-9.]+/)?.[0]);
    const weeks = num(fieldIn(c, "Weeks spent per year")?.match(/[0-9]+/)?.[0]);
    const years = (levels.match(/\b(?:9|10|11|12|PG)\b/gi) ?? []).length;
    const missingBits = [hours == null && "hours per week", weeks == null && "weeks per year", !years && "grade levels"].filter(Boolean);
    if (missingBits.length) warnings.push(`Activity ${n} (${org || role || category}): ${missingBits.join(", ")} not found. Add them in your profile.`);
    activities.push({
      id: `ca-a-${activities.length}`,
      name: (org || role.split(",")[0] || category).replace(/\s*Activity \d+$/i, "").slice(0, 100),
      role: role.replace(/\s*Activity \d+$/i, "").slice(0, 80),
      category: category.replace(/\s*Activity \d+$/i, ""),
      years,
      hoursPerWeek: hours ?? 0,
      weeksPerYear: weeks ?? 0,
      leadership: /\b(president|captain|co-captain|founder|co-founder|director|chair|lead|leader|head|editor|officer|manager|organizer|vice|treasurer|secretary|coordinator)\b/i.test(role),
      founder: /\bfound(?:er|ed)\b/i.test(role),
      impact: impactFromText(`${role} ${org} ${desc}`),
      description: desc.slice(0, 150),
    });
  }
  if (activities.length) {
    profile.activities = activities;
    found.push(`${activities.length} activit${activities.length === 1 ? "y" : "ies"}`);
    warnings.push("Common App doesn't record how far each activity's impact reached (school, state, national). We set it from your descriptions; check it in Activities.");
  } else missing.push("Activities");

  // Personal essay: text after the "Personal essay" heading, minus instructions, prompts and printout lines.
  const essayStart = text.search(/(?:^|\n)\s*(?:Personal essay|Common App essay|Personal statement)\s*:?[^\n]{0,40}\n/i);
  if (essayStart >= 0) {
    let body = text.slice(essayStart).replace(/^\s*(?:Personal essay|Common App essay|Personal statement)[^\n]*\n/i, "");
    const stop = body.search(/\n\s*(?:Disciplinary history|Additional information|Community disruption|Signature|Courses & Grades|Word count|Writing supplement|Supplement|College questions)\b/i);
    if (stop > 0) body = body.slice(0, stop);
    let cut = 0;
    const markers = [...COMMON_APP_PROMPTS, "The essay demonstrates your ability to write clearly and concisely on a selected topic and helps you distinguish yourself in your own voice.", "What do we want to know about you? Keep that question at the center of your writing.", "Use the prompt to inspire and structure your response.", "Remember: 650 words is your limit, not your goal. Use the full range if you need it, but don't feel obligated to do so."];
    for (const m of markers) {
      const words = m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").split(/\s+/);
      for (let k = words.length; k >= Math.min(8, words.length); k--) {
        const hit = new RegExp(words.slice(0, k).join("\\s+"), "i").exec(body);
        if (!hit) continue;
        if (hit.index < body.length * 0.6) {
          const eol = body.indexOf("\n", hit.index + hit[0].length);
          cut = Math.max(cut, eol < 0 ? hit.index + hit[0].length : eol);
        }
        break;
      }
    }
    body = body.slice(cut).replace(/^\s*(?:Prompt|Selected prompt|Essay)\s*:?\s*\n/i, "");
    // Drop lines that belong to the printout, not the essay: the student's name on its own, short lines
    // repeated elsewhere in the document (running headers), and preview/ID/page stamps.
    const counts = new Map<string, number>();
    for (const l of text.split("\n")) counts.set(l.trim(), (counts.get(l.trim()) ?? 0) + 1);
    const name = (profile.name ?? "").toLowerCase();
    body = body
      .split("\n")
      .filter((l) => {
        const t = l.trim();
        if (!t) return true;
        if (name && t.toLowerCase().replace(/[:|]/g, "").trim() === name) return false;
        if (t.length < 70 && (counts.get(t) ?? 0) >= 2) return false;
        if (/\b(?:CAID|Common App ID|Application preview|Print preview|Printed (?:on )?\d|Page \d+ of \d+|commonapp\.org)\b/i.test(t) && t.length < 120) return false;
        if (/^(?:preview|draft|not submitted|word count:?\s*\d+|\d+ words?)$/i.test(t)) return false;
        return true;
      })
      .join("\n");
    const essay = reflow(body.trim());
    if (essay.split(/\s+/).length > 100) {
      profile.personalStatement = essay.slice(0, 6000);
      found.push(`Personal essay (${essay.split(/\s+/).length} words)`);
    }
  }
  if (!profile.personalStatement) missing.push("Personal essay");

  // Intended major
  const major = get("(?:Academic interests?|Intended major|Career interest)")?.match(/^[A-Z][A-Za-z ,&/-]{1,60}/)?.[0]?.trim() ?? null;
  if (major) {
    profile.intendedMajor = major;
    found.push("Intended major");
  }

  // First-generation: no parent with a bachelor's degree or higher (as reported in Family).
  const parentEd = [...text.matchAll(/Parent \d[^\n:]*highest level of education\s*:?\s*([^\n]+)/gi)].map((m) => m[1].trim());
  if (!parentEd.length) for (const m of flat.matchAll(/highest level of education\s*:?\s*(None|Some [a-z/ ]+?school|High school graduate|Some college\/university|Some college|Associate'?s? degree|Bachelor'?s? degree|Master'?s? degree|Doctoral[a-z ]*|Graduate school|Other\/unknown|Unknown)/gi)) parentEd.push(m[1]);
  const known = parentEd.filter((e) => !/unknown|other/i.test(e));
  if (known.length) {
    const degree = known.some((e) => /bachelor|master|doctor|graduate (?:school|degree)|professional degree|\bj\.?d\b|\bm\.?d\b|ph\.?d/i.test(e));
    profile.firstGen = !degree;
    found.push(degree ? "Parent education (not first-generation)" : "First-generation (no parent with a bachelor's degree)");
  }

  // Fee waiver (an explicit yes only)
  if (/fee waiver[^\n]{0,120}?:\s*Yes\b/i.test(text)) {
    profile.lowIncome = true;
    found.push("Fee waiver indicator");
  }

  // Citizenship / visa → used only to filter scholarships, never printed.
  const citizenship = lineField(text, "Citizenship status") ?? grab(flat, /Citizenship status:?\s*(U\.?S\.? citizen or U\.?S\.? national|U\.?S\.? dual citizen|U\.?S\.? permanent resident|U\.?S\.? refugee or asylee|DACA[^:]*?|Other \(non-U\.?S\.?\)|[A-Za-z .()-]{3,40}?)(?=\s+(?:Visa|Country|Countries|Citizenship|Other citizenship|Years|Language|Birth|Place|Do you|Are you|Social|$))/i);
  const visa = lineField(text, "Visa type")?.match(/^[A-Za-z0-9-]+/)?.[0] ?? grab(flat, /Visa type:?\s*([A-Z]{1,2}-?\d{0,2}|TPS|[A-Za-z0-9 -]{2,20}?)(?=\s+(?:Visa|Country|Countries|Citizenship|Other|Years|Language|Birth|Place|Do you|Are you|$))/i);
  const status = statusFrom(citizenship, visa);
  if (status) {
    funding.residenceStatus = status;
    found.push("Citizenship / visa status (private)");
  }
  const countriesRaw =
    grab(text, /(?:Other citizenship|Countries of citizenship|Country of citizenship|Citizenship country)(?:\(s\))?:?[ \t]*([A-Za-z ,]+?)[ \t]*(?:\n|$)/i) ??
    grab(flat, /(?:Other citizenship|Countries of citizenship|Country of citizenship)(?:\(s\))?:?\s*([A-Za-z]+(?:\s[A-Za-z]+)?)/i);
  if (countriesRaw) {
    const codes = countriesRaw.split(/,|\band\b/).map((x) => COUNTRY_CODES[x.trim().toLowerCase()]).filter((x): x is string => !!x && x !== "US");
    if (codes.length) funding.citizenships = [...new Set(codes)];
  }
  const dob = flat.match(/(?:Date of birth|Birth date):?\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (dob) {
    const born = new Date(Number(dob[3]), Number(dob[1]) - 1, Number(dob[2]));
    const now = new Date();
    let age = now.getFullYear() - born.getFullYear();
    if (now < new Date(now.getFullYear(), born.getMonth(), born.getDate())) age--;
    if (age >= 12 && age <= 30) funding.age = age;
  }

  return { profile, funding, found, missing, warnings };
}

type PdfJs = typeof import("pdfjs-dist");

interface PdfItem {
  s: string;
  x: number;
  xe: number;
  y: number;
  size: number;
}
interface Cell {
  x: number;
  xe: number;
  text: string;
}
interface PdfRow {
  y: number;
  cells: Cell[];
  text: string;
}

const JOINERS = /(?:,|-|\b(?:and|or|of|the|to|you|any|including|a|an|in|for|with|your|this|that|what|which))$/i;

/** Groups text items into rows by baseline, then splits each row into cells at wide gaps. */
function rowsOf(items: PdfItem[]): PdfRow[] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: { y: number; items: PdfItem[] }[] = [];
  for (const it of sorted) {
    const r = rows[rows.length - 1];
    if (r && Math.abs(r.y - it.y) <= Math.max(2, it.size * 0.35)) r.items.push(it);
    else rows.push({ y: it.y, items: [it] });
  }
  return rows.map((r) => {
    const its = r.items.sort((a, b) => a.x - b.x);
    const cells: Cell[] = [];
    for (const it of its) {
      const cur = cells[cells.length - 1];
      const gap = cur ? it.x - cur.xe : Infinity;
      if (cur && gap <= Math.max(12, it.size * 1.4)) {
        cur.text += gap > it.size * 0.12 && !cur.text.endsWith(" ") && !it.s.startsWith(" ") ? ` ${it.s}` : it.s;
        cur.xe = Math.max(cur.xe, it.xe);
      } else cells.push({ x: it.x, xe: it.xe, text: it.s });
    }
    for (const c of cells) c.text = c.text.replace(/\s+/g, " ").trim();
    const kept = cells.filter((c) => c.text);
    return { y: r.y, cells: kept, text: kept.map((c) => c.text).join(" ") };
  });
}

/** The x where the answer column starts on a two-column form page, if the page has one. */
function answerColumn(rows: PdfRow[], width: number): number | null {
  const counts = new Map<number, number>();
  for (const r of rows) {
    const xs = r.cells.length >= 2 ? r.cells.slice(1).map((c) => c.x) : r.cells[0] && r.cells[0].x > width * 0.28 ? [r.cells[0].x] : [];
    for (const x of xs) if (x > width * 0.22 && x < width * 0.75) counts.set(Math.round(x / 6) * 6, (counts.get(Math.round(x / 6) * 6) ?? 0) + 1);
  }
  let best: [number, number] | null = null;
  for (const [x, n] of counts) if (!best || n > best[1]) best = [x, n];
  return best && best[1] >= 3 ? best[0] - 6 : null;
}

/**
 * Rebuilds a Common App PDF as "Label: answer" lines.
 *  - Watermarks (rotated or oversized text) are dropped.
 *  - Running headers and footers (the same text at the top or bottom of several pages, with page
 *    numbers ignored) are dropped.
 *  - On two-column pages, a question label that wraps over several lines in the left column is
 *    re-joined and kept apart from its answer in the right column, so label text never leaks
 *    into answers.
 * Pages are separated by form feeds.
 */
export async function pdfToText(pdfjs: Pick<PdfJs, "getDocument">, data: ArrayBuffer | Uint8Array): Promise<string> {
  const doc = await pdfjs.getDocument({ data: data instanceof Uint8Array ? data : new Uint8Array(data) }).promise;
  const pages: { rows: PdfRow[]; width: number; height: number }[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items: PdfItem[] = [];
    for (const raw of content.items as { str: string; transform: number[]; width?: number }[]) {
      if (!raw.str?.trim()) continue;
      const [a, b, c, d, e, f] = raw.transform;
      if (Math.abs(b) > 0.01 || Math.abs(c) > 0.01) continue; // rotated: watermark
      const size = Math.hypot(c, d) || Math.hypot(a, b) || 10;
      if (size > 26) continue; // oversized: watermark
      items.push({ s: raw.str, x: e, xe: e + (raw.width ?? raw.str.length * size * 0.5), y: f, size });
    }
    pages.push({ rows: rowsOf(items), width: vp.width, height: vp.height });
  }

  // Running headers/footers: rows near the top or bottom edge whose text (digits ignored) repeats on 2+ pages.
  const key = (t: string) => t.replace(/\d+/g, "#").toLowerCase();
  const nearEdge = (r: PdfRow, h: number) => r.y > h * 0.92 || r.y < h * 0.08;
  const seen = new Map<string, number>();
  for (const pg of pages) for (const k of new Set(pg.rows.filter((r) => nearEdge(r, pg.height)).map((r) => key(r.text)))) seen.set(k, (seen.get(k) ?? 0) + 1);
  const isChrome = (r: PdfRow, h: number) => nearEdge(r, h) && (seen.get(key(r.text)) ?? 0) >= 2 && pages.length >= 2;

  const splits = pages.map((pg) => answerColumn(pg.rows, pg.width));
  const known = splits.filter((x): x is number => x != null);
  const fallback = known.length ? known.sort((a, b) => a - b)[Math.floor(known.length / 2)] : null;
  const out: string[] = [];
  for (const [pi, pg] of pages.entries()) {
    const rows = pg.rows.filter((r) => !isChrome(r, pg.height));
    // A short page (e.g. the last one) borrows the answer column found on the other pages.
    const split = splits[pi] ?? (fallback != null && rows.some((r) => r.cells.some((c) => Math.abs(c.x - fallback - 6) < 8)) ? fallback : null);
    const lines: string[] = [];
    // Typical line spacing on this page; a noticeably bigger gap before a text line marks a new paragraph.
    // Measured between consecutive full-width text lines, so short form rows don't skew it.
    const wide = rows.map((r) => split == null || r.cells.some((c) => c.x < split && c.xe > split + 24));
    const gaps = rows
      .slice(1)
      .map((r, k) => (wide[k] && wide[k + 1] ? rows[k].y - r.y : 0))
      .filter((g) => g > 0)
      .sort((a, b) => a - b);
    const lineGap = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 12;
    const paraBreak = (k: number) => k > 0 && rows[k - 1].y - rows[k].y > lineGap * 1.45;
    if (split == null) {
      for (const [k, r] of rows.entries()) {
        if (paraBreak(k)) lines.push("");
        lines.push(r.text);
      }
      out.push(lines.join("\n"));
      continue;
    }
    let label: string[] = [];
    let value: string[] = [];
    const flush = () => {
      if (!label.length && !value.length) return;
      const l = label.join(" ").replace(/\s+/g, " ").trim();
      if (!value.length) lines.push(l);
      else if (!l) lines.push(...value);
      else lines.push(`${l}${/[:?]$/.test(l) ? "" : ":"} ${value.join("\n")}`);
      label = [];
      value = [];
    };
    for (const [k, r] of rows.entries()) {
      const left = r.cells.filter((c) => c.x < split);
      const right = r.cells.filter((c) => c.x >= split);
      // A line that runs across both columns (essay text, long headings) stands on its own.
      if (left.some((c) => c.xe > split + 24)) {
        flush();
        if (paraBreak(k)) lines.push("");
        lines.push(r.text);
        continue;
      }
      const L = left.map((c) => c.text).join(" ");
      const R = right.map((c) => c.text).join(" ");
      if (L) {
        const prev = label[label.length - 1] ?? "";
        const continues = label.length > 0 && (/^[a-z(]/.test(L) || JOINERS.test(prev));
        if (continues) label.push(L);
        else {
          flush();
          label = [L];
        }
      }
      if (R) value.push(R);
    }
    flush();
    out.push(lines.join("\n"));
  }
  return out.join("\n\f");
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Worker is bundled with the app (no third-party CDN at runtime).
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  return pdfToText(pdfjs, await file.arrayBuffer());
}

/** Applies imported fields on top of the current profile. Scholarship details merge into `funding`. */
export function mergeImport(prev: Profile, partial: Partial<Profile>): Profile {
  const { funding, ...rest } = partial;
  return { ...prev, ...rest, ...(funding ? { funding: { ...EMPTY_FUNDING, ...(prev.funding ?? {}), ...funding } } : {}) };
}
