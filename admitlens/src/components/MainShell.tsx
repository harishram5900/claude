"use client";
import { usePathname } from "next/navigation";

/** The landing page is full-bleed; every other page sits in the standard container. */
export function MainShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/") return <main>{children}</main>;
  return <main className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 sm:pt-10">{children}</main>;
}
