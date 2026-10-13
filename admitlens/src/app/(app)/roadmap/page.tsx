"use client";
import { BookOpen, Check, ClipboardCheck, Compass, DollarSign, Flag, MapPin, PenLine, Star, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CollegePicker } from "@/components/CollegePicker";
import { Badge, ButtonLink, Card, cx, fmtPct, PageHeader, Progress } from "@/components/ui";
import { evaluate } from "@/lib/engine";
import { buildRoadmap, currentPhase, PHASES, type Track } from "@/lib/roadmap";
import { useStore } from "@/lib/store";
import { useCollege } from "@/lib/useCollege";

const TRACK_ICON: Record<Track, typeof BookOpen> = { Academics: BookOpen, Testing: Target, Activities: Trophy, Essays: PenLine, Applications: ClipboardCheck, Money: DollarSign };
const TRACK_COLOR: Record<Track, string> = {
  Academics: "text-brand bg-brand-soft",
  Testing: "text-bad bg-bad-soft",
  Activities: "text-good bg-good-soft",
  Essays: "text-warn bg-warn-soft",
  Applications: "text-brand-2 bg-surface-2",
  Money: "text-accent bg-warn-soft",
};

export default function RoadmapPage() {
  const { profile, dreamCollege, setDreamCollege, roadmapDone, toggleRoadmap, ready } = useStore();
  const { college } = useCollege(dreamCollege);
  const [filter, setFilter] = useState<Track | "All" | "Priority">("All");
  const now = currentPhase(profile.grade);
  const items = useMemo(() => buildRoadmap(profile, college), [profile, college]);
  const ev = useMemo(() => (college ? evaluate(profile, college) : null), [profile, college]);
  const chance = ev?.chance ?? null;
  if (!ready) return null;

  const shown = items.filter((m) => filter === "All" || (filter === "Priority" ? m.priority : m.track === filter));
  const done = items.filter((m) => roadmapDone[m.id]).length;
  const phases = PHASES.map((p, i) => ({ p, i, items: shown.filter((m) => m.order === i) })).filter((x) => x.items.length > 0);

  return (
    <div className="rise">
      <PageHeader
        eyebrow="Your path"
        title={college ? <>The road to <span className="text-brand">{college.short}</span></> : "The road to your dream college"}
        subtitle="A grade-by-grade map from where you are now. Milestones marked ★ target the specific gaps your dream school's reader would flag."
      />

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-2 text-sm font-medium">Dream college</div>
          <CollegePicker onPick={(c) => setDreamCollege(c.id)} placeholder={college ? `${college.name}. Change…` : "Pick your dream school…"} />
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(["All", "Priority", "Academics", "Testing", "Activities", "Essays", "Applications", "Money"] as const).map((t) => (
              <button key={t} onClick={() => setFilter(t)} className={cx("rounded-full border px-3 py-1 text-xs transition", filter === t ? "border-brand bg-brand-soft text-brand" : "border-line hover:bg-surface-2")}>
                {t === "Priority" ? "★ Priority" : t}
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="tabular-nums text-muted">{done}/{items.length}</span>
          </div>
          <Progress value={(done / items.length) * 100} className="mt-2" tone="good" />
          {college && chance != null && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-2 p-3">
              <div className="text-sm">
                Today's chance at {college.short}
                <div className="text-xs text-muted">Updates as your profile improves</div>
              </div>
              <div className="font-display text-2xl font-semibold">{fmtPct(chance)}</div>
            </div>
          )}
          {!college && <p className="mt-3 text-sm text-muted">Choose a dream college to personalize every milestone.</p>}
        </Card>
      </div>

      {college && ev && ev.improvements.length > 0 && (
        <Card className="mb-10 overflow-hidden">
          <div className="border-b border-line px-6 py-4">
            <div className="eyebrow">Game plan</div>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">Your three biggest levers for {college.short}</h2>
            <p className="text-sm text-muted">Each is re-simulated against {college.short}'s reader, so the gains reflect this school's priorities.</p>
          </div>
          <div className="grid gap-px bg-line md:grid-cols-3">
            {ev.improvements.slice(0, 3).map((im, i) => (
              <div key={im.title} className="bg-surface p-6">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs text-accent">0{i + 1}</span>
                  <span className="font-display text-lg font-semibold text-good">+{im.gain.toFixed(1)} pts</span>
                </div>
                <div className="mt-2 font-medium">{im.title}</div>
                <p className="mt-1 text-sm text-muted">{im.detail}</p>
                <Badge tone="neutral" className="mt-3">{im.effort}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* The map */}
      <div className="relative">
        <div className="absolute bottom-0 left-5 top-0 w-1 rounded-full bg-gradient-to-b from-brand via-brand-2 to-accent opacity-60 md:left-1/2 md:-translate-x-1/2" aria-hidden />
        <div className="space-y-10">
          {phases.map(({ p, i, items: its }, idx) => {
            const isNow = i === now;
            const past = i < now;
            return (
              <section key={p} className="relative">
                <div className="relative z-10 mb-4 flex items-center gap-3 md:justify-center">
                  <div className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-full border-4 border-bg shadow-card", isNow ? "bg-brand text-white" : past ? "bg-surface-2 text-muted" : "bg-surface text-brand")}>
                    {isNow ? <MapPin size={18} /> : past ? <Check size={16} /> : <Compass size={16} />}
                  </div>
                  <div className={cx("rounded-full border px-3 py-1 text-sm font-semibold", isNow ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface")}>
                    {p} {isNow && <span className="ml-1 text-xs font-normal">· you are here</span>}
                  </div>
                </div>
                <div className={cx("grid gap-3 pl-14 md:w-1/2 md:pl-0", idx % 2 === 0 ? "md:pr-10" : "md:ml-auto md:pl-10")}>
                  {its.map((m) => {
                    const Icon = TRACK_ICON[m.track];
                    const isDone = !!roadmapDone[m.id];
                    return (
                      <Card key={m.id} className={cx("p-4 transition", isDone && "opacity-60", m.priority && !isDone && "border-brand/50", past && !isDone && "opacity-80")}>
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggleRoadmap(m.id)} className={cx("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition", isDone ? "border-good bg-good text-white" : "border-line hover:border-brand")} aria-label={isDone ? "Mark not done" : "Mark done"}>
                            {isDone && <Check size={13} />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={cx("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium", TRACK_COLOR[m.track])}>
                                <Icon size={11} /> {m.track}
                              </span>
                              {m.priority && (
                                <Badge tone="brand">
                                  <Star size={10} className="fill-current" /> Gap at {college?.short ?? "dream school"}
                                </Badge>
                              )}
                            </div>
                            <div className={cx("mt-1.5 font-medium", isDone && "line-through")}>{m.title}</div>
                            <p className="mt-0.5 text-sm text-muted">{m.detail}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
          <div className="relative z-10 flex flex-col items-start gap-3 pl-0 md:items-center">
            <div className="grid h-14 w-14 place-items-center rounded-full border-4 border-bg bg-accent text-white shadow-card">
              <Flag size={22} />
            </div>
            <Card className="max-w-md p-5 md:text-center">
              <div className="font-display text-xl font-semibold">{college ? `Admitted to ${college.short}` : "Decision day"}</div>
              <p className="mt-1 text-sm text-muted">Most decisions arrive mid-December (early) or late March (regular). Commit by May 1.</p>
              {college && (
                <ButtonLink href={`/evaluate?college=${college.id}`} className="mt-3">
                  See the full counselor review
                </ButtonLink>
              )}
              {!college && (
                <Link href="/colleges" className="mt-3 inline-block text-sm font-medium text-brand">
                  Explore colleges →
                </Link>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
