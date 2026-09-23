import { Reveal } from "@/components/ui/Reveal";

/** Numbered eyebrow + serif heading used at the top of every section. */
export function SectionHeading({
  index,
  eyebrow,
  title,
  id,
  intro,
}: {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  id: string;
  intro?: string;
}) {
  return (
    <Reveal className="mb-12 flex flex-col gap-5 md:mb-16 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-accent">
          <span className="font-display text-sm tracking-normal">{index}</span>
          <span className="h-px w-8 bg-accent/60" />
          {eyebrow}
        </p>
        <h2 id={id} className="mt-6 font-display text-display-md font-bold text-fg">
          {title}
        </h2>
      </div>
      {intro && <p className="max-w-sm text-muted">{intro}</p>}
    </Reveal>
  );
}
