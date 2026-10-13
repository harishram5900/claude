import { ConflictError, createUser, normEmail, setSessionCookie, validEmail } from "@/lib/server/auth";
import { putJSON, StorageUnavailable } from "@/lib/server/kv";
import { dataKey } from "@/lib/server/auth";
import { cleanData } from "@/lib/server/data";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = normEmail(String(b.email ?? ""));
  const password = String(b.password ?? "");
  const name = String(b.name ?? "").trim();
  if (!validEmail(email)) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Use at least 8 characters for your password." }, { status: 400 });
  if (password.length > 200) return Response.json({ error: "That password is too long." }, { status: 400 });
  try {
    const user = await createUser(email, password, name);
    // Save whatever the student already entered (questionnaire, imported application) to the new account.
    const data = cleanData(b.data);
    if (data) await putJSON(dataKey(user.id), { ...data, savedAt: Date.now() });
    await setSessionCookie(user);
    return Response.json({ user });
  } catch (e) {
    if (e instanceof ConflictError) return Response.json({ error: "An account with this email already exists. Sign in instead." }, { status: 409 });
    if (e instanceof StorageUnavailable) return Response.json({ error: "Accounts aren't available on this deployment yet." }, { status: 503 });
    console.error("signup failed", e);
    return Response.json({ error: "Couldn't create your account. Please try again." }, { status: 500 });
  }
}
