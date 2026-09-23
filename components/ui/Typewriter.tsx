"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/** Types and deletes each phrase in turn. Screen readers get the full list once. */
export function Typewriter({ phrases, className = "" }: { phrases: string[]; className?: string }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const full = phrases[i % phrases.length];
    const done = !deleting && text === full;
    const empty = deleting && text === "";
    const delay = done ? 1600 : empty ? 250 : deleting ? 28 : 55;
    const t = setTimeout(() => {
      if (done) setDeleting(true);
      else if (empty) {
        setDeleting(false);
        setI((n) => n + 1);
      } else setText(full.slice(0, text.length + (deleting ? -1 : 1)));
    }, delay);
    return () => clearTimeout(t);
  }, [text, deleting, i, phrases, reduce]);

  return (
    <span className={className}>
      <span className="sr-only">{phrases.join(", ")}</span>
      <span aria-hidden="true">
        {reduce ? phrases[0] : text}
        <span className="ml-0.5 inline-block w-[2px] animate-blink bg-accent align-[-0.1em]" style={{ height: "1em" }} />
      </span>
    </span>
  );
}
