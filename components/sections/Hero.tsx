"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Counter } from "@/components/ui/Counter";
import { Magnetic } from "@/components/ui/Magnetic";
import { hrefFor, links } from "@/lib/links";
import { spring } from "@/lib/motion";

const stats = [
  { value: 50000, suffix: "+", label: "Users" },
  { value: 70, suffix: "+", label: "Countries" },
  { value: 200, suffix: "+", label: "Student startups helped" },
  { value: 23, suffix: "", label: "Person team" },
];

const headline = ["I build", "the systems", "other founders", "wish existed."];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Gentle parallax: headline drifts up and fades as you scroll past.
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0.2]);

  return (
    <section
      id="top"
      ref={ref}
      aria-labelledby="hero-heading"
      className="grain relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-black pb-10 pt-28 sm:pb-14"
    >
      {/* Drifting gold glow orbs — decorative */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -right-[10%] -top-[15%] h-[70vmax] w-[70vmax] animate-drift rounded-full bg-[radial-gradient(circle,rgba(176,141,62,0.28),transparent_60%)] blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[20%] h-[60vmax] w-[60vmax] animate-drift-slow rounded-full bg-[radial-gradient(circle,rgba(226,198,133,0.14),transparent_60%)] blur-3xl" />
        {/* Faint editorial grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(246,241,230,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(246,241,230,0.035)_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 mx-auto w-full max-w-page px-4 sm:px-8 lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          className="mb-8 inline-flex items-center gap-3 rounded-full border border-gold-light/30 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-gold-light"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-light opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-light" />
          </span>
          Founder · Builder · 18
        </motion.p>

        <h1 id="hero-heading" className="font-display text-display-xl font-bold text-cream">
          {headline.map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.08em]">
              <motion.span
                className={`block ${i === headline.length - 1 ? "italic text-gold-light" : ""}`}
                initial={reduce ? { opacity: 0 } : { y: "105%" }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                transition={{ ...spring, delay: 0.2 + i * 0.09 }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <motion.p
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ ...spring, delay: 0.65 }}
            className="max-w-xl text-base leading-relaxed text-gray-light sm:text-lg"
          >
            CEO &amp; co-founder of <strong className="font-medium text-cream">Level Up</strong>, an AI agent team
            that runs a company&apos;s entire marketing. Also building{" "}
            <span className="text-cream">Canary OS</span>, <span className="text-cream">High Agency</span>, and{" "}
            <span className="text-cream">Pippin</span> — because one company was never going to be enough.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.8 }}
            className="flex flex-wrap gap-3 lg:justify-end"
          >
            <Magnetic>
              <a
                href="#work"
                className="inline-flex items-center gap-2 rounded-full bg-gold-light px-7 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-cream"
              >
                See the work
                <span aria-hidden="true">↓</span>
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href={hrefFor(links.resume)}
                className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:border-gold-light hover:text-gold-light"
              >
                Resume &amp; contact
              </a>
            </Magnetic>
          </motion.div>
        </div>

        {/* Live stat strip */}
        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-14 grid grid-cols-2 border-t border-cream/15 sm:mt-20 md:grid-cols-4"
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col-reverse gap-1 py-5 md:py-7 ${
                i % 2 === 1 ? "pl-5 border-l border-cream/15" : ""
              } ${i >= 2 ? "border-t border-cream/15 md:border-t-0" : ""} ${
                i > 0 ? "md:border-l md:border-cream/15 md:pl-8" : ""
              }`}
            >
              <dt className="text-xs uppercase tracking-[0.2em] text-gray-light">{s.label}</dt>
              <dd className="font-display text-4xl font-bold text-cream sm:text-5xl">
                <Counter value={s.value} suffix={s.suffix} />
              </dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>
    </section>
  );
}
