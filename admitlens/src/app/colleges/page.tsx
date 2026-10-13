"use client";
import { Building2, Globe2, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CollegePicker } from "@/components/CollegePicker";
import { Badge, Card, categoryTone, cx, fmtPct, inputCls, PageHeader } from "@/components/ui";
import { COLLEGES } from "@/data/colleges";
import { chanceOnly, collegeSatRange, tierOf, TIER_INFO, type Tier } from "@/lib/engine";
import { collegeForProgram } from "@/lib/programs";
import { useStore } from "@/lib/store";

export default function CollegesPage() {
  const router = useRouter();
  const { profile, profileComplete, ready, programs } = useStore();
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [tier, setTier] = useState<"" | Tier>("");
  const [control, setControl] = useState("");
  const [policy, setPolicy] = useState("");
  const [sort, setSort] = useState<"selective" | "chance" | "name" | "cost">("selective");
  const showChance = ready && profileComplete >= 30;

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    let l = COLLEGES.filter(
      (c) =>
        (!s || `${c.name} ${c.short} ${c.city}`.toLowerCase().includes(s)) &&
        (!state || c.state === state) &&
        (!tier || tierOf(c) === tier) &&
        (!control || c.control === control) &&
        (!policy || c.testPolicy === policy),
    ).map((c) => ({ c, chance: showChance ? chanceOnly(profile, collegeForProgram(c, programs)) : 0 }));
    l = l.sort((a, b) =>
      sort === "selective" ? a.c.admitRate - b.c.admitRate : sort === "chance" ? b.chance - a.chance : sort === "cost" ? a.c.coa - b.c.coa : a.c.name.localeCompare(b.c.name),
    );
    return l;
  }, [q, state, tier, control, policy, sort, profile, showChance]);

  const states = Array.from(new Set(COLLEGES.map((c) => c.state))).sort();

  return (
    <div className="rise">
      <PageHeader
        eyebrow="Explore"
        title="Colleges"
        subtitle={`${COLLEGES.length} colleges with detailed admissions profiles, plus live search across every accredited four-year college in the U.S. via the Department of Education's College Scorecard.`}
      />
      <Card className="mb-6 p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Globe2 size={15} className="text-brand" /> Search all US colleges
        </div>
        <CollegePicker onPick={(c) => router.push(`/colleges/${c.id}`)} placeholder="Type any college name, e.g. 'Kenyon', 'Cal State Fullerton', 'Xavier'…" />
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SlidersHorizontal size={16} className="text-muted" />
        <input className={cx(inputCls, "w-48")} placeholder="Filter list…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={cx(inputCls, "w-auto")} value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">All states</option>
          {states.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={cx(inputCls, "w-auto")} value={tier} onChange={(e) => setTier(e.target.value ? (Number(e.target.value) as Tier) : "")}>
          <option value="">Any selectivity</option>
          {([1, 2, 3, 4, 5] as Tier[]).map((t) => <option key={t} value={t}>{TIER_INFO[t].label}</option>)}
        </select>
        <select className={cx(inputCls, "w-auto")} value={control} onChange={(e) => setControl(e.target.value)}>
          <option value="">Public & private</option>
          <option>Public</option>
          <option>Private</option>
        </select>
        <select className={cx(inputCls, "w-auto")} value={policy} onChange={(e) => setPolicy(e.target.value)}>
          <option value="">Any test policy</option>
          <option value="required">Test required</option>
          <option value="optional">Test optional</option>
          <option value="blind">Test blind</option>
        </select>
        <select className={cx(inputCls, "w-auto")} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="selective">Most selective</option>
          {showChance && <option value="chance">Best chance for me</option>}
          <option value="cost">Lowest sticker cost</option>
          <option value="name">A–Z</option>
        </select>
        <span className="ml-auto text-sm text-muted">{list.length} colleges</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(({ c, chance }) => {
          const sat = collegeSatRange(c);
          const cat = chance >= 0.8 ? "Safety" : chance >= 0.6 ? "Likely" : chance >= 0.33 && c.admitRate >= 0.15 ? "Target" : chance >= 0.12 ? "Reach" : "High reach";
          return (
            <Link key={c.id} href={`/colleges/${c.id}`} className="group min-w-0">
              <Card className="h-full p-4 transition group-hover:-translate-y-0.5 group-hover:border-brand">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft font-display font-semibold text-brand">{c.short.slice(0, 2)}</div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{c.name}</div>
                      <div className="text-xs text-muted">{c.city}, {c.state} · {c.control}</div>
                    </div>
                  </div>
                  {showChance && <Badge tone={categoryTone(cat)}>{fmtPct(chance)}</Badge>}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-surface-2 p-2">
                    <div className="text-muted">Admit</div>
                    <div className="font-semibold tabular-nums">{(c.admitRate * 100).toFixed(c.admitRate < 0.1 ? 1 : 0)}%</div>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-2">
                    <div className="text-muted">SAT 50%</div>
                    <div className="font-semibold tabular-nums">{c.testPolicy === "blind" ? "Blind" : `${sat[0]}–${sat[1]}`}</div>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-2">
                    <div className="text-muted">Avg GPA</div>
                    <div className="font-semibold tabular-nums">{c.gpa.toFixed(2)}</div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
      {list.length === 0 && (
        <div className="py-16 text-center text-muted">
          <Building2 className="mx-auto mb-2" /> No colleges match. Try the live search above.
        </div>
      )}
    </div>
  );
}
