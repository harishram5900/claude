import { fromScorecard, officialStats, SC_FIELDS } from "@/lib/scorecard";

// Live search across every US institution in the Dept. of Education College Scorecard.
// Set COLLEGE_SCORECARD_API_KEY (free at api.data.gov/signup); DEMO_KEY works at low volume.
const BASE = "https://api.data.gov/ed/collegescorecard/v1/schools.json";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const id = searchParams.get("id")?.trim();
  // ?official=<exact name>&state=XX → federal outcome data for a dataset college
  const official = searchParams.get("official")?.trim();
  const state = searchParams.get("state")?.trim();
  if (official) return officialLookup(official, state);
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

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\bthe\b/g, "").trim();

async function officialLookup(name: string, state?: string | null) {
  const params = new URLSearchParams({
    api_key: process.env.COLLEGE_SCORECARD_API_KEY || "DEMO_KEY",
    fields: SC_FIELDS,
    per_page: "20",
    "school.name": name.replace(/^the\s+/i, "").replace(/[–—,]/g, " ").replace(/\s+/g, " ").trim(),
  });
  if (state) params.set("school.state", state);
  try {
    const res = await fetch(`${BASE}?${params}`, { next: { revalidate: 60 * 60 * 24 * 7 } });
    if (!res.ok) return Response.json({ error: `College Scorecard returned ${res.status}` }, { status: 502 });
    const data = (await res.json()) as { results?: Record<string, unknown>[] };
    const rows = data.results ?? [];
    const target = norm(name);
    // 1) exact name, 2) federal name that starts with ours ("University of Michigan" →
    // "University of Michigan-Ann Arbor"), 3) every word of ours present, in order.
    // Never fall back to an unrelated school that merely shares a word (e.g. Michigan State).
    const bySize = (a: Record<string, unknown>, b: Record<string, unknown>) => Number(b["latest.student.size"] ?? 0) - Number(a["latest.student.size"] ?? 0);
    const words = target.split(" ");
    const inOrder = (n: string) => {
      let i = 0;
      for (const w of n.split(" ")) if (w === words[i]) i++;
      return i === words.length;
    };
    const best =
      rows.find((r) => norm(String(r["school.name"])) === target) ??
      rows.filter((r) => norm(String(r["school.name"])).startsWith(target + " ")).sort(bySize)[0] ??
      rows.filter((r) => inOrder(norm(String(r["school.name"])))).sort(bySize)[0];
    if (!best) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ stats: officialStats(best) });
  } catch {
    return Response.json({ error: "Could not reach College Scorecard" }, { status: 502 });
  }
}
