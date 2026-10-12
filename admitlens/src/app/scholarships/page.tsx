"use client";
import { CalendarClock, CheckCircle2, ExternalLink, Lock, Search, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Card, cx, inputCls, PageHeader, Progress } from "@/components/ui";
import { matchScholarship, SCHOLARSHIPS } from "@/data/scholarships";
import { unweightedGpa } from "@/lib/engine";
import { useStore } from "@/lib/store";

export default function ScholarshipsPage() {
  const { profile, ready } = useStore();
  const [q, setQ] = useState("");
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [sort, setSort] = useState<"match" | "amount" | "deadline">("match");

  const rows = useMemo(() => {
    const now = new Date().getMonth() + 1;
    const ctx = { grade: Math.min(profile.grade, 12), gpa: unweightedGpa(profile), state: profile.state, major: profile.intendedMajor, firstGen: profile.firstGen, lowIncome: profile.lowIncome };
    return SCHOLARSHIPS.map((s) => ({ s, m: matchScholarship(s, ctx), monthsAway: (s.deadlineMonth - now + 12) % 12 }))
      .filter((r) => (!onlyEligible || r.m.blockers.length === 0) && (!q || `${r.s.name} ${r.s.provider} ${r.s.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => (sort === "match" ? b.m.score - a.m.score : sort === "amount" ? b.s.amountValue - a.s.amountValue : a.monthsAway - b.monthsAway));
  }, [profile, q, onlyEligible, sort]);

  if (!ready) return null;
  const eligible = rows.filter((r) => r.m.blockers.length === 0).length;

  return (
    <div className="rise">
      <PageHeader
        eyebrow="Pay for it"
        title="Scholarships matched to you"
        subtitle={`${SCHOLARSHIPS.length} major national and state programs, ranked by fit with your grade, GPA, state, major and circumstances. ${eligible} look open to you right now.`}
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className={cx(inputCls, "w-64 pl-9")} placeholder="Search STEM, need-based, art…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={cx(inputCls, "w-auto")} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="match">Best match</option>
          <option value="amount">Largest award</option>
          <option value="deadline">Soonest deadline</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-[var(--brand)]" checked={onlyEligible} onChange={(e) => setOnlyEligible(e.target.checked)} /> Eligible only
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(({ s, m, monthsAway }) => (
          <Card key={s.id} className={cx("flex flex-col p-5", m.blockers.length > 0 && "opacity-70")}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Trophy size={18} />
                </div>
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-muted">{s.provider}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg font-semibold text-good">{s.amount}</div>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">{s.blurb}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.tags.map((t) => <Badge key={t}>{t}</Badge>)}
            </div>
            <div className="mt-4 space-y-1 text-sm">
              {m.reasons.map((r) => <div key={r} className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-good" />{r}</div>)}
              {m.blockers.map((r) => <div key={r} className="flex gap-2 text-bad"><Lock size={15} className="mt-0.5 shrink-0" />{r}</div>)}
            </div>
            <div className="mt-auto flex items-center gap-3 pt-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-muted"><span>Match</span><span>{m.score}%</span></div>
                <Progress value={m.score} className="mt-1 h-1.5" tone={m.score >= 70 ? "good" : m.score >= 45 ? "brand" : "warn"} />
              </div>
              <div className={cx("flex items-center gap-1 text-xs", monthsAway <= 1 ? "text-bad" : "text-muted")}>
                <CalendarClock size={13} /> {s.deadline}
              </div>
              <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs hover:bg-surface-2">
                Apply <ExternalLink size={12} />
              </a>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">Amounts and deadlines reflect each program's typical cycle and can change. Always confirm on the official site. Never pay to apply for a scholarship.</p>
    </div>
  );
}
