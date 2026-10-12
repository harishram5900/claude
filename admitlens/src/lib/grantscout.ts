// GrantScout engine (TypeScript port of grant_scout.py).
// Eligibility filter (immigration/citizenship status, location, grade, age, GPA, background, field),
// TF-IDF retrieval for profile fit, predictive priority score, location-ring sorting,
// "connect the dots" insights and a per-ring search plan. Runs entirely in the browser:
// status, income and background answers never leave the device and are never printed.

export type Vehicle =
  | "scholarship" | "grant" | "fellowship" | "prize" | "competition" | "internship" | "accelerator"
  | "program_stipend" | "free_program" | "microgrant" | "tuition_waiver" | "fee_waiver" | "work_study"
  | "service_conditional" | "forgivable_loan" | "dual_enrollment";

export type GeoLevel = "school" | "district" | "city" | "county" | "metro" | "region" | "state" | "province" | "national" | "continent" | "global";

export interface FundingRecord {
  name: string;
  sponsor: string;
  sponsor_type?: string;
  source_url: string;
  vehicle: Vehicle;
  selection_basis?: string[];
  amount_min?: number;
  amount_max?: number;
  amount_text?: string;
  program_value_usd?: number;
  renewable?: boolean;
  number_of_awards?: number | null;
  deadline?: string | null; // ISO
  deadline_typical?: string | null; // "MM-DD"
  cycle?: "annual" | "rolling" | "one-time";
  grade_levels?: string[];
  age_min?: number | null;
  age_max?: number | null;
  gpa_min?: number | null;
  status_rules?: string[];
  citizenship_text?: string;
  geo?: { level: GeoLevel; country?: string; state?: string; metro?: string; county?: string; city?: string; continent?: string };
  host_location?: string;
  background_focus?: string[];
  background_required?: boolean;
  fields_of_study?: string[];
  fields_required?: boolean;
  interests?: string[];
  need_based?: boolean;
  application_materials?: string[];
  essay_prompts?: string;
  application_fee?: number;
  description?: string;
  last_verified?: string | null; // confirmed on the sponsor's own page
  cross_checked?: string | null; // details matched against current listings, sponsor page not yet opened
  status?: "open" | "closed" | "discontinued";
  flags?: string[];
  unclaimed_signal?: boolean;
  user_added?: boolean;
}

export interface FundingProfile {
  name: string;
  grade: string; // "6".."12" or "college"
  age: number | null;
  gpa: number | null;
  location: { city: string; county: string; metro: string; state: string; country: string; continent: string };
  residence_status: string; // "" = prefer not to say
  has_work_authorization: boolean;
  citizenships: string[]; // ISO-2
  country_ties: string[]; // "IN:oci"
  heritage: string[];
  background: string[];
  intended_majors: string[];
  interests_activities: string[];
  parent_employers: string[];
  affiliations: string[];
  wants: string[];
  story: string;
}

// ---------------------------------------------------------------------------
// 1. Immigration / citizenship eligibility
// ---------------------------------------------------------------------------
export const RESIDENCE_STATUS_TOKENS: Record<string, string[]> = {
  citizen: ["citizen", "citizen_or_pr", "fafsa_eligible", "work_authorized"],
  national: ["citizen", "citizen_or_pr", "fafsa_eligible", "work_authorized"],
  pr: ["pr", "citizen_or_pr", "eligible_noncitizen", "fafsa_eligible", "work_authorized"],
  conditional_pr: ["pr", "citizen_or_pr", "eligible_noncitizen", "fafsa_eligible", "work_authorized"],
  refugee: ["refugee_asylee", "eligible_noncitizen", "fafsa_eligible", "work_authorized"],
  asylee: ["refugee_asylee", "eligible_noncitizen", "fafsa_eligible", "work_authorized"],
  parolee: ["eligible_noncitizen", "fafsa_eligible", "noncitizen"],
  t_visa: ["eligible_noncitizen", "fafsa_eligible", "noncitizen"],
  vawa: ["eligible_noncitizen", "fafsa_eligible", "noncitizen"],
  h4: ["dependent_visa", "noncitizen"],
  l2: ["dependent_visa", "noncitizen"],
  other_dependent: ["dependent_visa", "noncitizen"],
  f1: ["student_visa", "international", "noncitizen"],
  j1: ["student_visa", "international", "noncitizen"],
  daca: ["daca", "status_friendly", "noncitizen", "work_authorized"],
  tps: ["tps", "status_friendly", "noncitizen", "work_authorized"],
  undocumented: ["undocumented", "status_friendly", "noncitizen"],
  pending_ac: ["pending_ac", "noncitizen"],
  international: ["international", "noncitizen"],
};

