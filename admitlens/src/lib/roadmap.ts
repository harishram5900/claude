// Builds a personalized grade-by-grade roadmap from where the student is today to their
// dream college, prioritizing the gaps the evaluation engine found for that school.
import type { College } from "@/data/colleges";
import { bestSat, collegeSatRange, evaluate, tierOf, unweightedGpa } from "./engine";
import type { Profile } from "./types";

export type Track = "Academics" | "Testing" | "Activities" | "Essays" | "Applications" | "Money";

export interface Milestone {
  id: string;
  phase: string; // e.g. "11th · Fall"
  order: number; // phase order, 0 = 9th fall
  title: string;
  detail: string;
  track: Track;
  priority: boolean; // directly addresses a gap at the dream school
}

export const PHASES = ["9th · Fall", "9th · Spring", "Summer after 9th", "10th · Fall", "10th · Spring", "Summer after 10th", "11th · Fall", "11th · Spring", "Summer after 11th", "12th · Fall", "12th · Spring"];

export function currentPhase(grade: number, now = new Date()) {
  const m = now.getMonth(); // 0–11
  const semester = m >= 7 ? 0 : m <= 4 ? 1 : 2; // Aug–Dec fall, Jan–May spring, Jun–Jul summer
  const g = Math.max(9, Math.min(12, grade));
  return Math.min((g - 9) * 3 + semester, PHASES.length - 1);
}

