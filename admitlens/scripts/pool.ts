// Synthetic applicant pools for calibration: academics fixed per decile, everything else
// (activities, honors, essays, recommendations, context) drawn from plausible distributions
// for a highly selective school's applicant pool. Seeded, so results are reproducible.
import { DECILE_ACADEMICS } from "../src/data/calibration";
import { SAMPLE_PROFILE } from "../src/lib/sample";
import { EMPTY_PROFILE, type Activity, type Profile } from "../src/lib/types";
import { ESSAYS } from "../tests/fixtures";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}
function pickW<T>(r: () => number, items: [T, number][]): T {
  let x = r() * items.reduce((a, [, w]) => a + w, 0);
  for (const [v, w] of items) if ((x -= w) <= 0) return v;
  return items[items.length - 1][0];
}

const ESSAY_POOL: [string, number][] = [
  [ESSAYS.ESSAY_C, 0.2],
  [ESSAYS.ESSAY_A, 0.4],
  [SAMPLE_PROFILE.personalStatement, 0.4],
];

export function pool(decile: number, n: number, seed = 1): Profile[] {
  const r = rng(seed * 1000 + decile);
  const a = DECILE_ACADEMICS[decile];
  const out: Profile[] = [];
  for (let i = 0; i < n; i++) {
    const nActs = 3 + Math.floor(r() * 8);
    const acts: Activity[] = Array.from({ length: nActs }, (_, j) => ({
      id: `p${j}`,
      name: "Activity",
      role: "",
      category: "Other",
      years: 1 + Math.floor(r() * 4),
      hoursPerWeek: 2 + Math.floor(r() * 10),
      weeksPerYear: 20 + Math.floor(r() * 25),
      leadership: r() < 0.35,
      founder: r() < 0.06,
      impact: pickW(r, [["school", 0.45], ["local", 0.3], ["state", 0.15], ["national", 0.08], ["international", 0.02]]),
      description: "",
    }));
    const nAwards = Math.floor(r() * 5);
    out.push({
      ...EMPTY_PROFILE,
      name: `Applicant ${decile}-${i}`,
      grade: 12,
      state: "NY",
      gpaUnweighted: Math.min(4, Math.round((a.gpa + (r() - 0.5) * 0.06) * 100) / 100),
      sat: Math.min(1600, Math.round((a.sat + (r() - 0.5) * 40) / 10) * 10),
      apCount: Math.max(0, a.ap + Math.floor((r() - 0.5) * 4)),
      rigor: (a.ap >= 9 ? 5 : a.ap >= 6 ? 4 : 3) as Profile["rigor"],
      activities: acts,
      awards: Array.from({ length: nAwards }, (_, j) => ({ id: `w${j}`, name: "Award", level: pickW(r, [["school", 0.5], ["regional", 0.2], ["state", 0.2], ["national", 0.09], ["international", 0.01]]) })),
      personalStatement: pickW(r, ESSAY_POOL),
      recs: pickW(r, [["unknown", 0.1], ["average", 0.35], ["strong", 0.4], ["exceptional", 0.15]]),
      firstGen: r() < 0.1,
      lowIncome: r() < 0.15,
    });
  }
  return out;
}
