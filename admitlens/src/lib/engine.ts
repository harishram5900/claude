// AdmitLens evaluation engine.
//
// The model is calibrated per college from published admissions data:
//   * the school's overall admit rate sets the base odds,
//   * its enrolled middle-50% SAT/ACT and average GPA define what "typical" looks like,
//   * its selectivity tier sets how much weight holistic factors carry vs. grades,
//     how harsh the academic screen is, and the ceiling no unhooked applicant can pass.
// Each dimension is scored as a z-score *relative to that college*, so the same student
// can rate "1" academically at one school and "4" at another, exactly as real readers do.
import type { College } from "@/data/colleges";
import { analyzeEssay, letter, type EssayAnalysis } from "./essay";
import type { Activity, AppPlan, Profile } from "./types";

export type Tier = 1 | 2 | 3 | 4 | 5;

export const TIER_INFO: Record<Tier, { label: string; reader: string; stance: string }> = {
  1: {
    label: "Most selective (under 8%)",
    reader: "Senior Admissions Officer",
    stance:
      "We could fill the class twice over with valedictorians and perfect scores. Strong academics get a file read closely. They are not a reason to admit.",
  },
  2: {
    label: "Highly selective (8–20%)",
    reader: "Regional Admissions Officer",
    stance:
      "Nearly everyone I read is academically qualified. I'm looking for evidence you'll shape this campus, not just attend it.",
  },
  3: {
    label: "Selective (20–40%)",
    reader: "Admissions Counselor",
    stance:
      "Academics come first and have to clear our bar for your intended major. After that, essays and activities decide the close cases.",
  },
  4: {
    label: "Moderately selective (40–70%)",
    reader: "Admissions Counselor",
    stance:
      "I'm checking that you've taken a solid college-prep curriculum and earned grades that predict success here. The rest of the file can move you up or down in close cases.",
  },
  5: {
    label: "Broadly accessible (70%+)",
    reader: "Admissions Counselor",
    stance:
      "My job is to confirm you're ready to succeed here. GPA and the courses behind it carry most of the decision, and I'm looking for reasons to say yes.",
  },
};

export function tierOf(c: College): Tier {
  const r = c.admitRate;
  if (r < 0.08) return 1;
  if (r < 0.2) return 2;
  if (r < 0.4) return 3;
  if (r < 0.7) return 4;
  return 5;
}

// ---------- helpers
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const logit = (p: number) => Math.log(p / (1 - p));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ACT → SAT concordance (2018 ACT/College Board tables, composite midpoints)
const ACT_TO_SAT: Record<number, number> = {
  36: 1590, 35: 1540, 34: 1500, 33: 1460, 32: 1430, 31: 1400, 30: 1370, 29: 1340, 28: 1310, 27: 1280, 26: 1240,
  25: 1210, 24: 1180, 23: 1140, 22: 1110, 21: 1080, 20: 1040, 19: 1010, 18: 970, 17: 930, 16: 890, 15: 850,
  14: 800, 13: 760, 12: 710, 11: 670, 10: 630, 9: 590,
};
export function actToSat(act: number) {
  return ACT_TO_SAT[clamp(Math.round(act), 9, 36)];
}

export function bestSat(p: Profile): number | null {
  const fromAct = p.act ? actToSat(p.act) : null;
  if (p.sat && fromAct) return Math.max(p.sat, fromAct);
  return p.sat ?? fromAct;
}

export function unweightedGpa(p: Profile): number | null {
  if (p.gpaUnweighted != null) return clamp(p.gpaUnweighted, 0, 4);
  if (p.gpaWeighted != null) return clamp(p.gpaWeighted - 0.35, 0, 4);
  return null;
}

