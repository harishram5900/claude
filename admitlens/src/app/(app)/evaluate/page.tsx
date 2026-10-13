"use client";
import { Columns3, GraduationCap, Heart, Plus, Sparkles, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { CollegePicker } from "@/components/CollegePicker";
import { CounselorReport } from "@/components/CounselorReport";
import { Badge, Button, ButtonLink, Card, CardHeader, categoryTone, cx, Empty, fmtPct, PageHeader } from "@/components/ui";
import { getCollege, type College } from "@/data/colleges";
import { getProgram, PROGRAMS, suggestProgram } from "@/data/programs";
import { evaluate, TIER_INFO } from "@/lib/engine";
import { applyProgram, collegeForProgram } from "@/lib/programs";
import { guessDeadline } from "@/lib/deadline";
import { useStore } from "@/lib/store";
import type { AppPlan } from "@/lib/types";
import { useCollege } from "@/lib/useCollege";

function Evaluation() {
  const params = useSearchParams();
  const router = useRouter();
  const { profile, profileComplete, ready, dreamCollege, setDreamCollege, tracker, setTracker, programs, setProgram } = useStore();
  const id = params.get("college") ?? dreamCollege ?? null;
  const { college, loading } = useCollege(id);
  const [plan, setPlan] = useState<AppPlan>("RD");
  const [compare, setCompare] = useState<College[]>(() => ["harvard", "umich", "uiuc", "uic"].map((i) => getCollege(i)!));

  // The school or program inside the college: saved choice, else the one matching the intended major.
  const options = college ? (PROGRAMS[college.id] ?? []) : [];
  const saved = college ? programs[college.id] : undefined;
  const suggested = college && !saved ? suggestProgram(college.id, profile.intendedMajor) : null;
  const programId = saved ?? suggested?.id ?? null;
  const target = useMemo(() => (college ? applyProgram(college, getProgram(college.id, programId)) : null), [college, programId]);
  const ev = useMemo(() => (target ? evaluate(profile, target, plan) : null), [profile, target, plan]);
  const plans: AppPlan[] = college ? (["RD", college.plans.ed && "ED", college.plans.ed2 && "ED2", college.plans.rea && "REA", college.plans.ea && "EA"].filter(Boolean) as AppPlan[]) : ["RD"];

  const pick = (c: College) => {
    setPlan("RD");
    router.replace(`/evaluate?college=${encodeURIComponent(c.id)}`, { scroll: false });
  };

  const inTracker = college && tracker.some((t) => t.collegeId === college.id);

  if (!ready) return null;

  return (
    <div className="rise">
      <PageHeader
        eyebrow="Admissions evaluation"
        title={target ? `Your ${target.short} evaluation` : "See your file through their eyes"}
        subtitle="Pick any college. Its admissions reader rates every part of your application against that school's admitted students, gives your chances, writes how your file would be reviewed and tells you exactly what to fix."
      />

      {profileComplete < 40 && (
        <Card className="mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warn-soft text-warn">
              <UserRound size={18} />
            </div>
            <div>
              <div className="font-semibold">Your profile is {profileComplete}% complete</div>
              <p className="text-sm text-muted">Your evaluation is only as good as what's in your profile. Add your grades, scores, activities, honors and essay once; every college uses them.</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <ButtonLink href="/profile">Complete my profile</ButtonLink>
          </div>
        </Card>
      )}

      <Card className="mb-6 p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="mb-1.5 text-sm font-medium">College</div>
            <CollegePicker onPick={pick} placeholder={college ? `Change from ${college.name}…` : "Search 6,000+ US colleges…"} />
          </div>
          {college && (
            <div>
              <div className="mb-1.5 text-sm font-medium">Application plan</div>
              <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface-2 p-1">
                {plans.map((p) => (
                  <button key={p} onClick={() => setPlan(p)} className={cx("rounded-lg px-3 py-1.5 text-sm", plan === p ? "bg-surface font-medium shadow-sm" : "text-muted")}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {college && (
          <div className="mt-4 grid gap-4 border-t border-line pt-4 md:grid-cols-[1fr_1.2fr]">
            <div>
              <div className="mb-1.5 text-sm font-medium">School or program you're applying to</div>
              {options.length ? (
                <select
                  className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                  value={programId ?? ""}
                  onChange={(e) => setProgram(college.id, e.target.value || null)}
                  data-testid="program"
                >
                  <option value="">Whole university / undecided</option>
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl border border-line bg-surface-2/60 px-3.5 py-2.5 text-sm text-muted">
                  {college.short} admits to the university as a whole{profile.intendedMajor ? `; your interest in ${profile.intendedMajor} is read for fit` : ""}.
                </div>
              )}
              {suggested && !saved && <p className="mt-1.5 text-xs text-brand">Picked from your intended major ({profile.intendedMajor}). Change it if you're applying elsewhere.</p>}
              {!profile.intendedMajor && options.length > 0 && (
                <p className="mt-1.5 text-xs text-muted">
                  Add your intended major in your <Link href="/profile" className="text-brand">profile</Link> and we'll pick the right school automatically.
                </p>
              )}
            </div>
            {target?.program && (
              <div className="rounded-xl border border-line bg-surface-2/60 p-3.5 text-xs leading-relaxed text-muted" data-testid="program-note">
                <div className="mb-1 font-semibold text-ink">
                  {target.program.name}: {(target.admitRate * 100).toFixed(target.admitRate < 0.1 ? 1 : 0)}% admit rate used
                  {target.program.requires?.length ? ` · requires ${target.program.requires.join(", ").toLowerCase()}` : ""}
                </div>
                {target.program.rateNote}{" "}
                {target.program.rateUrl && (
                  <a href={target.program.rateUrl} target="_blank" rel="noreferrer" className="text-brand">
                    Source
                  </a>
                )}
              </div>
            )}
          </div>
        )}
        {college && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-sm">
            <span className="font-semibold">{target?.name ?? college.name}</span>
            <Badge>{TIER_INFO[ev!.tier].label}</Badge>
            {college.source === "scorecard" && <Badge tone="brand">Live College Scorecard data</Badge>}
            <div className="ml-auto flex gap-2">
              <Button variant={dreamCollege === college.id ? "primary" : "secondary"} onClick={() => setDreamCollege(dreamCollege === college.id ? null : college.id)}>
                <Heart size={15} className={dreamCollege === college.id ? "fill-current" : ""} />
                {dreamCollege === college.id ? "Dream school" : "Set as dream school"}
              </Button>
              <Button
                variant="secondary"
                disabled={!!inTracker}
                onClick={() =>
                  setTracker((t) => [
                    ...t,
                    { collegeId: college.id, collegeName: college.name, plan, status: "Researching", deadline: guessDeadline(college, plan), checklist: {}, notes: "", addedAt: Date.now() },
                  ])
                }
              >
                <Plus size={15} /> {inTracker ? "In tracker" : "Add to tracker"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {loading && <div className="py-16 text-center text-muted">Loading college data…</div>}
      {!college && !loading && (
        <Empty icon={<GraduationCap size={22} />} title="Choose a college" body="Search any US college. Elite schools are read very differently from regional publics, and you'll see exactly how." />
      )}
      {ev && <CounselorReport ev={ev} profile={profile} />}
      {ev && (
        <p className="mt-4 text-xs text-muted">
          Chances are estimates from {target!.short}'s published admit rate, score ranges and priorities, calibrated on real admissions outcomes. Actual decisions also depend on recommendations, interviews and institutional needs no outside tool can see.
        </p>
      )}

      {/* Comparison */}
      <Card className="mt-8">
        <CardHeader
          title="Same file, different readers"
          subtitle="The same application, read by offices with very different standards. Add schools to build a balanced list."
          icon={<Columns3 size={16} />}
        />
        <div className="p-5">
          <CollegePicker onPick={(c) => setCompare((l) => (l.some((x) => x.id === c.id) ? l : [...l, c].slice(-8)))} placeholder="Add a college to compare…" className="mb-4 max-w-md" />
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="pb-2 font-medium">College</th>
                  <th className="pb-2 font-medium">Admit rate</th>
                  <th className="pb-2 font-medium">Your chance</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Academic</th>
                  <th className="pb-2 font-medium">Activities</th>
                  <th className="pb-2 font-medium">Overall</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {compare.map((c) => {
                  const e = evaluate(profile, collegeForProgram(c, programs), "RD");
                  const r = (k: string) => e.dimensions.find((d) => d.key === k)!;
                  return (
                    <tr key={c.id}>
                      <td className="py-2.5">
                        <Link href={`/evaluate?college=${c.id}`} className="font-medium hover:text-brand">
                          {c.short}
                        </Link>
                      </td>
                      <td className="tabular-nums text-muted">{(c.admitRate * 100).toFixed(c.admitRate < 0.1 ? 1 : 0)}%</td>
                      <td className="font-semibold tabular-nums">{fmtPct(e.chance)}</td>
                      <td>
                        <Badge tone={categoryTone(e.category)}>{e.category}</Badge>
                      </td>
                      <td className="tabular-nums">{r("academics").rating} · {r("academics").grade}</td>
                      <td className="tabular-nums">{r("extracurriculars").rating} · {r("extracurriculars").grade}</td>
                      <td className="tabular-nums">{e.overallRating} · {e.overallGrade}</td>
                      <td className="text-right">
                        <button onClick={() => setCompare((l) => l.filter((x) => x.id !== c.id))} className="rounded p-1 text-muted hover:text-ink" aria-label={`Remove ${c.short}`}>
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Evaluation />
    </Suspense>
  );
}
