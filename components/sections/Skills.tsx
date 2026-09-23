import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { skills } from "@/lib/profile";

const icons = ["✦", "⌘", "↗", "◎"];

export function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-heading" className="relative">
      <div className="mx-auto max-w-page px-4 py-24 sm:px-8 sm:py-32 lg:px-12">
        <SectionHeading
          index="05"
          eyebrow="Skills"
          id="skills-heading"
          title={
            <>
              Building with AI is <span className="text-gradient">the whole toolkit.</span>
            </>
          }
          intro="What I use to take an idea from a prompt to real users."
        />
        <Reveal group step={0.1} className="grid gap-4 md:grid-cols-2">
          {skills.map((g, i) => (
            <RevealItem key={g.group} className="rounded-3xl border border-line/10 bg-surface p-7 sm:p-8">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-lg text-accent">
                  {icons[i % icons.length]}
                </span>
                <h3 className="font-display text-2xl font-bold text-fg">{g.group}</h3>
              </div>
              <ul className="mt-6 flex flex-wrap gap-2">
                {g.items.map((s) => (
                  <li
                    key={s}
                    className="rounded-full border border-line/15 bg-bg/50 px-4 py-2 text-sm text-fg/90 transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
