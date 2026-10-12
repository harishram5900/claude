"use client";
import { Check, Compass, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { guessDeadline } from "@/lib/deadline";
import { buildList, type Suggestion } from "@/lib/listbuilder";
import { useStore } from "@/lib/store";
import { Badge, Card, CardHeader, cx, fmtPct } from "./ui";

const BUCKETS: { key: "reach" | "target" | "likely"; label: string; note: string; tone: "warn" | "brand" | "good" }[] = [
  { key: "reach", label: "Reach", note: "Worth a shot. Admission is uncertain for anyone.", tone: "warn" },
  { key: "target", label: "Target", note: "Your profile sits near the middle of admits.", tone: "brand" },
  { key: "likely", label: "Likely", note: "Strong odds. Pick one you'd happily attend and can afford.", tone: "good" },
];

export function ListBuilder() {
  const { profile, tracker, setTracker, profileComplete } = useStore();
  const list = useMemo(() => buildList(profile), [profile]);
  const tracked = new Set(tracker.map((t) => t.collegeId));

  const add = (s: Suggestion) =>
    setTracker((t) =>
      t.some((x) => x.collegeId === s.college.id)
        ? t
        : [...t, { collegeId: s.college.id, collegeName: s.college.name, plan: "RD", status: "Researching", deadline: guessDeadline(s.college, "RD"), checklist: {}, notes: "", addedAt: Date.now() }],
    );

  if (profileComplete < 30)
    return (
      <Card className="p-5 text-sm text-muted">
        <Compass size={18} className="mb-2 text-brand" />
        Complete at least a third of your <Link href="/profile" className="font-medium text-brand">profile</Link> to get a recommended college list.
      </Card>
    );

  return (
    <Card>
      <CardHeader
        title="Recommended list for you"
        subtitle="Built from your simulated chances at every profiled college. Prioritizes programs related to your major and affordable in-state options."
        icon={<Compass size={16} />}
      />
      <div className="grid gap-px bg-line md:grid-cols-3">
        {BUCKETS.map((b) => (
          <div key={b.key} className="bg-surface p-5">
            <div className="flex items-center gap-2">
              <Badge tone={b.tone}>{b.label}</Badge>
              <span className="text-xs text-muted">{list[b.key].length} suggestions</span>
            </div>
            <p className="mt-2 text-xs text-muted">{b.note}</p>
            <ul className="mt-4 space-y-3">
              {list[b.key].length === 0 && <li className="text-sm text-muted">None in this range yet. Strengthen your profile or use live search.</li>}
              {list[b.key].map((s) => {
                const on = tracked.has(s.college.id);
                return (
                  <li key={s.college.id} className="flex items-start gap-3">
                    <button
                      onClick={() => add(s)}
                      disabled={on}
                      aria-label={on ? `${s.college.short} is in your tracker` : `Add ${s.college.short} to tracker`}
                      className={cx("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border transition", on ? "border-transparent bg-good-soft text-good" : "border-line hover:border-brand hover:text-brand")}
                    >
                      {on ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <Link href={`/colleges/${s.college.id}`} className="truncate font-medium hover:text-brand">
                          {s.college.short}
                        </Link>
                        <span className="shrink-0 font-mono text-xs tabular-nums">{fmtPct(s.chance)}</span>
                      </div>
                      {s.reasons[0] && <div className="truncate text-xs text-muted">{s.reasons.slice(0, 2).join(" · ")}</div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
