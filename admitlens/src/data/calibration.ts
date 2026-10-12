// Real admissions outcomes used to calibrate the most-selective end of the model.
//
// Harvard College admit rates for applicants who were NOT recruited athletes, legacies,
// dean's/director's list or children of faculty ("non-ALDC"), by academic-index decile of
// the applicant pool, Classes of 2014–2019 (about 5.9% overall admit rate in that period).
// Source: Arcidiacono, Kinsler & Ransom, "Legacy and Athlete Preferences at Harvard",
// Economics of Education Review 88 (2022), built from data released in SFFA v. Harvard.
export const HARVARD_NON_ALDC_BY_DECILE = [0.0001, 0.0053, 0.0165, 0.0329, 0.044, 0.0564, 0.0661, 0.0822, 0.104, 0.1458];
export const HARVARD_PERIOD_ADMIT_RATE = 0.059;

// Legacy applicants were admitted at ~33.6% vs 5.9% overall; the authors estimate legacy status
// multiplies a typical applicant's odds about five-fold.
export const LEGACY_ODDS_MULTIPLIER = 5;

// Representative academics for each decile of Harvard's applicant pool. The paper publishes
// academic-index ranges only for the ends (decile 1: 100–193.5, decile 10: 236–240); the
// middle cutoffs are interpolated. Academic index ≈ SAT/10 + converted GPA/rank score (max 80).
export const DECILE_ACADEMICS: { sat: number; gpa: number; ap: number }[] = [
  { sat: 1180, gpa: 3.35, ap: 3 },
  { sat: 1320, gpa: 3.55, ap: 5 },
  { sat: 1390, gpa: 3.67, ap: 6 },
  { sat: 1430, gpa: 3.75, ap: 7 },
  { sat: 1460, gpa: 3.82, ap: 8 },
  { sat: 1490, gpa: 3.86, ap: 9 },
  { sat: 1510, gpa: 3.9, ap: 9 },
  { sat: 1530, gpa: 3.93, ap: 10 },
  { sat: 1550, gpa: 3.97, ap: 11 },
  { sat: 1580, gpa: 4.0, ap: 12 },
];

/** Converts a past-period admit rate to today's by holding the odds ratio to the overall rate fixed. */
export function rescale(rate: number, fromOverall: number, toOverall: number) {
  const odds = (rate / (1 - rate)) * ((toOverall / (1 - toOverall)) / (fromOverall / (1 - fromOverall)));
  return odds / (1 + odds);
}
