"use client";

import { motion } from "framer-motion";
import { Magnetic } from "@/components/ui/Magnetic";
import { Portrait } from "@/components/ui/Portrait";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { Typewriter } from "@/components/ui/Typewriter";
import { links } from "@/lib/links";
import { spring } from "@/lib/motion";
import { profile } from "@/lib/profile";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { ...spring, delay },
});

export function Hero() {
  const [first, ...rest] = profile.name.split(" ");
  return (
    <section id="top" aria-labelledby="hero-heading" className="relative overflow-hidden pb-20 pt-32 sm:pt-40 lg:flex lg:min-h-[100svh] lg:items-center lg:pb-24">
      {/* Background: drifting glow + faint grid */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-[15%] -top-[20%] h-[60vmax] w-[60vmax] animate-drift rounded-full bg-[radial-gradient(circle,rgb(var(--accent)/0.16),transparent_60%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgb(var(--line)/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--line)/0.04)_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-page items-center gap-16 px-4 sm:px-8 lg:grid-cols-[1.35fr_1fr] lg:px-12">
        <div className="min-w-0">
          <motion.p
            {...fadeUp(0.05)}
            className="inline-flex items-center gap-2.5 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-accent"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Founder · Builder · 18
          </motion.p>

          <motion.h1 {...fadeUp(0.15)} id="hero-heading" className="mt-7 font-display text-[clamp(2.1rem,5.2vw,5.5rem)] font-bold leading-[1] tracking-[-0.03em] text-fg">
            Hi, I&apos;m {first}
            <span className="block text-gradient">{rest.join(" ")}.</span>
          </motion.h1>

          <motion.p {...fadeUp(0.3)} className="mt-6 min-h-[2.2em] font-display text-xl text-fg/90 sm:text-2xl">
            <Typewriter phrases={profile.roles} />
          </motion.p>

          <motion.p {...fadeUp(0.4)} className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {profile.tagline} Based in {profile.location}.
          </motion.p>

          <motion.div {...fadeUp(0.55)} className="mt-9 flex flex-wrap items-center gap-3">
            <Magnetic>
              <a
                href="#ventures"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-on-accent transition-transform hover:scale-[1.03]"
              >
                See what I&apos;ve built <span aria-hidden="true">↓</span>
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href={`mailto:${links.email}`}
                className="inline-flex items-center gap-2 rounded-full border border-line/20 px-7 py-3.5 text-sm font-medium text-fg transition-colors hover:border-accent hover:text-accent"
              >
                Email me
              </a>
            </Magnetic>
            <div className="ml-1 flex items-center gap-2">
              <SocialIcon kind="linkedin" href={links.linkedin} />
              <SocialIcon kind="instagram" href={links.instagram} />
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...spring, delay: 0.3 }} className="min-w-0 px-6 sm:px-10">
          <Portrait />
        </motion.div>
      </div>
    </section>
  );
}
