"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { LandingData } from "@/lib/landing";
import { cx } from "../ui";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const tone = (c: number) => (c >= 0.6 ? "bg-good-soft text-good" : c >= 0.25 ? "bg-brand-soft text-brand" : "bg-warn-soft text-warn");

/** One application, read by several admissions offices. */
export function ReadersCarousel({ readers }: { readers: LandingData["readers"] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => setPos(el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth));
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);
  const go = (dir: number) => {
    const el = ref.current;
    const card = el?.firstElementChild as HTMLElement | null;
    el?.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + 16), behavior: "smooth" });
  };
  return (
    <div>
      <div ref={ref} className="lp-noscroll flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {readers.map((r) => (
          <Link key={r.id} href={`/colleges/${r.id}`} className="paper group w-[86%] max-w-[380px] shrink-0 snap-start rounded-3xl border border-line p-6 shadow-card transition hover:border-brand sm:w-[360px]">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-2xl font-semibold tracking-tight">{r.short}</h3>
              <span className="font-mono text-[11px] text-muted">{pct(r.admitRate)} admit</span>
            </div>
            <div className="mt-1 text-xs text-muted">
              {r.tier} · SAT {r.sat[0]}–{r.sat[1]}
            </div>
            <div className="rule my-5" />
            <p className="font-display text-[17px] italic leading-snug">“{r.stance}”</p>
            <div className="mt-6 flex items-end justify-between gap-3">
              <div className="text-xs text-muted">{r.decision}</div>
              <span className={cx("rounded-xl px-3 py-1.5 font-display text-2xl font-semibold tabular-nums", tone(r.chance))}>{pct(r.chance)}</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-center gap-5">
        <button onClick={() => go(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-muted transition hover:text-ink" aria-label="Previous college">
          <ChevronLeft size={18} />
        </button>
        <div className="relative h-1 w-40 overflow-hidden rounded-full bg-line sm:w-56">
          <span className="absolute inset-y-0 w-1/3 rounded-full bg-brand transition-[left] duration-200" style={{ left: `${pos * 66.6}%` }} />
        </div>
        <button onClick={() => go(1)} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-muted transition hover:text-ink" aria-label="Next college">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
