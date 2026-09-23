"use client";

import { motion, useReducedMotion, useScroll } from "framer-motion";
import { useRef } from "react";
import { reveal, revealReduced } from "@/lib/motion";
import { SectionLabel } from "@/components/ui/SectionLabel";

/** Chronological milestones, in the order given. Edit freely. */
const milestones = [
  { title: "Solo V1", body: "Built the first version of Level Up alone — 36,000+ unique visitors, no signup required." },
  { title: "Level Up is founded", body: "Teamed up with co-founder & CTO Prajith Kocherla to turn the experiment into a company." },
  { title: "Canary OS", body: "Real-time audio ML to flag scam calls for elderly users. 3rd place, Butter Pitch Competition." },
  { title: "High Agency", body: "Co-founded with 3 others to connect young founders with Fortune 500 and Ivy League mentors. 200+ applicants." },
  { title: "Plastikeers presidency", body: "Elected President of Plastikeers Speech Club, where I mentor 150+ middle and high school students." },
  { title: "MindHack", body: "Co-founded and helped organize an event for 100+ undergraduate and master's students." },
  { title: "Level Up V2", body: "Building the full autonomous agent system with a 23-person team." },
  { title: "@founderharish", body: "Started documenting the whole thing in public on Instagram and YouTube." },
  { title: "Today", body: "Preparing a Y Combinator application — and relocating to San Francisco full-time after YC.", now: true },
];

export function Journey() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  // The gold progress line fills as you scroll through the timeline.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });

  return (
    <section id="journey" aria-labelledby="journey-heading" className="grain relative bg-charcoal">
      <div className="relative z-10 mx-auto grid max-w-page gap-14 px-4 py-24 sm:px-8 sm:py-32 lg:grid-cols-12 lg:px-12 lg:py-40">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <SectionLabel index="07">Journey</SectionLabel>
            <h2 id="journey-heading" className="mt-8 font-display text-display-md font-bold text-cream">
              Connecting <span className="italic text-gold-light">the dots.</span>
            </h2>
            <p className="mt-6 max-w-sm text-gray-light">
              From one solo build to five ventures and a 23-person team.
            </p>
          </div>
        </div>

        <ol ref={ref} className="relative lg:col-span-8">
          {/* Track + animated fill */}
          <span aria-hidden="true" className="absolute bottom-2 left-[11px] top-2 w-px bg-cream/15" />
          <motion.span
            aria-hidden="true"
            style={{ scaleY: reduce ? 1 : scrollYProgress }}
            className="absolute bottom-2 left-[11px] top-2 w-px origin-top bg-gold-light"
          />

          {milestones.map((m, i) => (
            <motion.li
              key={m.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "0px 0px -15% 0px" }}
              variants={reduce ? revealReduced : reveal}
              className="relative pb-12 pl-12 last:pb-0 sm:pl-16"
            >
              <span
                aria-hidden="true"
                className={`absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border ${
                  m.now ? "border-gold-light bg-gold-light" : "border-gold-light/60 bg-charcoal"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${m.now ? "animate-ping bg-black" : "bg-gold-light"}`} />
              </span>
              <p className="text-xs uppercase tracking-[0.25em] text-gold-light">
                {m.now ? "Now" : `Chapter ${String(i + 1).padStart(2, "0")}`}
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-cream sm:text-3xl">{m.title}</h3>
              <p className="mt-2 max-w-xl leading-relaxed text-gray-light">{m.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
