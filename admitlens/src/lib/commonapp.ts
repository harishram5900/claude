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
  const pages = raw.split("\f").map((pg) =>
    pg
      .split("\n")
      .map((l) => {
        let t = l.trim();
        for (const re of INLINE_NOISE) t = t.replace(re, " ").trim();
        return t;
      })
      .filter(Boolean),
  );
  const edge = (i: number, n: number) => i < 3 || i >= n - 3;
  const counts = new Map<string, number>();
  for (const pg of pages) for (const l of new Set(pg.filter((_, i) => edge(i, pg.length)))) counts.set(l, (counts.get(l) ?? 0) + 1);
  const repeated = (l: string) => pages.length >= 3 && (counts.get(l) ?? 0) >= Math.max(3, pages.length * 0.5);
  return pages
    .map((pg) => pg.filter((t, i) => !NOISE.some((re) => re.test(t)) && !(edge(i, pg.length) && (repeated(t) || /^\d{1,3}$/.test(t)))).join("\n"))
    .join("\n");
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
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return "";
  const full = Math.max(...lines.map((l) => l.length));
  const paras: string[] = [];
  let cur = "";
  for (const l of lines) {
    cur = cur ? `${cur} ${l}` : l;
    if (/[.!?"”]$/.test(l) && l.length < full * 0.7) {
      paras.push(cur);
      cur = "";
    }
  }
  if (cur) paras.push(cur);
  return paras.join("\n\n");
}

