"use client";

import { motion, useReducedMotion } from "framer-motion";
import { reveal, spring } from "@/lib/motion";

/** The Level Up agent loop, drawn as an animated pipeline. */
const steps = [
  { n: "01", title: "Research", body: "Trends + competitors in the brand's niche" },
  { n: "02", title: "Script", body: "Brand-specific scripts and content" },
  { n: "03", title: "Produce", body: "Video editing + visual asset generation" },
  { n: "04", title: "Review", body: "Automated content review" },
  { n: "05", title: "Publish", body: "TikTok · Reels · Shorts · Facebook" },
  { n: "06", title: "Adapt", body: "Performance-based adjustment" },
];

export function AgentPipeline() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      className="relative mt-20 rounded-3xl border border-cream/10 bg-charcoal/60 p-5 sm:p-8"
      aria-label="How Level Up's agents work, in six steps"
      role="group"
    >
      <div className="mb-6 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-gray-light">
        <span>The agent loop</span>
        <span className="flex items-center gap-2 text-gold-light">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-light" /> autonomous
        </span>
      </div>

      <ol className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {/* Connecting line that draws itself (desktop) */}
        <motion.span
          aria-hidden="true"
          className="absolute left-0 right-0 top-[2.1rem] hidden h-px origin-left bg-gradient-to-r from-gold-light/0 via-gold-light/60 to-gold-light/0 lg:block"
          variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: reduce ? 0 : 1.4, ease: [0.16, 1, 0.3, 1] } } }}
        />
        {steps.map((s, i) => (
          <motion.li
            key={s.n}
            variants={reveal}
            transition={{ ...spring, delay: reduce ? 0 : 0.15 + i * 0.1 }}
            className="relative rounded-2xl border border-cream/10 bg-black/70 p-5 backdrop-blur"
          >
            <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-gold-light/50 bg-black font-display text-sm text-gold-light">
              {s.n}
            </span>
            <p className="mt-4 font-display text-xl font-semibold text-cream">{s.title}</p>
            <p className="mt-1 text-sm leading-snug text-gray-light">{s.body}</p>
          </motion.li>
        ))}
      </ol>
    </motion.div>
  );
}
