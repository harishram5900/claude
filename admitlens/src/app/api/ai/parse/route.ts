import { aiEnabled, errorMessage, structured } from "@/lib/ai";

export const maxDuration = 120;

const activity = {
  type: "object",
  additionalProperties: false,
  required: ["name", "role", "category", "years", "hoursPerWeek", "weeksPerYear", "leadership", "founder", "impact", "description"],
  properties: {
    name: { type: "string" },
    role: { type: "string" },
    category: { type: "string" },
    years: { type: "integer" },
    hoursPerWeek: { type: "number" },
    weeksPerYear: { type: "integer" },
    leadership: { type: "boolean" },
    founder: { type: "boolean" },
    impact: { type: "string", enum: ["school", "local", "state", "national", "international"] },
    description: { type: "string" },
  },
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "state", "highSchool", "intendedMajor", "graduationYear", "gpaUnweighted", "gpaWeighted", "classRankPercent", "apCount", "sat", "act", "activities", "awards", "personalStatement", "firstGen", "feeWaiver"],
  properties: {
    name: { type: "string" },
    state: { type: "string", description: "Two-letter US state code or empty" },
    highSchool: { type: "string" },
    intendedMajor: { type: "string" },
    graduationYear: { type: ["integer", "null"] },
    gpaUnweighted: { type: ["number", "null"] },
    gpaWeighted: { type: ["number", "null"] },
    classRankPercent: { type: ["number", "null"] },
    apCount: { type: "integer" },
    sat: { type: ["integer", "null"] },
    act: { type: ["integer", "null"] },
    activities: { type: "array", items: activity },
    awards: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["name", "level"], properties: { name: { type: "string" }, level: { type: "string", enum: ["school", "regional", "state", "national", "international"] } } },
    },
    personalStatement: { type: "string", description: "Full personal essay text verbatim, or empty" },
    firstGen: { type: "boolean" },
    feeWaiver: { type: "boolean" },
  },
};

export async function POST(req: Request) {
  if (!aiEnabled()) return Response.json({ error: "AI is not configured on this deployment." }, { status: 503 });
  const { text } = (await req.json()) as { text: string };
  if (!text || text.length < 200) return Response.json({ error: "Not enough text to parse." }, { status: 400 });
  try {
    const out = await structured({
      system:
        "Extract a student's college application data from the text of their Common App PDF export. Only use values present in the text; use null/empty/0/false when absent. Copy the personal essay verbatim. 'impact' is the widest reach evident in the activity description.",
      user: text.slice(0, 60000),
      schema,
      maxTokens: 16000,
    });
    return Response.json(out);
  } catch (e) {
    return Response.json({ error: errorMessage(e) }, { status: 502 });
  }
}
