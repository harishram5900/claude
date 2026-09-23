import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TiltCard } from "@/components/ui/TiltCard";
import { awards, pitches } from "@/lib/profile";

function Trophy() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  );
}

/** Trophy case of awards, then a marquee of every stage pitched on. */
export function Awards() {
  return (
    <section id="awards" aria-labelledby="awards-heading" className="relative overflow-hidden">
      <div className="mx-auto max-w-page px-4 pt-24 sm:px-8 sm:pt-32 lg:px-12">
        <SectionHeading
          index="03"
          eyebrow="Awards & recognition"
          id="awards-heading"
          title={
            <>
              Judged by others<span className="text-accent">.</span>
            </>
          }
          intro="National app challenges, hackathons, and pitch stages from Chicago to Harvard."
        />

        <Reveal group step={0.08} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {awards.map((a) => (
            <RevealItem key={a.title}>
              <TiltCard
                className={`rounded-3xl border p-7 ${
                  a.highlight ? "border-accent/35 bg-gradient-to-br from-accent/15 to-surface" : "border-line/10 bg-surface"
                }`}
              >
                <div className="relative flex h-full flex-col">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent">
                    <Trophy />
                  </span>
                  <p className="mt-6 font-display text-2xl font-bold text-gradient">{a.result}</p>
                  <h3 className="mt-1 text-lg font-semibold text-fg">{a.title}</h3>
                  {a.detail && <p className="mt-1 text-sm text-muted">{a.detail}</p>}
                </div>
              </TiltCard>
            </RevealItem>
          ))}
        </Reveal>

        <Reveal className="mt-20">
          <h3 className="text-xs font-medium uppercase tracking-[0.28em] text-muted">Pitched on stage at</h3>
        </Reveal>
      </div>

      {/* Static list for screen readers; the marquee below is decorative. */}
      <ul className="sr-only">
        {pitches.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <div aria-hidden="true" className="relative mt-6 pb-24 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)] sm:pb-32">
        <div className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused]">
          {[...pitches, ...pitches, ...pitches, ...pitches].map((p, i) => (
            <span
              key={i}
              className="flex items-center gap-4 whitespace-nowrap rounded-full border border-line/10 bg-surface px-8 py-4 font-display text-2xl font-semibold text-fg sm:text-3xl"
            >
              <span className="text-accent">✦</span>
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
