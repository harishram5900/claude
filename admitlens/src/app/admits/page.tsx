"use client";
import { ArrowUpDown, ArrowUpRight, GraduationCap, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CollegePicker } from "@/components/CollegePicker";
import { OllieSays } from "@/components/Ollie";
import { Badge, ButtonLink, Card, cx, inputCls, PageHeader } from "@/components/ui";
import { DECILE_ACADEMICS, HARVARD_NON_ALDC_BY_DECILE, HARVARD_PERIOD_ADMIT_RATE, LEGACY_ODDS_MULTIPLIER } from "@/data/calibration";
import { COLLEGES, type College } from "@/data/colleges";
import { PROGRAMS } from "@/data/programs";
import { bestSat, collegeSatRange, unweightedGpa } from "@/lib/engine";
import { useStore } from "@/lib/store";

/** Rates under 10% keep one decimal: 7.7% and 8% are different stories. */
const fmtPct = (x: number) => (x < 0.1 ? `${(Math.round(x * 1000) / 10).toFixed(1)}%` : `${Math.round(x * 100)}%`);

const QUICK = ["harvard", "stanford", "mit", "nyu", "umich", "berkeley", "uiuc", "utaustin", "gatech", "uva"];

/** A horizontal scale with the admitted middle-50% band and, if known, the student's own score. */
function RangeBar({ min, max, lo, hi, you, label, fmt = String }: { min: number; max: number; lo: number; hi: number; you?: number | null; label: string; fmt?: (n: number) => string }) {
  const at = (v: number) => `${((Math.min(max, Math.max(min, v)) - min) / (max - min)) * 100}%`;
  const inside = you != null && you >= lo && you <= hi;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted">
          middle 50%: <b className="text-ink">{fmt(lo)}–{fmt(hi)}</b>
        </span>
      </div>
      <div className="relative mt-3 h-3 rounded-full bg-surface-2">
        <div className="absolute inset-y-0 rounded-full bg-brand/80" style={{ left: at(lo), width: `calc(${at(hi)} - ${at(lo)})` }} />
        {you != null && (
          <div className="absolute -top-2 -translate-x-1/2" style={{ left: at(you) }}>
            <div className={cx("h-7 w-1 rounded-full", inside ? "bg-good" : you > hi ? "bg-accent" : "bg-bad")} />
          </div>
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-muted">
        <span>{fmt(min)}</span>
        {you != null && <span className={cx("font-medium", inside ? "text-good" : you > hi ? "text-accent" : "text-bad")}>You: {fmt(you)}{inside ? " (in range)" : you > hi ? " (above range)" : " (below range)"}</span>}
        <span>{fmt(max)}</span>
      </div>
    </div>
  );
}

function AdmitProfile({ c }: { c: College }) {
  const { profile, user } = useStore();
  const sat = collegeSatRange(c);
  const yourSat = bestSat(profile);
  const yourGpa = unweightedGpa(profile);
  const programs = PROGRAMS[c.id] ?? [];
  const early = c.earlyRate;
  return (
    <Card className="overflow-hidden">
      <div className="glow border-b border-line p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{c.control}</Badge>
              <Badge>Test {c.testPolicy}</Badge>
              {c.verified && <Badge tone="good">Checked against {c.verified.cycle}</Badge>}
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">Who gets into {c.short}</h2>
            <p className="mt-1 text-sm text-muted">
              {c.city}, {c.state}
              {c.enrollment ? ` · ${c.enrollment.toLocaleString()} undergraduates` : ""}
            </p>
          </div>
          <ButtonLink href={`/evaluate?college=${encodeURIComponent(c.id)}`}>
            <GraduationCap size={16} /> Chance me here
          </ButtonLink>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {[
            ["Admit rate", fmtPct(c.admitRate), c.verified ? c.verified.detail : "Latest Common Data Set"],
            ["Early round", early ? fmtPct(early) : "n/a", early ? (c.verified?.earlyFrom ? `From the ${c.verified.earlyFrom}` : "Early decision or action") : "Not published"],
            ["Typical GPA", c.gpa.toFixed(2), c.source === "scorecard" ? "Estimated from selectivity (not published)" : "Unweighted, admitted students"],
            ["Cost of attendance", c.coa ? `$${Math.round(c.coa / 1000)}k` : "Service academy", "Sticker price per year"],
          ].map(([l, v, s]) => (
            <div key={l} className="bg-surface p-4">
              <div className="text-xs text-muted">{l}</div>
              <div className="font-display mt-1 text-2xl font-semibold tabular-nums">{v}</div>
              <div className="mt-0.5 line-clamp-2 text-[11px] text-muted">{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 p-6 lg:grid-cols-2">
        <div className="space-y-7">
          {c.testPolicy === "blind" ? (
            <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">{c.short} is test-blind: SAT and ACT scores aren't considered, so admitted-student score ranges aren't published.</p>
          ) : (
            <>
              <RangeBar label="SAT (composite)" min={800} max={1600} lo={sat[0]} hi={sat[1]} you={profile.submitTests ? yourSat : null} />
              {c.act && <RangeBar label="ACT (composite)" min={12} max={36} lo={c.act[0]} hi={c.act[1]} you={profile.submitTests ? profile.act : null} />}
            </>
          )}
          <div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">Unweighted GPA</span>
              <span className="text-muted">
                typical admit: <b className="text-ink">{c.gpa.toFixed(2)}</b>
              </span>
            </div>
            <div className="relative mt-3 h-3 rounded-full bg-surface-2">
              <div className="absolute inset-y-0 left-0 rounded-full bg-brand/80" style={{ width: `${((c.gpa - 2) / 2) * 100}%` }} />
              {yourGpa != null && <div className={cx("absolute -top-2 h-7 w-1 -translate-x-1/2 rounded-full", yourGpa >= c.gpa ? "bg-good" : "bg-bad")} style={{ left: `${((Math.max(2, yourGpa) - 2) / 2) * 100}%` }} />}
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-muted">
              <span>2.0</span>
              {yourGpa != null && <span className={cx("font-medium", yourGpa >= c.gpa ? "text-good" : "text-bad")}>You: {yourGpa.toFixed(2)}</span>}
              <span>4.0</span>
            </div>
          </div>
          {!user && <p className="text-xs text-muted">Sign in and fill in your profile to see your own scores on these scales.</p>}
          {c.inStateFactor && c.inStateFactor > 1 && (
            <p className="text-sm text-muted">
              As a public university, {c.short} admits its own state's residents at a higher rate. AdmitLens models in-state odds at about {c.inStateFactor.toFixed(1)}× the overall rate.
            </p>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold">What its readers reward</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              {c.values.map((v) => (
                <li key={v} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </li>
              ))}
            </ul>
          </div>
          {c.supplements.length > 0 && <div>
            <h3 className="text-sm font-semibold">Supplement themes</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {c.supplements.map((s) => (
                <span key={s} className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs">{s}</span>
              ))}
            </div>
          </div>}
          {c.knownFor.length > 0 && <div>
            <h3 className="text-sm font-semibold">Known for</h3>
            <p className="mt-1.5 text-sm text-muted">{c.knownFor.join(" · ")}</p>
          </div>}
        </div>
      </div>

      {programs.length > 0 && (
        <div className="border-t border-line p-6">
          <h3 className="font-display text-xl font-semibold">Schools and programs inside {c.short}</h3>
          <p className="mt-1 text-sm text-muted">You apply to one of these, and each reads its own applicants. Rates are shown only where the university published them.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {programs.map((p) => (
              <div key={p.id} className="rounded-xl border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{p.name}</div>
                  {p.rate ? (
                    <span className="shrink-0 font-display text-lg font-semibold tabular-nums">{fmtPct(p.rate.value)}</span>
                  ) : (
                    <span className="shrink-0 text-xs text-muted">rate not published</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{p.review}</p>
                {p.requires && <p className="mt-1 text-xs text-warn">Requires: {p.requires.join("; ")}</p>}
                {p.rate?.url && (
                  <a href={p.rate.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-brand hover:underline">
                    Source <ArrowUpRight size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-2/50 px-6 py-3 text-xs text-muted">
        <span>
          Source:{" "}
          {c.verified ? (
            <a href={c.verified.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">
              {c.verified.source}, {c.verified.cycle}
            </a>
          ) : c.source === "scorecard" ? (
            "U.S. Department of Education College Scorecard"
          ) : (
            "the college's latest Common Data Set"
          )}
          . Score ranges are for enrolled students.
        </span>
        <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
          Official admissions site <ArrowUpRight size={12} />
        </a>
      </div>
    </Card>
  );
}

function HarvardDeciles() {
  const max = Math.max(...HARVARD_NON_ALDC_BY_DECILE);
  return (
    <Card className="p-6">
      <div className="eyebrow">Real outcomes, not anecdotes</div>
      <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">At the very top, grades get you read. They don't get you in.</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Harvard admit rates for applicants who weren't recruited athletes, legacies, on the dean's or director's list, or children of faculty, by academic decile of the applicant pool (Classes of 2014–2019, about {fmtPct(HARVARD_PERIOD_ADMIT_RATE)} overall). Even the strongest tenth was admitted only about {fmtPct(HARVARD_NON_ALDC_BY_DECILE[9])} of the time.
      </p>
      <div className="mt-6 flex h-56 items-end gap-2 sm:gap-3">
        {HARVARD_NON_ALDC_BY_DECILE.map((r, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[11px] font-medium tabular-nums">{r < 0.001 ? "<0.1%" : `${(r * 100).toFixed(1)}%`}</span>
            <div className="w-full rounded-t-lg bg-brand" style={{ height: `${Math.max(2, (r / max) * 170)}px`, opacity: 0.45 + (i / 9) * 0.55 }} />
            <span className="text-[11px] text-muted">{i + 1}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 text-center text-xs text-muted">Academic decile (1 = lowest, 10 = highest)</div>
      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-xl bg-surface-2 p-3">
          <b>Decile 1</b> looked roughly like a {DECILE_ACADEMICS[0].sat} SAT and {DECILE_ACADEMICS[0].gpa.toFixed(2)} GPA.
        </div>
        <div className="rounded-xl bg-surface-2 p-3">
          <b>Decile 10</b> looked roughly like a {DECILE_ACADEMICS[9].sat} SAT and {DECILE_ACADEMICS[9].gpa.toFixed(2)} GPA.
        </div>
        <div className="rounded-xl bg-surface-2 p-3">
          <b>Legacy status</b> multiplied a typical applicant's odds about {LEGACY_ODDS_MULTIPLIER}×.
        </div>
      </div>
      <p className="mt-4 text-xs text-muted">
        Source: Arcidiacono, Kinsler and Ransom, "Legacy and Athlete Preferences at Harvard," Economics of Education Review 88 (2022), using data released in SFFA v. Harvard. Middle-decile academics are interpolated.
      </p>
    </Card>
  );
}

type SortKey = "admitRate" | "sat" | "gpa" | "name";

function CompareTable({ onPick, selected }: { onPick: (c: College) => void; selected: string }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("admitRate");
  const [asc, setAsc] = useState(true);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = COLLEGES.filter((c) => !s || `${c.name} ${c.short} ${c.state}`.toLowerCase().includes(s));
    const val = (c: College) => (sort === "sat" ? (collegeSatRange(c)[0] + collegeSatRange(c)[1]) / 2 : sort === "gpa" ? c.gpa : sort === "name" ? c.short : c.admitRate);
    return [...list].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      const d = typeof x === "string" ? x.localeCompare(y as string) : (x as number) - (y as number);
      return asc ? d : -d;
    });
  }, [q, sort, asc]);
  const head = (k: SortKey, l: string, cls = "") => (
    <button onClick={() => (sort === k ? setAsc(!asc) : (setSort(k), setAsc(k === "admitRate" || k === "name")))} className={cx("inline-flex items-center gap-1 hover:text-ink", sort === k && "text-ink", cls)}>
      {l} <ArrowUpDown size={12} />
    </button>
  );
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Compare admitted classes</h2>
          <p className="text-sm text-muted">{COLLEGES.length} colleges, from each school's published numbers.</p>
        </div>
        <label className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name or state" className={cx(inputCls, "pl-9")} />
        </label>
      </div>
      <div className="max-h-[560px] overflow-auto scroll-thin">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="sticky top-0 bg-surface text-left text-xs text-muted">
            <tr className="border-b border-line">
              <th className="px-5 py-3 font-medium">{head("name", "College")}</th>
              <th className="px-3 py-3 text-right font-medium">{head("admitRate", "Admit rate", "justify-end")}</th>
              <th className="px-3 py-3 text-right font-medium">{head("sat", "SAT middle 50%", "justify-end")}</th>
              <th className="px-3 py-3 text-right font-medium">{head("gpa", "Typical GPA", "justify-end")}</th>
              <th className="px-5 py-3 text-right font-medium">Tests</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const s = collegeSatRange(c);
              return (
                <tr key={c.id} onClick={() => onPick(c)} className={cx("cursor-pointer border-b border-line last:border-0 hover:bg-surface-2", selected === c.id && "bg-brand-soft/60")}>
                  <td className="px-5 py-2.5">
                    <div className="font-medium">{c.short}</div>
                    <div className="text-xs text-muted">{c.city}, {c.state}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtPct(c.admitRate)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{c.testPolicy === "blind" ? <span className="text-muted">test-blind</span> : c.sat ? `${s[0]}–${s[1]}` : <span className="text-muted">{s[0]}–{s[1]} (from ACT)</span>}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{c.gpa.toFixed(2)}</td>
                  <td className="px-5 py-2.5 text-right capitalize text-muted">{c.testPolicy}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function AdmitsPage() {
  const [college, setCollege] = useState<College>(COLLEGES.find((c) => c.id === "nyu") ?? COLLEGES[0]);
  const pick = (c: College) => {
    setCollege(c);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div className="rise space-y-8">
      <PageHeader
        eyebrow="Admit profiles"
        title="What the students who got in actually look like"
        subtitle="Admit rates, score ranges, GPAs and the schools inside each university, from each college's own published numbers. No invented students and no hand-picked success stories."
      />
      <OllieSays mood="reading">
        Hoo's getting in? These are the published numbers for each <b>admitted class</b>. Put your own scores in your profile and I'll mark where you land.
      </OllieSays>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <CollegePicker onPick={pick} placeholder="Pick a college to see its admitted class…" className="md:w-96" />
        <div className="flex flex-wrap gap-1.5">
          {QUICK.map((id) => {
            const c = COLLEGES.find((x) => x.id === id);
            if (!c) return null;
            return (
              <button key={id} onClick={() => setCollege(c)} className={cx("rounded-full border px-3 py-1 text-xs transition", college.id === id ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface hover:bg-surface-2")}>
                {c.short}
              </button>
            );
          })}
        </div>
      </div>
      <AdmitProfile c={college} />
      <HarvardDeciles />
      <CompareTable onPick={pick} selected={college.id} />
      <p className="text-xs text-muted">
        Want individual essays from admitted students? Colleges publish them on their own sites. <Link href="/learn" className="text-brand hover:underline">See the essays that worked</Link>.
      </p>
    </div>
  );
}
