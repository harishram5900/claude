"use client";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Mode = "light" | "dark" | "system";

function apply(mode: Mode) {
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");
  useEffect(() => {
    let m: Mode = "system";
    try {
      m = (localStorage.getItem("admitlens:theme") as Mode) || "system";
    } catch {}
    setMode(m);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let cur: Mode = "system";
      try {
        cur = (localStorage.getItem("admitlens:theme") as Mode) || "system";
      } catch {}
      if (cur === "system") apply("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const next = () => {
    const order: Mode[] = ["light", "dark", "system"];
    const m = order[(order.indexOf(mode) + 1) % 3];
    setMode(m);
    try {
      localStorage.setItem("admitlens:theme", m);
    } catch {}
    apply(m);
  };
  const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
  return (
    <button onClick={next} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition hover:text-ink" aria-label={`Theme: ${mode}. Click to change`} title={`Theme: ${mode}`}>
      <Icon size={16} />
    </button>
  );
}

export const themeScript = `(function(){try{var m=localStorage.getItem('admitlens:theme')||'system';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;