export function parseCommonApp(raw: string): ParseResult {
  // Normalize: unify line endings, collapse spaces, re-join words hyphenated across a line break.
  const text = cleanText(raw.replace(/\r/g, "").replace(/[ \t]+/g, " ")).replace(/([a-z])-\n([a-z])/g, "$1-$2");
  const flat = text.replace(/\n+/g, " ");
  const found: string[] = [];
  const missing: string[] = [];
  const profile: Partial<Profile> = { importedFrom: "Common App" };
  const funding: Partial<FundingExtras> = {};

  // Name
  const first = grab(flat, /First\s*\/?\s*given name:?\s*([A-Z][\w'-]+)/i);
  const last = grab(flat, /Last\s*\/?\s*family\s*\/?\s*surname:?\s*([A-Z][\w'-]+(?:[ -][A-Z][\w'-]+)?)(?=\s+(?:Suffix|Preferred|Former|Middle|Birth|Date|Address|Gender|Sex|Email|Phone|Contact|Permanent|[A-Z][a-z]+\s*(?:name|address|date)\b)|\s*$)/i) ?? grab(flat, /Last\s*\/?\s*family\s*\/?\s*surname:?\s*([A-Z][\w'-]+)/i);
  if (first || last) {
    profile.name = [first, last].filter(Boolean).join(" ");
    found.push("Name");
  }

  // State
  const st = grab(flat, /State\/Province:?\s*([A-Z]{2})\b/) ?? grab(flat, /,\s*([A-Z]{2})\s+\d{5}/);
  if (st) {
    profile.state = st;
    found.push("State");
  }

  // School
  const hs = grab(flat, /(?:Current or most recent secondary\/high school|Current school):?\s*([A-Z][^:]{3,80}?)(?=\s+(?:Date|Address|CEEB|Entry|Is this|School type))/i);
  if (hs) {
    profile.highSchool = hs;
    found.push("High school");
  }

  // Graduation / grade
  const grad = grab(flat, /Graduation date:?\s*(?:\w+\s+)?(20\d\d)/i);
  if (grad) {
    const now = new Date();
    const seniorYear = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
    profile.grade = Math.max(9, Math.min(12, 12 - (Number(grad) - seniorYear)));
    found.push("Graduation year");
  }

  // GPA
  const gpaStr = grab(flat, /Cumulative GPA:?\s*([0-9]\.[0-9]{1,3})/i);
  const scale = grab(flat, /GPA scale:?\s*([0-9]{1,3})/i);
  const weighting = grab(flat, /GPA weighting:?\s*(Weighted|Unweighted)/i) ?? grab(flat, /Weighting:?\s*(Weighted|Unweighted)/i);
  if (gpaStr) {
    let g = Number(gpaStr);
    const sc = scale ? Number(scale) : 4;
    if (sc && sc !== 4 && sc !== 5) g = (g / sc) * 4;
    if (weighting?.toLowerCase() === "weighted" || g > 4.0) profile.gpaWeighted = Math.round(g * 100) / 100;
    else profile.gpaUnweighted = Math.round(g * 100) / 100;
    found.push(`GPA (${gpaStr}${weighting ? `, ${weighting.toLowerCase()}` : ""})`);
  } else missing.push("GPA");

  // Class rank
  const rank = num(grab(flat, /Class rank:?\s*([0-9,]+)/i));
  const size = num(grab(flat, /Graduating class size(?:\s*\(approx\.?\))?:?\s*([0-9,]+)/i));
  if (rank && size) {
    profile.classRankPercent = Math.max(1, Math.round((rank / size) * 100));
    found.push(`Class rank (${rank}/${size})`);
  } else {
    const decile = grab(flat, /Class rank(?: reporting)?:?\s*(?:Top\s*)?([0-9]{1,2})\s*%/i);
    if (decile) {
      profile.classRankPercent = Number(decile);
      found.push(`Class rank (top ${decile}%)`);
    }
  }

  // SAT
  const satTotal = num(grab(flat, /(?:Highest )?SAT (?:total|composite)(?: score)?:?\s*(1[0-6]\d0|[4-9]\d0)/i));
  const ebrw = num(grab(flat, /(?:Highest )?evidence-based reading and writing score:?\s*([2-8]\d0)/i));
  const math = num(grab(flat, /(?:Highest )?math score:?\s*([2-8]\d0)/i));
  if (satTotal) profile.sat = satTotal;
  else if (ebrw && math) profile.sat = ebrw + math;
  if (profile.sat) found.push(`SAT (${profile.sat})`);

  // ACT
  const act = num(grab(flat, /(?:Highest )?(?:ACT )?composite score:?\s*([1-3]?\d)\b/i));
  if (act && act >= 1 && act <= 36) {
    profile.act = act;
    found.push(`ACT (${act})`);
  }
  if (!profile.sat && !profile.act) missing.push("Test scores (fine if applying test-optional)");

  // AP count — count distinct "AP " course mentions in coursework / test sections
  const apMatches = new Set((text.match(/\b(?:AP|IB(?: HL| SL)?)[ \t]+[A-Z][\w&:]*(?:[ \t]+[A-Z][\w&:]*)*/g) ?? []).map((s) => s.trim().toLowerCase()).filter((s) => !/^ap (scholar|score|exam)/.test(s)));
  if (apMatches.size) {
    profile.apCount = apMatches.size;
    found.push(`${apMatches.size} AP/IB courses`);
  }

  // Honors: "Honors title: X Grade level: 11, 12 Level(s) of recognition: State, National"
  const awards: Award[] = [];
  const honorRe = /Honors title:?\s*(.+?)\s+Grade level\(?s?\)?:?\s*[0-9, PG]+\s+Level\(?s?\)? of recognition:?\s*([A-Za-z/, ]+?)(?=\s+(?:Honors title|Activities|Activity type|Future plans|$))/gi;
  let hm: RegExpExecArray | null;
  while ((hm = honorRe.exec(flat))) awards.push({ id: `ca-h-${awards.length}`, name: hm[1].slice(0, 100), level: levelFromText(hm[2]) });
  if (awards.length) {
    profile.awards = awards;
    found.push(`${awards.length} honors`);
  } else missing.push("Honors");

  // Activities — split on "Activity type"
  const activities: Activity[] = [];
  const chunks = flat.split(/Activity type:?/i).slice(1);
  for (const chunk of chunks) {
    const end = chunk.search(/(?:Honors title|Personal essay|Writing\b|Additional information|Future plans|Contribution)/i);
    const c = end > 0 ? chunk.slice(0, end) : chunk;
    const category = (c.match(/^\s*([A-Za-z/&,'():\- ]{2,60}?)(?=\s+(?:Position|Organization|Please describe|Participation))/) ?? [])[1]?.trim() ?? "Other";
    const role = grab(c, /Position\/leadership description(?: and organization name)?:?\s*(.+?)(?=\s+(?:Organization name|Please describe|Participation))/i) ?? "";
    const org = grab(c, /(?<!and )Organization name:?\s*(.+?)(?=\s+(?:Please describe|Participation))/i) ?? "";
    const desc = (grab(c, /Please describe this activity[^:]*:?\s*(.+?)(?=\s+(?:Participation grade levels|Timing of participation|Hours spent|I intend))/i) ?? "").replace(/\s+/g, " ");
    const levels = grab(c, /Participation grade levels:?\s*([0-9, PG]+)/i) ?? "";
    const hours = num(grab(c, /Hours spent per week:?\s*([0-9.]+)/i)) ?? 3;
    const weeks = num(grab(c, /Weeks spent per year:?\s*([0-9]+)/i)) ?? 30;
    const years = Math.max(1, (levels.match(/\d+/g) ?? []).length);
    const blob = `${role} ${org} ${desc}`;
    const leadership = /(president|captain|founder|co-founder|director|chair|lead|head|editor|officer|manager|organizer|vice)/i.test(role);
    activities.push({
      id: `ca-a-${activities.length}`,
      name: (org || role.split(",")[0] || category).replace(/\s*Activity \d+$/i, "").slice(0, 100),
      role: role.replace(/\s*Activity \d+$/i, "").slice(0, 80),
      category,
      years,
      hoursPerWeek: hours,
      weeksPerYear: weeks,
      leadership,
      founder: /found/i.test(role),
      impact: impactFromText(blob),
      description: desc.slice(0, 150),
    });
  }
  if (activities.length) {
    profile.activities = activities;
    found.push(`${activities.length} activities`);
  } else missing.push("Activities");

  // Personal essay: text after the "Personal essay" heading, minus instructions and the prompt list.
  const essayStart = text.search(/(?:^|\n)\s*(?:Personal essay|Common App essay|Personal statement)[^\n]*\n/i);
  if (essayStart >= 0) {
    let body = text.slice(essayStart).replace(/^\s*(?:Personal essay|Common App essay|Personal statement)[^\n]*\n/i, "");
    const stop = body.search(/\n\s*(?:Disciplinary history|Additional information|Community disruption|Signature|Courses & Grades|Word count|Writing supplement|Supplement)/i);
    if (stop > 0) body = body.slice(0, stop);
    // Cut everything up to the end of the last Common App prompt or instruction that appears.
    let cut = 0;
    const markers = [...COMMON_APP_PROMPTS, "The essay demonstrates your ability to write clearly and concisely on a selected topic and helps you distinguish yourself in your own voice.", "What do we want to know about you? Keep that question at the center of your writing.", "Use the prompt to inspire and structure your response.", "Remember: 650 words is your limit, not your goal. Use the full range if you need it, but don't feel obligated to do so."];
    for (const m of markers) {
      const words = m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").split(/\s+/);
      // Longest matching prefix of the prompt (printouts sometimes clip long lines), then to end of that line.
      for (let n = words.length; n >= Math.min(8, words.length); n--) {
        const hit = new RegExp(words.slice(0, n).join("\\s+"), "i").exec(body);
        if (!hit) continue;
        if (hit.index < body.length * 0.6) {
          const eol = body.indexOf("\n", hit.index + hit[0].length);
          cut = Math.max(cut, eol < 0 ? hit.index + hit[0].length : eol);
        }
        break;
      }
    }
    body = body.slice(cut).replace(/^\s*(?:Prompt|Selected prompt|Essay)\s*:?\s*\n/i, "");
    const essay = reflow(body.trim());
    if (essay.split(/\s+/).length > 100) {
      profile.personalStatement = essay.slice(0, 6000);
      found.push(`Personal essay (${essay.split(/\s+/).length} words)`);
    }
  }
  if (!profile.personalStatement) missing.push("Personal essay");

  // Intended major
  const major = grab(text, /(?:Academic interests?|Intended major|Career interest):?[ \t]*([A-Z][A-Za-z ,&/-]{1,60})[ \t]*(?:\n|$)/i);
  if (major) {
    profile.intendedMajor = major;
    found.push("Intended major");
  }

  // Context
  if (/first[- ]generation/i.test(flat) || /Parent 1[^.]*Highest level of education:?\s*(?:None|Some (?:grade|high) school|High school graduate)/i.test(flat)) {
    profile.firstGen = true;
    found.push("First-generation indicator");
  }
  if (/Common App fee waiver.*(?:Yes|eligible)/i.test(flat) || /fee waiver:?\s*yes/i.test(flat)) {
    profile.lowIncome = true;
    found.push("Fee waiver indicator");
  }

  // Honors-level courses (shown in Courses & Grades); "Honors title" belongs to the honors section.
  const honorsCourses = new Set((text.match(/\bHonors[ \t]+(?!title)[A-Z][\w&:]*(?:[ \t]+[A-Z0-9][\w&:]*)*/g) ?? []).map((x) => x.trim().toLowerCase()));
  if (honorsCourses.size) profile.honorsCount = honorsCourses.size;

  // Citizenship / visa → used only to filter scholarships, never printed.
  const citizenship = grab(flat, /Citizenship status:?\s*(U\.?S\.? citizen or U\.?S\.? national|U\.?S\.? dual citizen|U\.?S\.? permanent resident|U\.?S\.? refugee or asylee|DACA[^:]*?|Other \(non-U\.?S\.?\)|[A-Za-z .()-]{3,40}?)(?=\s+(?:Visa|Country|Countries|Citizenship|Other citizenship|Years|Language|Birth|Place|Do you|Are you|Social|$))/i);
  const visa = grab(flat, /Visa type:?\s*([A-Z]{1,2}-?\d{0,2}|TPS|[A-Za-z0-9 -]{2,20}?)(?=\s+(?:Visa|Country|Countries|Citizenship|Other|Years|Language|Birth|Place|Do you|Are you|$))/i);
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
  const cityState = grab(flat, /(?:Permanent home address|Home address|Address):?\s*[^,]{3,80},\s*([A-Z][A-Za-z .'-]{1,40}),\s*[A-Z]{2}\s+\d{5}/i);
  if (cityState) funding.city = cityState;
  const dob = flat.match(/(?:Date of birth|Birth date):?\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (dob) {
    const born = new Date(Number(dob[3]), Number(dob[1]) - 1, Number(dob[2]));
    const now = new Date();
    let age = now.getFullYear() - born.getFullYear();
    if (now < new Date(now.getFullYear(), born.getMonth(), born.getDate())) age--;
    if (age >= 12 && age <= 30) funding.age = age;
  }

  return { profile, funding, found, missing };
}

type PdfJs = typeof import("pdfjs-dist");

/** Rebuilds text lines from a PDF, joining items that share a baseline (label + value rows). */
export async function pdfToText(pdfjs: Pick<PdfJs, "getDocument">, data: ArrayBuffer | Uint8Array): Promise<string> {
  const doc = await pdfjs.getDocument({ data: data instanceof Uint8Array ? data : new Uint8Array(data) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const item of content.items as { str: string; transform: number[] }[]) {
      if (!item.str?.trim()) continue;
      const [a, b, c2, d] = item.transform;
      // Watermarks ("PREVIEW") are rotated or printed far larger than body text.
      if (Math.abs(b) > 0.01 || Math.abs(c2) > 0.01 || Math.hypot(a, b) > 36 || Math.hypot(c2, d) > 36) continue;
      const y = Math.round(item.transform[5] / 3) * 3; // tolerate tiny baseline jitter
      const x = item.transform[4];
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)!.push({ x, s: item.str });
    }
    const lines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, parts]) => parts.sort((a, b) => a.x - b.x).map((p) => p.s.trim()).join(" "));
    pages.push(lines.join("\n"));
  }
  return pages.join("\n\f");
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
