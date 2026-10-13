"use client";
import { CalendarDays, Compass, Download, FileDown, Lightbulb, ListChecks, PenLine, PlusCircle, Search, SlidersHorizontal, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AddAward } from "@/components/funding/AddAward";
import { Intake } from "@/components/funding/Intake";
import { fmtDeadline, ResultCard } from "@/components/funding/ResultCard";
import { Badge, Button, ButtonLink, Card, CardHeader, cx, PageHeader } from "@/components/ui";
import { money, RING_NAME, RINGS, type Ranked } from "@/lib/grantscout";
import { useStore } from "@/lib/store";
import { RING_QUOTA, useFunding } from "@/lib/useFunding";

type Tab = "top" | "rings" | "free" | "essays" | "research" | "add" | "profile";
const TABS: [Tab, string, typeof Trophy][] = [
  ["top", "Start here", Sparkles],
  ["rings", "By location", Compass],
  ["free", "Free money checklist", ListChecks],
  ["essays", "Essay reuse plan", PenLine],
  ["research", "Find local money", Search],
  ["add", "Add an award", PlusCircle],
  ["profile", "Your funding profile", SlidersHorizontal],
];

function csv(results: Ranked[]) {
  const cols = ["Ring", "Score", "Name", "Sponsor", "Type", "Amount", "Deadline", "Estimated", "Win probability", "Expected value", "Why it fits", "Review", "Sponsor page"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = results.map((x) => [RING_NAME[x.ring], x.score, x.rec.name, x.rec.sponsor, x.rec.vehicle, money(x.rec), x.deadline, x.deadlineEstimated, x.winProb, x.expectedValue, x.why, x.review.join(" | "), x.rec.source_url].map(esc).join(","));
  return [cols.map(esc).join(","), ...rows].join("\n");
}

export default function FundingPage() {
  const { ready, profile } = useStore();
  const f = useFunding();
  const [tab, setTab] = useState<Tab>("top");
  if (!ready) return null;

  const download = () => {
    const blob = new Blob([csv(f.results)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `grantscout-${(f.fp.name || "student").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const urgent = [...f.results].filter((x) => x.deadline && !x.deadlineEstimated).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 3);
  const location = [profile.funding?.city, profile.state].filter(Boolean).join(", ");

  return (
    <div className="rise">
      <PageHeader
        eyebrow="Scholarships & funding"
        title="Money you can actually win"
        subtitle="Scholarships, grants, fellowships, paid internships, funded programs and competitions, filtered to what you're eligible for (including citizenship and immigration status), sorted closest first, and ranked by your real odds."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={download}><Download size={15} /> CSV</Button>
            <ButtonLink href="/scholarships/report" target="_blank"><FileDown size={15} /> Download PDF</ButtonLink>
          </div>
        }
      />

      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
        {[
          [String(f.results.length), "opportunities you appear eligible for", location || "Add your city and county for local results"],
          [`$${Math.round(f.totalValue).toLocaleString()}`, "listed value (approx.)", "If you won every one"],
          [`$${Math.round(f.totalEv).toLocaleString()}`, "expected value*", "Award size × estimated odds"],
          [String(f.needsReview), "need a closer look", "Unverified wording or estimated dates"],
        ].map(([n, l, s]) => (
          <div key={l} className="bg-surface px-5 py-4">
            <div className="font-display text-3xl font-semibold tabular-nums">{n}</div>
            <div className="mt-0.5 text-sm">{l}</div>
            <div className="text-xs text-muted">{s}</div>
          </div>
        ))}
      </div>
      {urgent.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <CalendarDays size={15} className="text-bad" />
          <span className="font-medium">Most urgent:</span>
          {urgent.map((x) => <Badge key={x.rec.name} tone="bad">{x.rec.name} · {fmtDeadline(x)}</Badge>)}
        </div>
      )}

      {/* Tabs */}
      <div className="scroll-thin mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={cx("-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition", tab === k ? "border-brand font-medium text-brand" : "border-transparent text-muted hover:text-ink")}>
            <Icon size={14} /> {l}
          </button>
        ))}
      </div>

      {tab === "top" && (
        <div className="space-y-6">
          {!profile.funding && (
            <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">Results use your AdmitLens profile. Add your city, county and (optionally) citizenship status for local and status-specific funding.</p>
              <Button variant="secondary" onClick={() => setTab("profile")}>Complete funding profile</Button>
            </Card>
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{f.top.map((x, i) => <ResultCard key={x.rec.name + x.rec.sponsor} x={x} rank={i + 1} />)}</div>
          <p className="text-xs text-muted">*Expected value and odds are estimates for prioritizing, not promises. Smaller, local and narrowly targeted awards score higher odds. Always confirm on the sponsor's page before applying. Legitimate awards never charge a fee or ask for bank or SSN details.</p>
        </div>
      )}

      {tab === "rings" && (
        <div className="space-y-10">
          {RINGS.map(([ring, name]) => {
            const items = f.results.filter((x) => x.ring === ring);
            if (!items.length && !f.thinRings.includes(ring)) return null;
            return (
              <section key={ring}>
                <div className="mb-4 flex items-end justify-between gap-3 border-b border-line pb-2">
                  <h2 className="font-display text-xl font-semibold">{ring}. {name}</h2>
                  <span className="text-sm text-muted">{items.length} found</span>
                </div>
                {items.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((x) => <ResultCard key={x.rec.name + x.rec.sponsor} x={x} />)}</div>
                ) : (
                  <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted">Nothing here yet. Local awards aren't in any national database. They're on your county foundation's and civic clubs' own sites.</p>
                    <Button variant="secondary" onClick={() => setTab("research")}><Search size={14} /> Search this ring</Button>
                  </Card>
                )}
              </section>
            );
          })}
        </div>
      )}

      {tab === "free" && (
        <Card>
          <CardHeader title="Free money people leave on the table" subtitle="Entitlement aid and fee waivers: meet the criteria, file on time, and you're funded." icon={<ListChecks size={16} />} />
          <ul className="divide-y divide-line">
            {f.unclaimed.map((u) => <li key={u} className="flex gap-3 px-5 py-3.5 text-sm"><Lightbulb size={15} className="mt-0.5 shrink-0 text-accent" />{u}</li>)}
          </ul>
          <p className="border-t border-line px-5 py-3 text-xs text-muted">
            Federal Pell Grant estimates are from NCAN. The "billions in unclaimed private scholarships" claim is mostly a myth: private money goes to whoever applies, so GrantScout targets low-competition awards instead.
          </p>
        </Card>
      )}

      {tab === "essays" && (
        <div className="space-y-4">
          <p className="max-w-2xl text-sm text-muted">Write once, apply many. Awards are grouped by the essay theme they ask for, so one strong essay can be adapted five to ten times.</p>
          {f.essays.length === 0 && <Card className="p-5 text-sm text-muted">None of your current matches require an essay.</Card>}
          {f.essays.map(([theme, names]) => (
            <Card key={theme} className="p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">{theme}</h3>
                <Badge tone="brand">{names.length} awards</Badge>
              </div>
              <p className="mt-2 text-sm text-muted">{names.join(" · ")}</p>
              <Link href="/essays" className="mt-3 inline-block text-sm font-medium text-brand">Draft it in the Essay Lab →</Link>
            </Card>
          ))}
        </div>
      )}

      {tab === "research" && (
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-display text-lg font-semibold">Ring coverage</h3>
            <p className="mt-1 text-sm text-muted">AdmitLens aims for these minimums at each distance from home. Local awards aren't in any national database, so the closest rings need a short search on sponsors' own sites.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {RINGS.filter(([r]) => r !== 6).map(([r, n]) => (
                <div key={r} className={cx("rounded-xl border p-3", f.thinRings.includes(r) ? "border-warn/40 bg-warn-soft/40" : "border-line")}>
                  <div className="text-xs text-muted">{n}</div>
                  <div className="mt-1 font-display text-xl font-semibold tabular-nums">{f.ringCounts[r]} <span className="text-sm font-normal text-muted">/ {RING_QUOTA[r]}</span></div>
                </div>
              ))}
            </div>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            {f.plan.map(([ring, queries]) => (
              <Card key={ring}>
                <CardHeader title={`${ring}. ${RING_NAME[ring]}`} subtitle={f.thinRings.includes(ring) ? "Thin: search here first" : `${f.ringCounts[ring]} found so far`} icon={<Search size={16} />} />
                <ul className="divide-y divide-line">
                  {queries.map((q) => (
                    <li key={q}>
                      <a href={`https://www.google.com/search?q=${encodeURIComponent(q)}`} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm hover:bg-surface-2/60">
                        <span>{q}</span>
                        <Search size={13} className="shrink-0 text-muted" />
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader title="Connecting the dots: angles worth a second search" subtitle="Intersections of your traits have tiny applicant pools. Brainstorm wide, then verify strictly." icon={<Lightbulb size={16} />} />
            <ul className="grid gap-px bg-line sm:grid-cols-2">
              {f.lateral.map((l) => (
                <li key={l} className="bg-surface">
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(l.split(":")[0] + " scholarship")}`} target="_blank" rel="noreferrer" className="block px-5 py-3 text-sm hover:bg-surface-2/60">{l}</a>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5 text-sm">
            <b>How to research safely:</b> <span className="text-muted">use aggregators like Fastweb or Bold.org only for discovery, then open the sponsor's own page. Copy the eligibility wording exactly. Skip anything with a fee, a "guaranteed" win, or a request for bank or SSN details. Found one?</span>{" "}
            <button onClick={() => setTab("add")} className="font-medium text-brand">Add it to your list →</button>
          </Card>
        </div>
      )}

      {tab === "add" && <AddAward state={profile.state} />}
      {tab === "profile" && <Intake />}

      {Object.keys(f.dropped).length > 0 && tab !== "add" && tab !== "profile" && (
        <p className="mt-8 text-xs text-muted">
          Filtered out for you: {Object.entries(f.dropped).map(([k, v]) => `${v} × ${k}`).join(" · ")}.
        </p>
      )}
    </div>
  );
}
