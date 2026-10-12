// Fits the most-selective end of the model to Harvard's SFFA outcome data.
// Run: npx tsx scripts/calibrate.ts   (prints fitted PARAMS to paste into src/lib/engine.ts)
import { getCollege } from "../src/data/colleges";
import { HARVARD_NON_ALDC_BY_DECILE, HARVARD_PERIOD_ADMIT_RATE, rescale } from "../src/data/calibration";
import { chanceOnly, PARAMS } from "../src/lib/engine";
import { pool } from "./pool";

const harvard = getCollege("harvard")!;
const N = Number(process.env.N ?? 120);
const pools = HARVARD_NON_ALDC_BY_DECILE.map((_, d) => pool(d, N));
const targets = HARVARD_NON_ALDC_BY_DECILE.map((r) => rescale(r, HARVARD_PERIOD_ADMIT_RATE, harvard.admitRate));

export function curve() {
  return pools.map((ps) => ps.reduce((a, p) => a + chanceOnly(p, harvard), 0) / ps.length);
}
function loss() {
  const c = curve();
  let l = 0;
  for (let d = 1; d < 10; d++) l += (Math.log(c[d]) - Math.log(targets[d])) ** 2;
  l += c[0] > 0.003 ? Math.log(c[0] / 0.003) ** 2 : 0; // decile 1 must stay near zero
  return l;
}

const KEYS = ["base", "gpaW", "testW", "screen", "screenPenalty", "ecW"] as const;
// GPA and SAT move together across the deciles, so the data alone can't separate their weights.
// Keep GPA meaningful (it is the strongest predictor of college grades) with a floor.
const MIN: Partial<Record<(typeof KEYS)[number], number>> = { gpaW: 0.4, testW: 0.3, ecW: 0.5 };
const STEP: Record<(typeof KEYS)[number], number> = { base: 0.25, gpaW: 0.15, testW: 0.15, screen: 0.3, screenPenalty: 0.3, ecW: 0.15 };

if (process.argv[1]?.includes("calibrate")) {
  const before = curve();
  let best = loss();
  console.log("start loss", best.toFixed(3));
  for (let round = 0; round < 6; round++) {
    for (const k of KEYS) {
      for (const dir of [1, -1]) {
        for (;;) {
          const old = PARAMS[k][0];
          PARAMS[k][0] = Math.round((old + dir * STEP[k] / (round + 1)) * 1000) / 1000;
          if (MIN[k] !== undefined && PARAMS[k][0] < MIN[k]!) {
            PARAMS[k][0] = old;
            break;
          }
          const l = loss();
          if (l < best - 1e-4) best = l;
          else {
            PARAMS[k][0] = old;
            break;
          }
        }
      }
    }
    console.log(`round ${round} loss ${best.toFixed(3)}`);
  }
  const c = curve();
  console.log("decile  target  before  after");
  c.forEach((v, d) => console.log(`${String(d + 1).padStart(6)}  ${(targets[d] * 100).toFixed(2).padStart(6)}%  ${(before[d] * 100).toFixed(2).padStart(6)}%  ${(v * 100).toFixed(2).padStart(6)}%`));
  console.log("fitted:", JSON.stringify(Object.fromEntries(KEYS.map((k) => [k, PARAMS[k][0]]))));
}
