import type { Transition, Variants } from "framer-motion";

/** House spring — used for every reveal and hover so motion feels unified. */
export const spring: Transition = { type: "spring", stiffness: 100, damping: 20, mass: 0.9 };

/** Fade + lift + blur-in reveal. */
export const reveal: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: spring },
};

/** Reduced-motion variant: a plain opacity fade. */
export const revealReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4 } },
};

export const stagger = (step = 0.09, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: delay } },
});
