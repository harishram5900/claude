import type { Metadata, Viewport } from "next";
import { Lora, Poppins } from "next/font/google";
import { Cursor } from "@/components/ui/Cursor";
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
  title: "Harish Ramasubramanian — Founder, Level Up",
  description:
    "18-year-old founder. CEO & co-founder of Level Up, an AI agent team that runs a company's entire marketing. Also building Canary OS, High Agency, and Pippin.",
  openGraph: {
    title: "Harish Ramasubramanian — Founder, Level Up",
    description: "I build the systems other founders wish existed.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Harish Ramasubramanian — Founder, Level Up",
    description: "I build the systems other founders wish existed.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E0D0C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lora.variable} ${poppins.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-gold-light focus:px-4 focus:py-2 focus:text-black"
        >
          Skip to content
        </a>
        <Cursor />
        {children}
      </body>
    </html>
  );
}
