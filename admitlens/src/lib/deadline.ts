import type { College } from "@/data/colleges";
import type { AppPlan } from "./types";

/** Turn "Nov 1" / "Jan 15" into the next upcoming ISO date in the current cycle. */
export function guessDeadline(c: College, plan: AppPlan) {
  const s = plan === "RD" ? c.deadlines.rd : c.deadlines.early ?? c.deadlines.rd;
  const m = s.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2})/);
  if (!m) return "";
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(m[1]);
  const now = new Date();
  let year = now.getFullYear();
  const d = new Date(year, month, Number(m[2]));
  if (d.getTime() < now.getTime() - 86400000 * 120) year++;
  return new Date(year, month, Number(m[2])).toISOString().slice(0, 10);
}
