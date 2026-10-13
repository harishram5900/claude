"use client";
import { AlertTriangle, ArrowUpRight, Award, CheckCircle2, FileText, Gavel, Landmark, ListChecks, Loader2, MessageSquareQuote, PenLine, Sparkles, TrendingUp, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { College } from "@/data/colleges";
import { RATING_TEXT, TIER_INFO, type Evaluation } from "@/lib/engine";
import type { Profile } from "@/lib/types";
import { useAiStatus } from "@/lib/useCollege";
import { Badge, Button, Card, CardHeader, categoryTone, cx, fmtPct, Gauge } from "./ui";

interface AiRead {
  memo: string[];
  harshTruths: string[];
  whatWouldChangeMyMind: string[];
  essayCritique: string;
  activityCritique: string;
  oneLineVerdict: string;
}

const ratingCls = (r: number) => (r <= 2 ? "bg-good-soft text-good" : r === 3 ? "bg-brand-soft text-brand" : r === 4 ? "bg-warn-soft text-warn" : "bg-bad-soft text-bad");

export function CounselorReport({ ev, profile }: { ev: Evaluation; profile: Profile }) {
  const ai = useAiStatus();
  const [aiRead, setAiRead] = useState<AiRead | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const c: College = ev.college;

  const runAi = async () => {
    setAiLoading(true);
    setAiErr(null);
    try {
      const res = await fetch("/api/ai/counselor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, plan: ev.plan, ...(c.source === "scorecard" ? { college: c } : { collegeId: c.id }) }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Request failed");
      setAiRead(d);
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Headline */}
      <Card className="overflow-hidden">
        <div className="glow">
          <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center">
            <Gauge value={ev.chance} size={168} label={fmtPct(ev.chance)} sub={`${fmtPct(ev.chanceLow)}–${fmtPct(ev.chanceHigh)} range`} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={categoryTone(ev.category)}>{ev.category}</Badge>
                <Badge tone="neutral">{TIER_INFO[ev.tier].label}</Badge>
                <Badge tone="neutral">{ev.plan === "RD" ? "Regular Decision" : ev.plan}</Badge>
              </div>
              <div className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Likely outcome</div>
              <div className="font-medium" data-testid="decision">{ev.decision}</div>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{ev.verdict}</h2>
              <p className="mt-1 text-sm text-muted">
                {c.name}: {(c.admitRate * 100).toFixed(c.admitRate < 0.1 ? 1 : 0)}% overall admit rate. Reader: {ev.reader}.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="text-sm">Overall reader rating</div>
                <div className={cx("rounded-lg px-2.5 py-1 font-display text-lg font-semibold", ratingCls(ev.overallRating))}>
                  {ev.overallRating} <span className="text-sm font-normal">/ 6</span>
                </div>
                <div className="text-sm text-muted">({ev.overallGrade}) {RATING_TEXT[ev.overallRating]}</div>
              </div>
            </div>
          </div>
        </div>
        {ev.flags.length > 0 && (
          <div className="space-y-1.5 border-t border-line bg-warn-soft/50 px-6 py-3">
            {ev.flags.map((f) => (
              <div key={f} className="flex gap-2 text-sm text-warn">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Full written evaluation */}
      <Card>
        <CardHeader title={`Admissions evaluation: ${c.short}`} subtitle={`Written as ${ev.reader} would read your full file`} icon={<FileText size={16} />} />
        <div className="space-y-4 px-5 py-5">
          <p className="text-[15.5px] leading-[1.75]" data-testid="evaluation">{ev.evaluation}</p>
          <div className="rounded-xl border border-line bg-surface-2/60 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Landmark size={13} /> How {c.short} reviews your application
            </div>
            <p className="text-sm leading-relaxed">{ev.reviewProcess}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Ratings */}
        <Card className="lg:col-span-2">
          <CardHeader title="Ratings by category" subtitle={`1 = exceptional for ${c.short} · 6 = not competitive here`} icon={<Gavel size={16} />} />
          <div className="divide-y divide-line">
            {ev.dimensions.map((d) => (
              <div key={d.key} className="flex items-center gap-3 px-5 py-3">
                <div className={cx("grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-lg font-semibold", ratingCls(d.rating))}>{d.rating}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{d.label}</span>
                    <span className="text-sm font-semibold tabular-nums">{d.grade}</span>
                  </div>
                  <div className="truncate text-xs text-muted">{d.note}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Memo */}
        <Card className="lg:col-span-3">
          <CardHeader title="Reader notes" subtitle="Category by category, in the reader's voice" icon={<MessageSquareQuote size={16} />} />
          <div className="space-y-3 px-5 py-4 text-[15px] leading-relaxed">
            {ev.memo.map((m, i) => (
              <p key={i} className={i === 0 ? "font-display text-lg italic" : ""}>
                {m}
              </p>
            ))}
            <div className="rounded-xl border border-line bg-surface-2/60 p-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">In committee, I'd say</div>
              <p className="font-display text-lg">{ev.committeeLine}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Activity-by-activity read" subtitle={`How each activity reads at ${c.short}`} icon={<ListChecks size={16} />} />
          <div className="divide-y divide-line">
            {ev.activityReads.length === 0 && <p className="px-5 py-4 text-sm text-muted">No activities on file. Upload your Common App or add them in your profile.</p>}
            {ev.activityReads.map((a) => (
              <div key={a.id} className="px-5 py-3" data-testid="activity-read">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {a.name}
                    {a.role && <span className="font-normal text-muted"> · {a.role}</span>}
                  </span>
                  <Badge tone={a.tier === 1 ? "good" : a.tier === 2 ? "brand" : a.tier === 3 ? "neutral" : "warn"}>{a.label}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{a.comment}</p>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Honors & awards" icon={<Award size={16} />} />
            <div className="divide-y divide-line">
              {ev.awardReads.length === 0 && <p className="px-5 py-4 text-sm text-muted">No honors listed.</p>}
              {ev.awardReads.map((w) => (
                <div key={w.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{w.name}</span>
                    <Badge className="capitalize">{w.level}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{w.comment}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Personal essay" icon={<PenLine size={16} />} />
            {ev.essay ? (
              <div className="px-5 py-4 text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-semibold">{ev.essay.grade}</span>
                  <span className="text-muted">{ev.essay.overall}/100 · {ev.essay.words} words</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                  {Object.entries(ev.essay.scores)
                    .filter(([, v]) => v != null)
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between capitalize">
                        <span className="text-muted">{k}</span>
                        <span className="tabular-nums">{v}</span>
                      </div>
                    ))}
                </div>
                {ev.essay.issues.slice(0, 3).map((i) => (
                  <div key={i.excerpt} className="mt-3 rounded-lg border border-line p-2.5">
                    <div className="text-xs italic text-muted">“{i.excerpt}”</div>
                    <div className="mt-1">{i.advice}</div>
                  </div>
                ))}
                <Link href="/essays" className="mt-3 inline-block text-sm text-brand">Revise in the Essay Lab →</Link>
              </div>
            ) : (
              <p className="px-5 py-4 text-sm text-muted">No personal statement on file yet.</p>
            )}
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title="What's working" icon={<CheckCircle2 size={16} />} />
          <ul className="space-y-2 px-5 py-4 text-sm">
            {ev.strengths.length ? ev.strengths.map((s) => <li key={s} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-good" />{s}</li>) : <li className="text-muted">Nothing stands out yet for this school. See the plan below.</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Where the reader pushes back" icon={<XCircle size={16} />} />
          <ul className="space-y-2 px-5 py-4 text-sm">
            {ev.concerns.length ? ev.concerns.map((s) => <li key={s} className="flex gap-2"><XCircle size={16} className="mt-0.5 shrink-0 text-bad" />{s}</li>) : <li className="text-muted">No major red flags for this school.</li>}
          </ul>
        </Card>
      </div>

      {/* Improvements */}
      <Card>
        <CardHeader title="How to raise your chances here" subtitle="Each change is re-simulated against this college. Gains are what the model predicts, not guarantees." icon={<TrendingUp size={16} />} />
        <div className="grid gap-3 p-5 md:grid-cols-2">
          {ev.improvements.length === 0 && <p className="text-sm text-muted">You've maxed out what the model can measure. The rest is execution: polish every supplement.</p>}
          {ev.improvements.map((im) => (
            <div key={im.title} className="rounded-xl border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="font-medium">{im.title}</div>
                <div className="shrink-0 text-right">
                  <div className="font-display text-lg font-semibold text-good">+{im.gain.toFixed(1)}</div>
                  <div className="text-[11px] text-muted">pts → {fmtPct(im.newChance)}</div>
                </div>
              </div>
              <p className="mt-1 text-sm text-muted">{im.detail}</p>
              <Badge tone="neutral" className="mt-2">{im.effort}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* AI deep read */}
      <Card>
        <CardHeader
          title="Deep read by AI admissions reader"
          subtitle={ai === false ? "Not configured on this deployment (set ANTHROPIC_API_KEY to enable)." : `A full-text read of your activities and essay, written in the voice of a ${c.short} reader.`}
          icon={<Sparkles size={16} />}
          action={
            ai ? (
              <Button onClick={runAi} disabled={aiLoading}>
                {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {aiRead ? "Re-read" : "Get deep read"}
              </Button>
            ) : null
          }
        />
        {aiErr && <div className="px-5 py-3 text-sm text-bad">{aiErr}</div>}
        {aiLoading && !aiRead && <div className="px-5 py-8 text-center text-sm text-muted">The reader is going through your file. This takes 20–60 seconds…</div>}
        {aiRead && (
          <div className="grid gap-6 p-5 lg:grid-cols-2">
            <div className="space-y-3 text-[15px] leading-relaxed">
              {aiRead.memo.map((m, i) => <p key={i}>{m}</p>)}
              <p className="font-display text-lg">"{aiRead.oneLineVerdict}"</p>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <div className="mb-1.5 font-semibold">Harsh truths</div>
                <ul className="space-y-1.5">{aiRead.harshTruths.map((h) => <li key={h} className="flex gap-2"><XCircle size={15} className="mt-0.5 shrink-0 text-bad" />{h}</li>)}</ul>
              </div>
              <div>
                <div className="mb-1.5 font-semibold">What would change my mind</div>
                <ul className="space-y-1.5">{aiRead.whatWouldChangeMyMind.map((h) => <li key={h} className="flex gap-2"><ArrowUpRight size={15} className="mt-0.5 shrink-0 text-good" />{h}</li>)}</ul>
              </div>
              <div><span className="font-semibold">On your activities: </span>{aiRead.activityCritique}</div>
              <div><span className="font-semibold">On your essay: </span>{aiRead.essayCritique}</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
