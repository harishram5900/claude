import "server-only";

const MAX_BYTES = 900_000;
const KEYS = ["profile", "tracker", "essays", "dreamCollege", "roadmapDone", "customAwards", "goals", "onboarded", "programs"] as const;

/** Keeps only known top-level keys and caps size, so the account store holds app state and nothing else. */
export function cleanData(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, unknown> = {};
  for (const k of KEYS) if (k in (raw as Record<string, unknown>)) out[k] = (raw as Record<string, unknown>)[k];
  if (JSON.stringify(out).length > MAX_BYTES) return null;
  return out;
}
