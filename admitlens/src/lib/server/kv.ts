// Tiny JSON document store for accounts.
//   * Production: a private Vercel Blob store (BLOB_READ_WRITE_TOKEN). Reads bypass the CDN cache
//     so a profile saved on one device is what the next device sees.
//   * Local development: JSON files under .data/ (never deployed).
import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

export class ConflictError extends Error {}
export class StorageUnavailable extends Error {}

const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const useFiles = () => !useBlob() && (process.env.NODE_ENV !== "production" || process.env.ADMITLENS_FILE_STORE === "1");
const DIR = path.join(process.cwd(), ".data");

export function storageReady() {
  return useBlob() || useFiles();
}

function safe(key: string) {
  if (!/^[a-z0-9/_-]+\.json$/i.test(key) || key.includes("..")) throw new Error("bad key");
  return key;
}

export async function getJSON<T>(key: string): Promise<T | null> {
  safe(key);
  if (useBlob()) {
    const { get } = await import("@vercel/blob");
    const r = await get(key, { access: "private", useCache: false }).catch((e) => {
      if (/not.?found/i.test(String(e?.name ?? e?.message))) return null;
      throw e;
    });
    if (!r || r.statusCode !== 200) return null;
    return JSON.parse(await new Response(r.stream).text()) as T;
  }
  if (useFiles()) {
    try {
      return JSON.parse(await fs.readFile(path.join(DIR, key), "utf8")) as T;
    } catch {
      return null;
    }
  }
  throw new StorageUnavailable("Account storage is not configured.");
}

/** Writes a document. With `create: true` the write fails with ConflictError if it already exists. */
export async function putJSON(key: string, value: unknown, opts: { create?: boolean } = {}) {
  safe(key);
  const body = JSON.stringify(value);
  if (useBlob()) {
    const { put } = await import("@vercel/blob");
    try {
      await put(key, body, { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: !opts.create, cacheControlMaxAge: 60 });
    } catch (e) {
      if (opts.create && /exist|already|conflict|412/i.test(String((e as Error)?.message))) throw new ConflictError("exists");
      throw e;
    }
    return;
  }
  if (useFiles()) {
    const file = path.join(DIR, key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    try {
      await fs.writeFile(file, body, { flag: opts.create ? "wx" : "w" });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "EEXIST") throw new ConflictError("exists");
      throw e;
    }
    return;
  }
  throw new StorageUnavailable("Account storage is not configured.");
}
