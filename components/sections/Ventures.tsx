import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TiltCard } from "@/components/ui/TiltCard";
import { ventures, type Venture } from "@/lib/profile";

/** Flagship (LevelUp) gets a full-width feature card; the rest sit in a tilt-card grid. */
export function Ventures() {
  const [flagship, ...rest] = ventures;
  return (
    <section id="ventures" aria-labelledby="ventures-heading" className="relative bg-surface/50">
      <div className="mx-auto max-w-page px-4 py-24 sm:px-8 sm:py-32 lg:px-12">
        <SectionHeading
          index="02"
          eyebrow="Ventures"
          id="ventures-heading"
          title={
            <>
              Things I&apos;ve <span className="text-gradient">built &amp; co-founded.</span>
            </>
          }
          intro="One company was never going to be enough. Every one of these is live, shipping, or in front of real users."
        />

        <Reveal>
          <TiltCard max={4} className="overflow-hidden rounded-[2rem] border border-accent/25 bg-gradient-to-br from-accent/10 via-surface to-surface">
            <div className="relative grid gap-10 p-7 sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:p-14">
              <div>
                <CardMeta v={flagship} />
                <h3 className="mt-4 font-display text-5xl font-bold text-fg sm:text-6xl">
                  {flagship.name}
                  <span className="text-accent">.</span>
                </h3>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg/85">{flagship.summary}</p>
                <Links v={flagship} />
              </div>
              <div className="flex flex-col justify-between gap-8">
                {flagship.metric && (
                  <div className="rounded-2xl border border-line/10 bg-bg/60 p-6">
                    <p className="font-display text-5xl font-bold text-gradient">{flagship.metric.value}</p>
                    <p className="mt-1 text-sm text-muted">{flagship.metric.label}</p>
                  </div>
                )}
                <ul className="space-y-3">
                  {flagship.points.map((p) => (
                    <li key={p} className="flex gap-3 text-sm leading-relaxed text-fg/85">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TiltCard>
        </Reveal>

        <Reveal group step={0.1} className="mt-5 grid gap-5 md:grid-cols-2">
          {rest.map((v) => (
            <RevealItem key={v.name}>
              <TiltCard className="rounded-[1.75rem] border border-line/10 bg-surface transition-colors hover:border-accent/40">
                <article className="relative flex h-full flex-col p-7 sm:p-9">
                  <CardMeta v={v} />
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <h3 className="font-display text-3xl font-bold text-fg sm:text-4xl">{v.name}</h3>
                    {v.metric && (
                      <p className="text-right">
                        <span className="block font-display text-3xl font-bold text-gradient">{v.metric.value}</span>
                        <span className="text-xs uppercase tracking-[0.15em] text-muted">{v.metric.label}</span>
                      </p>
                    )}
                  </div>
                  <p className="mt-4 leading-relaxed text-fg/80">{v.summary}</p>
                  {v.points.length > 0 && (
                    <ul className="mt-5 flex flex-wrap gap-2">
                      {v.points.map((p) => (
                        <li key={p} className="rounded-full border border-accent/25 bg-accent/5 px-3 py-1 text-xs text-fg/85">
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto">
                    <Links v={v} />
                  </div>
                </article>
              </TiltCard>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function CardMeta({ v }: { v: Venture }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.2em]">
      <span className="rounded-full bg-accent px-3 py-1 text-on-accent">{v.role}</span>
      <span className="text-muted">{v.kind}</span>
    </p>
  );
}

function Links({ v }: { v: Venture }) {
  if (!v.links.length) return null;
  return (
    <div className="mt-7 flex flex-wrap gap-3">
      {v.links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full border border-line/15 bg-bg/40 px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-accent hover:text-accent"
        >
          {l.label}
          <span aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
            ↗
          </span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ))}
    </div>
  );
}
