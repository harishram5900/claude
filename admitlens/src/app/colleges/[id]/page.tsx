"use client";
import { ArrowLeft, CalendarDays, ExternalLink, GraduationCap, Heart, Plus, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { OfficialData } from "@/components/OfficialData";
import { Badge, Button, ButtonLink, Card, CardHeader, categoryTone, fmtPct, Gauge, Stat } from "@/components/ui";
import { collegeSatRange, evaluate, TIER_INFO } from "@/lib/engine";
import { guessDeadline } from "@/lib/deadline";
import { useStore } from "@/lib/store";
import { useCollege } from "@/lib/useCollege";

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function CollegeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { college, loading } = useCollege(decodeURIComponent(id));
  const { profile, profileComplete, tracker, setTracker, dreamCollege, setDreamCollege, ready } = useStore();
  if (loading || !ready) return <div className="py-24 text-center text-muted">Loading…</div>;
  if (!college) return <div className="py-24 text-center text-muted">College not found. <Link href="/colleges" className="text-brand">Back to colleges</Link></div>;
  const ev = evaluate(profile, college);
  const sat = collegeSatRange(college);
  const inTracker = tracker.some((t) => t.collegeId === college.id);
  const fmtMoney = (n: number) => (n ? `$${n.toLocaleString()}` : "Tuition-free (service obligation)");

  return (
    <div className="rise space-y-6">
      <Link href="/colleges" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> All colleges
      </Link>
      <Card className="overflow-hidden">
        <div className="glow grid gap-6 p-6 md:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">{TIER_INFO[ev.tier].label}</Badge>
              <Badge>{college.control}</Badge>
              <Badge>Test {college.testPolicy}</Badge>
              {college.source === "scorecard" && <Badge tone="brand">Live College Scorecard data</Badge>}
            </div>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{college.name}</h1>
            <p className="mt-1 text-muted">{college.city}, {college.state} · {college.enrollment ? `${college.enrollment.toLocaleString()} undergraduates` : ""}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink href={`/evaluate?college=${college.id}`}>
                <GraduationCap size={16} /> Full counselor review
              </ButtonLink>
              <Button variant={dreamCollege === college.id ? "primary" : "secondary"} onClick={() => setDreamCollege(dreamCollege === college.id ? null : college.id)}>
                <Heart size={15} className={dreamCollege === college.id ? "fill-current" : ""} /> {dreamCollege === college.id ? "Dream school" : "Make dream school"}
              </Button>
              <Button
                variant="secondary"
                disabled={inTracker}
                onClick={() => setTracker((t) => [...t, { collegeId: college.id, collegeName: college.name, plan: "RD", status: "Researching", deadline: guessDeadline(college, "RD"), checklist: {}, notes: "", addedAt: Date.now() }])}
              >
                <Plus size={15} /> {inTracker ? "In tracker" : "Track"}
              </Button>
              {college.url && (
                <a href={college.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-muted hover:text-ink">
                  Official site <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
          {profileComplete >= 30 ? (
            <div className="flex flex-col items-center">
              <Gauge value={ev.chance} label={fmtPct(ev.chance)} sub="your chance" />
              <Badge tone={categoryTone(ev.category)} className="mt-2">{ev.category}</Badge>
            </div>
          ) : (
            <Card className="max-w-56 self-center p-4 text-sm">
              <Target size={18} className="mb-1 text-brand" />
              <Link href="/profile" className="font-medium text-brand">Complete your profile</Link> to see your chance here.
            </Card>
          )}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Admit rate" value={`${(college.admitRate * 100).toFixed(college.admitRate < 0.1 ? 1 : 0)}%`} sub={college.earlyRate ? `Early: ${(college.earlyRate * 100).toFixed(1)}%${college.verified?.earlyFrom ? ` (${college.verified.earlyFrom})` : ""}` : undefined} />
        <Stat label="SAT middle 50%" value={college.testPolicy === "blind" ? "Test blind" : `${sat[0]}–${sat[1]}`} sub={college.sat ? "Published" : college.testPolicy === "blind" ? "Not considered" : "Estimated"} />
        <Stat label="ACT middle 50%" value={college.act ? `${college.act[0]}–${college.act[1]}` : "—"} />
        <Stat label="Typical GPA (UW)" value={college.gpa.toFixed(2)} sub={college.source === "scorecard" ? "Estimated" : "From CDS"} />
        <Stat label="Sticker cost / yr" value={fmtMoney(college.coa)} sub="Before aid" />
      </div>

      {college.verified ? (
        <p className="-mt-2 text-xs text-muted">
          Admit rate verified for the {college.verified.cycle}: {college.verified.detail}.{" "}
          <a href={college.verified.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">
            Source: {college.verified.source}
          </a>
          . Score ranges and GPA are from the latest Common Data Set.
        </p>
      ) : (
        <p className="-mt-2 text-xs text-muted">
          {college.source === "scorecard" ? "Admissions figures from the U.S. Department of Education College Scorecard. GPA is estimated from selectivity." : "Figures from the college's most recent Common Data Set and admissions office reports. They change every cycle, so confirm on the official site."}
        </p>
      )}

      <OfficialData college={college} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="What readers look for" icon={<Sparkles size={16} />} />
          <ul className="space-y-2 p-5 text-sm">
            {college.values.map((v) => <li key={v} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{cap(v)}</li>)}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Only-here resources" subtitle="Use these in your 'why us' essay" icon={<GraduationCap size={16} />} />
          <ul className="space-y-2 p-5 text-sm">
            {college.knownFor.length ? college.knownFor.map((v) => <li key={v} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-2" />{cap(v)}</li>) : <li className="text-muted">Research the official site for signature programs.</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Deadlines & essays" icon={<CalendarDays size={16} />} />
          <div className="space-y-3 p-5 text-sm">
            <div className="flex flex-wrap gap-2">
              {college.plans.ed && <Badge tone="brand">Early Decision</Badge>}
              {college.plans.ed2 && <Badge tone="brand">ED II</Badge>}
              {college.plans.rea && <Badge tone="brand">Restrictive EA</Badge>}
              {college.plans.ea && <Badge tone="brand">Early Action</Badge>}
            </div>
            {college.deadlines.early && <div>Early deadline: <b>{college.deadlines.early}</b></div>}
            <div>Regular deadline: <b>{college.deadlines.rd}</b></div>
            {college.supplements.length > 0 && (
              <div>
                <div className="mb-1 font-medium">Supplement themes</div>
                <ul className="list-disc space-y-1 pl-5 text-muted">{college.supplements.map((s) => <li key={s}>{cap(s)}</li>)}</ul>
              </div>
            )}
            <p className="text-xs text-muted">Deadlines and policies change each cycle. Confirm on the official site.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
