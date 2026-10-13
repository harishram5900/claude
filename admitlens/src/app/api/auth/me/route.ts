import { authConfigured, currentUser } from "@/lib/server/auth";
import { storageReady } from "@/lib/server/kv";

export const dynamic = "force-dynamic";

export async function GET() {
  const accounts = storageReady() && authConfigured();
  return Response.json({ user: accounts ? await currentUser() : null, accounts }, { headers: { "Cache-Control": "no-store" } });
}