export function buildRoadmap(p: Profile, c: College | null): Milestone[] {
  const ms: Milestone[] = [];
  const add = (order: number, track: Track, title: string, detail: string, priority = false) =>
    ms.push({ id: `${order}-${track}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"), phase: PHASES[order], order, title, detail, track, priority });

  const ev = c ? evaluate(p, c) : null;
  const dim = (k: string) => ev?.dimensions.find((d) => d.key === k);
  const tier = c ? tierOf(c) : 3;
  const name = c?.short ?? "your dream school";
  const gpa = unweightedGpa(p);
  const sat = bestSat(p);
  const satTarget = c ? collegeSatRange(c)[1] : 1400;
  const gpaGap = c && gpa != null ? c.gpa - gpa : 0;
  const major = p.intendedMajor || "your main interest";

  // Academics
  add(0, "Academics", "Start strong: every grade counts", `Freshman grades are on your transcript. ${c ? `${name}'s admits average a ~${c.gpa.toFixed(2)} unweighted GPA.` : ""} Build study habits now and use office hours early.`, gpaGap > 0.1);
  add(1, "Academics", "Map a 4-year course plan", `Plan backward to the most rigorous senior schedule your school offers, especially in courses tied to ${major}. ${tier <= 2 ? `${name} expects the hardest available path.` : ""}`, (dim("rigor")?.z ?? 0) < -0.5);
  add(4, "Academics", "Lock in junior-year rigor", "Register for APs/IB/dual-enrollment in core subjects. Junior year is the most-read year of the transcript.", (dim("rigor")?.z ?? 0) < -0.3);
  if (gpaGap > 0.05) add(Math.max(6, currentPhase(p.grade)), "Academics", `Close the GPA gap (${gpa?.toFixed(2)} → ${c!.gpa.toFixed(2)})`, "Target the classes where you're losing the most points. An upward trend in 11th–12th grade is read favorably.", true);
  add(10, "Academics", "Finish senior year strong", "Admissions are conditional. Senior-spring grade drops can lead to rescinded offers.");

  // Testing
  add(3, "Testing", "Take the PSAT 10 (practice)", "Get a baseline. Use Bluebook and Khan Academy's free official practice.");
  add(6, "Testing", "PSAT/NMSQT: the one that counts", "Junior-year PSAT qualifies you for National Merit, which unlocks major merit scholarships.", false);
  if (c?.testPolicy !== "blind") {
    add(7, "Testing", `First SAT/ACT: aim for ${satTarget}+`, `${c ? `${name}'s middle 50% is ${collegeSatRange(c).join("–")}.` : ""} Take it in spring of junior year so you have time to retake.`, !!(c && (!sat || sat < satTarget)));
    add(8, "Testing", "Retake if below target", "Most students improve on a second attempt. Many schools superscore.", !!(sat && sat < satTarget));
  }

  // Activities
  add(0, "Activities", "Explore 4–6 clubs, then narrow", "Try things freely in 9th grade. By 10th, keep the 2–3 you'd do even if no one were watching.");
  add(2, "Activities", "Summer: build, don't just attend", `Pick one project tied to ${major}: research with a local professor, an app, a community initiative. Free programs and jobs count as much as expensive camps.`, (dim("extracurriculars")?.z ?? 0) < -0.3);
  add(4, "Activities", "Step into leadership", "Run for an officer role or start an initiative within a club you've committed to.", p.activities.every((a) => !a.leadership));
  add(5, "Activities", "Scale your signature activity", `Take your strongest commitment beyond school: regional competitions, city partnerships, measurable outcomes. ${tier <= 2 ? `At ${name}, admits typically show state-level or larger impact.` : ""}`, (dim("extracurriculars")?.z ?? 0) < 0);
  add(7, "Activities", "Compete for outside recognition", `Enter state/national competitions in ${major} (Science Olympiad, AMC, Scholastic Art & Writing, DECA, NSDA, Congressional App Challenge…).`, (dim("awards")?.z ?? 0) < -0.3);
  add(8, "Activities", "Summer before senior year: deepen", "Push your main project to a concrete result you can describe in numbers in the 150-character activity description.", true);

  // Essays
  add(5, "Essays", "Start a 'moments' journal", "Write down specific scenes: conversations, failures, small obsessions. These become essay material.");
  add(8, "Essays", "Draft your Common App essay", "Write 3 different openings before committing. Run each through the Essay Lab and pick the most specific.", (dim("essays")?.z ?? -1) < 0.3);
  add(9, "Essays", `Write ${name} supplements`, c ? `${name} recurring themes: ${c.supplements.slice(0, 3).join("; ")}. Reference resources like ${c.knownFor.slice(0, 2).join(" and ")}.` : "Research each school's unique resources before writing 'why us' essays.", !!c);

  // Applications
  add(6, "Applications", "Build a balanced list", "Aim for ~3 reaches, ~4 targets and ~3 likely schools you'd be happy to attend and can afford. Use the Tracker.");
  add(7, "Applications", "Ask two teachers for recommendations", "Ask junior-year core teachers in person before summer, then give them a brag sheet.", p.recs === "unknown" || p.recs === "average");
  add(8, "Applications", "Visit or connect virtually", `Attend info sessions${c ? ` for ${name}` : ""}. Note specific people, classes and details for 'why us' essays.`);
  add(9, "Applications", c?.plans.ed ? `Decide on Early Decision to ${name}` : "Submit early applications", c?.plans.ed ? `ED is binding but can raise your odds meaningfully at ${name}. Decide by October.` : `Early deadlines are usually Nov 1. ${c?.deadlines.early ? `${name}: ${c.deadlines.early}.` : ""}`, !!c);
  add(9, "Applications", "Submit regular decision apps", `Most RD deadlines fall Jan 1–15. ${c ? `${name}: ${c.deadlines.rd}.` : ""}`);
  add(10, "Applications", "Compare offers & commit by May 1", "Compare net cost, not sticker price. Appeal aid packages with competing offers.");

  // Money
  add(3, "Money", "Run net price calculators", "Every college has one on its site. Sticker price is rarely what families pay.");
  add(6, "Money", "Start applying for scholarships", "Many awards, like QuestBridge College Prep and Coolidge, are for juniors. See the Scholarships page.", p.lowIncome);
  add(9, "Money", "File the FAFSA (and CSS Profile)", "The FAFSA opens Oct 1. File early. Some state grants are first-come, first-served.");

  return ms.sort((a, b) => a.order - b.order || Number(b.priority) - Number(a.priority));
}
