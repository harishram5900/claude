"use client";
import { BookOpenCheck, Building2, Library, ClipboardList, Gauge, GraduationCap, Map, Menu, PenLine, Trophy, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { cx } from "./ui";

export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/simulate", label: "Simulator", icon: GraduationCap },
  { href: "/colleges", label: "Colleges", icon: Building2 },
  { href: "/essays", label: "Essay Lab", icon: PenLine },
  { href: "/scholarships", label: "Funding", icon: Trophy },
  { href: "/tracker", label: "Tracker", icon: ClipboardList },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/learn", label: "Learn", icon: Library },
];

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { profileComplete, ready } = useStore();
  useEffect(() => setOpen(false), [path]);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="AdmitLens home" className="shrink-0">
          <Logo />
        </Link>
        <nav className="ml-6 hidden items-center gap-0.5 xl:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cx("relative rounded-full px-3 py-1.5 text-sm transition", path.startsWith(n.href) ? "bg-brand-soft font-medium text-brand" : "text-muted hover:text-ink")}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/profile" className={cx("hidden items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm transition hover:bg-surface-2 sm:flex", path === "/profile" && "border-brand")}>
            <User size={15} />
            <span>Profile</span>
            {ready && (
              <span className={cx("rounded-full px-1.5 text-xs tabular-nums", profileComplete >= 80 ? "bg-good-soft text-good" : "bg-warn-soft text-warn")}>{profileComplete}%</span>
            )}
          </Link>
          <ThemeToggle />
          <button className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface xl:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-line bg-bg px-4 py-3 xl:hidden">
          <div className="grid grid-cols-2 gap-2">
            {[...NAV, { href: "/profile", label: "Profile", icon: User }, { href: "/about", label: "How it works", icon: BookOpenCheck }].map((n) => (
              <Link key={n.href} href={n.href} className={cx("flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm", path.startsWith(n.href) ? "border-brand bg-brand-soft text-brand" : "bg-surface")}>
                <n.icon size={16} /> {n.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
