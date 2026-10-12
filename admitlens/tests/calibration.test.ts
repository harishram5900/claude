// Checks the model against real outcomes: Harvard admit rates by academic decile (SFFA data),
// the legacy effect, and recruited-athlete admit rates.
import { getCollege } from "../src/data/colleges";
import { HARVARD_NON_ALDC_BY_DECILE, HARVARD_PERIOD_ADMIT_RATE, LEGACY_ODDS_MULTIPLIER, rescale } from "../src/data/calibration";
import { chanceOnly } from "../src/lib/engine";
import { pool } from "../scripts/pool";

const harvard = getCollege("harvard")!;
let fail = 0;
const check = (n: string, ok: boolean, d = "") => { if (!ok) fail++; console.log(`${ok ? "✓" : "✗"} ${n} ${d}`); };
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const odds = (p: number) => p / (1 - p);

console.log("decile  real(today)  model");
HARVARD_NON_ALDC_BY_DECILE.forEach((real, d) => {
  const target = rescale(real, HARVARD_PERIOD_ADMIT_RATE, harvard.admitRate);
  const model = avg(pool(d, 120).map((p) => chanceOnly(p, harvard)));
  console.log(`${String(d + 1).padStart(6)}  ${(target * 100).toFixed(2).padStart(10)}%  ${(model * 100).toFixed(2).padStart(5)}%`);
  if (d === 0) check("decile 1 stays near zero", model < 0.003);
  else check(`decile ${d + 1} within 1.5x of real outcome`, model / target < 1.5 && target / model < 1.5);
});

const mid = pool(5, 120);
const base = avg(mid.map((p) => chanceOnly(p, harvard)));
const legacy = avg(mid.map((p) => chanceOnly({ ...p, legacyAt: ["harvard"] }, harvard)));
const ratio = odds(legacy) / odds(base);
check("legacy multiplies odds ~5x (SFFA)", ratio > LEGACY_ODDS_MULTIPLIER * 0.6 && ratio < LEGACY_ODDS_MULTIPLIER * 1.5, `got ${ratio.toFixed(1)}x`);
const athlete = avg(pool(6, 120).map((p) => chanceOnly({ ...p, recruitedAthlete: true }, harvard)));
check("recruited athletes admitted at a high rate (SFFA: ~83–86%)", athlete > 0.6 && athlete < 0.92, `got ${(athlete * 100).toFixed(0)}%`);
process.exit(fail ? 1 : 0);
