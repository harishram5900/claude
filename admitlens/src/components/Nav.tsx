"use client";
import { BookOpenCheck, Building2, Check, ClipboardList, CloudOff, Gauge, GraduationCap, Library, Loader2, LogOut, Map, Menu, PenLine, Trophy, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { cx } from "./ui";

export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/evaluate", label: "Evaluation", icon: GraduationCap },
  { href: "/scholarships", label: "Scholarships", icon: Trophy },
  { href: "/essays", label: "Essays", icon: PenLine },
  { href: "/colleges", label: "Colleges", icon: Building2 },
  { href: "/tracker", label: "Tracker", icon: ClipboardList },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/learn", label: "Learn", icon: Library },
];

function SaveDot() {
  const { saveState } = useStore();
  if (saveState === "saving") return <span className="flex items-center gap-1 text-xs text-muted"><Loader2 size={12} className="animate-spin" /> Saving</span>;
  if (saveState === "saved") return <span className="flex items-center gap-1 text-xs text-good"><Check size={12} /> Saved</span>;
  if (saveState === "error") return <span className="flex items-center gap-1 text-xs text-warn" title="Couldn't reach the server. Changes are kept on this device and will save on your next edit."><CloudOff size={12} /> Not saved</span>;
  return null;
}

function AccountMenu() {
  const { user, profile, profileComplete, signOut } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  if (!user) return null;
  const name = profile.name || user.name || user.email;
  const initials = name.split(/[\s@]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-sm transition hover:bg-surface-2" aria-label="Account menu" aria-expanded={open} data-testid="account-menu">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-semibold text-[var(--surface)]">{initials || <User size={14} />}</span>
        <span className="hidden max-w-28 truncate sm:inline">{name.split(" ")[0]}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div className="border-b border-line px-4 py-3">
            <div className="truncate text-sm font-medium">{name}</div>
            <div className="truncate text-xs text-muted">{user.email}</div>
            <div className="mt-1.5"><SaveDot /></div>
          </div>
          <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-surface-2">
            <span className="flex items-center gap-2"><User size={15} /> My profile</span>
            <span className={cx("rounded-full px-1.5 text-xs tabular-nums", profileComplete >= 80 ? "bg-good-soft text-good" : "bg-warn-soft text-warn")}>{profileComplete}%</span>
          </Link>
          <button
            onClick={async () => {
              setOpen(false);
              await signOut();
              router.push("/");
            }}
            className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-left text-sm hover:bg-surface-2"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { ready, user, accountsAvailable } = useStore();
  useEffect(() => setOpen(false), [path]);
  if (path === "/start") {
    return (
      <header className="border-b border-line bg-bg/80 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
          <Link href="/" aria-label="AdmitLens home"><Logo /></Link>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
      </header>
    );
  }
  const links = user || (ready && !accountsAvailable) ? NAV : NAV.filter((n) => ["/colleges", "/learn"].includes(n.href));
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href={user ? "/dashboard" : "/"} aria-label="AdmitLens home" className="shrink-0">
          <Logo />
        </Link>
        <nav className="ml-6 hidden items-center gap-0.5 xl:flex">
          {links.map((n) => (
            <Link key={n.href} href={n.href} className={cx("relative rounded-full px-3 py-1.5 text-sm transition", path.startsWith(n.href) ? "bg-brand-soft font-medium text-brand" : "text-muted hover:text-ink")}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {ready && !user && (
            <>
              {accountsAvailable && <Link href="/signin" className="hidden rounded-full px-3 py-1.5 text-sm text-muted hover:text-ink sm:block">Sign in</Link>}
              <Link href="/start" className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-[var(--surface)] hover:brightness-110">Get started</Link>
            </>
          )}
          <AccountMenu />
          <ThemeToggle />
          <button className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface xl:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-line bg-bg px-4 py-3 xl:hidden">
          <div className="grid grid-cols-2 gap-2">
            {[...links, ...(user ? [{ href: "/profile", label: "Profile", icon: User }] : [{ href: "/signin", label: "Sign in", icon: User }]), { href: "/about", label: "How it works", icon: BookOpenCheck }].map((n) => (
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
