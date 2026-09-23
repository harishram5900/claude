"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { reveal, revealReduced, stagger } from "@/lib/motion";

type RevealProps = HTMLMotionProps<"div"> & {
  /** Render as a stagger container; children should be <RevealItem>. */
  group?: boolean;
  step?: number;
  delay?: number;
};

/**
 * Scroll-triggered reveal. Standalone it fades/lifts/un-blurs itself;
 * with `group` it staggers its <RevealItem> children instead.
 */
export function Reveal({ group, step, delay, children, ...rest }: RevealProps) {
  const reduce = useReducedMotion();
  const variants = group ? stagger(step, delay) : reduce ? revealReduced : reveal;
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      variants={variants}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, ...rest }: HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div variants={reduce ? revealReduced : reveal} {...rest}>
      {children}
    </motion.div>
  );
}
