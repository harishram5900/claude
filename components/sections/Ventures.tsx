"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Counter } from "@/components/ui/Counter";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

/**
 * Asymmetric bento grid (12-col on desktop):
 *   ┌──────── Canary OS (7) ────────┬── High Agency (5) ──┐
 *   ├─ MindHack (4) ─┬──────────── Pippin (8) ───────────┤
 */
export function Ventures() {
  return (
    <section id="ventures" aria-labelledby="ventures-heading" className="grain relative bg-charcoal">
      <div className="relative z-10 mx-auto max-w-page px-4 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel index="03">Ventures</SectionLabel>
            <h2 id="ventures-heading" className="mt-8 font-display text-display-md font-bold text-cream">
              One company was never
              <br className="hidden sm:block" /> <span className="italic text-gold-light">going to be enough.</span>
            </h2>
          </div>
          <p className="max-w-sm text-gray-light">
            Four more bets, built in parallel with Level Up.
          </p>
        </Reveal>

        <Reveal group step={0.1} className="mt-14 grid auto-rows-[minmax(0,auto)] grid-cols-1 gap-4 md:grid-cols-12">
          {/* Canary OS */}
          <BentoCard className="md:col-span-7 md:row-span-1">
            <CanaryWave />
            <CardHeader tag="AI safety · Audio ML" name="Canary OS" />
            <p className="mt-4 max-w-lg text-cream/80">
              AI scam-detection built on real-time audio machine-learning models that flag likely scam calls —
              protecting elderly users. Pitched directly to senior living homes.
            </p>
            <Badge>3rd place — Butter Pitch Competition</Badge>
          </BentoCard>

          {/* High Agency */}
          <BentoCard className="md:col-span-5" tone="gold">
            <CardHeader tag="Community · Mentorship" name="High Agency" dark />
            <p className="mt-4 text-black/80">
              Co-founded with 3 other co-founders. Connects young, talented entrepreneurs to mentors from Fortune 500
              companies and Ivy League schools — and to each other.
            </p>
            <p className="mt-8 font-display text-6xl font-bold text-black sm:text-7xl">
              <Counter value={200} suffix="+" />
            </p>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/70">Applicants</p>
          </BentoCard>

          {/* MindHack */}
          <BentoCard className="md:col-span-4">
            <CardHeader tag="Event · Co-founder & organizer" name="MindHack" />
            <p className="mt-4 text-cream/80">
              Co-founded and helped organize an event bringing together undergraduate and master&apos;s students.
            </p>
            <p className="mt-8 font-display text-6xl font-bold text-gold-light">
              <Counter value={100} suffix="+" />
            </p>
            <p className="text-sm uppercase tracking-[0.2em] text-gray-light">Students</p>
          </BentoCard>

          {/* Pippin */}
          <BentoCard className="md:col-span-8">
            <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <CardHeader tag="Edtech · Early stage" name="Pippin" />
                <p className="mt-4 max-w-md text-cream/80">
                  A Duolingo-style gamified app teaching AI literacy and &ldquo;vibe-coding&rdquo; — working effectively
                  with AI coding agents like Cursor and Replit. Mascot: Pip. Building toward a future YC application.
                </p>
              </div>
              <PipStreak />
            </div>
          </BentoCard>
        </Reveal>
      </div>
    </section>
  );
}

function BentoCard({
  children,
  className = "",
  tone = "dark",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "dark" | "gold";
}) {
  const reduce = useReducedMotion();
  const surface =
    tone === "gold"
      ? "light-surface bg-gradient-to-br from-gold-light to-gold text-black border-transparent"
      : "bg-black/60 border-cream/10 hover:border-gold-light/40";
  return (
    <RevealItem className={className}>
      <motion.article
        whileHover={reduce ? undefined : { y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        data-cursor="hover"
        className={`relative h-full overflow-hidden rounded-3xl border p-7 transition-colors sm:p-9 ${surface}`}
      >
        {children}
      </motion.article>
    </RevealItem>
  );
}

function CardHeader({ tag, name, dark = false }: { tag: string; name: string; dark?: boolean }) {
  return (
    <header className="relative">
      <p className={`text-xs font-medium uppercase tracking-[0.22em] ${dark ? "text-black/65" : "text-gold-light"}`}>
        {tag}
      </p>
      <h3 className={`mt-3 font-display text-4xl font-bold sm:text-5xl ${dark ? "text-black" : "text-cream"}`}>
        {name}
      </h3>
    </header>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold-light/40 bg-gold/10 px-4 py-2 text-sm font-medium text-gold-light">
      <span aria-hidden="true">✦</span>
      {children}
    </p>
  );
}

/** Decorative animated "voice waveform" for Canary OS. */
function CanaryWave() {
  const reduce = useReducedMotion();
  const bars = [4, 9, 14, 7, 18, 26, 12, 22, 30, 16, 9, 20, 28, 14, 6, 11, 24, 17, 8, 5];
  return (
    <div aria-hidden="true" className="absolute right-6 top-6 hidden h-16 items-center gap-1 sm:flex">
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className={`w-1 rounded-full ${i === 8 || i === 12 ? "bg-red-400/80" : "bg-gold-light/50"}`}
          style={{ height: h * 1.6 }}
          animate={reduce ? undefined : { scaleY: [1, 0.35, 1] }}
          transition={{ duration: 1.2 + (i % 5) * 0.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

/** Decorative streak-style lesson path for Pippin (abstract, not a screenshot). */
function PipStreak() {
  return (
    <div aria-hidden="true" className="flex items-center gap-3 sm:flex-col">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`flex h-12 w-12 items-center justify-center rounded-full border-2 font-display text-lg font-bold sm:odd:translate-x-4 ${
            i < 2
              ? "border-gold-light bg-gold-light text-black"
              : i === 2
                ? "border-gold-light text-gold-light"
                : "border-cream/20 text-cream/30"
          }`}
        >
          {i < 2 ? "✓" : i === 2 ? "P" : "·"}
        </span>
      ))}
    </div>
  );
}
