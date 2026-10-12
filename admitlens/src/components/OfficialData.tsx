"use client";
import { ExternalLink, Landmark, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { College } from "@/data/colleges";
import type { OfficialStats } from "@/lib/scorecard";
import { Card, CardHeader } from "./ui";

const money = (n: number | null) => (n == null ? "—" : `$${Math.round(n).toLocaleString()}`);
const pct = (n: number | null) => (n == null ? "—" : `${Math.round(n * 100)}%`);

/** Live U.S. Department of Education figures for a college (College Scorecard). */
export function OfficialData({ college }: { college: College }) {
  const [stats, setStats] = useState<OfficialStats | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  useEffect(() => {
    let alive = true;
    setState("loading");
    fetch(`/api/scorecard?official=${encodeURIComponent(college.name)}&state=${encodeURIComponent(college.state)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.stats) {
          setStats(d.stats);
          setState("ok");
        } else setState("error");
      })
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, [college.name, college.state]);

  const items: [string, string, string?][] = stats
    ? [
        ["Graduation rate", pct(stats.gradRate), "within 6 years"],
        ["First-year retention", pct(stats.retention), "return for year two"],
        ["Median earnings", money(stats.medianEarnings10yr), "10 years after entry"],
        ["Average net price", money(stats.avgNetPrice), "after grants, per year"],
        ["Net price, income $0–30k", money(stats.netPriceLowIncome), "per year"],
        ["Net price, income $75–110k", money(stats.netPriceMiddleIncome), "per year"],
        ["Students with Pell grants", pct(stats.pellRate), "low-income share"],
        ["Median debt at graduation", money(stats.medianDebt), "federal loans"],
      ]
    : [];

  return (
    <Card>
      <CardHeader
        title="Official federal data"
        subtitle="Outcomes and real cost after aid, from the U.S. Department of Education"
        icon={<Landmark size={16} />}
        action={
          <a href="https://collegescorecard.ed.gov" target="_blank" rel="noreferrer" className="hidden items-center gap-1 text-xs text-muted hover:text-ink sm:inline-flex">
            College Scorecard <ExternalLink size={12} />
          </a>
        }
      />
      {state === "loading" && (
        <div className="flex items-center gap-2 px-5 py-8 text-sm text-muted">
          <Loader2 size={15} className="animate-spin" /> Fetching federal data…
        </div>
      )}
      {state === "error" && <div className="px-5 py-6 text-sm text-muted">Federal data is temporarily unavailable. Try again shortly, or see collegescorecard.ed.gov.</div>}
      {state === "ok" && stats && (
        <>
          <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
            {items.map(([l, v, s]) => (
              <div key={l} className="bg-surface px-5 py-4">
                <div className="text-xs text-muted">{l}</div>
                <div className="mt-1 font-display text-xl font-semibold tabular-nums">{v}</div>
                {s && <div className="text-[11px] text-muted">{s}</div>}
              </div>
            ))}
          </div>
          <div className="border-t border-line px-5 py-3 text-xs text-muted">
            Matched to "{stats.name}" (IPEDS {stats.unitId}). Federal admissions figures lag one to two cycles behind what colleges announce.
            {stats.admitRate != null && ` Federal admit rate on file: ${(stats.admitRate * 100).toFixed(1)}%.`}
          </div>
        </>
      )}
    </Card>
  );
}
