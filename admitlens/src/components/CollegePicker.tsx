"use client";
import { Globe2, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { COLLEGES, type College } from "@/data/colleges";
import { rememberCollege } from "@/lib/useCollege";
import { cx, inputCls } from "./ui";

export function searchLocal(q: string, limit = 8) {
  const s = q.trim().toLowerCase();
  if (!s) return COLLEGES.slice(0, limit);
  return COLLEGES.map((c) => {
    const hay = `${c.name} ${c.short} ${c.city} ${c.state}`.toLowerCase();
    const score = c.short.toLowerCase().startsWith(s) ? 3 : c.name.toLowerCase().includes(s) ? 2 : hay.includes(s) ? 1 : 0;
    return { c, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.c.admitRate - b.c.admitRate)
    .slice(0, limit)
    .map((x) => x.c);
}

export function CollegePicker({ onPick, placeholder = "Search any US college…", autoFocus, className }: { onPick: (c: College) => void; placeholder?: string; autoFocus?: boolean; className?: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [live, setLive] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const local = useMemo(() => searchLocal(q), [q]);

  useEffect(() => {
    if (q.trim().length < 3) return setLive([]);
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/scorecard?q=${encodeURIComponent(q.trim())}`)
        .then((r) => r.json())
        .then((d) => {
          const names = new Set(local.map((c) => c.name.toLowerCase()));
          setLive(((d.results ?? []) as College[]).filter((c) => !names.has(c.name.toLowerCase())).slice(0, 8));
        })
        .catch(() => setLive([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [q, local]);

  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const all = [...local, ...live];
  const choose = (c: College) => {
    rememberCollege(c);
    onPick(c);
    setQ("");
    setOpen(false);
  };

  return (
    <div ref={ref} className={cx("relative", className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        autoFocus={autoFocus}
        className={cx(inputCls, "py-2.5 pl-9")}
        placeholder={placeholder}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, all.length - 1));
          if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
          if (e.key === "Enter" && all[active]) choose(all[active]);
          if (e.key === "Escape") setOpen(false);
        }}
        role="combobox"
        aria-expanded={open}
      />
      {open && (
        <div className="scroll-thin absolute z-30 mt-2 max-h-96 w-full overflow-auto rounded-xl border border-line bg-surface p-1 shadow-card">
          {all.length === 0 && !loading && <div className="px-3 py-6 text-center text-sm text-muted">No matches yet. Keep typing to search every US college.</div>}
          {all.map((c, i) => (
            <button
              key={c.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(c)}
              className={cx("flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm", i === active && "bg-surface-2")}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{c.name}</span>
                <span className="block text-xs text-muted">
                  {c.city}, {c.state} · {c.control}
                  {c.source === "scorecard" && " · live data"}
                </span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted">{(c.admitRate * 100).toFixed(c.admitRate < 0.1 ? 1 : 0)}% admit</span>
            </button>
          ))}
          {(loading || live.length > 0) && (
            <div className="flex items-center gap-2 border-t border-line px-3 py-2 text-xs text-muted">
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Globe2 size={12} />}
              {loading ? "Searching all US colleges (College Scorecard)…" : "Includes live results from the U.S. Dept. of Education College Scorecard"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
