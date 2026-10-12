// Converts U.S. Department of Education College Scorecard records into AdmitLens colleges,
// so every accredited four-year institution in the country can be simulated.
import type { College } from "@/data/colleges";

export const SC_FIELDS = [
  "id",
  "school.name",
  "school.city",
  "school.state",
  "school.ownership",
  "school.school_url",
  "latest.admissions.admission_rate.overall",
  "latest.admissions.sat_scores.25th_percentile.critical_reading",
  "latest.admissions.sat_scores.25th_percentile.math",
  "latest.admissions.sat_scores.75th_percentile.critical_reading",
  "latest.admissions.sat_scores.75th_percentile.math",
  "latest.admissions.act_scores.25th_percentile.cumulative",
  "latest.admissions.act_scores.75th_percentile.cumulative",
  "latest.admissions.test_requirements",
  "latest.student.size",
  "latest.cost.attendance.academic_year",
  "latest.cost.avg_net_price.overall",
  "latest.cost.net_price.public.by_income_level.0-30000",
  "latest.cost.net_price.private.by_income_level.0-30000",
  "latest.cost.net_price.public.by_income_level.75001-110000",
  "latest.cost.net_price.private.by_income_level.75001-110000",
  "latest.completion.consumer_rate",
  "latest.student.retention_rate.four_year.full_time",
  "latest.earnings.10_yrs_after_entry.median",
  "latest.aid.pell_grant_rate",
  "latest.aid.median_debt.completers.overall",
].join(",");

/** Outcome and affordability figures published by the U.S. Department of Education. */
export interface OfficialStats {
  unitId: number;
  name: string;
  admitRate: number | null;
  sat: [number, number] | null;
  act: [number, number] | null;
  enrollment: number | null;
  costOfAttendance: number | null;
  avgNetPrice: number | null;
  netPriceLowIncome: number | null; // family income $0–30k
  netPriceMiddleIncome: number | null; // $75k–110k
  gradRate: number | null;
  retention: number | null;
  medianEarnings10yr: number | null;
  pellRate: number | null;
  medianDebt: number | null;
}

export function officialStats(r: Record<string, unknown>): OfficialStats {
  const pub = n(r["school.ownership"]) === 1;
  const r25 = n(r["latest.admissions.sat_scores.25th_percentile.critical_reading"]);
  const m25 = n(r["latest.admissions.sat_scores.25th_percentile.math"]);
  const r75 = n(r["latest.admissions.sat_scores.75th_percentile.critical_reading"]);
  const m75 = n(r["latest.admissions.sat_scores.75th_percentile.math"]);
  const a25 = n(r["latest.admissions.act_scores.25th_percentile.cumulative"]);
  const a75 = n(r["latest.admissions.act_scores.75th_percentile.cumulative"]);
  return {
    unitId: Number(r.id),
    name: String(r["school.name"] ?? ""),
    admitRate: n(r["latest.admissions.admission_rate.overall"]),
    sat: r25 && m25 && r75 && m75 ? [r25 + m25, r75 + m75] : null,
    act: a25 && a75 ? [a25, a75] : null,
    enrollment: n(r["latest.student.size"]),
    costOfAttendance: n(r["latest.cost.attendance.academic_year"]),
    avgNetPrice: n(r["latest.cost.avg_net_price.overall"]),
    netPriceLowIncome: n(r[`latest.cost.net_price.${pub ? "public" : "private"}.by_income_level.0-30000`]),
    netPriceMiddleIncome: n(r[`latest.cost.net_price.${pub ? "public" : "private"}.by_income_level.75001-110000`]),
    gradRate: n(r["latest.completion.consumer_rate"]),
    retention: n(r["latest.student.retention_rate.four_year.full_time"]),
    medianEarnings10yr: n(r["latest.earnings.10_yrs_after_entry.median"]),
    pellRate: n(r["latest.aid.pell_grant_rate"]),
    medianDebt: n(r["latest.aid.median_debt.completers.overall"]),
  };
}

type Rec = Record<string, unknown>;
const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** "California State University-Fullerton" → "CSU Fullerton"; short names pass through. */
export function shortName(name: string) {
  const i = name.lastIndexOf("-");
  const head = i > 0 ? name.slice(0, i).trim() : "";
  const campus = i > 0 ? name.slice(i + 1).trim() : "";
  if (head.split(/\s+/).length >= 2 && /^[A-Z]/.test(campus)) {
    const acronym = head.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join("");
    return /^main campus$/i.test(campus) ? acronym : `${acronym} ${campus}`;
  }
  if (name.length <= 26) return name;
  const words = name.split(/\s+/).filter((w) => /^[A-Z]/.test(w) && !["University", "College", "Of", "The"].includes(w));
  return words.slice(0, 2).join(" ") || name;
}

export function fromScorecard(r: Rec): College | null {
  const name = r["school.name"] as string | undefined;
  const rate = n(r["latest.admissions.admission_rate.overall"]);
  if (!name) return null;
  const r25 = n(r["latest.admissions.sat_scores.25th_percentile.critical_reading"]);
  const m25 = n(r["latest.admissions.sat_scores.25th_percentile.math"]);
  const r75 = n(r["latest.admissions.sat_scores.75th_percentile.critical_reading"]);
  const m75 = n(r["latest.admissions.sat_scores.75th_percentile.math"]);
  const a25 = n(r["latest.admissions.act_scores.25th_percentile.cumulative"]);
  const a75 = n(r["latest.admissions.act_scores.75th_percentile.cumulative"]);
  const req = n(r["latest.admissions.test_requirements"]);
  const admitRate = rate ?? 0.85; // open-admission schools report no rate
  const ownership = n(r["school.ownership"]);
  const url = (r["school.school_url"] as string | undefined) ?? "";
  const short = shortName(name);
  return {
    id: `sc-${r.id}`,
    name,
    short,
    city: (r["school.city"] as string) ?? "",
    state: (r["school.state"] as string) ?? "",
    control: ownership === 1 ? "Public" : "Private",
    enrollment: n(r["latest.student.size"]) ?? 0,
    admitRate: Math.max(0.02, Math.min(1, admitRate)),
    sat: r25 && m25 && r75 && m75 ? [r25 + m25, r75 + m75] : null,
    act: a25 && a75 ? [a25, a75] : null,
    // Scorecard does not publish GPA; estimate typical admitted GPA from selectivity.
    gpa: Math.round(Math.max(3.1, Math.min(3.95, 3.98 - admitRate * 0.75)) * 100) / 100,
    testPolicy: req === 1 ? "required" : req === 3 ? "blind" : "optional",
    coa: n(r["latest.cost.attendance.academic_year"]) ?? 0,
    plans: {},
    considersLegacy: false,
    deadlines: { rd: "See school site" },
    url: url ? (url.startsWith("http") ? url : `https://${url}`) : "",
    knownFor: [],
    values: admitRate < 0.3 ? ["academic excellence", "personal qualities", "contribution to campus"] : ["academic preparation", "course rigor", "fit with major"],
    supplements: [],
    source: "scorecard",
  };
}
