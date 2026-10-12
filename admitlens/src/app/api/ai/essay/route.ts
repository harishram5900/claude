import { getCollege } from "@/data/colleges";
import { aiEnabled, errorMessage, structured } from "@/lib/ai";
import { tierOf, TIER_INFO } from "@/lib/engine";

export const maxDuration = 120;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["readerReaction", "biggestProblem", "lineEdits", "revisionPlan", "whatItRevealsAboutYou", "score"],
  properties: {
    readerReaction: { type: "string", description: "First-person gut reaction of the admissions reader after one read" },
    biggestProblem: { type: "string" },
    whatItRevealsAboutYou: { type: "string" },
    lineEdits: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["original", "issue", "suggestion"],
        properties: { original: { type: "string" }, issue: { type: "string" }, suggestion: { type: "string" } },
      },
    },
    revisionPlan: { type: "array", items: { type: "string" } },
    score: { type: "integer", description: "0–100 calibrated to this college's reader" },
  },
};

export async function POST(req: Request) {
  if (!aiEnabled()) return Response.json({ error: "AI is not configured on this deployment." }, { status: 503 });
  const { text, prompt, collegeId, limit } = (await req.json()) as { text: string; prompt: string; collegeId?: string | null; limit?: number };
  if (!text || text.trim().split(/\s+/).length < 40) return Response.json({ error: "Write at least 40 words first." }, { status: 400 });
  const college = collegeId ? getCollege(collegeId) : undefined;
  const system = college
    ? `You are an admissions reader at ${college.name} (admit rate ${(college.admitRate * 100).toFixed(1)}%; ${TIER_INFO[tierOf(college)].label}). This office rewards: ${college.values.join("; ")}. Distinctive resources: ${college.knownFor.join("; ")}. Critique the essay as this reader would, calibrated to this school's standards. Be candid and specific; quote the student's own sentences for line edits. Never rewrite the whole essay or replace the student's voice. Suggest, don't ghostwrite.`
    : `You are a veteran college admissions reader and writing coach. Critique this Common App-style essay candidly and specifically, quoting the student's own sentences for line edits. Never rewrite the whole essay or replace the student's voice. Suggest, don't ghostwrite.`;
  try {
    const out = await structured({
      system,
      user: `Prompt: ${prompt}\nWord limit: ${limit ?? 650}\n\nEssay:\n"""\n${text.slice(0, 8000)}\n"""`,
      schema,
    });
    return Response.json(out);
  } catch (e) {
    return Response.json({ error: errorMessage(e) }, { status: 502 });
  }
}
