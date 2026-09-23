"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type CounterProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
};

/** Counts from 0 → value once scrolled into view. Screen readers get the final value. */
export function Counter({ value, suffix = "", prefix = "", className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: value > 1000 ? 2.2 : 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  const final = `${prefix}${value.toLocaleString("en-US")}${suffix}`;

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true" className="tabular-nums">
        {prefix}
        {display.toLocaleString("en-US")}
        {suffix}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
