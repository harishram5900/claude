// Parses the text of a Common App application PDF (Common App → "Preview" / "Download PDF")
// or text pasted from the Common App dashboard into an AdmitLens profile.
//
// Common App does not offer a public API for third-party apps to read a student's
// application, so import works from the student's own exported PDF. Nothing leaves the
// browser unless the student chooses AI-assisted parsing.
import type { Activity, Award, AwardLevel, ImpactLevel, Profile } from "./types";

export interface ParseResult {
  profile: Partial<Profile>;
  found: string[];
  missing: string[];
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
  const text = raw.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/([a-z])-\n([a-z])/g, "$1-$2");
  const flat = text.replace(/\n+/g, " ");
  const found: string[] = [];
  const missing: string[] = [];
  const profile: Partial<Profile> = { importedFrom: "Common App" };

  // Name
  const first = grab(flat, /First\s*\/?\s*given name:?\s*([A-Z][\w'-]+)/i);
  const last = grab(flat, /Last\s*\/?\s*family\s*\/?\s*surname:?\s*([A-Z][\w'-]+)/i);
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
    const end = chunk.search(/(?:Honors title|Personal essay|Writing\b|Additional information)/i);
    const c = end > 0 ? chunk.slice(0, end) : chunk;
    const category = (c.match(/^\s*([A-Za-z/&,'():\- ]{2,60}?)(?=\s+(?:Position|Organization|Please describe|Participation))/) ?? [])[1]?.trim() ?? "Other";
    const role = grab(c, /Position\/leadership description(?: and organization name)?:?\s*(.+?)(?=\s+(?:Organization name|Please describe|Participation))/i) ?? "";
    const org = grab(c, /(?<!and )Organization name:?\s*(.+?)(?=\s+(?:Please describe|Participation))/i) ?? "";
    const desc = grab(c, /Please describe this activity[^:]*:?\s*(.+?)(?=\s+(?:Participation grade levels|Timing of participation|Hours spent))/i) ?? "";
    const levels = grab(c, /Participation grade levels:?\s*([0-9, PG]+)/i) ?? "";
    const hours = num(grab(c, /Hours spent per week:?\s*([0-9.]+)/i)) ?? 3;
    const weeks = num(grab(c, /Weeks spent per year:?\s*([0-9]+)/i)) ?? 30;
    const years = Math.max(1, (levels.match(/\d+/g) ?? []).length);
    const blob = `${role} ${org} ${desc}`;
    const leadership = /(president|captain|founder|co-founder|director|chair|lead|head|editor|officer|manager|organizer|vice)/i.test(role);
    activities.push({
      id: `ca-a-${activities.length}`,
      name: org || role.split(",")[0] || category,
      role: role.slice(0, 80),
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

  // Personal essay — text after "Personal essay" header, before the next section
  const essayStart = text.search(/Personal essay[^\n]*\n/i);
  if (essayStart >= 0) {
    const after = text.slice(essayStart).replace(/^Personal essay[^\n]*\n/i, "");
    // Skip the prompt list if present
    const body = after.replace(/^(?:[\s\S]*?(?:Share an essay on any topic of your choice[^\n]*\n))/i, "");
    const stop = body.search(/\n\s*(?:Disciplinary history|Additional information|Community disruption|Signature|Courses & Grades)/i);
    const essay = reflow((stop > 0 ? body.slice(0, stop) : body).trim());
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

  return { profile, found, missing };
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
  return pages.join("\n");
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Worker is bundled with the app (no third-party CDN at runtime).
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  return pdfToText(pdfjs, await file.arrayBuffer());
}
