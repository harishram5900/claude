import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

/** Founder story — the first cream "page" in the scroll, like the deck's light slides. */
export function About() {
  return (
    <section aria-labelledby="about-heading" className="light-surface bg-cream text-black">
      <div className="mx-auto grid max-w-page gap-12 px-4 py-24 sm:px-8 sm:py-32 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:py-40">
        <Reveal className="lg:col-span-4">
          <SectionLabel index="01" tone="light">
            The founder
          </SectionLabel>
          <p className="mt-8 font-display text-2xl italic leading-snug text-gold sm:text-3xl">
            Aurora&nbsp;→ San&nbsp;Francisco.
          </p>
          <p className="mt-3 text-sm uppercase tracking-[0.2em] text-gray">Building for the world</p>
        </Reveal>

        <Reveal group step={0.12} className="lg:col-span-8">
          <RevealItem>
            <h2 id="about-heading" className="font-display text-display-md font-bold text-black">
              Great products don&apos;t automatically get customers.{" "}
              <span className="text-gold">So I started building the fix.</span>
            </h2>
          </RevealItem>
          <div className="mt-12 grid gap-8 text-base leading-relaxed text-charcoal sm:text-lg md:grid-cols-2">
            <RevealItem>
              <p>
                Based in Aurora, building for the world — relocating to San Francisco full-time after Y Combinator. I
                started my first company solo, before I had a co-founder, before I had funding, because I kept running
                into the same problem: great products don&apos;t automatically get customers.
              </p>
            </RevealItem>
            <RevealItem>
              <p>
                Everything I&apos;ve built since — five ventures, one nonprofit-style mentorship role, and a growing
                media presence — traces back to that same obsession:{" "}
                <em className="font-display text-xl not-italic text-black">
                  making it easier for the next builder to actually get seen.
                </em>
              </p>
            </RevealItem>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
