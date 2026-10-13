import { currentUser, dataKey } from "@/lib/server/auth";
import { cleanData } from "@/lib/server/data";
import { getJSON, putJSON } from "@/lib/server/kv";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  try {
    const data = await getJSON<Record<string, unknown>>(dataKey(user.id));
    return Response.json({ user, data: data ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("load failed", e);
    return Response.json({ error: "Couldn't load your saved data." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const data = cleanData(await req.json().catch(() => null));
  if (!data) return Response.json({ error: "Invalid or too large" }, { status: 400 });
  try {
    await putJSON(dataKey(user.id), { ...data, savedAt: Date.now() });
    return Response.json({ ok: true, savedAt: Date.now() });
  } catch (e) {
    console.error("save failed", e);
    return Response.json({ error: "Couldn't save. Your changes are kept on this device." }, { status: 500 });
  }
}
