import { aiEnabled, MODEL } from "@/lib/ai";

export function GET() {
  return Response.json({ enabled: aiEnabled(), model: aiEnabled() ? MODEL : null });
}
