"use client";
import { Pause, Play } from "lucide-react";
import { useState } from "react";

/** Pauses every animation inside the element with the given id. */
export function PauseToggle({ target }: { target: string }) {
  const [paused, setPaused] = useState(false);
  return (
    <button
      onClick={() => {
        document.getElementById(target)?.classList.toggle("lp-paused", !paused);
        setPaused(!paused);
      }}
      className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-muted transition hover:text-ink"
      aria-label={paused ? "Play animations" : "Pause animations"}
    >
      {paused ? <Play size={15} /> : <Pause size={15} />}
    </button>
  );
}
