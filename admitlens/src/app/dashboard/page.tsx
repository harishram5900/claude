"use client";
import { AlarmClock, ArrowRight, ClipboardList, GraduationCap, Heart, Map, PenLine, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { Badge, Button, ButtonLink, Card, CardHeader, categoryTone, Empty, fmtPct, Gauge, PageHeader, Progress } from "@/components/ui";
import { getCollege } from "@/data/colleges";
import { matchScholarship, SCHOLARSHIPS } from "@/data/scholarships";
import { analyzeEssay } from "@/lib/essay";
import { evaluate, unweightedGpa } from "@/lib/engine";
import { buildRoadmap, currentPhase } from "@/lib/roadmap";
import { SAMPLE_PROFILE } from "@/lib/sample";
import { useStore } from "@/lib/store";
import { useCollege } from "@/lib/useCollege";

export default function Dashboard() {
  const { profile, setProfile, profileComplete, tracker, dreamCollege, roadmapDone, ready } = useStore();
  const { college: dream } = useCollege(dreamCollege);
  if (!ready) return null;

  if (profileComplete < 20)
    return (
      <div className="rise">
        <PageHeader eyebrow="Dashboard" title="Welcome to AdmitLens" subtitle="Start by building your profile. Everything else reads from it." />
        <Empty
          icon={<Sparkles size={22} />}
          title="No profile yet"
          body="Import your Common App PDF or fill in your profile. Or explore with a realistic sample student."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href="/profile">Build profile</ButtonLink>
              <Button variant="secondary" onClick={() => setProfile(SAMPLE_PROFILE)}>Load sample</Button>
            </div>
          }
        />
      </div>
    );

  const ev = dream ? evaluate(profile, dream) : null;
  const upcoming = tracker.filter((t) => t.deadline && !["Submitted", "Admitted", "Denied", "Waitlisted", "Committed"].includes(t.status)).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 5);
  const essay = profile.personalStatement ? analyzeEssay(profile.personalStatement) : null;
  const ctx = { grade: Math.min(profile.grade, 12), gpa: unweightedGpa(profile), state: profile.state, major: profile.intendedMajor, firstGen: profile.firstGen, lowIncome: profile.lowIncome };
  const scholarships = SCHOLARSHIPS.map((s) => ({ s, m: matchScholarship(s, ctx) })).filter((x) => !x.m.blockers.length).sort((a, b) => b.m.score - a.m.score).slice(0, 4);
  const phase = currentPhase(profile.grade);
  const next = buildRoadmap(profile, dream).filter((m) => m.order >= phase && !roadmapDone[m.id]).slice(0, 4);

  return (
    <div className="rise">
      <PageHeader eyebrow="Dashboard" title={`Hi${profile.name ? `, ${profile.name.split(" ")[0]}` : ""}`} subtitle="Here's where your applications stand today." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Dream school" icon={<Heart size={16} />} action={<Link href="/simulate" className="text-sm text-brand">Simulator →</Link>} />
          {ev && dream ? (
            <div className="grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
              <Gauge value={ev.chance} label={fmtPct(ev.chance)} sub={dream.short} />
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={categoryTone(ev.category)}>{ev.category}</Badge>
                  <Badge>{ev.verdict}</Badge>
                </div>
                <p className="mt-3 font-display text-lg italic">{ev.committeeLine}</p>
                {ev.improvements[0] && (
                  <div className="mt-3 rounded-xl border border-line p-3 text-sm">
                    <span className="text-muted">Biggest lever: </span>
                    <b>{ev.improvements[0].title}</b> <span className="text-good">(+{ev.improvements[0].gain.toFixed(1)} pts)</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5">
              <Empty icon={<GraduationCap size={22} />} title="Pick a dream school" body="Set one in the simulator or on any college page." action={<ButtonLink href="/simulate">Open simulator</ButtonLink>} />
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Profile strength" icon={<Sparkles size={16} />} />
          <div className="p-5">
            <div className="font-display text-4xl font-semibold">{profileComplete}%</div>
            <Progress value={profileComplete} className="mt-2" tone={profileComplete >= 80 ? "good" : "warn"} />
            <div className="mt-4 space-y-1 text-sm text-muted">
              <div>GPA {unweightedGpa(profile)?.toFixed(2) ?? "—"} · {profile.apCount} AP/IB · SAT {profile.sat ?? "—"}</div>
              <div>{profile.activities.length} activities · {profile.awards.length} honors</div>
              <div>Essay: {essay ? `${essay.grade} (${essay.overall})` : "not added"}</div>
            </div>
            <ButtonLink href="/profile" variant="secondary" className="mt-4 w-full">Edit profile</ButtonLink>
          </div>
        </Card>

        <Card>
          <CardHeader title="Upcoming deadlines" icon={<AlarmClock size={16} />} action={<Link href="/tracker" className="text-sm text-brand">Tracker →</Link>} />
          <div className="divide-y divide-line">
            {upcoming.length === 0 && <p className="p-5 text-sm text-muted">No deadlines tracked yet.</p>}
            {upcoming.map((t) => {
              const days = Math.ceil((new Date(t.deadline).getTime() - Date.now()) / 86400000);
              return (
                <div key={t.collegeId} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <div className="font-medium">{t.collegeName}</div>
                    <div className="text-xs text-muted">{t.plan} · {new Date(t.deadline + "T12:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                  </div>
                  <Badge tone={days <= 14 ? "bad" : days <= 45 ? "warn" : "neutral"}>{days < 0 ? "Passed" : `${days}d`}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Your list" icon={<ClipboardList size={16} />} />
          <div className="divide-y divide-line">
            {tracker.length === 0 && <p className="p-5 text-sm text-muted">Add colleges from the tracker or any college page.</p>}
            {tracker.slice(0, 6).map((t) => {
              const c = getCollege(t.collegeId);
              const e = c ? evaluate(profile, c, t.plan) : null;
              return (
                <Link key={t.collegeId} href={`/simulate?college=${t.collegeId}`} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-surface-2">
                  <span className="truncate">{t.collegeName}</span>
                  {e && <Badge tone={categoryTone(e.category)}>{fmtPct(e.chance)}</Badge>}
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Next on your roadmap" icon={<Map size={16} />} action={<Link href="/roadmap" className="text-sm text-brand">Map →</Link>} />
          <ul className="space-y-3 p-5 text-sm">
            {next.map((m) => (
              <li key={m.id}>
                <div className="text-xs text-muted">{m.phase}{m.priority && " · ★ priority"}</div>
                <div className="font-medium">{m.title}</div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Top scholarship matches" icon={<Trophy size={16} />} action={<Link href="/scholarships" className="text-sm text-brand">All →</Link>} />
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {scholarships.map(({ s, m }) => (
              <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="rounded-xl border border-line p-3 transition hover:border-brand">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-muted">{m.score}%</span>
                </div>
                <div className="mt-1 text-sm text-good">{s.amount}</div>
                <div className="text-xs text-muted">Deadline: {s.deadline}</div>
              </a>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Essays" icon={<PenLine size={16} />} />
          <div className="p-5 text-sm">
            {essay ? (
              <>
                <div className="font-display text-3xl font-semibold">{essay.grade}</div>
                <p className="mt-1 text-muted">{essay.nextSteps[0]}</p>
              </>
            ) : (
              <p className="text-muted">No personal statement yet.</p>
            )}
            <ButtonLink href="/essays" variant="secondary" className="mt-4 w-full">
              Open Essay Lab <ArrowRight size={15} />
            </ButtonLink>
          </div>
        </Card>
      </div>
    </div>
  );
}
