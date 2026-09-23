import { Counter } from "@/components/ui/Counter";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { about, stats } from "@/lib/profile";

export function About() {
  return (
    <section id="about" aria-labelledby="about-heading" className="relative">
      <div className="mx-auto max-w-page px-4 py-24 sm:px-8 sm:py-32 lg:px-12">
        {/* Stat strip */}
        <Reveal group className="mb-24 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line/10 bg-line/10 md:grid-cols-4">
          {stats.map((s) => (
            <RevealItem key={s.label} className="bg-bg p-6 sm:p-8">
              <p className="font-display text-4xl font-bold text-gradient sm:text-5xl">
                <Counter value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">{s.label}</p>
            </RevealItem>
          ))}
        </Reveal>

        <SectionHeading
          index="01"
          eyebrow="About"
          id="about-heading"
          title={
            <>
              Great products don&apos;t get customers automatically.{" "}
              <span className="italic text-accent">So I build the fix.</span>
            </>
          }
        />
        <Reveal group step={0.12} className="grid gap-8 text-base leading-relaxed text-fg/85 sm:text-lg md:grid-cols-3">
          {about.map((p) => (
            <RevealItem key={p.slice(0, 24)}>
              <p>{p}</p>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
