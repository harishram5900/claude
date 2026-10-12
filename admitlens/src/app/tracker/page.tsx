"use client";
import { AlarmClock, ClipboardList, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { CollegePicker } from "@/components/CollegePicker";
import { ListBuilder } from "@/components/ListBuilder";
import { Badge, Card, categoryTone, cx, Empty, fmtPct, inputCls, PageHeader, Progress } from "@/components/ui";
import { getCollege, type College } from "@/data/colleges";
import { evaluate } from "@/lib/engine";
import { useStore } from "@/lib/store";
import type { AppPlan, TrackerEntry, TrackerStatus } from "@/lib/types";
import { useCollege } from "@/lib/useCollege";
import { guessDeadline } from "@/lib/deadline";

const STATUSES: TrackerStatus[] = ["Researching", "Applying", "Submitted", "Admitted", "Waitlisted", "Denied", "Committed"];
const CHECKLIST = ["Common App essay", "Supplements", "Activities list", "Teacher recs requested", "Counselor rec / transcript", "Test scores sent", "FAFSA", "CSS Profile", "Application fee / waiver", "Portal set up"];
const statusTone: Record<TrackerStatus, "neutral" | "brand" | "good" | "warn" | "bad"> = {
  Researching: "neutral",
  Applying: "brand",
  Submitted: "brand",
  Admitted: "good",
  Waitlisted: "warn",
  Denied: "bad",
  Committed: "good",
};

function Row({ e, onChange, onRemove }: { e: TrackerEntry; onChange: (e: TrackerEntry) => void; onRemove: () => void }) {
  const { profile } = useStore();
  const { college } = useCollege(e.collegeId);
  const ev = college ? evaluate(profile, college, e.plan) : null;
  const done = CHECKLIST.filter((k) => e.checklist[k]).length;
  const days = e.deadline ? Math.ceil((new Date(e.deadline).getTime() - Date.now()) / 86400000) : null;
  const plans: AppPlan[] = college ? (["RD", college.plans.ed && "ED", college.plans.ed2 && "ED2", college.plans.rea && "REA", college.plans.ea && "EA"].filter(Boolean) as AppPlan[]) : ["RD"];
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/colleges/${e.collegeId}`} className="font-semibold hover:text-brand">{e.collegeName}</Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone={statusTone[e.status]}>{e.status}</Badge>
            {ev && <Badge tone={categoryTone(ev.category)}>{ev.category} · {fmtPct(ev.chance)}</Badge>}
            {days !== null && days >= 0 && e.status !== "Submitted" && (
              <Badge tone={days <= 14 ? "bad" : days <= 45 ? "warn" : "neutral"}>
                <AlarmClock size={12} /> {days === 0 ? "Due today" : `${days} days left`}
              </Badge>
            )}
          </div>
        </div>
        <button onClick={onRemove} className="rounded-lg p-1.5 text-muted hover:bg-bad-soft hover:text-bad" aria-label="Remove">
          <Trash2 size={15} />
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <select className={inputCls} value={e.status} onChange={(x) => onChange({ ...e, status: x.target.value as TrackerStatus })}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          className={inputCls}
          value={e.plan}
          onChange={(x) => {
            const plan = x.target.value as AppPlan;
            onChange({ ...e, plan, deadline: college ? guessDeadline(college, plan) || e.deadline : e.deadline });
          }}
        >
          {plans.map((p) => <option key={p} value={p}>{p === "RD" ? "Regular Decision" : p}</option>)}
        </select>
        <input type="date" className={inputCls} value={e.deadline} onChange={(x) => onChange({ ...e, deadline: x.target.value })} />
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span>Checklist</span>
          <span>{done}/{CHECKLIST.length}</span>
        </div>
        <Progress value={(done / CHECKLIST.length) * 100} tone={done === CHECKLIST.length ? "good" : "brand"} className="mb-3 h-1.5" />
        <div className="flex flex-wrap gap-1.5">
          {CHECKLIST.map((k) => (
            <button key={k} onClick={() => onChange({ ...e, checklist: { ...e.checklist, [k]: !e.checklist[k] } })} className={cx("rounded-full border px-2.5 py-1 text-xs transition", e.checklist[k] ? "border-transparent bg-good-soft text-good line-through" : "border-line hover:bg-surface-2")}>
              {k}
            </button>
          ))}
        </div>
      </div>
      <textarea className={cx(inputCls, "mt-3 min-h-16 text-sm")} placeholder="Notes: interview date, portal login, who's writing recs…" value={e.notes} onChange={(x) => onChange({ ...e, notes: x.target.value })} />
    </Card>
  );
}

export default function TrackerPage() {
  const { tracker, setTracker, ready, profile } = useStore();
  if (!ready) return null;
  const counts = STATUSES.map((s) => [s, tracker.filter((t) => t.status === s).length] as const).filter(([, n]) => n > 0);
  const add = (c: College) => {
    if (tracker.some((t) => t.collegeId === c.id)) return;
    setTracker((t) => [...t, { collegeId: c.id, collegeName: c.name, plan: "RD", status: "Researching", deadline: guessDeadline(c, "RD"), checklist: {}, notes: "", addedAt: Date.now() }]);
  };
  const sorted = [...tracker].sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));
  const mix = tracker.map((t) => getCollege(t.collegeId)).filter(Boolean).map((c) => evaluate(profile, c!).category);
  const reaches = mix.filter((m) => m === "Reach" || m === "High reach").length;
  const safeties = mix.filter((m) => m === "Safety" || m === "Likely").length;

  return (
    <div className="rise">
      <PageHeader eyebrow="Stay on top of it" title="College tracker" subtitle="Every school, deadline and requirement in one place. Deadlines fill in automatically from each college's published dates." />
      <Card className="mb-6 p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <CollegePicker onPick={add} placeholder="Add a college to your list…" />
          <div className="flex flex-wrap gap-2">
            {counts.map(([s, n]) => <Badge key={s} tone={statusTone[s]}>{s}: {n}</Badge>)}
          </div>
        </div>
        {tracker.length >= 3 && (
          <p className="mt-3 text-sm text-muted">
            List balance: <b className="text-ink">{reaches}</b> reaches, <b className="text-ink">{mix.length - reaches - safeties}</b> targets, <b className="text-ink">{safeties}</b> likely/safety.{" "}
            {safeties < 2 ? "Counselors recommend at least 2 schools where you're likely to be admitted and could afford to attend." : reaches > mix.length * 0.6 ? "Your list is reach-heavy. Add targets." : "Healthy mix."}
          </p>
        )}
      </Card>
      <div className="mb-8">
        <ListBuilder />
      </div>
      {tracker.length === 0 ? (
        <Empty icon={<ClipboardList size={22} />} title="Your list is empty" body="Add colleges above, or from any college page or the simulator." action={<Link href="/colleges" className="text-sm font-medium text-brand"><Plus size={14} className="inline" /> Browse colleges</Link>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sorted.map((e) => (
            <Row key={e.collegeId} e={e} onChange={(n) => setTracker((l) => l.map((x) => (x.collegeId === n.collegeId ? n : x)))} onRemove={() => setTracker((l) => l.filter((x) => x.collegeId !== e.collegeId))} />
          ))}
        </div>
      )}
    </div>
  );
}
