"use client";
import { Cloud, ShieldOff, Trophy } from "lucide-react";
import { useState } from "react";
import { cx } from "../ui";

const WHERE = [
  { id: "account", icon: Cloud, title: "Saved to your account", items: ["Your profile and saved programs", "Essays, tracker and roadmap progress"] },
  { id: "scholarships", icon: Trophy, title: "Only for scholarships", items: ["Citizenship or visa status", "City, background and family employers", "Used to hide awards you can't receive"] },
  { id: "never", icon: ShieldOff, title: "Never", items: ["Sold or shared", "Your visa status in reports or PDFs", "Used to train AI models"] },
] as const;

/** Where each piece of a student's data goes. */
export function PrivacyPanel() {
  const [k, setK] = useState<(typeof WHERE)[number]["id"]>("account");
  const cur = WHERE.find((w) => w.id === k)!;
  return (
    <div className="lp-on-ivy rounded-3xl p-2">
      <div className="grid grid-cols-3 gap-1" role="tablist">
        {WHERE.map((w) => (
          <button key={w.id} role="tab" aria-selected={k === w.id} onClick={() => setK(w.id)} className={cx("flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center text-[12.5px] font-medium transition sm:text-sm", k === w.id ? "bg-[#f5f2ea] text-[#1d5a46]" : "text-[#f5f2ea]/70 hover:text-[#f5f2ea]")}>
            <w.icon size={17} />
            {w.title}
          </button>
        ))}
      </div>
      <ul className="space-y-3 px-5 pb-6 pt-7">
        {cur.items.map((it) => (
          <li key={it} className="rise flex items-center gap-3 font-display text-xl">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e0b65a]" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
