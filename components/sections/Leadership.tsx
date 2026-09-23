import { Counter } from "@/components/ui/Counter";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

/** Quieter, human section on the cream surface. */
export function Leadership() {
  return (
    <section aria-labelledby="leadership-heading" className="light-surface bg-cream-2 text-black">
      <div className="mx-auto max-w-page px-4 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <Reveal>
          <SectionLabel index="05" tone="light">
            Leadership &amp; community
          </SectionLabel>
        </Reveal>

        <div className="mt-10 grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <h2 id="leadership-heading" className="font-display text-display-md font-bold">
              The longest thing I&apos;ve committed to{" "}
              <span className="italic text-gold">isn&apos;t a company.</span>
            </h2>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-charcoal">
              <strong className="font-semibold text-black">Plastikeers Speech Club</strong> — 3+ years, my
              longest-running commitment. Elected <strong className="font-semibold text-black">President</strong>. I
              mentor middle and high school students in persuasive speaking, vocal projection, and stage presence.
            </p>
          </Reveal>

          <Reveal group step={0.12} className="grid gap-4 self-end sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            <RevealItem className="rounded-3xl bg-cream p-7 shadow-[0_1px_0_rgba(14,13,12,0.06)]">
              <p className="font-display text-6xl font-bold text-black">
                <Counter value={150} suffix="+" />
              </p>
              <p className="mt-2 text-sm text-charcoal">Middle and high school students mentored</p>
            </RevealItem>
            <RevealItem className="rounded-3xl bg-black p-7 text-cream">
              <p className="font-display text-6xl font-bold text-gold-light">
                3–4<span className="text-3xl">+ hrs</span>
              </p>
              <p className="mt-2 text-sm text-gray-light">
                Volunteered weekly across Plastikeers mentorship, Canary OS community outreach, and High Agency
              </p>
            </RevealItem>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
