import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-5-5";

export function aiEnabled() {
  return !!process.env.ANTHROPIC_API_KEY;
}

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

/**
 * Calls Claude with a JSON-schema-constrained response and returns the parsed object.
 * Server-side fallbacks are enabled so a safety-classifier decline is retried on
 * Anthropic's recommended fallback model instead of failing the request.
 */
export async function structured<T>(opts: { system: string; user: string; schema: Record<string, unknown>; maxTokens?: number }): Promise<T> {
  const res = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: { type: "json_schema", schema: opts.schema } },
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  if (res.stop_reason === "refusal") throw new Error("The model declined this request.");
  if (res.stop_reason === "max_tokens") throw new Error("The response was cut off. Try a shorter input.");
  const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return JSON.parse(text) as T;
}

export function errorMessage(e: unknown) {
  if (e instanceof Anthropic.RateLimitError) return "AI is busy right now. Try again in a minute.";
  if (e instanceof Anthropic.AuthenticationError) return "The server's Anthropic API key is invalid.";
  if (e instanceof Anthropic.APIError) return `AI service error (${e.status}).`;
  if (e instanceof Error) return e.message;
  return "Unknown error";
}
