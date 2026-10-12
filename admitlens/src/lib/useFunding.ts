"use client";
import { useMemo } from "react";
import { FUNDING_LIBRARY } from "@/data/funding";
import { toFundingProfile } from "./fundingProfile";
import { awardValue, essayClusters, lateralAngles, rank, RINGS, searchPlan, unclaimedChecklist } from "./grantscout";
import { useStore } from "./store";

// GrantScout's per-ring minimums for a complete list (playbook A4).
export const RING_QUOTA: Record<number, number> = { 1: 15, 2: 10, 3: 15, 4: 20, 5: 5, 6: 3, 7: 10 };
export const MAX_RESULTS = 100;

export function useFunding() {
  const { profile, customAwards } = useStore();
  return useMemo(() => {
    const fp = toFundingProfile(profile);
    const { kept, dropped } = rank(fp, [...FUNDING_LIBRARY, ...customAwards]);
    // Keep ring order but make sure the strongest records survive the cap.
    const top = new Set([...kept].sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS));
    const results = kept.filter((x) => top.has(x));
    const ringCounts = Object.fromEntries(RINGS.map(([r]) => [r, results.filter((x) => x.ring === r).length])) as Record<number, number>;
    const hasHomeCountry = fp.citizenships.length > 0 || fp.country_ties.length > 0;
    const thinRings = RINGS.filter(([r]) => (r !== 5 || hasHomeCountry) && r !== 6 && ringCounts[r] < RING_QUOTA[r]).map(([r]) => r);
    return {
      fp,
      results,
      dropped,
      ringCounts,
      thinRings,
      top: [...results].sort((a, b) => b.score - a.score).slice(0, 15),
      essays: essayClusters(results),
      unclaimed: unclaimedChecklist(fp),
      lateral: lateralAngles(fp),
      plan: searchPlan(fp),
      totalValue: results.reduce((a, x) => a + awardValue(x.rec), 0),
      totalEv: results.reduce((a, x) => a + x.expectedValue, 0),
      needsReview: results.filter((x) => x.review.length).length,
    };
  }, [profile, customAwards]);
}
