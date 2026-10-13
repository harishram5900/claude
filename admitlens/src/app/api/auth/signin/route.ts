import { clearFailures, noteFailure, normEmail, setSessionCookie, throttled, verifyUser } from "@/lib/server/auth";
import { StorageUnavailable } from "@/lib/server/kv";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = normEmail(String(b.email ?? ""));
  const password = String(b.password ?? "");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${ip}|${email}`;
  if (throttled(key)) return Response.json({ error: "Too many attempts. Wait 15 minutes and try again." }, { status: 429 });
  try {
    const user = email && password ? await verifyUser(email, password.slice(0, 200)) : null;
    if (!user) {
      noteFailure(key);
      return Response.json({ error: "That email and password don't match an account." }, { status: 401 });
    }
    clearFailures(key);
    await setSessionCookie(user);
    return Response.json({ user });
  } catch (e) {
    if (e instanceof StorageUnavailable) return Response.json({ error: "Accounts aren't available on this deployment yet." }, { status: 503 });
    console.error("signin failed", e);
    return Response.json({ error: "Couldn't sign you in. Please try again." }, { status: 500 });
  }
}
