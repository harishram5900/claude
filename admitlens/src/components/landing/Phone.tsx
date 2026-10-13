import { cx } from "../ui";

/** A phone frame showing an AdmitLens screen. The parent crops it (overflow-hidden). */
export function Phone({ children, tone = "paper", className }: { children: React.ReactNode; tone?: "paper" | "ivy"; className?: string }) {
  return (
    <div className={cx("relative w-[272px] shrink-0 rounded-[2.6rem] border border-line bg-[#191d1b] p-[7px] shadow-[0_40px_70px_-34px_rgba(25,29,27,0.55)]", className)}>
      <div className={cx("relative h-[560px] overflow-hidden rounded-[2.2rem]", tone === "paper" ? "lp-screen-paper" : "lp-screen-ivy")}>
        <div className="flex items-center justify-between px-7 pt-3.5 text-[12px] font-semibold">
          <span>9:41</span>
          <span className="absolute left-1/2 top-2.5 h-[24px] w-[86px] -translate-x-1/2 rounded-full bg-[#191d1b]" />
          <span className="flex items-center gap-1 opacity-80">
            <svg width="16" height="10" viewBox="0 0 17 11" fill="currentColor" aria-hidden><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
            <svg width="22" height="10" viewBox="0 0 24 11" aria-hidden><rect x="0.5" y="0.5" width="20" height="10" rx="3" fill="none" stroke="currentColor" opacity=".5" /><rect x="2" y="2" width="14" height="7" rx="1.6" fill="currentColor" /></svg>
          </span>
        </div>
        <div className="px-5 pt-4">{children}</div>
      </div>
    </div>
  );
}

/** Screen header in the app's own style: logo mark row + page eyebrow. */
export function ScreenHead({ eyebrow, title, onIvy = false }: { eyebrow: string; title: string; onIvy?: boolean }) {
  return (
    <div>
      <div className={cx("text-[10px] font-semibold uppercase tracking-[0.16em]", onIvy ? "text-[#e0b65a]" : "text-brand")}>{eyebrow}</div>
      <div className="font-display mt-1 text-[24px] font-semibold leading-tight tracking-tight">{title}</div>
    </div>
  );
}

/** Progress ring that fills when its section scrolls into view (same look as the in-app gauge). */
export function Ring({ value, label, sub, size = 150, onIvy = false }: { value: number; label: string; sub?: string; size?: number; onIvy?: boolean }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={onIvy ? "#e0b65a" : "var(--brand)"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          className="lp-ring [stroke-dashoffset:var(--off)] [.reveal:not(.in)_&]:[stroke-dashoffset:var(--c)]"
          style={{ ["--off" as string]: String(c * (1 - Math.max(0, Math.min(1, value)))), ["--c" as string]: String(c) }}
        />
      </svg>
      <div className="text-center">
        <div className="font-display font-semibold leading-none tabular-nums" style={{ fontSize: size * 0.24 }}>{label}</div>
        {sub && <div className="mt-1 text-[10.5px] opacity-60">{sub}</div>}
      </div>
    </div>
  );
}
