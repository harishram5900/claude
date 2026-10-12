import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { Nav } from "@/components/Nav";
import { themeScript } from "@/components/ThemeToggle";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "AdmitLens: see your application the way admissions does", template: "%s · AdmitLens" },
  description:
    "Simulate how admissions officers at the college you choose would read your application. Calibrated chances, counselor-style critique, essay coaching, scholarships, a college tracker and a roadmap to your dream school.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f0d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,400..700,30;1,9..144,400..700,30&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen">
        <StoreProvider>
          <Nav />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
          <footer className="mt-16 border-t border-line print:hidden">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
              <div>
                <div className="flex items-center gap-2">
                  <LogoMark size={26} />
                  <span className="font-display text-lg font-semibold">AdmitLens</span>
                </div>
                <p className="mt-3 max-w-xs text-sm text-muted">
                  A simulation of how admissions offices read applications, built on published college data. Not affiliated with any college or with Common App.
                </p>
              </div>
              {[
                ["Plan", [["Simulator", "/simulate"], ["Roadmap", "/roadmap"], ["Tracker", "/tracker"]]],
                ["Write & fund", [["Essay Lab", "/essays"], ["GrantScout funding", "/scholarships"], ["Learn from real admits", "/learn"]]],
                ["About", [["How it works", "/about"], ["Your data & privacy", "/about#privacy"], ["Colleges", "/colleges"]]],
              ].map(([h, links]) => (
                <div key={h as string}>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{h as string}</div>
                  <ul className="mt-3 space-y-2 text-sm">
                    {(links as string[][]).map(([l, href]) => (
                      <li key={href}>
                        <Link href={href} className="hover:text-brand">{l}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-line">
              <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-muted sm:px-6">
                Data: U.S. Department of Education College Scorecard, college Common Data Sets and admissions office reports. Figures change every cycle. Confirm on each college's official site.
              </div>
            </div>
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}
