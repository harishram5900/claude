import { fromScorecard, SC_FIELDS } from "@/lib/scorecard";

// Live search across every US institution in the Dept. of Education College Scorecard.
// Set COLLEGE_SCORECARD_API_KEY (free at api.data.gov/signup); DEMO_KEY works at low volume.
const BASE = "https://api.data.gov/ed/collegescorecard/v1/schools.json";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const id = searchParams.get("id")?.trim();
  if (!q && !id) return Response.json({ error: "Provide q or id" }, { status: 400 });
  const params = new URLSearchParams({
    api_key: process.env.COLLEGE_SCORECARD_API_KEY || "DEMO_KEY",
    fields: SC_FIELDS,
    per_page: "20",
    "school.degrees_awarded.predominant": "3",
    "school.operating": "1",
  });
  if (id) params.set("id", id.replace(/^sc-/, ""));
  else params.set("school.name", q!);
  try {
    const res = await fetch(`${BASE}?${params}`, { next: { revalidate: 60 * 60 * 24 } });
    if (!res.ok) return Response.json({ error: `College Scorecard returned ${res.status}`, results: [] }, { status: 502 });
    const data = (await res.json()) as { results?: Record<string, unknown>[] };
    const results = (data.results ?? []).map(fromScorecard).filter(Boolean);
    return Response.json({ results });
  } catch {
    return Response.json({ error: "Could not reach College Scorecard", results: [] }, { status: 502 });
  }
}
