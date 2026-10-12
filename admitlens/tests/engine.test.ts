// Run with: npm test
// Exercises the evaluation engine across many profiles and colleges and asserts the
// properties the product promises: calibrated, school-specific, differentiated, monotonic.
import { COLLEGES, getCollege } from "../src/data/colleges";
import { analyzeEssay } from "../src/lib/essay";
import { chanceOnly, evaluate } from "../src/lib/engine";
import type { Profile } from "../src/lib/types";
import { AVERAGE, ESSAYS, SOLID, STRONG, WEAK, act } from "./fixtures";

let failures = 0;
let passes = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) passes++;
  else {
    failures++;
    console.log(`  ✗ ${name} ${detail}`);
  }
}
const pct = (x: number) => (x * 100).toFixed(1).padStart(5) + "%";

const schools = ["harvard", "mit", "stanford", "duke", "umich", "uiuc", "utaustin", "purdue", "uic", "asu"].map((id) => getCollege(id)!);
const people = [STRONG, SOLID, AVERAGE, WEAK];

console.log("\n== Chance matrix (RD) ==");
console.log("".padEnd(16) + schools.map((s) => s.short.slice(0, 9).padStart(10)).join(""));
for (const p of people) {
  console.log(p.name.padEnd(16) + schools.map((s) => pct(chanceOnly(p, s)).padStart(10)).join(""));
}

console.log("\n== Ratings & grades: same student, different readers ==");
for (const s of [getCollege("harvard")!, getCollege("umich")!, getCollege("uic")!]) {
  const e = evaluate(SOLID, s);
  console.log(`${s.short.padEnd(10)} overall ${e.overallRating} (${e.overallGrade})  ` + e.dimensions.map((d) => `${d.key.slice(0, 5)}:${d.rating}/${d.grade}`).join("  "));
  console.log(`  verdict: ${e.verdict} | committee: ${e.committeeLine}`);
}

// 1. Harvard grades harder than UIC for every profile
for (const p of people) {
  const h = evaluate(p, getCollege("harvard")!);
  const u = evaluate(p, getCollege("uic")!);
  check(`${p.name}: Harvard chance < UIC chance`, h.chance < u.chance);
  check(`${p.name}: Harvard academic rating is harsher (higher number) than UIC`, h.dimensions[0].rating >= u.dimensions[0].rating);
}

// 2. Ceiling: even a near-perfect unhooked applicant is not a lock at Harvard/MIT/Stanford
for (const id of ["harvard", "mit", "stanford", "caltech"]) {
  const c = chanceOnly(STRONG, getCollege(id)!);
  check(`Strong applicant at ${id} stays under 35%`, c < 0.35, pct(c));
  check(`Strong applicant at ${id} is well above base rate`, c > getCollege(id)!.admitRate * 2, pct(c));
}
// 3. Accessible school is likely for solid/average
check("Solid applicant is likely at UIC", chanceOnly(SOLID, getCollege("uic")!) > 0.85);
check("Average applicant is better than a coin flip at UIC", chanceOnly(AVERAGE, getCollege("uic")!) > 0.6);
check("Weak applicant is under 3% at Harvard", chanceOnly(WEAK, getCollege("harvard")!) < 0.03);

// 4. Monotonicity on many random perturbations
function rnd(seed: number) { let s = seed; return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296); }
const r = rnd(42);
let mono = 0;
for (let i = 0; i < 300; i++) {
  const c = COLLEGES[Math.floor(r() * COLLEGES.length)];
  const base: Profile = { ...AVERAGE, gpaUnweighted: 2.8 + r() * 1.2, sat: Math.round(1000 + r() * 590), apCount: Math.floor(r() * 12), rigor: (1 + Math.floor(r() * 5)) as Profile["rigor"] };
  const up = { ...base, gpaUnweighted: Math.min(4, base.gpaUnweighted! + 0.15) };
  const upSat = { ...base, sat: Math.min(1600, base.sat! + 80) };
  const upAct = { ...base, activities: [...base.activities, act({ name: "Startup", role: "Founder", leadership: true, founder: true, impact: "state", years: 3, hoursPerWeek: 8 })] };
  const b = chanceOnly(base, c);
  if (chanceOnly(up, c) >= b && chanceOnly(upAct, c) >= b && (c.testPolicy === "blind" || chanceOnly(upSat, c) >= b)) mono++;
  else console.log("  non-monotone at", c.id, base.gpaUnweighted, base.sat);
}
check("Monotonic in GPA, SAT and activities over 300 random cases", mono === 300, `${mono}/300`);

