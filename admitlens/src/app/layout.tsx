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
    { media: "(prefers-color-scheme: light)", color: "#f6f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#090a12" },
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
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen">
        <StoreProvider>
          <Nav />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
          <footer className="border-t border-line">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-2">
                <LogoMark size={22} />
                <span>AdmitLens is a simulation. It is not affiliated with any college or with Common App. Always verify on official sites.</span>
              </div>
              <div className="flex gap-4">
                <Link href="/about" className="hover:text-ink">How it works</Link>
                <Link href="/profile" className="hover:text-ink">Your data</Link>
              </div>
            </div>
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}