/** Hash used only to pick between equivalent phrasings so memos don't read as boilerplate. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const pick = <T,>(arr: T[], seed: number) => arr[seed % arr.length];

// ---------- college expectations
export function collegeSatRange(c: College): [number, number] {
  if (c.sat) return c.sat;
  if (c.act) return [actToSat(c.act[0]), actToSat(c.act[1])];
  // Test-blind / unpublished: estimate typical scores from selectivity
  const mid = clamp(1560 - c.admitRate * 520, 1050, 1540);
  return [mid - 90, mid + 70];
}

const IMPACT_W: Record<Activity["impact"], number> = { school: 1, local: 1.6, state: 2.6, national: 4, international: 4.6 };
const AWARD_W = { school: 0.5, regional: 1, state: 2, national: 4.5, international: 6 } as const;
const ACT_WEIGHTS = [1, 0.7, 0.5, 0.35, 0.25, 0.2, 0.15, 0.1, 0.1, 0.1];

export function activityPoints(a: Activity) {
  const hours = Math.max(0, a.hoursPerWeek) * Math.max(1, a.weeksPerYear || 30);
  const hoursF = clamp(Math.sqrt(hours / 150), 0.45, 1.35);
  const yearsF = 0.6 + 0.15 * clamp(a.years, 1, 4);
  return IMPACT_W[a.impact] * (a.leadership ? 1.35 : 1) * (a.founder ? 1.15 : 1) * yearsF * hoursF;
}

function majorAligned(p: Profile, a: Activity) {
  if (!p.intendedMajor) return false;
  const keys = p.intendedMajor.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3);
  const text = `${a.name} ${a.category} ${a.description} ${a.role}`.toLowerCase();
  const synonyms: Record<string, string[]> = {
    computer: ["coding", "programming", "robotics", "software", "app", "hackathon", "cyber", "ai", "machine learning"],
    engineering: ["robotics", "build", "design", "physics", "science olympiad", "cad", "engineering"],
    biology: ["research", "hospital", "lab", "medical", "health", "science olympiad", "biology"],
    medicine: ["hospital", "clinic", "emt", "health", "research", "medical", "volunteer"],
    business: ["deca", "fbla", "startup", "business", "entrepreneur", "investment", "finance", "company"],
    economics: ["economics", "finance", "investment", "deca", "fbla", "policy"],
    political: ["debate", "model un", "government", "campaign", "policy", "student council", "mock trial"],
    english: ["writing", "newspaper", "journal", "literary", "poetry", "editor"],
    journalism: ["newspaper", "yearbook", "editor", "writing", "podcast"],
    music: ["band", "orchestra", "choir", "music", "composition"],
    art: ["art", "design", "gallery", "film", "photography"],
    mathematics: ["math", "amc", "aime", "olympiad", "tutor"],
    nursing: ["hospital", "cna", "health", "volunteer", "care"],
  };
  for (const k of keys) {
    if (text.includes(k)) return true;
    for (const [root, syn] of Object.entries(synonyms)) if (k.startsWith(root.slice(0, 5)) && syn.some((s) => text.includes(s))) return true;
  }
  return false;
}

// ---------- evaluation
export interface DimensionResult {
  key: "academics" | "testing" | "rigor" | "extracurriculars" | "awards" | "essays" | "recommendations" | "personal";
  label: string;
  z: number; // relative to this college
  rating: number; // 1 (exceptional) – 6 (weak), Harvard-style reader scale
  grade: string;
  note: string;
}

export interface Improvement {
  title: string;
  detail: string;
  newChance: number;
  gain: number; // percentage points
  effort: "Quick win" | "This season" | "Long-term";
}

export interface Evaluation {
  college: College;
  tier: Tier;
  reader: string;
  plan: AppPlan;
  chance: number; // 0–1
  chanceLow: number;
  chanceHigh: number;
  category: "Safety" | "Likely" | "Target" | "Reach" | "High reach";
  verdict: string;
  overallRating: number;
  overallGrade: string;
  dimensions: DimensionResult[];
  strengths: string[];
  concerns: string[];
  memo: string[]; // paragraphs, in the reader's voice
  committeeLine: string;
  improvements: Improvement[];
  essay: EssayAnalysis | null;
  flags: string[];
  inputsHash: string;
}

const RATING_LABEL: Record<number, string> = {
  1: "Exceptional, rare even here",
  2: "Strong for this pool",
  3: "Solid, typical of admits",
  4: "Below typical admit",
  5: "Well below this pool",
  6: "Not competitive here",
};

function ratingFromZ(z: number) {
  if (z >= 1.6) return 1;
  if (z >= 0.6) return 2;
  if (z >= -0.3) return 3;
  if (z >= -1.2) return 4;
  if (z >= -2.2) return 5;
  return 6;
}
function gradeFromZ(z: number) {
  return letter(clamp(76 + z * 11, 0, 100));
}

interface Core {
  logitScore: number;
  maxP: number;
  dims: DimensionResult[];
  essay: EssayAnalysis | null;
  flags: string[];
  ctx: {
    gpa: number | null;
    sat: number | null;
    satRange: [number, number];
    satPct: number | null;
    ecAbs: number;
    awardsAbs: number;
    topActs: Activity[];
    aligned: boolean;
    leadershipCount: number;
    expectedEc: number;
  };
}

function core(p: Profile, c: College, plan: AppPlan): Core {
  const tier = tierOf(c);
  const t = (tier - 1) / 4; // 0 = most selective, 1 = most accessible
  const flags: string[] = [];

  // ---- weights (logit units per z) interpolated by selectivity
  const W = {
    gpa: lerp(0.5, 1.0, t),
    test: lerp(0.45, 0.35, t),
    rigor: lerp(0.4, 0.3, t),
    ec: lerp(0.7, 0.15, t),
    essay: lerp(0.4, 0.08, t),
    recs: lerp(0.3, 0.05, t),
  };

  // ---- GPA
  const gpa = unweightedGpa(p);
  const gpaSd = 0.11 + (4 - c.gpa) * 0.5;
  let zGpa = gpa == null ? -0.5 : (gpa - c.gpa) / gpaSd;
  if (gpa == null) flags.push("No GPA entered, so the estimate assumes slightly below typical.");
  if (p.classRankPercent != null) {
    const rankBonus = p.classRankPercent <= 1 ? 0.35 : p.classRankPercent <= 5 ? 0.2 : p.classRankPercent <= 10 ? 0.08 : p.classRankPercent > 25 ? -0.3 : 0;
    zGpa += rankBonus;
  }
  zGpa = clamp(zGpa, -3.2, 1.6);

  // ---- rigor
  const expectedAp = { 9: 1, 10: 3, 11: 6, 12: 9, 13: 9 }[clamp(p.grade, 9, 13)] ?? 9;
  const rigorAbs = clamp(Math.min(p.apCount / expectedAp, 1.2) * 0.6 + (p.rigor / 5) * 0.4 + Math.min(p.honorsCount, 8) * 0.01, 0, 1.15);
  const rigorExpected = lerp(0.92, 0.35, t);
  const zRigor = clamp((rigorAbs - rigorExpected) / 0.2, -3, 1.5);

  // ---- testing
  const sat = bestSat(p);
  const satRange = collegeSatRange(c);
  const satMid = (satRange[0] + satRange[1]) / 2;
  const satSd = Math.max(70, ((satRange[1] - satRange[0]) / 1.35) * 1.4);
  let zTest = 0;
  let testW = W.test;
  let satPct: number | null = null;
  if (c.testPolicy === "blind") {
    testW = 0;
  } else if (sat && p.submitTests) {
    zTest = clamp((sat - satMid) / satSd, -3.2, 1.4);
    satPct = Math.round(clamp(sigmoid(1.7 * ((sat - satMid) / satSd)) * 100, 1, 99));
  } else if (c.testPolicy === "required") {
    zTest = -2.5;
    flags.push(`${c.short} requires SAT or ACT scores. Without them the application is incomplete.`);
  } else {
    testW = 0;
    if (tier <= 2) flags.push(`Applying test-optional to ${c.short}. Non-submitters are admitted at lower rates at highly selective schools.`);
  }
  // Submitting a below-range score at an optional school can hurt; flag it.
  if (sat && p.submitTests && c.testPolicy === "optional" && sat < satRange[0]) {
    flags.push(`Your ${sat} is below ${c.short}'s 25th percentile (${satRange[0]}). Consider applying test-optional here.`);
  }

  // ---- extracurriculars
  const scored = [...p.activities].sort((a, b) => activityPoints(b) - activityPoints(a));
  const ecRaw = scored.slice(0, 10).reduce((sum, a, i) => sum + activityPoints(a) * ACT_WEIGHTS[i], 0);
  const aligned = scored.slice(0, 3).some((a) => majorAligned(p, a));
  const ecAbs = 100 * (1 - Math.exp(-ecRaw / 6)) + (aligned ? 4 : 0);
  const expectedEc = lerp(74, 28, t);
  const zEc = clamp((ecAbs - expectedEc) / 16, -3, 1.8);

  // ---- awards
  const awardsSorted = [...p.awards].sort((a, b) => AWARD_W[b.level] - AWARD_W[a.level]);
  const awardRaw = awardsSorted.slice(0, 5).reduce((s, a, i) => s + AWARD_W[a.level] * [1, 0.6, 0.4, 0.3, 0.2][i], 0);
  const awardsAbs = 100 * (1 - Math.exp(-awardRaw / 4));
  const expectedAwards = lerp(55, 10, t);
  const zAwards = clamp((awardsAbs - expectedAwards) / 18, -3, 2);

  // ---- essay
  const essay = p.personalStatement.trim().split(/\s+/).length >= 150 ? analyzeEssay(p.personalStatement, { limit: 650 }) : null;
  const expectedEssay = lerp(80, 52, t);
  const zEssay = essay ? clamp((essay.overall - expectedEssay) / 13, -2.5, 1.8) : -0.35;
  if (!essay) flags.push("No personal statement on file. Add one in your profile (150+ words) for a full essay read.");

  // ---- recommendations
  const recZ = { unknown: 0, average: lerp(-0.9, -0.2, t), strong: 0.35, exceptional: 1.3 }[p.recs];

  // ---- personal / context
  const zPersonal = clamp(zEssay * 0.55 + recZ * 0.45 + (p.significantResponsibilities ? 0.3 : 0), -3, 2);

  let L = logit(c.admitRate) + lerp(0.95, 0.55, t);
  L += W.gpa * zGpa + testW * zTest + W.rigor * zRigor + W.ec * (zEc * 0.8 + zAwards * 0.2) + W.essay * zEssay + W.recs * recZ;
  if (tier <= 2 && c.testPolicy === "optional" && !(sat && p.submitTests)) L -= 0.15;
  // Required scores missing = incomplete application; readers don't review incomplete files.
  if (c.testPolicy === "required" && !(sat && p.submitTests)) L -= 3;

  // Academic screen: at selective schools an academic profile far below the class is rarely read past
  const academicZ = (zGpa * 1.2 + (testW ? zTest : zGpa) * 0.9 + zRigor * 0.7) / 2.8;
  const screen = lerp(-1.1, -2.3, t);
  if (academicZ < screen) L -= (screen - academicZ) * lerp(1.2, 0.8, t);

  // Hooks and context
  if (p.recruitedAthlete && tier <= 3) {
    L += lerp(2.6, 1.6, t * 2);
    flags.push("Recruited-athlete status assumes a coach is formally supporting your application.");
  }
  if (p.legacyAt.includes(c.id)) {
    if (c.considersLegacy) L += tier <= 2 ? 0.9 : 0.35;
    else flags.push(`${c.short} does not give legacy preference, so legacy status was not counted.`);
  }
  if (p.firstGen && tier <= 4) L += lerp(0.35, 0.1, t);
  if (p.lowIncome && tier <= 4) L += lerp(0.25, 0.05, t);

  // Residency
  if (c.control === "Public" && c.inStateFactor && c.inStateFactor > 1) {
    L += p.state === c.state ? Math.log(c.inStateFactor) : -Math.log(Math.sqrt(c.inStateFactor));
  }

  // Application plan
  const early = plan === "ED" || plan === "ED2" ? (c.plans.ed || c.plans.ed2 ? 1 : 0) : plan === "REA" ? (c.plans.rea ? 0.65 : 0) : plan === "EA" ? (c.plans.ea ? 0.25 : 0) : 0;
  if (early) {
    const ratio = c.earlyRate ? clamp(Math.sqrt(c.earlyRate / c.admitRate), 1.1, 1.75) : lerp(1.6, 1.15, t);
    L += Math.log(ratio) * early;
  }

  const maxP = p.recruitedAthlete && tier <= 3 ? 0.92 : clamp(c.admitRate * 7 + 0.04, 0.12, 0.97);

  // ---- dimension report
  const dims: DimensionResult[] = [];
  const add = (key: DimensionResult["key"], label: string, z: number, note: string) =>
    dims.push({ key, label, z: Math.round(z * 100) / 100, rating: ratingFromZ(z), grade: gradeFromZ(z), note });
  add("academics", "GPA & class standing", zGpa, gpa == null ? "No GPA provided" : `${gpa.toFixed(2)} UW vs. ~${c.gpa.toFixed(2)} typical admit`);
  add("rigor", "Course rigor", zRigor, `${p.apCount} AP/IB/dual-enrollment, rigor ${p.rigor}/5`);
  if (c.testPolicy !== "blind")
    add("testing", "Testing", testW ? zTest : 0, sat && p.submitTests ? `${sat} SAT-equivalent vs. ${satRange[0]}–${satRange[1]} middle 50%` : c.testPolicy === "required" ? "Missing (required)" : "Not submitted (optional)");
  add("extracurriculars", "Extracurricular impact", zEc, `${p.activities.length} activities${aligned ? ", aligned with your major" : ""}`);
  add("awards", "Honors & awards", zAwards, p.awards.length ? `${p.awards.length} honors, top level: ${awardsSorted[0].level}` : "None listed");
  add("essays", "Personal statement", zEssay, essay ? `${essay.grade} (${essay.overall}/100) on our essay rubric` : "Not provided");
  add("recommendations", "Recommendations", recZ, p.recs === "unknown" ? "Assumed typical" : `Self-assessed ${p.recs}`);
  add("personal", "Personal qualities", zPersonal, "From essays, recommendations and context");

  return {
    logitScore: L,
    maxP,
    dims,
    essay,
    flags,
    ctx: {
      gpa,
      sat: p.submitTests ? sat : null,
      satRange,
      satPct,
      ecAbs,
      awardsAbs,
      topActs: scored.slice(0, 3),
      aligned,
      leadershipCount: p.activities.filter((a) => a.leadership).length,
      expectedEc,
    },
  };
}

function toChance(L: number, maxP: number) {
  // Soft ceiling in logit space: leaves low chances untouched, approaches maxP asymptotically.
  // No unhooked applicant is a lock at a single-digit-admit-rate school.
  const p = maxP * sigmoid(L - Math.log(maxP));
  return clamp(p, 0.0002, 0.985);
}

export function chanceOnly(p: Profile, c: College, plan: AppPlan = "RD") {
  const k = core(p, c, plan);
  return toChance(k.logitScore, k.maxP);
}

function categoryFor(chance: number, c: College): Evaluation["category"] {
  if (c.admitRate < 0.15 && chance < 0.6) return chance < 0.12 ? "High reach" : "Reach";
  if (chance >= 0.8) return "Safety";
  if (chance >= 0.6) return "Likely";
  if (chance >= 0.33) return "Target";
  if (chance >= 0.12) return "Reach";
  return "High reach";
}

/** Verdicts are relative to the best odds anyone unhooked can have at this school (maxP),
 *  so a 7% file at Harvard (twice the base rate) isn't called "deny range". */
