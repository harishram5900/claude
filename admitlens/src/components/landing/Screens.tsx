import type { LandingData } from "@/lib/landing";
import { cx } from "../ui";
import { Ring, ScreenHead } from "./Phone";

const pct = (x: number) => (x < 0.01 ? "<1%" : `${Math.round(x * 100)}%`);
const date = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
// Same rating colors as the in-app report.
const tile = (r: number) => (r <= 2 ? "bg-good-soft text-good" : r === 3 ? "bg-brand-soft text-brand" : r === 4 ? "bg-warn-soft text-warn" : "bg-bad-soft text-bad");

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("rounded-2xl border border-line bg-surface p-3.5 shadow-card", className)}>{children}</div>;
}

export function EvalScreen({ d }: { d: LandingData }) {
  return (
    <>
      <ScreenHead eyebrow={`Evaluation · ${d.mich.short}`} title="Strong consideration" />
      <div className="mt-3">
        <Ring value={d.mich.chance} label={pct(d.mich.chance)} sub="estimated chance" size={140} />
      </div>
      <Panel className="mt-3">
        <div className="mb-1.5 flex justify-between text-[10.5px] text-muted">
          <span>Ratings by category</span>
          <span>1 = exceptional</span>
        </div>
        {d.mich.dims.map((x) => (
          <div key={x.label} className="flex items-center gap-2.5 py-[4px] text-[12.5px]">
            <span className={cx("grid h-6 w-6 shrink-0 place-items-center rounded-md font-display text-[13px] font-semibold", tile(x.rating))}>{x.rating}</span>
            <span>{x.label}</span>
          </div>
        ))}
      </Panel>
    </>
  );
}

export function ImportScreen() {
  const items = ["Grades and test scores", "Activities, roles and hours", "Honors and their levels", "Your personal essay", "Page numbers and watermark removed"];
  return (
    <>
      <ScreenHead eyebrow="Common App import" title="Reading your PDF" onIvy />
      <div className="relative mx-auto mt-6 h-40 w-36 overflow-hidden rounded-xl border border-white/20 bg-white/[0.06] p-3" aria-hidden>
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="mb-2 h-[5px] rounded-full bg-white/25" style={{ width: `${55 + ((i * 29) % 45)}%` }} />
        ))}
        <div className="lp-scan absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-[#e0b65a]/35 to-transparent" />
      </div>
      <ul className="mt-6 space-y-2.5 text-[12.5px]">
        {items.map((t, i) => (
          <li key={t} className="lp-tick flex items-center gap-2.5" style={{ animationDelay: `${0.3 + i * 0.4}s` }}>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#e0b65a] text-[10px] font-bold text-[#1d3b31]">✓</span>
            {t}
          </li>
        ))}
      </ul>
    </>
  );
}

export function NoteScreen({ d }: { d: LandingData }) {
  return (
    <>
      <ScreenHead eyebrow="Essay · draft 1" title={`Graded ${d.draft1.grade}`} />
      <div className="mt-3">
        <Ring value={d.draft1.score / 100} label={String(d.draft1.score)} sub="out of 100" size={130} />
      </div>
      <Panel className="mt-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">First thing to fix</div>
        <p className="font-display mt-1 text-[15.5px] leading-snug">{d.firstImprovement?.detail ?? "Replace clichés with one specific scene."}</p>
      </Panel>
      {d.draft1.issue && (
        <Panel className="mt-2.5 text-[12px]">
          <span className="rounded bg-bad-soft px-1 text-bad line-through">{d.draft1.issue.excerpt}</span>
          <span className="text-muted"> appears in thousands of essays each season.</span>
        </Panel>
      )}
    </>
  );
}

export function RetryScreen({ d }: { d: LandingData }) {
  const rows: [string, string, string][] = [
    ["Essay score", String(d.draft1.score), String(d.draft2.score)],
    ["Voice", String(d.draft1.voice), String(d.draft2.voice)],
    ["Specificity", String(d.draft1.specificity), String(d.draft2.specificity)],
    [`${d.mich.short} odds`, pct(d.mich.before), pct(d.mich.chance)],
  ];
  return (
    <>
      <ScreenHead eyebrow="Essay Lab" title="Draft 2 vs. draft 1" />
      <Panel className="mt-4 p-0">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-line px-3.5 py-2 text-[10.5px] text-muted">
          <span />
          <span>Draft 1</span>
          <span className="text-brand">Draft 2</span>
        </div>
        {rows.map(([l, a, b]) => (
          <div key={l} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-line px-3.5 py-2.5 text-[12.5px] last:border-0">
            <span>{l}</span>
            <span className="w-10 text-right tabular-nums text-muted line-through">{a}</span>
            <span className="w-10 text-right font-semibold tabular-nums text-good">{b}</span>
          </div>
        ))}
      </Panel>
      <div className="mt-3 rounded-xl border border-good/30 bg-good-soft px-3 py-2.5 text-[12px] text-good">
        +{Math.round((d.mich.chance - d.mich.before) * 100)} points at {d.mich.short} from the essay alone.
      </div>
      <div className="mt-3 rounded-full bg-brand py-2.5 text-center text-[12.5px] font-medium text-[var(--surface)]">Update my evaluation</div>
    </>
  );
}

export function ScholarshipScreen({ d }: { d: LandingData }) {
  return (
    <>
      <ScreenHead eyebrow="Scholarships" title={`${d.scholarshipCount} you qualify for`} />
      <div className="mt-1 text-[11.5px] text-muted">Matched to grades, state and status.</div>
      <div className="mt-4 space-y-2.5">
        {d.scholarships.map((s) => (
          <Panel key={s.name}>
            <div className="text-[12.5px] font-semibold leading-snug">{s.name}</div>
            <div className="mt-1 flex justify-between text-[11.5px]">
              <span className="text-good">{s.amount}</span>
              {s.deadline && <span className="text-muted">Due {date(s.deadline)}</span>}
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}

export function RoadmapScreen({ d }: { d: LandingData }) {
  return (
    <>
      <ScreenHead eyebrow={`Roadmap · toward ${d.mich.short}`} title="10th grade plan" onIvy />
      <ol className="mt-5 space-y-3.5 border-l border-white/25 pl-4">
        {d.roadmap.map((m, i) => (
          <li key={m.title} className="relative text-[12.5px]">
            <span className={cx("absolute -left-[21.5px] top-1 h-2.5 w-2.5 rounded-full", i === 0 ? "bg-[#e0b65a]" : "border border-white/50 bg-[#1d5a46]")} />
            <div className="text-[10px] uppercase tracking-wider opacity-60">
              {m.phase}
              {m.priority && " · priority"}
            </div>
            <div className="leading-snug">{m.title}</div>
          </li>
        ))}
      </ol>
    </>
  );
}
