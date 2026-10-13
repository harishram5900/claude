"use client";
import { Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { fmtDeadline } from "@/components/funding/ResultCard";
import { Button } from "@/components/ui";
import { awardValue, essayClusters, lateralAngles, money, revealsStatus, RING_NAME, RINGS, unclaimedChecklist, type Ranked } from "@/lib/grantscout";
import { useStore } from "@/lib/store";
import { useFunding } from "@/lib/useFunding";

// Shareable report. Deliberately never prints citizenship/immigration status, income or
// background: those answers were used only to filter the list.

function Table({ rows, numbered }: { rows: Ranked[]; numbered?: boolean }) {
  return (
    <table className="w-full border-collapse text-[11px] leading-snug">
      <thead>
        <tr className="border-b-2 border-[#1d5a46] text-left">
          {numbered && <th className="py-1.5 pr-2">#</th>}
          <th className="py-1.5 pr-2">Opportunity</th>
          <th className="py-1.5 pr-2">Amount</th>
          <th className="py-1.5 pr-2">Deadline</th>
          <th className="py-1.5 pr-2">Odds</th>
          <th className="py-1.5">Why it fits</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((x, i) => (
          <tr key={x.rec.name + x.rec.sponsor} className="break-inside-avoid border-b border-[#e4ddcd] align-top">
            {numbered && <td className="py-1.5 pr-2">{i + 1}</td>}
            <td className="py-1.5 pr-2">
              <a href={x.rec.source_url} className="font-semibold text-[#1d5a46]">{x.rec.name}</a>
              <div className="text-[10px] text-[#676a62]">{x.rec.sponsor}{x.review.length ? " · verify on sponsor page" : ""}</div>
            </td>
            <td className="py-1.5 pr-2">{money(x.rec)}</td>
            <td className="py-1.5 pr-2 whitespace-nowrap">{fmtDeadline(x)}</td>
            <td className="py-1.5 pr-2">~{(x.winProb * 100).toFixed(x.winProb < 0.01 ? 1 : 0)}%</td>
            <td className="py-1.5">{x.why}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Report() {
  const { ready, profile } = useStore();
  const all = useFunding();
  const [hideStatus, setHideStatus] = useState(true);
  const hidden = all.results.filter(revealsStatus);
  const results = hideStatus ? all.results.filter((x) => !revealsStatus(x)) : all.results;
  const f = {
    ...all,
    results,
    top: [...results].sort((a, b) => b.score - a.score).slice(0, 15),
    essays: essayClusters(results),
    unclaimed: unclaimedChecklist(all.fp, { shareable: true }),
    lateral: lateralAngles(all.fp, { shareable: true }),
    totalValue: results.reduce((a, x) => a + awardValue(x.rec), 0),
    totalEv: results.reduce((a, x) => a + x.expectedValue, 0),
    needsReview: results.filter((x) => x.review.length).length,
  };
  useEffect(() => {
    document.title = `GrantScout · ${f.fp.name || "student"} · ${new Date().toISOString().slice(0, 10)}`;
  }, [f.fp.name]);
  if (!ready) return null;
  const today = new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  const calendar = new Map<string, Ranked[]>();
  for (const x of [...f.results].filter((x) => x.deadline).sort((a, b) => a.deadline.localeCompare(b.deadline))) {
    const k = new Date(`${x.deadline}T12:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    calendar.set(k, [...(calendar.get(k) ?? []), x]);
  }
  const place = [profile.funding?.city, profile.state].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-5xl bg-white p-8 text-[#191d1b] print:max-w-none print:p-0">
      <style>{`@media print { @page { size: letter landscape; margin: 0.45in; } header, footer, .no-print { display: none !important; } body, html { background: white !important; } main { padding: 0 !important; max-width: none !important; } }`}</style>
      <div className="no-print mb-6 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 p-4 text-sm text-ink">
        <span>Use your browser's print dialog and choose <b>Save as PDF</b>. Your status, income and background are never printed.</span>
        <Button onClick={() => window.print()}><Printer size={15} /> Save as PDF</Button>
      </div>
      {hidden.length > 0 && (
        <label className="no-print mb-6 flex items-start gap-2 rounded-xl border border-line p-4 text-sm text-ink">
          <input type="checkbox" className="mt-1 accent-[var(--brand)]" checked={hideStatus} onChange={(e) => setHideStatus(e.target.checked)} />
          <span>
            <b>Hide {hidden.length} award{hidden.length === 1 ? "" : "s"} that could reveal your citizenship status or home-country ties</b>
            <span className="block text-muted">Recommended if you'll share this PDF. Untick to include them in a copy just for you.</span>
          </span>
        </label>
      )}

      <h1 className="font-display text-3xl font-semibold">Funding opportunities for {f.fp.name || "you"}</h1>
      <p className="mt-1 text-sm text-[#676a62]">{place && `${place} · `}grade {f.fp.grade} · generated {today} · by GrantScout in AdmitLens</p>

      <div className="mt-5 grid grid-cols-4 overflow-hidden rounded-md border border-[#1d5a46] text-center">
        {[["Opportunities", String(f.results.length)], ["Listed value (approx.)", `$${Math.round(f.totalValue).toLocaleString()}`], ["Expected value*", `$${Math.round(f.totalEv).toLocaleString()}`], ["Need a closer look", String(f.needsReview)]].map(([l, v]) => (
          <div key={l}>
            <div className="bg-[#1d5a46] py-1.5 text-xs text-white">{l}</div>
            <div className="py-2 text-xl tabular-nums">{v}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-snug text-[#676a62]">
        *Expected value = award size × an estimated chance of winning. Smaller, local and narrowly targeted awards score higher odds. It's an estimate for prioritizing, not a promise. Every listing was filtered to awards this student appears eligible for; the eligibility details used for filtering are kept private and are not printed here. Always confirm on the sponsor's page before applying. Legitimate awards never charge a fee or ask for bank or SSN details.
      </p>

      <h2 className="mt-6 font-display text-xl font-semibold text-[#1d5a46]">Start here: top 15 by priority</h2>
      <div className="mt-2"><Table rows={f.top} numbered /></div>

      {RINGS.map(([ring]) => {
        const rows = f.results.filter((x) => x.ring === ring);
        if (!rows.length) return null;
        return (
          <section key={ring} className="mt-6 break-before-page">
            <h2 className="font-display text-xl font-semibold text-[#1d5a46]">{ring}. {RING_NAME[ring]} <span className="text-sm font-normal text-[#676a62]">({rows.length})</span></h2>
            <div className="mt-2"><Table rows={rows} /></div>
          </section>
        );
      })}

      <section className="mt-6 break-before-page">
        <h2 className="font-display text-xl font-semibold text-[#1d5a46]">Free money people leave on the table</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[12px]">{f.unclaimed.map((u) => <li key={u}>{u}</li>)}</ul>
        <h2 className="mt-6 font-display text-xl font-semibold text-[#1d5a46]">Write once, apply many: essay reuse plan</h2>
        <div className="mt-2 space-y-1.5 text-[12px]">{f.essays.map(([t, n]) => <p key={t}><b>{t}</b> ({n.length}): {n.join(", ")}</p>)}</div>
        <h2 className="mt-6 font-display text-xl font-semibold text-[#1d5a46]">Connecting the dots: angles worth a second search</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px]">{f.lateral.map((l) => <li key={l}>{l}</li>)}</ul>
      </section>

      <section className="mt-6 break-before-page">
        <h2 className="font-display text-xl font-semibold text-[#1d5a46]">Deadline calendar</h2>
        <div className="mt-2 space-y-1.5 text-[12px]">
          {[...calendar.entries()].map(([m, xs]) => (
            <p key={m}><b>{m}:</b> {xs.map((x) => `${new Date(`${x.deadline}T12:00:00`).getDate()} ${x.rec.name}${x.deadlineEstimated ? " (est.)" : ""}`).join("; ")}</p>
          ))}
        </div>
      </section>
      <p className="mt-8 border-t border-[#e4ddcd] pt-2 text-[10px] text-[#676a62]">GrantScout in AdmitLens · verify every listing on the sponsor's site · amounts and deadlines change each cycle.</p>
    </div>
  );
}
