"use client";
import { Check, FileText, X } from "lucide-react";
import { useState } from "react";
import { cx } from "../ui";

type Row = { label?: string; value: string; keep: boolean };
const TABS: Record<string, Row[]> = {
  Activities: [
    { value: "PREVIEW", keep: false },
    { label: "Position", value: "Captain", keep: true },
    { label: "Organization", value: "Robotics team", keep: true },
    { label: "Description", value: "Led 30 students to state finals", keep: true },
    { label: "Hours / week", value: "12", keep: true },
    { value: "Page 3 of 9", keep: false },
  ],
  Honors: [
    { value: "CAID: 41234567", keep: false },
    { label: "Honor", value: "State science fair, 2nd place", keep: true },
    { label: "Level", value: "State", keep: true },
    { label: "Honor", value: "AP Scholar with Distinction", keep: true },
    { value: "10/12/2026, 4:18 PM", keep: false },
  ],
  Essay: [
    { value: "Describe a topic, idea, or concept you find so engaging…", keep: false },
    { value: "Remember: 650 words is your limit, not your goal.", keep: false },
    { label: "Essay", value: "The first time our robot drove itself across the gym…", keep: true },
    { value: "apply.commonapp.org/print", keep: false },
  ],
  Status: [
    { label: "Citizenship", value: "Other (non-US)", keep: true },
    { label: "Visa", value: "H-4", keep: true },
    { label: "Other citizenship", value: "India", keep: true },
    { value: "PREVIEW", keep: false },
  ],
};

/** What the Common App importer keeps versus what it discards. */
export function ImportDemo() {
  const [tab, setTab] = useState<keyof typeof TABS>("Activities");
  const rows = TABS[tab];
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3 text-sm">
        <FileText size={15} className="text-brand" />
        <span className="font-medium">common-app.pdf</span>
        <span className="ml-auto rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">{rows.filter((r) => !r.keep).length} removed</span>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-line px-3 pt-2 lp-noscroll" role="tablist">
        {(Object.keys(TABS) as (keyof typeof TABS)[]).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx("shrink-0 border-b-2 px-3 pb-2 text-sm transition", tab === k ? "border-brand font-medium text-brand" : "border-transparent text-muted hover:text-ink")}>
            {k}
          </button>
        ))}
      </div>
      <ul className="min-h-[248px] divide-y divide-line">
        {rows.map((r, i) => (
          <li key={`${tab}-${i}`} className="rise flex items-start gap-3 px-5 py-3 text-[14.5px]" style={{ animationDelay: `${i * 50}ms` }}>
            <span className={cx("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full", r.keep ? "bg-good-soft text-good" : "bg-bad-soft text-bad")}>{r.keep ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}</span>
            {r.keep ? (
              <span className="min-w-0">
                {r.label && <span className="text-muted">{r.label}: </span>}
                <span className="font-medium">{r.value}</span>
              </span>
            ) : (
              <span className="min-w-0 text-muted line-through decoration-bad/60">{r.value}</span>
            )}
          </li>
        ))}
      </ul>
      {tab === "Status" && <div className="border-t border-line bg-surface-2/60 px-5 py-2.5 text-xs text-muted">Used only to filter scholarships. Never shown in reports.</div>}
    </div>
  );
}