export const STATUS_OPTIONS: [string, string][] = [
  ["", "Prefer not to say"],
  ["citizen", "U.S. citizen"],
  ["national", "U.S. national"],
  ["pr", "Permanent resident (green card)"],
  ["conditional_pr", "Conditional permanent resident"],
  ["refugee", "Refugee"],
  ["asylee", "Asylee"],
  ["parolee", "Parolee"],
  ["t_visa", "T visa"],
  ["vawa", "VAWA self-petitioner"],
  ["h4", "H-4 dependent"],
  ["l2", "L-2 dependent"],
  ["other_dependent", "Other dependent visa"],
  ["f1", "F-1 student"],
  ["j1", "J-1 exchange"],
  ["daca", "DACA"],
  ["tps", "TPS"],
  ["undocumented", "Undocumented"],
  ["pending_ac", "Green card pending"],
];

export function profileTokens(p: FundingProfile): Set<string> {
  const toks = new Set<string>(["ANY"]);
  const cc = (p.location.country || "US").toUpperCase();
  toks.add(`${cc}:resident_any`);
  for (const t of RESIDENCE_STATUS_TOKENS[(p.residence_status || "").toLowerCase()] ?? []) toks.add(`${cc}:${t}`);
  if (p.has_work_authorization) toks.add(`${cc}:work_authorized`);
  for (const raw of p.citizenships) {
    const c = raw.toUpperCase();
    toks.add(`${c}:citizen`);
    toks.add(`${c}:citizen_or_pr`);
    if (c !== cc) {
      toks.add(`${c}:citizen_abroad`);
      toks.add(`${c}:diaspora`);
      toks.add(`${cc}:international_citizen_of_${c}`);
    }
  }
  for (const tie of p.country_ties) {
    const [c, kind = ""] = tie.split(":");
    toks.add(`${c.toUpperCase()}:${kind.toLowerCase()}`);
    toks.add(`${c.toUpperCase()}:diaspora`);
  }
  return toks;
}

const COUNTRY_NAMES: Record<string, string> = {
  IN: "India", US: "the United States", MX: "Mexico", CN: "China", PH: "the Philippines", NG: "Nigeria", PK: "Pakistan",
  BD: "Bangladesh", KR: "South Korea", VN: "Vietnam", CA: "Canada", GB: "the United Kingdom", NP: "Nepal", LK: "Sri Lanka",
};
export const countryName = (cc: string) => COUNTRY_NAMES[cc.toUpperCase()] ?? cc.toUpperCase();

export function heritageCountries(p: FundingProfile) {
  const cc = (p.location.country || "US").toUpperCase();
  const out = new Set([...p.citizenships.map((c) => c.toUpperCase()), ...p.country_ties.map((t) => t.split(":")[0].toUpperCase())]);
  out.delete(cc);
  return out;
}

// ---------------------------------------------------------------------------
// 2. Location rings (closest first)
// ---------------------------------------------------------------------------
export const RINGS: [number, string][] = [
  [1, "Your county & city"],
  [2, "Your local hub / metro region"],
  [3, "Your state"],
  [4, "Your country (national)"],
  [5, "Home-country & diaspora funding"],
  [6, "Your continent"],
  [7, "Global / open worldwide"],
];
export const RING_NAME: Record<number, string> = Object.fromEntries(RINGS);
const LEVEL_TO_RING: Record<string, number> = { school: 1, district: 1, city: 1, county: 1, metro: 2, region: 2, state: 3, province: 3, national: 4, continent: 6, global: 7 };
const eq = (a?: string, b?: string) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

export function geoMatch(r: FundingRecord, p: FundingProfile): [boolean, number] {
  const g = r.geo ?? { level: "global" as GeoLevel };
  const level = (g.level || "global").toLowerCase();
  const cc = (p.location.country || "US").toUpperCase();
  const gcc = (g.country ?? "").toUpperCase();
  if (level === "global") return [true, 7];
  if (level === "continent") return [eq(g.continent, p.location.continent), 6];
  if (level === "national") {
    if (!gcc || gcc === cc) return [true, 4];
    if (heritageCountries(p).has(gcc)) return [true, 5];
    return [(r.flags ?? []).includes("open_to_nonresidents"), 5];
  }
  if (gcc && gcc !== cc) return [false, 9];
  const ring = LEVEL_TO_RING[level] ?? 4;
  const loc = p.location as Record<string, string>;
  for (const field of ["state", "metro", "county", "city"] as const) {
    const want = (g as Record<string, string | undefined>)[field];
    if (want && !eq(want, loc[field])) return [false, ring];
  }
  return [true, ring];
}

