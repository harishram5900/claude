// Builds everything the landing page's product screens show, from the real engines.
import { getCollege, type College } from "@/data/colleges";
import { FUNDING_LIBRARY } from "@/data/funding";
import { DRAFT_1, DRAFT_2, LANDING_PROFILE } from "@/data/landing";
import { collegeSatRange, evaluate, tierOf, TIER_INFO } from "./engine";
import { analyzeEssay } from "./essay";
import { toFundingProfile } from "./fundingProfile";
import { money, rank } from "./grantscout";
import { buildRoadmap } from "./roadmap";
import { getProgram } from "@/data/programs";
import { applyProgram } from "./programs";

const essayStats = (t: string) => {
  const a = analyzeEssay(t, { limit: 650 });
  return { score: a.overall, grade: a.grade, voice: a.scores.voice, specificity: a.scores.specificity, reflection: a.scores.reflection, issue: a.issues[0] ?? null };
};

const SHORT: Record<string, string> = { academics: "Academics", rigor: "Course rigor", testing: "Testing", extracurriculars: "Activities", awards: "Honors", essays: "Essay" };

export function landingData(today = new Date()) {
  const p1 = LANDING_PROFILE;
  const p2 = { ...LANDING_PROFILE, personalStatement: DRAFT_2 };
  const mich = getCollege("umich")!;
  const harv = getCollege("harvard")!;
  const m1 = evaluate(p1, mich);
  const m2 = evaluate(p2, mich);
  const h1 = evaluate(p1, harv);
  const h2 = evaluate(p2, harv);

  const readers = ["harvard", "umich", "uiuc", "uic"].map((id) => {
    const c = getCollege(id) as College;
    const e = evaluate(p2, c);
    return { id, name: c.name, short: c.short, admitRate: c.admitRate, sat: collegeSatRange(c), stance: TIER_INFO[tierOf(c)].stance, tier: TIER_INFO[tierOf(c)].label, chance: e.chance, decision: e.decision, academic: e.dimensions[0].rating };
  });

  const { kept } = rank(toFundingProfile(p2), FUNDING_LIBRARY, { today });
  // Example screen: awards open to any student (no gender- or heritage-specific ones).
  const open = kept.filter((x) => !/women|girls|hispanic|latino|black|asian|native|indian|lgbt/i.test(`${x.rec.name} ${x.rec.sponsor ?? ""}`));
  const upcoming = open.filter((x) => x.deadline && !x.deadlineEstimated).sort((a, b) => b.score - a.score);
  const scholarships = (upcoming.length >= 3 ? upcoming : open).slice(0, 3).map((x) => ({ name: x.rec.name, amount: money(x.rec), deadline: x.deadline }));

  const roadmap = buildRoadmap({ ...p2, grade: 10 }, mich)
    .filter((m) => m.order >= 3)
    .slice(0, 5)
    .map((m) => ({ phase: m.phase, title: m.title, priority: m.priority }));

  // Same student, same university, different schools inside it.
  const programRows = (cid: string, ids: (string | null)[]) => {
    const c = getCollege(cid)!;
    return {
      college: c.short,
      rows: ids.map((pid) => {
        const t = applyProgram(c, getProgram(cid, pid));
        const e = evaluate(p2, t);
        return { name: pid ? t.program!.name : `${c.short} overall`, rate: t.admitRate, chance: e.chance, decision: e.decision, arts: t.program?.kind === "arts", estimated: !!t.program && !getProgram(cid, pid)?.rate && !getProgram(cid, pid)?.relativeOdds };
      }),
    };
  };
  const programs = [programRows("nyu", [null, "stern", "cas", "tandon", "tisch-drama"]), programRows("uiuc", [null, "las", "gies", "grainger", "cs"])];

  return {
    profile: { gpa: (p2.gpaUnweighted ?? 0).toFixed(2), sat: String(p2.sat ?? "—"), ap: String(p2.apCount), activities: String(p2.activities.length), honors: String(p2.awards.length), essay: `${analyzeEssay(DRAFT_2).words} words` },
    programs,
    mich: {
      short: mich.short,
      chance: m2.chance,
      decision: m2.decision,
      dims: m2.dimensions
        .filter((d) => d.key in SHORT)
        .map((d) => ({ label: SHORT[d.key], rating: d.rating })),
      committee: m2.committeeLine,
      improvement: m2.improvements[0] ? { title: m2.improvements[0].title, gain: m2.improvements[0].gain } : null,
      before: m1.chance,
    },
    harvard: { short: harv.short, before: h1.chance, after: h2.chance, decision: h2.decision },
    draft1: essayStats(DRAFT_1),
    draft2: essayStats(DRAFT_2),
    firstImprovement: m1.improvements[0] ? { title: m1.improvements[0].title, detail: m1.improvements[0].detail } : null,
    readers,
    scholarships,
    scholarshipCount: kept.length,
    roadmap,
  };
}
export type LandingData = ReturnType<typeof landingData>;
