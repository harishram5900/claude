import "server-only";
import { createHash, createHmac, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { ConflictError, getJSON, putJSON } from "./kv";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
export const COOKIE = "al_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  salt: string;
  hash: string;
  createdAt: number;
}
export interface PublicUser {
  id: string;
  email: string;
  name: string;
}

export function authConfigured() {
  return process.env.NODE_ENV !== "production" || (process.env.AUTH_SECRET ?? "").length >= 32;
}

function secret() {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is not set");
  return "dev-only-secret-do-not-use-in-production-0123456789";
}

export const normEmail = (e: string) => e.trim().toLowerCase();
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;
const emailKey = (email: string) => `users/email/${createHash("sha256").update(normEmail(email)).digest("hex")}.json`;
export const dataKey = (id: string) => `users/data/${id}.json`;

async function hashPassword(pw: string, salt: Buffer) {
  return (await scrypt(pw, salt, 64)).toString("hex");
}

export async function createUser(email: string, password: string, name: string): Promise<PublicUser> {
  if (await getJSON(emailKey(email))) throw new ConflictError("exists");
  const salt = randomBytes(16);
  const rec: UserRecord = { id: randomUUID(), email: normEmail(email), name: name.trim().slice(0, 80), salt: salt.toString("hex"), hash: await hashPassword(password, salt), createdAt: Date.now() };
  await putJSON(emailKey(email), rec, { create: true }); // throws ConflictError if the email is taken
  return { id: rec.id, email: rec.email, name: rec.name };
}
export { ConflictError };

export async function verifyUser(email: string, password: string): Promise<PublicUser | null> {
  const rec = await getJSON<UserRecord>(emailKey(email));
  // Always run scrypt so response time doesn't reveal whether the email exists.
  const salt = rec ? Buffer.from(rec.salt, "hex") : randomBytes(16);
  const h = Buffer.from(await hashPassword(password, salt), "hex");
  if (!rec) return null;
  const ok = timingSafeEqual(h, Buffer.from(rec.hash, "hex"));
  return ok ? { id: rec.id, email: rec.email, name: rec.name } : null;
}

// ---- sessions: stateless, HMAC-signed cookie "<b64 payload>.<sig>"
function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}
export function makeSession(u: PublicUser) {
  const payload = Buffer.from(JSON.stringify({ ...u, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function readSession(token: string | undefined): PublicUser | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof d.exp !== "number" || d.exp < Date.now()) return null;
    return { id: d.id, email: d.email, name: d.name };
  } catch {
    return null;
  }
}
export async function currentUser() {
  return readSession((await cookies()).get(COOKIE)?.value);
}
export async function setSessionCookie(u: PublicUser) {
  (await cookies()).set(COOKIE, makeSession(u), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
}
export async function clearSessionCookie() {
  (await cookies()).set(COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

// ---- best-effort brute-force throttle (per server instance)
const attempts = new Map<string, { n: number; until: number }>();
export function throttled(key: string) {
  const a = attempts.get(key);
  return !!a && a.n >= 8 && a.until > Date.now();
}
export function noteFailure(key: string) {
  const a = attempts.get(key);
  const fresh = !a || a.until < Date.now();
  attempts.set(key, { n: fresh ? 1 : a!.n + 1, until: Date.now() + 15 * 60 * 1000 });
}
export function clearFailures(key: string) {
  attempts.delete(key);
}
