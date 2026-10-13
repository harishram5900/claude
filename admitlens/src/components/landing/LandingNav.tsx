"use client";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Logo } from "../Logo";
import { ThemeToggle } from "../ThemeToggle";
import { cx } from "../ui";

const LINKS: [string, string][] = [
  ["How it works", "#how"],
  ["For every grade", "#grades"],
  ["Privacy", "#privacy"],
  ["Colleges", "/colleges"],
  ["FAQ", "#faq"],
];

/** Floating nav for the landing page; gains a shadow once the page scrolls. */
export function LandingNav() {
  const { ready, user } = useStore();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const cta = ready && user ? { href: "/dashboard", label: "Dashboard" } : { href: "/start", label: "Get started" };
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-6 print:hidden">
      <nav className={cx("pointer-events-auto mx-auto flex max-w-6xl items-center gap-2 rounded-full border border-line bg-surface/85 py-1.5 pl-4 pr-1.5 backdrop-blur-xl transition-shadow", scrolled && "shadow-card")}>
        <Link href="/" aria-label="AdmitLens home">
          <Logo />
        </Link>
        <div className="ml-6 hidden items-center gap-0.5 lg:flex">
          {LINKS.map(([l, h]) => (
            <a key={h} href={h} className="rounded-full px-3 py-1.5 text-sm text-muted transition hover:text-ink">
              {l}
            </a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {ready && !user && (
            <Link href="/signin" className="hidden rounded-full px-3 py-2 text-sm text-muted hover:text-ink sm:block">
              Sign in
            </Link>
          )}
          <span className="hidden sm:block">
            <ThemeToggle />
          </span>
          <Link href={cta.href} className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-[var(--surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition hover:brightness-110 sm:px-5 sm:py-2.5">
            {cta.label}
          </Link>
          <button onClick={() => setOpen((o) => !o)} className="grid h-10 w-10 place-items-center rounded-full text-ink lg:hidden" aria-label="Menu" aria-expanded={open}>
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="pointer-events-auto mx-auto mt-2 max-w-6xl overflow-hidden rounded-3xl border border-line bg-surface/95 p-2 shadow-card backdrop-blur-xl lg:hidden">
          {[...LINKS, ["Learn from real admits", "/learn"] as [string, string], ...(user ? [] : [["Sign in", "/signin"] as [string, string]])].map(([l, h]) => (
            <a key={h} href={h} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] hover:bg-surface-2">
              {l} <ArrowRight size={15} className="text-muted" />
            </a>
          ))}
          <div className="flex items-center justify-between px-4 py-2 text-sm text-muted">
            Theme <ThemeToggle />
          </div>
        </div>
      )}
    </div>
  );
}