function verdictFor(rel: number, tier: Tier) {
  const elite = tier <= 2;
  if (rel >= 0.75) return elite ? "Strong contender: top of the pile" : "Likely admit";
  if (rel >= 0.5) return elite ? "Strong file: in the committee mix" : "Competitive: leans admit";
  if (rel >= 0.22) return elite ? "Competitive, but not yet distinctive" : "Competitive: could go either way";
  if (rel >= 0.08) return "Reach: waitlist range";
  return "Unlikely: deny range as it stands";
}

// ---------- memo writing
function pctOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function writeMemo(p: Profile, c: College, tier: Tier, k: Core, rel: number) {
  const seed = hash(`${c.id}|${p.name}|${p.gpaUnweighted}|${p.sat}|${p.activities.length}`);
  const name = p.name.split(" ")[0] || "This applicant";
  const d = Object.fromEntries(k.dims.map((x) => [x.key, x])) as Record<DimensionResult["key"], DimensionResult>;
  const memo: string[] = [];
  const strengths: string[] = [];
  const concerns: string[] = [];

  // Opening, in the reader's voice
  const openers: Record<Tier, string[]> = {
    1: [
      `I'll be direct, because that's what a ${c.short} read is. ${TIER_INFO[1].stance}`,
      `At ${c.short} I read files from applicants who all look excellent on paper. ${TIER_INFO[1].stance}`,
    ],
    2: [`${TIER_INFO[2].stance} Here is how ${name}'s file reads against the ${c.short} pool.`, `At ${c.short}, ${TIER_INFO[2].stance.charAt(0).toLowerCase()}${TIER_INFO[2].stance.slice(1)}`],
    3: [`${TIER_INFO[3].stance}`, `Reading for ${c.short}: ${TIER_INFO[3].stance.charAt(0).toLowerCase()}${TIER_INFO[3].stance.slice(1)}`],
    4: [`${TIER_INFO[4].stance}`],
    5: [`${TIER_INFO[5].stance}`],
  };
  memo.push(pick(openers[tier], seed));

  // Academics
  const g = k.ctx.gpa;
  let acad = "";
  if (g != null) {
    acad = `Academically, a ${g.toFixed(2)} unweighted GPA with ${p.apCount} AP/IB/dual-enrollment course${p.apCount === 1 ? "" : "s"} (rigor ${p.rigor}/5) `;
    if (d.academics.z >= 0.3) acad += `sits at or above what we typically admit (~${c.gpa.toFixed(2)}). `;
    else if (d.academics.z >= -0.6) acad += `is close to our typical admit (~${c.gpa.toFixed(2)}), though not a differentiator. `;
    else acad += `is below the ~${c.gpa.toFixed(2)} we usually see${tier <= 2 ? ". At this level, every B gets noticed" : ""}. `;
  } else acad = "No GPA was provided, which makes the academic read incomplete. ";
  if (d.testing) {
    if (k.ctx.sat && k.ctx.satPct != null)
      acad += `The ${k.ctx.sat} SAT-equivalent lands around the ${pctOrdinal(k.ctx.satPct)} percentile of our enrolled range (${k.ctx.satRange[0]}–${k.ctx.satRange[1]}).`;
    else if (c.testPolicy === "required") acad += `There are no test scores, and ${c.short} requires them.`;
    else acad += `No scores submitted, so I'm leaning harder on the transcript.`;
  } else acad += `${c.short} is test-blind, so the transcript carries all the academic weight.`;
  memo.push(acad);
  if (d.academics.z >= 0.6) strengths.push(`GPA is strong for ${c.short}'s pool (${g?.toFixed(2)} vs ~${c.gpa.toFixed(2)}).`);
  if (d.academics.z < -0.6) concerns.push(`GPA trails ${c.short}'s typical admit by ${((c.gpa - (g ?? 0)) || 0).toFixed(2)} points.`);
  if (d.rigor.z < -0.8) concerns.push(`Course rigor looks light for ${c.short}. Readers ask whether you took the hardest path available to you.`);
  if (d.rigor.z >= 0.5) strengths.push("Took a demanding curriculum relative to what's expected here.");
  if (d.testing && d.testing.z >= 0.5) strengths.push(`Test score is in the upper part of ${c.short}'s range.`);
  if (d.testing && d.testing.z < -0.8 && k.ctx.sat) concerns.push(`Test score is below ${c.short}'s middle 50% (${k.ctx.satRange[0]}–${k.ctx.satRange[1]}).`);

  // Activities
  const top = k.ctx.topActs[0];
  let ec = "";
  if (!top) {
    ec = tier <= 3 ? `There are no activities listed. At ${c.short}, that alone would end the read.` : "No activities listed. That won't sink you here, but it leaves nothing to advocate for.";
    concerns.push("No activities listed.");
  } else {
    ec = `${name}'s strongest commitment is ${top.role ? top.role + ", " : ""}${top.name} (${top.impact}-level impact, ${top.years} yr${top.years > 1 ? "s" : ""}, ~${top.hoursPerWeek} hrs/wk). `;
    if (d.extracurriculars.z >= 0.6) ec += tier <= 2 ? "That's the kind of distinguishing depth that gets a file flagged for committee. " : "That clearly stands out in our pool. ";
    else if (d.extracurriculars.z >= -0.3) ec += tier <= 2 ? "It's solid, but I see this profile in a large share of files. What is the thing only you did? " : "It's a respectable profile for us. ";
    else ec += tier <= 2 ? `Compared with the ${c.short} pool, the activities read as participation more than impact. ` : "The activities section is thinner than most admits'. ";
    if (k.ctx.aligned) ec += `It connects to the stated interest in ${p.intendedMajor}, which gives the file a coherent story.`;
    else if (p.intendedMajor) ec += `I don't yet see how your activities connect to ${p.intendedMajor}. Readers look for that thread.`;
  }
  memo.push(ec);
  if (d.extracurriculars.z >= 0.6) strengths.push(`Activities show impact beyond school level${top ? ` (${top.name})` : ""}.`);
  if (d.extracurriculars.z < -0.5 && top) concerns.push(`Activities are mostly school-level. ${c.short}'s admits typically show regional or larger impact.`);
  if (k.ctx.leadershipCount === 0 && p.activities.length > 0 && tier <= 3) concerns.push("No formal leadership roles listed.");
  if (d.awards.z >= 0.6) strengths.push("Honors at state or national level give outside validation.");
  if (d.awards.z < -0.8 && tier <= 2) concerns.push(`No honors beyond school level. Many ${c.short} admits bring outside recognition.`);

  // Essays & personal
  if (k.essay) {
    const e = k.essay;
    let es = `The personal statement scores ${e.grade} on our rubric (${e.overall}/100). `;
    if (d.essays.z >= 0.5) es += "It has a real voice. I came away knowing something about you that isn't on the activity list. ";
    else if (d.essays.z >= -0.4) es += `It's competent, but ${tier <= 2 ? "at this level competent essays don't move committee" : "it could do more work for you"}. `;
    else es += "Right now it isn't helping. ";
    const weakest = Object.entries(e.scores).filter(([, v]) => v != null).sort((a, b) => (a[1] as number) - (b[1] as number))[0];
    if (weakest) es += `The weakest dimension is ${weakest[0]} (${weakest[1]}/100).`;
    memo.push(es);
    if (d.essays.z >= 0.5) strengths.push("Personal statement has a distinctive voice and specific detail.");
    if (d.essays.z < -0.4) concerns.push(`Essay (${e.grade}) is below what ${c.short} readers expect.`);
  } else {
    memo.push(tier <= 3 ? `There's no personal statement for me to read. At ${c.short}, that's where I learn who you are beyond numbers. Without it I can't advocate for you.` : "No personal statement provided. It matters less here, but it can tip a close decision.");
  }

  // Context
  const ctxBits: string[] = [];
  if (p.firstGen) ctxBits.push("first-generation status");
  if (p.lowIncome) ctxBits.push("limited family resources");
  if (p.significantResponsibilities) ctxBits.push("significant work or family responsibilities");
  if (ctxBits.length) {
    memo.push(`I'm reading all of this in context: ${ctxBits.join(", ")}. Achievements earned with fewer resources carry more weight in my read.`);
    strengths.push(`Context (${ctxBits.join(", ")}) strengthens what you've achieved.`);
  }
  if (p.recruitedAthlete && tier <= 3) strengths.push("Recruited athlete. A coach's support changes the math substantially.");

  // What this school values
  memo.push(`What ${c.short} is specifically reading for: ${c.values.slice(0, 3).join("; ")}.`);

  // Committee line
  const pitchPieces: string[] = [];
  if (d.academics.z >= 0.3 && (!d.testing || d.testing.z >= 0)) pitchPieces.push("academically ready");
  if (d.extracurriculars.z >= 0.6) pitchPieces.push(top && (top.impact === "school" || top.impact === "local") ? `committed involvement (${top.name})` : `real impact in ${top?.name ?? "activities"}`);
  if (d.essays.z >= 0.5) pitchPieces.push("a memorable voice");
  let committeeLine: string;
  if (rel >= 0.5) committeeLine = `"${name}: ${pitchPieces.join(", ") || "consistently strong file"}. I'd advocate."`;
  else if (rel >= 0.2) committeeLine = `"${name}: ${pitchPieces.join(", ") || "qualified"}, but ${concerns[0]?.toLowerCase().replace(/\.$/, "") || "not yet distinctive in this pool"}. Hold for the committee."`;
  else committeeLine = `"${name}: ${concerns[0]?.replace(/\.$/, "") || `not competitive in this year's ${c.short} pool`}. Recommend deny unless something changes."`;

  return { memo, strengths, concerns, committeeLine };
}

