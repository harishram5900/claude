import type { Metadata, Viewport } from "next";
import { Lora, Poppins } from "next/font/google";
import { Cursor } from "@/components/ui/Cursor";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Harish Ramasubramanian — Founder of LevelUp",
  description:
    "18-year-old founder from Aurora, IL. Founder & CEO of LevelUp (AI marketing agents), co-founder of Pippin, High Agency and Canary OS. Congressional App Challenge 2nd place, NASA Space Apps Chicago 2nd place, Harvard x VTSP Community Award.",
  openGraph: {
    title: "Harish Ramasubramanian — Founder of LevelUp",
    description: "I build AI products that help the next builder actually get seen.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Harish Ramasubramanian — Founder of LevelUp",
    description: "I build AI products that help the next builder actually get seen.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0A08",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${lora.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="grain">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
        >
          Skip to content
        </a>
        <ScrollProgress />
        <SmoothScroll />
        <Cursor />
        {children}
      </body>
    </html>
  );
}