// ---------------------------------------------------------------------------
// 3. Record helpers
// ---------------------------------------------------------------------------
const VEHICLES: Vehicle[] = ["scholarship", "grant", "fellowship", "prize", "competition", "internship", "accelerator", "program_stipend", "free_program", "microgrant", "tuition_waiver", "fee_waiver", "work_study", "service_conditional", "forgivable_loan", "dual_enrollment"];
const GIFT_VEHICLES = new Set<Vehicle>(VEHICLES.filter((v) => v !== "forgivable_loan"));
export const SCAM_PATTERNS = /guaranteed|processing fee|application fee required|bank account|routing number|social security number|\bssn\b|credit card|you('| ha)ve (already )?won|act now/i;

export const recKey = (r: Pick<FundingRecord, "name" | "sponsor">) =>
  `${(r.name || "").toLowerCase().replace(/[^a-z0-9]/g, "")}|${(r.sponsor || "").toLowerCase().replace(/[^a-z0-9]/g, "")}`;

const parseDate = (s?: string | null) => {
  if (!s) return null;
  const d = new Date(`${String(s).slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};
const iso = (d: Date) => d.toISOString().slice(0, 10);
const dayDiff = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86400000);

/** Next deadline and whether it's an estimate from last cycle's date. */
export function nextDeadline(r: FundingRecord, today: Date): [Date | null, boolean] {
  const d = parseDate(r.deadline);
  if (d && d >= today) return [d, false];
  const typ = r.deadline_typical;
  if (typ && /^\d{2}-\d{2}$/.test(typ)) {
    const [m, dd] = typ.split("-").map(Number);
    let cand = new Date(today.getFullYear(), m - 1, dd, 12);
    if (cand < today) cand = new Date(today.getFullYear() + 1, m - 1, dd, 12);
    return [cand, true];
  }
  if (d && d < today && (r.cycle ?? "annual") === "annual") {
    let cand = new Date(today.getFullYear(), d.getMonth(), d.getDate(), 12);
    if (cand < today) cand = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate(), 12);
    return [cand, true];
  }
  return [null, false];
}

// ---------------------------------------------------------------------------
// 4. Lightweight RAG: TF-IDF retrieval
// ---------------------------------------------------------------------------
const STOP = new Set("a an and the of for to in on at by with from or is are be as this that your you students student program award awards scholarship scholarships".split(" "));
export const tokenize = (text: string) => ((text || "").toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => !STOP.has(w) && w.length > 1);

const recordText = (r: FundingRecord) =>
  [r.name, r.sponsor, r.description, r.vehicle, (r.selection_basis ?? []).join(" "), (r.fields_of_study ?? []).join(" "), (r.background_focus ?? []).join(" "), (r.interests ?? []).join(" "), r.essay_prompts].filter(Boolean).join(" ");

export const profileText = (p: FundingProfile) =>
  [p.intended_majors.join(" "), p.interests_activities.join(" "), p.background.join(" "), p.heritage.join(" "), p.affiliations.join(" "), p.wants.join(" "), p.story].filter(Boolean).join(" ");

class TfIdf {
  private idf = new Map<string, number>();
  private vecs: Map<string, number>[];
  constructor(docs: string[]) {
    const counts = docs.map((d) => countWords(tokenize(d)));
    const n = counts.length || 1;
    const df = new Map<string, number>();
    for (const c of counts) for (const w of c.keys()) df.set(w, (df.get(w) ?? 0) + 1);
    for (const [w, c] of df) this.idf.set(w, Math.log((n + 1) / (c + 1)) + 1);
    this.vecs = counts.map((c) => this.vec(c));
  }
  private vec(counts: Map<string, number>) {
    const v = new Map<string, number>();
    let norm = 0;
    for (const [w, c] of counts) {
      const x = (1 + Math.log(c)) * (this.idf.get(w) ?? 1);
      v.set(w, x);
      norm += x * x;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [w, x] of v) v.set(w, x / norm);
    return v;
  }
  score(query: string) {
    const q = this.vec(countWords(tokenize(query)));
    return this.vecs.map((v) => {
      let s = 0;
      for (const [w, x] of v) s += (q.get(w) ?? 0) * x;
      return s;
    });
  }
}
function countWords(ws: string[]) {
  const m = new Map<string, number>();
  for (const w of ws) m.set(w, (m.get(w) ?? 0) + 1);
  return m;
}

// ---------------------------------------------------------------------------
// 5. Eligibility filter
// ---------------------------------------------------------------------------
// Phrase match on word boundaries: "robotics" ~ "robotics team", but "art" must not match "startup".
const within = (needle: string, hay: string) => new RegExp(`(^|[^a-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(hay);
const fuzzyOverlap = (a: string[], b: string[]) => a.some((x) => b.some((y) => x && y && (within(x, y) || within(y, x))));

function gradeOk(r: FundingRecord, p: FundingProfile) {
  const gl = (r.grade_levels ?? []).map((g) => String(g).toLowerCase());
  if (!gl.length || gl.includes("any")) return true;
  const g = String(p.grade).toLowerCase();
  const aliases = new Set([g]);
  if (g === "12" || g === "senior") ["12", "senior", "graduating_senior"].forEach((x) => aliases.add(x));
  if (g.startsWith("college")) ["college", "undergrad"].forEach((x) => aliases.add(x));
  return gl.some((x) => aliases.has(x));
}

const WANT_ALIAS: Record<string, string> = {
  program_stipend: "internship", free_program: "fellowship", prize: "competition", microgrant: "grant", tuition_waiver: "grant",
  fee_waiver: "grant", work_study: "grant", service_conditional: "scholarship", dual_enrollment: "grant",
};

export function checkEligibility(r: FundingRecord, p: FundingProfile, toks: Set<string>, today: Date, strict = false) {
  const why: string[] = [];
  const review: string[] = [];
  if (["closed", "discontinued"].includes((r.status ?? "open").toLowerCase())) why.push("closed/discontinued");
  if ((r.application_fee ?? 0) > 0) why.push("charges an application fee (scam rule)");
  if (SCAM_PATTERNS.test([r.description, r.citizenship_text, r.essay_prompts].filter(Boolean).join(" "))) why.push("scam warning signs in wording");
  if (!GIFT_VEHICLES.has(r.vehicle)) review.push("not gift aid: repayment possible");
  const wants = p.wants.map((w) => w.toLowerCase());
  if (wants.length && !wants.includes("all") && !wants.includes(r.vehicle) && !wants.includes(WANT_ALIAS[r.vehicle] ?? "")) why.push("type not wanted");
  const rules = r.status_rules ?? [];
  if (rules.length) {
    if (!rules.some((t) => toks.has(t))) why.push("citizenship / immigration status not eligible");
  } else {
    if (strict) why.push("eligibility wording unknown (strict mode)");
    review.push("status wording not confirmed: read eligibility before applying");
  }
  const [geoOk, ring] = geoMatch(r, p);
  if (!geoOk) why.push("outside geographic area");
  if (!gradeOk(r, p)) why.push("grade level");
  if (p.age != null) {
    if (r.age_min && p.age < r.age_min) why.push(`age under ${r.age_min}`);
    if (r.age_max && p.age > r.age_max) why.push(`age over ${r.age_max}`);
  }
  if (r.gpa_min && p.gpa != null && p.gpa < r.gpa_min) why.push(`GPA below ${r.gpa_min}`);
  const bg = [...p.background, ...p.heritage].map((b) => b.toLowerCase());
  const focus = (r.background_focus ?? []).map((b) => b.toLowerCase());
  if (r.background_required && focus.length && !focus.some((f) => bg.includes(f))) why.push("background-specific award");
  const majors = p.intended_majors.map((m) => m.toLowerCase());
  const fields = (r.fields_of_study ?? []).map((f) => f.toLowerCase());
  if (r.fields_required && fields.length && !fuzzyOverlap(fields, majors)) why.push("field of study");
  const [d, est] = nextDeadline(r, today);
  if (d === null && parseDate(r.deadline) && r.cycle === "one-time") why.push("deadline passed");
  if (est) review.push("deadline is last cycle's date: confirm the new date");
  const lv = parseDate(r.last_verified);
  if (!lv) review.push(r.cross_checked ? `cross-checked ${r.cross_checked} against current listings: confirm on the sponsor page` : "not yet verified on the sponsor page");
  else if (dayDiff(today, lv) > 365) review.push("stale: last verified over 12 months ago");
  return { ok: why.length === 0, why, review, ring };
}

// ---------------------------------------------------------------------------
// 6. Predictive priority score
// ---------------------------------------------------------------------------
const BASE_WIN: Record<number, number> = { 1: 0.2, 2: 0.12, 3: 0.06, 4: 0.015, 5: 0.05, 6: 0.01, 7: 0.006 };

export function winProbability(r: FundingRecord, ring: number) {
  let p = BASE_WIN[ring] ?? 0.01;
  const n = r.number_of_awards;
  if (n) p *= Math.min(4, 1 + Math.log10(Math.max(n, 1)));
  if ((r.status_rules ?? []).length && !(r.status_rules ?? []).includes("ANY")) p *= 1.3;
  if (r.background_required) p *= 1.5;
  if (r.fields_required) p *= 1.3;
  const effort = (r.application_materials ?? []).filter((m) => ["essay", "video", "portfolio", "project", "interview"].includes(m)).length;
  p *= 1 + 0.15 * effort;
  if ((r.selection_basis ?? []).includes("no_essay")) p *= 0.2;
  if (["grant", "tuition_waiver", "fee_waiver", "work_study"].includes(r.vehicle) && r.need_based) p = Math.max(p, 0.6);
  return Math.max(0.001, Math.min(p, 0.9));
}

export function awardValue(r: FundingRecord) {
  let v = Math.max(r.amount_max ?? 0, r.amount_min ?? 0, r.program_value_usd ?? 0);
  if (r.renewable && r.amount_max && v === r.amount_max) v = r.amount_max * 4;
  return v;
}

function priority(r: FundingRecord, ring: number, fit: number, review: string[], today: Date) {
  const value = awardValue(r);
  const winp = winProbability(r, ring);
  const ev = value * winp;
  let s = 30 * Math.min(1, fit * 2.5);
  s += value ? 20 * Math.min(1, Math.log10(value + 1) / 5) : 4;
  s += 20 * Math.min(1, Math.log10(ev + 1) / 4);
  const [d] = nextDeadline(r, today);
  if (d) {
    const days = dayDiff(d, today);
    s += days >= 7 && days <= 90 ? 10 : days > 90 ? 6 : 3;
  }
  s += r.unclaimed_signal ? 8 : 0;
  s += ["scholarship", "grant", "microgrant", "tuition_waiver"].includes(r.vehicle) ? 7 : 4;
  s += parseDate(r.last_verified) ? 5 : 0;
  s -= 3 * review.filter((x) => x.startsWith("status wording")).length;
  return { score: Math.round(Math.max(0, Math.min(100, s)) * 10) / 10, winProb: winp, expectedValue: Math.round(ev) };
}

function attributeFit(r: FundingRecord, p: FundingProfile) {
  let bonus = 0;
  if (fuzzyOverlap((r.fields_of_study ?? []).map((f) => f.toLowerCase()), p.intended_majors.map((m) => m.toLowerCase()))) bonus += 0.15;
  const bg = [...p.background, ...p.heritage].map((b) => b.toLowerCase());
  if ((r.background_focus ?? []).some((b) => bg.includes(b.toLowerCase()))) bonus += 0.15;
  if (fuzzyOverlap((r.interests ?? []).map((i) => i.toLowerCase()), p.interests_activities.map((a) => a.toLowerCase()))) bonus += 0.1;
  return bonus;
}

function whyMatch(r: FundingRecord, p: FundingProfile, ring: number) {
  const bits = [RING_NAME[ring].replace(/^Your /, "")];
  const majors = p.intended_majors.map((m) => m.toLowerCase());
  const f = (r.fields_of_study ?? []).filter((x) => fuzzyOverlap([x.toLowerCase()], majors));
  if (f.length) bits.push(`major: ${f.slice(0, 2).join(", ")}`);
  const acts = p.interests_activities.map((a) => a.toLowerCase());
  const i = (r.interests ?? []).filter((x) => fuzzyOverlap([x.toLowerCase()], acts));
  if (i.length) bits.push(`fits your ${i.slice(0, 2).join(", ")}`);
  const rules = r.status_rules ?? [];
  if (rules.includes("ANY")) bits.push("open to all statuses");
  else if (rules.join(" ").includes("status_friendly") || rules.some((t) => /:(daca|tps|undocumented)$/.test(t))) bits.push("status-friendly");
  if (r.unclaimed_signal) bits.push("often under-claimed");
  return bits.join("; ");
}

// ---------------------------------------------------------------------------
// 7. Ranking
// ---------------------------------------------------------------------------
export interface Ranked {
  rec: FundingRecord;
  ring: number;
  score: number;
  winProb: number;
  expectedValue: number;
  deadline: string;
  deadlineEstimated: boolean;
  review: string[];
  why: string;
}

export function rank(p: FundingProfile, records: FundingRecord[], opts: { strict?: boolean; today?: Date } = {}) {
  const today = opts.today ?? new Date();
  const toks = profileTokens(p);
  const seen = new Set<string>();
  const uniq = records.filter((r) => {
    const k = recKey(r);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const sims = new TfIdf(uniq.map(recordText)).score(profileText(p));
  const kept: Ranked[] = [];
  const dropped = new Map<string, number>();
  uniq.forEach((r, i) => {
    const e = checkEligibility(r, p, toks, today, opts.strict);
    if (!e.ok) {
      for (const w of e.why) dropped.set(w, (dropped.get(w) ?? 0) + 1);
      return;
    }
    const fit = sims[i] + attributeFit(r, p);
    const pr = priority(r, e.ring, fit, e.review, today);
    const [d, est] = nextDeadline(r, today);
    kept.push({ rec: r, ring: e.ring, ...pr, deadline: d ? iso(d) : "", deadlineEstimated: est, review: e.review, why: whyMatch(r, p, e.ring) });
  });
  kept.sort((a, b) => a.ring - b.ring || b.score - a.score);
  return { kept, dropped: Object.fromEntries(dropped) as Record<string, number> };
}

// ---------------------------------------------------------------------------
// 8. "Connect the dots" insights
// ---------------------------------------------------------------------------
const ESSAY_THEMES: Record<string, string[]> = {
  "Leadership & initiative": ["leader", "leadership", "initiative", "founded", "started"],
  "Overcoming adversity": ["adversity", "challenge", "obstacle", "hardship", "overcome", "resilien"],
  "Community impact & service": ["community", "service", "volunteer", "impact"],
  "Career goals & major": ["career", "goal", "major", "future", "aspir"],
  "Identity & heritage": ["identity", "heritage", "culture", "background", "immigrant"],
  "Innovation & entrepreneurship": ["innovat", "entrepreneur", "startup", "venture", "build", "invent"],
  "Research & STEM project": ["research", "science", "project", "experiment", "engineering"],
  "Creative portfolio": ["portfolio", "art", "writing", "music", "film", "creative"],
};

export function essayClusters(items: Ranked[]) {
  const clusters = new Map<string, string[]>();
  for (const it of items) {
    const r = it.rec;
    if (!(r.application_materials ?? []).some((m) => ["essay", "video", "portfolio"].includes(m))) continue;
    const tl = `${r.essay_prompts ?? ""} ${r.description ?? ""}`.toLowerCase();
    let best: [string, number] | null = null;
    for (const [theme, kws] of Object.entries(ESSAY_THEMES)) {
      const hits = kws.reduce((a, k) => a + tl.split(k).length - 1, 0);
      if (hits && (!best || hits > best[1])) best = [theme, hits];
    }
    const key = best ? best[0] : "General personal statement";
    clusters.set(key, [...(clusters.get(key) ?? []), r.name]);
  }
  return [...clusters.entries()].sort((a, b) => b[1].length - a[1].length);
}

/** Opt `shareable` drops every line derived from private answers (status, heritage, background, employers, home country). */
export function unclaimedChecklist(p: FundingProfile, opts: { shareable?: boolean } = {}) {
  const toks = profileTokens(p);
  const share = !!opts.shareable;
  const cc = (p.location.country || "US").toUpperCase();
  const st = p.location.state || "your state";
  const county = p.location.county || "your county";
  const out: string[] = [];
  if (cc === "US") {
    if (share)
      out.push("File the FAFSA as soon as it opens if you're eligible: it unlocks federal, state and most college need-based aid. If you can't file the FAFSA, check your state's alternative aid application.");
    else if (toks.has("US:fafsa_eligible"))
      out.push("File the FAFSA as soon as it opens (Oct 1 most years). NCAN estimates about $3.6B in Pell Grants went unclaimed by the class of 2022 because eligible students never filed. The FAFSA also unlocks state grants, FSEOG, work-study and most college need-based aid.");
    else if (toks.has("US:status_friendly") || toks.has("US:noncitizen"))
      out.push(`You can't use federal aid, but check ${st}'s state aid application for students who can't file the FAFSA (for example Illinois's Alternative Application under the RISE Act, or the California Dream Act Application). Several states changed their rules in 2025, so re-check.`);
    else out.push("If you're eligible, file the FAFSA as soon as it opens. It unlocks federal, state and most college need-based aid.");
    out.push("Complete the CSS Profile only for colleges that require it. Many waive the fee for low-income students.");
    out.push("Ask for SAT, ACT, AP and college application fee waivers (College Board, ACT, Common App, NACAC). That's money you keep.");
    out.push(`Search the ${county} County community foundation's common scholarship application. One form often enters you into dozens of small local awards that get few applicants.`);
    out.push("Ask your school counselor for the local scholarship bulletin (Rotary, Lions, Kiwanis, Elks lodges, PTA, credit unions, local businesses). Many award money every year with fewer than 10 applicants.");
  }
  if (share) {
    out.push("Ask family members' employers and unions about scholarships for employees' children, and check heritage, faith and cultural associations you belong to.");
    out.push("After you're admitted, ask each college's aid office for a special-circumstances review and about named endowed scholarships that need a short separate application.");
    return out;
  }
  if (p.parent_employers.length) out.push(`Check your parent's or guardian's employer for dependent scholarships or tuition benefits: ${p.parent_employers.join(", ")}. Also check any labor union memberships.`);
  for (const h of p.heritage) out.push(`${h} community associations, temples, churches and cultural societies often run scholarships advertised only inside the community.`);
  for (const c of heritageCountries(p)) out.push(`Government of ${countryName(c)} diaspora programs (ministry of external or overseas affairs, embassy education desks) sometimes fund citizens or diaspora students abroad.`);
  out.push("After you're admitted, ask each college's aid office for a special-circumstances review and about named endowed scholarships that need a short separate application.");
  return out;
}

export function lateralAngles(p: FundingProfile, opts: { shareable?: boolean } = {}) {
  const { state: st, city, county } = p.location;
  const share = !!opts.shareable;
  const majors = p.intended_majors.length ? p.intended_majors : ["undeclared"];
  const ideas: string[] = [];
  for (const m of majors) {
    ideas.push(`${st} professional association for ${m} (state chapters fund students heading into the field)`);
    ideas.push(`Companies headquartered in ${city || st} that hire ${m} grads: their foundations sponsor local students`);
  }
  for (const a of p.interests_activities.slice(0, 4)) {
    ideas.push(`${a} + ${st}: state-level ${a} competitions and youth grants (smaller pools than national)`);
    ideas.push(`${a} + your heritage or identity: niche awards where both overlap`);
  }
  for (const h of share ? [] : p.heritage) {
    ideas.push(`${h} + ${majors[0]}: heritage professional societies (for example engineers' or doctors' associations)`);
    ideas.push(`${h} business owners in ${city || county}: their chambers of commerce run scholarships`);
  }
  for (const b of share ? [] : p.background) ideas.push(`${b.replace(/_/g, " ")} + ${st}: state-specific circumstance awards`);
  ideas.push(`Utilities, hospitals, banks and credit unions serving ${county || city} (customer-family scholarships)`);
  ideas.push(`${st} legislators' scholarship or tuition-waiver programs and the state treasurer's 529 contests`);
  ideas.push("Funded summer research at nearby universities (a stipend plus recommendation letters that win later awards)");
  ideas.push("Microgrants for a project you already run: often fewer than 20 applicants per round");
  return ideas;
}

/** Convergent search plan per ring: GrantScout's research queries, ready to open. */
export function searchPlan(p: FundingProfile, today = new Date()) {
  const { city, county, metro, state: st, country: cc, continent: cont } = p.location;
  const lvl = /^\d+$/.test(p.grade) ? "high school" : "college";
  const y = today.getFullYear();
  const plan = new Map<number, string[]>();
  const add = (ring: number, q: string) => plan.set(ring, [...(plan.get(ring) ?? []), q]);
  for (const [place, ring] of [[`${city} ${st}`, 1], [county ? `${county} County ${st}` : "", 1], [metro, 2], [st, 3]] as [string, number][]) {
    if (!place.trim()) continue;
    add(ring, `${place} community foundation scholarships ${lvl} students`);
    add(ring, `${place} scholarships ${lvl} ${y}-${y + 1}`);
    add(ring, `${place} Rotary OR Lions OR Kiwanis OR Elks scholarship`);
    add(ring, `${place} youth grant OR microgrant student project`);
    add(ring, `${place} paid internship ${lvl} students`);
    for (const m of p.intended_majors.slice(0, 2)) add(ring, `${place} ${m} scholarship`);
    for (const a of p.interests_activities.slice(0, 3)) add(ring, `${place} ${a} competition OR fellowship students`);
  }
  add(3, `${st} state grant program student aid agency`);
  add(3, `${st} tuition waiver programs`);
  add(3, `${st} youth entrepreneurship competition ${y + 1}`);
  add(4, `national scholarships ${lvl} ${y + 1} deadline`);
  add(4, "fully funded summer program high school");
  add(4, "student founder fellowship OR accelerator teen");
  add(4, "paid research internship high school students");
  for (const m of p.intended_majors) add(4, `${m} national scholarship ${lvl}`);
  if (["daca", "tps", "undocumented"].includes(p.residence_status)) {
    add(4, "scholarships open to undocumented and DACA students");
    add(4, "TheDream.US Golden Door Scholars partners");
    add(4, `${st} Dream Act state aid undocumented`);
  }
  if (["h4", "l2", "other_dependent", "f1", "j1", "pending_ac"].includes(p.residence_status)) {
    add(4, "scholarships regardless of citizenship status high school");
    add(4, "scholarships open to H-4 dependent visa students");
    add(4, "merit scholarships no citizenship requirement");
    add(4, "colleges that give merit aid to international and visa-holder students");
  }
  for (const c of heritageCountries(p)) {
    const n = countryName(c).replace(/^the /, "");
    add(5, `Government of ${n} scholarship for diaspora or overseas citizen students`);
    add(5, `${n} ministry scholarship students studying abroad`);
    add(5, `${n} heritage association scholarship ${cc}`);
  }
  for (const h of p.heritage) add(5, `${h} association scholarship ${cc}`);
  if (cont) {
    add(6, `${cont} youth innovation prize`);
    add(6, `${cont} student fellowship open to all nationalities`);
  }
  add(7, "global youth fellowship ages 15-18 fully funded");
  add(7, "international high school competition scholarship prize");
  add(7, "open worldwide student entrepreneur grant");
  return [...plan.entries()].sort((a, b) => a[0] - b[0]);
}

export function money(r: FundingRecord) {
  if (r.amount_text) return r.amount_text;
  const lo = r.amount_min ?? 0;
  const hi = r.amount_max ?? 0;
  const pv = r.program_value_usd ?? 0;
  if (hi && lo && hi !== lo) return `$${lo.toLocaleString()}–$${hi.toLocaleString()}`;
  if (hi || lo) return `$${Math.max(hi, lo).toLocaleString()}`;
  if (pv) return `Fully funded (~$${pv.toLocaleString()} value)`;
  return "Varies";
}

export const VEHICLE_LABEL: Record<Vehicle, string> = {
  scholarship: "Scholarship", grant: "Grant", fellowship: "Fellowship", prize: "Prize", competition: "Competition", internship: "Paid internship",
  accelerator: "Accelerator", program_stipend: "Program stipend", free_program: "Funded program", microgrant: "Microgrant", tuition_waiver: "Tuition waiver",
  fee_waiver: "Fee waiver", work_study: "Work-study", service_conditional: "Service-conditional", forgivable_loan: "Forgivable loan", dual_enrollment: "Dual enrollment",
};

export const WANT_OPTIONS = ["scholarship", "grant", "fellowship", "internship", "accelerator", "competition"];

const STATUS_REVEALING = /:(daca|tps|undocumented|status_friendly|dependent_visa|student_visa|international|noncitizen|pending_ac|refugee_asylee|oci|pio|nri|citizen_abroad|diaspora)$/;
const BROAD = /^ANY$|:(resident_any|citizen|pr|citizen_or_pr|fafsa_eligible|eligible_noncitizen|work_authorized|national)$/;

/** True when listing this award would hint at the student's status or home-country ties (for shared copies). */
export function revealsStatus(x: Pick<Ranked, "rec" | "ring">) {
  if (x.ring === 5) return true;
  const rules = x.rec.status_rules ?? [];
  return rules.length > 0 && !rules.some((t) => BROAD.test(t)) && rules.some((t) => STATUS_REVEALING.test(t));
}