// ---------- what-if improvements
function improvements(p: Profile, c: College, plan: AppPlan, base: number): Improvement[] {
  const tier = tierOf(c);
  const out: Improvement[] = [];
  const tryIt = (title: string, detail: string, effort: Improvement["effort"], mod: (q: Profile) => Profile, newPlan: AppPlan = plan) => {
    const q = mod(structuredClone(p));
    const nc = chanceOnly(q, c, newPlan);
    const gain = Math.round((nc - base) * 1000) / 10;
    if (gain >= 0.3) out.push({ title, detail, newChance: nc, gain, effort });
  };
  const satRange = collegeSatRange(c);
  const sat = bestSat(p);
  if (c.testPolicy !== "blind" && (!sat || sat < satRange[1])) {
    const target = Math.min(1600, satRange[1]);
    tryIt(
      sat ? `Raise your SAT to ${target}` : `Take the SAT and aim for ${target}`,
      sat ? `You're at ${sat}. ${c.short}'s 75th percentile is ${satRange[1]}. Two focused months of official Bluebook practice tests typically yields 60–120 points.` : `${c.short}'s middle 50% is ${satRange[0]}–${satRange[1]}.${c.testPolicy === "required" ? " Scores are required." : ""}`,
      "This season",
      (q) => ({ ...q, sat: target, act: null, submitTests: true }),
    );
  }
  const g = unweightedGpa(p);
  if (g != null && g < 3.98 && p.grade <= 11) {
    const ng = Math.min(4, g + (p.grade <= 10 ? 0.2 : 0.1));
    tryIt(`Lift your GPA to ${ng.toFixed(2)}`, `Straight A's for the remaining semesters moves your cumulative GPA. Upward trends are read favorably, especially junior year.`, "Long-term", (q) => ({ ...q, gpaUnweighted: ng, gpaWeighted: q.gpaWeighted ? q.gpaWeighted + (ng - g) : null }));
  }
  if (p.rigor < 5 || p.apCount < 8) {
    tryIt("Take the most rigorous schedule available", `Add ${Math.max(2, 8 - p.apCount)} more AP/IB or dual-enrollment courses in core subjects for senior year. Readers check what you took against what your school offers.`, p.grade >= 12 ? "Quick win" : "This season", (q) => ({ ...q, rigor: 5, apCount: Math.max(q.apCount + 2, 8) }));
  }
  const top = [...p.activities].sort((a, b) => activityPoints(b) - activityPoints(a))[0];
  if (top && (top.impact === "school" || top.impact === "local" || !top.leadership)) {
    tryIt(
      `Scale "${top.name}" beyond your school`,
      `Take a leadership role and push it to state-level reach: a regional competition, a partnership with a city organization, or measurable outcomes (people served, dollars raised, users). ${tier <= 2 ? `${c.short} looks for "${c.values[0]}".` : ""}`,
      "Long-term",
      (q) => ({ ...q, activities: q.activities.map((a) => (a.id === top.id ? { ...a, leadership: true, impact: a.impact === "school" || a.impact === "local" ? "state" : a.impact } : a)) }),
    );
  } else if (!top) {
    tryIt("Build 2–3 sustained commitments", "Choose activities you can stick with for years: one tied to your intended major, one service, one personal interest. Depth beats a long list.", "Long-term", (q) => ({
      ...q,
      activities: [
        { id: "x1", name: "Major-related club", role: "Officer", category: "Academic", years: 2, hoursPerWeek: 5, weeksPerYear: 30, leadership: true, founder: false, impact: "local", description: "" },
        { id: "x2", name: "Community service", role: "Volunteer", category: "Service", years: 2, hoursPerWeek: 3, weeksPerYear: 40, leadership: false, founder: false, impact: "local", description: "" },
      ],
    }));
  }
  if (!p.awards.some((a) => a.level === "state" || a.level === "national" || a.level === "international")) {
    tryIt("Earn state or national recognition", `Enter a competition tied to ${p.intendedMajor || "your main interest"} (e.g., Science Olympiad, AMC/AIME, Scholastic Art & Writing, DECA, NSDA, Congressional App Challenge).`, "Long-term", (q) => ({ ...q, awards: [...q.awards, { id: "x", name: "State-level award", level: "state" }] }));
  }
  const essayScore = p.personalStatement.trim().split(/\s+/).length >= 150 ? analyzeEssay(p.personalStatement).overall : 0;
  if (essayScore < 85) {
    tryIt(
      essayScore ? "Revise your personal statement to an A" : "Write your personal statement",
      essayScore ? `Currently ${essayScore}/100. Use the Essay Lab: replace clichés with one specific scene and spend your last third on reflection.` : "Use the Essay Lab to draft and score a Common App essay.",
      "This season",
      (q) => ({ ...q, personalStatement: STRONG_ESSAY_PROXY }),
    );
  }
  if (p.recs !== "exceptional") {
    tryIt("Secure standout recommendations", "Ask two junior-year core teachers who saw you take intellectual risks. Give them a one-page brag sheet with specific moments from their class.", "Quick win", (q) => ({ ...q, recs: "strong" }));
  }
  if (plan === "RD" && (c.plans.ed || c.plans.rea || c.plans.ea)) {
    const np: AppPlan = c.plans.ed ? "ED" : c.plans.rea ? "REA" : "EA";
    tryIt(
      `Apply ${np === "ED" ? "Early Decision" : np === "REA" ? "Restrictive Early Action" : "Early Action"}`,
      np === "ED" ? `ED is binding. Use it only if ${c.short} is your clear first choice and you've run the net price calculator.` : `Applying early signals interest and is non-binding${np === "REA" ? " (but restricts other private early applications)" : ""}.`,
      "Quick win",
      (q) => q,
      np,
    );
  }
  return out.sort((a, b) => b.gain - a.gain).slice(0, 6);
}

