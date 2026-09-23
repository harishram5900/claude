"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useState, type ReactNode } from "react";

/** Accessible tab group (arrow keys move between tabs) with an animated pill. */
export function Tabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(0);
  const base = useId();

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = (active + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setActive(next);
    document.getElementById(`${base}-tab-${next}`)?.focus();
  };

  return (
    <div>
      <div role="tablist" onKeyDown={onKey} className="inline-flex flex-wrap gap-1 rounded-full border border-line/10 bg-surface p-1">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            id={`${base}-tab-${i}`}
            role="tab"
            type="button"
            aria-selected={active === i}
            aria-controls={`${base}-panel-${i}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            className={`relative rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              active === i ? "text-on-accent" : "text-muted hover:text-fg"
            }`}
          >
            {active === i && (
              <motion.span
                layoutId={`${base}-pill`}
                className="absolute inset-0 rounded-full bg-accent"
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          id={`${base}-panel-${active}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${active}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mt-10"
        >
          {tabs[active].content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
