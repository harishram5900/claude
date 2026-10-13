"use client";
import { useState } from "react";
import type { LandingData } from "@/lib/landing";
import { cx } from "../ui";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const tone = (c: number) => (c >= 0.6 ? "bg-good-soft text-good" : c >= 0.25 ? "bg-brand-soft text-brand" : "bg-warn-soft text-warn");

/** One student, one university, several schools inside it. */
export function ProgramsDemo({ data }: { data: LandingData["programs"] }) {
  const [i, setI] = useState(0);
  const cur = data[i];
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
      <div className="flex gap-1 border-b border-line px-3 pt-2" role="tablist">
        {data.map((d, k) => (
          <button key={d.college} role="tab" aria-selected={i === k} onClick={() => setI(k)} className={cx("border-b-2 px-3 pb-2 text-sm transition", i === k ? "border-brand font-medium text-brand" : "border-transparent text-muted hover:text-ink")}>
            {d.college}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-5 border-b border-line bg-surface-2/60 px-5 py-2.5 text-xs font-medium text-muted">
        <span>Applying to</span>
        <span className="w-14 text-right">Admits</span>
        <span className="w-16 text-right">Same file</span>
      </div>
      <ul className="divide-y divide-line">
        {cur.rows.map((r) => (
          <li key={r.name} className="rise grid grid-cols-[1fr_auto_auto] items-center gap-x-5 px-5 py-3.5">
            <span className="min-w-0">
              <span className="block text-[14.5px] font-medium">{r.name}</span>
              <span className="block text-xs text-muted">{r.arts ? "Decided mainly by audition" : r.decision}</span>
            </span>
            <span className="w-14 text-right text-sm tabular-nums text-muted">{r.estimated ? "n/p" : pct(r.rate)}</span>
            <span className={cx("w-16 rounded-lg px-2 py-1 text-center font-display text-lg font-semibold tabular-nums", tone(r.chance))}>{pct(r.chance)}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-line px-5 py-2.5 text-xs text-muted">n/p: not published, so the university's rate is used and the school's review style changes the read.</div>
    </div>
  );
}