// A proxy text used only by the what-if simulation to model an A-range essay.
const STRONG_ESSAY_PROXY = `The radiator in Room 114 clanked twice before every chemistry quiz, and by October I had started timing my breathing to it. Mr. Alvarez noticed. "You know it's just steam," he said, handing back a test I had failed by four points. I did not know that. I did not know most things about how the building worked, which is how I ended up spending three Saturdays with Ms. Ruiz, our custodian, tracing pipes behind the auditorium with a flashlight and a notebook.
She showed me the 1962 boiler, the patched valve she named Gerald, the way pressure finds the weakest joint. I filled nineteen pages with sketches. On the fourth Saturday I asked why the east wing was always cold, and she shrugged: nobody had asked. I measured temperatures in eleven classrooms for two weeks, found a 9-degree gap, and wrote a two-page memo to the district facilities office. They replaced a stuck damper in December.
I used to think understanding meant being handed the right answer. Now I go looking for the Geralds: the overlooked joint where a small fix changes everything. I still flinch when the radiator clanks. But now I also wonder where the pressure is going, and who else has stopped asking why.`;

// ---------- public entry point
export function evaluate(p: Profile, c: College, plan: AppPlan = "RD"): Evaluation {
  const tier = tierOf(c);
  const k = core(p, c, plan);
  const chance = toChance(k.logitScore, k.maxP);
  // Uncertainty band widens when the file is incomplete
  const unknowns = (k.essay ? 0 : 1) + (p.recs === "unknown" ? 1 : 0) + (unweightedGpa(p) == null ? 1 : 0);
  const spread = 0.35 + unknowns * 0.15;
  const chanceLow = toChance(k.logitScore - spread, k.maxP);
  const chanceHigh = toChance(k.logitScore + spread, k.maxP);
  const rel = chance / k.maxP;
  const { memo, strengths, concerns, committeeLine } = writeMemo(p, c, tier, k, rel);
  const overallZ = k.logitScore - logit(c.admitRate) - lerp(0.95, 0.55, (tier - 1) / 4);
  const overallRating = ratingFromZ(overallZ / 1.4);
  return {
    college: c,
    tier,
    reader: `${TIER_INFO[tier].reader}, ${c.short} (simulated)`,
    plan,
    chance,
    chanceLow,
    chanceHigh,
    category: categoryFor(chance, c),
    verdict: verdictFor(rel, tier),
    overallRating,
    overallGrade: gradeFromZ(overallZ / 1.4),
    dimensions: k.dims,
    strengths,
    concerns,
    memo,
    committeeLine,
    improvements: improvements(p, c, plan, chance),
    essay: k.essay,
    flags: k.flags,
    inputsHash: hash(JSON.stringify(p) + c.id + plan).toString(36),
  };
}

export const RATING_TEXT = RATING_LABEL;