// 5. Differentiation: 200 random students at one school produce many distinct scores and memos
const harvard = getCollege("harvard")!;
const scores = new Set<string>();
let atFloor = 0;
const memos = new Set<string>();
for (let i = 0; i < 200; i++) {
  const p: Profile = {
    ...SOLID,
    name: `Student ${i}`,
    gpaUnweighted: Math.round((3.3 + r() * 0.7) * 100) / 100,
    sat: Math.round(1250 + r() * 350),
    apCount: Math.floor(r() * 13),
    activities: SOLID.activities.slice(0, 1 + Math.floor(r() * 4)).map((a) => ({ ...a, leadership: r() > 0.5, impact: (["school", "local", "state", "national"] as const)[Math.floor(r() * 4)] })),
    recs: (["unknown", "average", "strong", "exceptional"] as const)[Math.floor(r() * 4)],
  };
  const e = evaluate(p, harvard);
  if (e.chance <= 0.0002) atFloor++;
  else scores.add(e.chance.toPrecision(5));
  memos.add(e.memo.join(" "));
}
console.log(`\n200 random applicants to Harvard → ${scores.size} distinct chances (+${atFloor} at the 0.02% floor), ${memos.size} distinct memos`);
check("Every applicant above the floor gets a distinct chance", scores.size >= 200 - atFloor - 2);
check("Fewer than 10% of random applicants pinned at the floor", atFloor < 20);
check("At least 190/200 distinct memos", memos.size >= 190);

// 6. Determinism: same input → same output
check("Deterministic", JSON.stringify(evaluate(SOLID, harvard)) === JSON.stringify(evaluate(SOLID, harvard)));

// 7. ED and residency effects
check("ED raises chance at Duke", chanceOnly(SOLID, getCollege("duke")!, "ED") > chanceOnly(SOLID, getCollege("duke")!, "RD"));
check("In-state raises chance at UNC", chanceOnly({ ...SOLID, state: "NC" }, getCollege("unc")!) > chanceOnly(SOLID, getCollege("unc")!) * 1.5);
check("Legacy ignored at MIT", chanceOnly({ ...SOLID, legacyAt: ["mit"] }, getCollege("mit")!) === chanceOnly(SOLID, getCollege("mit")!));
check("Legacy counted at Harvard", chanceOnly({ ...SOLID, legacyAt: ["harvard"] }, harvard) > chanceOnly(SOLID, harvard));
check("Missing scores at test-required MIT hurts", chanceOnly({ ...STRONG, sat: null }, getCollege("mit")!) < chanceOnly(STRONG, getCollege("mit")!) / 2);

// 8. Essay analyzer separates good from cliché writing
const ea = analyzeEssay(ESSAYS.ESSAY_A);
const ec = analyzeEssay(ESSAYS.ESSAY_C);
console.log(`\nEssay A: ${ea.overall} (${ea.grade})  scores ${JSON.stringify(ea.scores)}`);
console.log(`Essay C: ${ec.overall} (${ec.grade})  scores ${JSON.stringify(ec.scores)}  issues=${ec.issues.length}`);
check("Specific essay outscores cliché essay by 20+", ea.overall - ec.overall >= 20);
check("Cliché essay flags at least 5 issues", ec.issues.length >= 5);
const why = analyzeEssay("I want to attend Harvard because it is prestigious and world-renowned with a diverse community and strong alumni network. ".repeat(4), { limit: 250, college: harvard });
const why2 = analyzeEssay("At Harvard I want to live in the House system and take a Kennedy School cross-registration seminar on housing policy, then bring that to the Harvard Innovation Labs where my team can pilot the eviction-alert tool we built for 312 families in Chicago. ".repeat(2), { limit: 250, college: harvard });
check("Specific why-us essay beats generic on fit", (why2.scores.fit ?? 0) > (why.scores.fit ?? 0) + 30, `${why2.scores.fit} vs ${why.scores.fit}`);

// 9. Improvement plan produces real, positive what-ifs
const plan = evaluate(SOLID, getCollege("umich")!).improvements;
console.log("\nImprovement plan for Ben at Michigan:");
plan.forEach((i) => console.log(`  +${i.gain.toFixed(1)} pts  ${i.title}`));
check("Improvement plan has 3+ items with positive gains", plan.length >= 3 && plan.every((i) => i.gain > 0));

// 10. Every college evaluates without NaN
let bad = 0;
for (const c of COLLEGES) for (const p of people) { const e = evaluate(p, c); if (!Number.isFinite(e.chance)) bad++; }
check(`All ${COLLEGES.length} colleges × 4 profiles produce finite chances`, bad === 0);

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
