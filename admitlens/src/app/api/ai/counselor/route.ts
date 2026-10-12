import { getCollege, type College } from "@/data/colleges";
import { aiEnabled, errorMessage, structured } from "@/lib/ai";
import { evaluate, TIER_INFO } from "@/lib/engine";
import type { AppPlan, Profile } from "@/lib/types";

export const maxDuration = 120;

interface Body {
  profile: Profile;
  collegeId?: string;
  college?: College;
  plan?: AppPlan;
}

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["memo", "harshTruths", "whatWouldChangeMyMind", "essayCritique", "activityCritique", "oneLineVerdict"],
  properties: {
    memo: { type: "array", items: { type: "string" }, description: "3–5 paragraphs in the reader's first-person voice" },
    harshTruths: { type: "array", items: { type: "string" }, description: "3–5 blunt criticisms specific to this file" },
    whatWouldChangeMyMind: { type: "array", items: { type: "string" }, description: "3–5 concrete, specific actions with why they matter at this college" },
    essayCritique: { type: "string" },
    activityCritique: { type: "string" },
    oneLineVerdict: { type: "string" },
  },
};

export async function POST(req: Request) {
  if (!aiEnabled()) return Response.json({ error: "AI is not configured on this deployment." }, { status: 503 });
  const body = (await req.json()) as Body;
  const college = body.collegeId ? getCollege(body.collegeId) : body.college;
  if (!college || !body.profile) return Response.json({ error: "Missing profile or college" }, { status: 400 });
  const ev = evaluate(body.profile, college, body.plan ?? "RD");
  const p = body.profile;

  const system = `You are simulating an experienced admissions reader at ${college.name}. You read applications the way this specific institution does.

Institution facts (from its published admissions data):
- Overall admit rate: ${(college.admitRate * 100).toFixed(1)}%. Selectivity tier: ${TIER_INFO[ev.tier].label}.
- Typical admitted GPA (unweighted): ~${college.gpa}. Middle-50% SAT: ${college.sat ? college.sat.join("–") : "n/a"}; ACT: ${college.act ? college.act.join("–") : "n/a"}. Test policy: ${college.testPolicy}.
- What this office says it rewards: ${college.values.join("; ")}.
- Distinctive programs/resources: ${college.knownFor.join("; ")}.
- Reader stance for this tier: ${TIER_INFO[ev.tier].stance}

Calibrate your severity to the institution. A reader at a school admitting under 5% is far harsher than one at a school admitting 80%; a profile that is excellent for one is ordinary for the other. Be specific to this applicant's actual activities, numbers and essay. Never be generic, never flatter, never invent facts about the applicant. Do not mention race or ethnicity as a factor. The quantitative model's chance estimate is provided; your qualitative read should be consistent with it.`;

  const user = `Quantitative model output for this file at ${college.short}:
- Estimated chance (${ev.plan}): ${(ev.chance * 100).toFixed(1)}% (range ${(ev.chanceLow * 100).toFixed(1)}–${(ev.chanceHigh * 100).toFixed(1)}%), verdict: ${ev.verdict}
- Reader ratings (1 best – 6 weakest): ${ev.dimensions.map((d) => `${d.label} ${d.rating} (${d.note})`).join("; ")}

Applicant file:
${JSON.stringify(
  {
    grade: p.grade,
    state: p.state,
    intendedMajor: p.intendedMajor,
    gpaUnweighted: p.gpaUnweighted,
    gpaWeighted: p.gpaWeighted,
    classRankTopPercent: p.classRankPercent,
    apIbDualEnrollmentCourses: p.apCount,
    rigorOutOf5: p.rigor,
    sat: p.submitTests ? p.sat : "not submitting",
    act: p.submitTests ? p.act : "not submitting",
    activities: p.activities.map((a) => ({ name: a.name, role: a.role, years: a.years, hoursPerWeek: a.hoursPerWeek, leadership: a.leadership, founder: a.founder, reach: a.impact, description: a.description })),
    honors: p.awards.map((a) => `${a.name} (${a.level})`),
    recommendationsSelfAssessed: p.recs,
    context: { firstGen: p.firstGen, lowIncome: p.lowIncome, significantResponsibilities: p.significantResponsibilities, recruitedAthlete: p.recruitedAthlete, legacyHere: p.legacyAt.includes(college.id) },
  },
  null,
  1,
)}

Personal statement:
"""
${p.personalStatement.slice(0, 5000) || "(none provided)"}
"""

Write your reader memo for the committee.`;

  try {
    const out = await structured<{
      memo: string[];
      harshTruths: string[];
      whatWouldChangeMyMind: string[];
      essayCritique: string;
      activityCritique: string;
      oneLineVerdict: string;
    }>({ system, user, schema });
    return Response.json(out);
  } catch (e) {
    return Response.json({ error: errorMessage(e) }, { status: 502 });
  }
}
