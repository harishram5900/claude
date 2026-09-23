"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { spring } from "@/lib/motion";

const items = [
  { id: "about", label: "About" },
  { id: "ventures", label: "Ventures" },
  { id: "awards", label: "Awards" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

/** Tracks which section is in view so the nav can highlight it. */
function useActiveSection() {
  const [active, setActive] = useState("");
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    items.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);
  return active;
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection();
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-6">
      <nav
        aria-label="Primary"
        className={`mx-auto flex h-14 max-w-page items-center justify-between rounded-full border px-4 transition-all duration-500 sm:px-6 ${
          scrolled || open ? "border-line/10 bg-bg/70 shadow-lg backdrop-blur-xl" : "border-transparent"
        }`}
      >
        <a href="#top" className="flex items-center gap-2 font-display text-lg font-bold text-fg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-sm text-on-accent">
            H
          </span>
          <span className="hidden sm:inline">Harish R.</span>
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active === item.id ? "true" : undefined}
                className={`relative rounded-full px-4 py-2 text-sm transition-colors ${
                  active === item.id ? "text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {active === item.id && (
                  <motion.span layoutId="nav-active" className="absolute inset-0 rounded-full bg-accent/15" transition={spring} />
                )}
                <span className="relative">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="#contact"
            className="hidden rounded-full bg-accent px-5 py-2 text-sm font-semibold text-on-accent transition-transform hover:scale-[1.03] sm:inline-block"
          >
            Let&apos;s talk
          </a>
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span className={`absolute h-px w-5 bg-fg transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-1"}`} />
            <span className={`absolute h-px w-5 bg-fg transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-1"}`} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={spring}
            className="mx-auto mt-2 max-w-page rounded-3xl border border-line/10 bg-bg/95 p-4 backdrop-blur-xl lg:hidden"
          >
            <ul className="flex flex-col">
              {items.map((item, i) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline gap-4 border-b border-line/10 px-2 py-4 font-display text-2xl font-semibold text-fg"
                  >
                    <span className="font-sans text-xs text-accent">0{i + 1}</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
