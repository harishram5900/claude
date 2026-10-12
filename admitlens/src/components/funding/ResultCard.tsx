import { AlertTriangle, ArrowUpRight, CalendarClock, MapPin } from "lucide-react";
import { money, VEHICLE_LABEL, type Ranked } from "@/lib/grantscout";
import { Badge, Card, cx } from "../ui";

export function fmtDeadline(x: Ranked) {
  if (!x.deadline) return x.rec.cycle === "rolling" ? "Rolling" : "See sponsor";
  const d = new Date(`${x.deadline}T12:00:00`);
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}${x.deadlineEstimated ? " (est.)" : ""}`;
}

export function ResultCard({ x, rank }: { x: Ranked; rank?: number }) {
  const r = x.rec;
  const days = x.deadline ? Math.ceil((new Date(`${x.deadline}T12:00:00`).getTime() - Date.now()) / 86400000) : null;
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {rank != null && <span className="font-mono text-xs text-accent">#{rank}</span>}
          <Badge tone="brand">{VEHICLE_LABEL[r.vehicle]}</Badge>
          {r.unclaimed_signal && <Badge tone="good">Often under-claimed</Badge>}
          {r.user_added && <Badge>Added by you</Badge>}
        </div>
        <span className="font-mono text-[11px] text-muted" title="GrantScout priority score (0–100)">score {x.score}</span>
      </div>
      <a href={r.source_url} target="_blank" rel="noreferrer" className="group mt-2 flex items-start gap-1 font-display text-lg font-semibold leading-snug hover:text-brand">
        {r.name} <ArrowUpRight size={15} className="mt-1 shrink-0 text-muted group-hover:text-brand" />
      </a>
      <div className="text-xs text-muted">{r.sponsor}</div>
      <div className="mt-2 font-display text-lg font-semibold leading-snug text-good">{money(r)}</div>
      {r.description && <p className="mt-3 text-sm text-muted">{r.description}</p>}
      <p className="mt-2 text-xs"><span className="font-medium">Why it fits:</span> <span className="text-muted">{x.why}</span></p>
      {x.review.length > 0 && (
        <ul className="mt-3 space-y-1">
          {x.review.slice(0, 2).map((rv) => (
            <li key={rv} className="flex gap-1.5 text-xs text-warn"><AlertTriangle size={12} className="mt-0.5 shrink-0" />{rv}</li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-muted" style={{ marginTop: "auto" }}>
        <span className={cx("flex items-center gap-1", days != null && days >= 0 && days <= 21 && "font-medium text-bad")}><CalendarClock size={12} /> {fmtDeadline(x)}</span>
        <span title="Estimated chance of winning, from applicant-pool size and how narrow the eligibility is">~{(x.winProb * 100).toFixed(x.winProb < 0.01 ? 1 : 0)}% odds</span>
        <span title="Award size × estimated odds">EV ${x.expectedValue.toLocaleString()}</span>
        {r.host_location && <span className="flex items-center gap-1"><MapPin size={12} />{r.host_location}</span>}
      </div>
    </Card>
  );
}
