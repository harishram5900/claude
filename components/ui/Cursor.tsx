"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Desktop-only custom cursor: a crisp gold dot plus a soft trailing glow that
 * swells over interactive elements. Disabled on touch devices and when the
 * user prefers reduced motion.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const trailX = useSpring(x, { stiffness: 180, damping: 22, mass: 0.6 });
  const trailY = useSpring(y, { stiffness: 180, damping: 22, mass: 0.6 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    setEnabled(true);
    document.documentElement.classList.add("has-custom-cursor");

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const target = e.target as HTMLElement | null;
      setHovering(!!target?.closest("a, button, [role='button'], [data-cursor='hover']"));
    };
    const leave = () => setVisible(false);

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100]">
      <motion.div
        className="absolute left-0 top-0 rounded-full"
        style={{
          x: trailX,
          y: trailY,
          translateX: "-50%",
          translateY: "-50%",
          background: "radial-gradient(circle, rgb(var(--accent) / 0.35) 0%, rgb(var(--accent) / 0) 70%)",
        }}
        animate={{ width: hovering ? 72 : 36, height: hovering ? 72 : 36, opacity: visible ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      />
      <motion.div
        className="absolute left-0 top-0 h-2 w-2 rounded-full bg-accent mix-blend-difference"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: hovering ? 0.5 : 1, opacity: visible ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      />
    </div>
  );
}
