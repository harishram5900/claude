"use client";

import { Tabs } from "@/components/ui/Tabs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { education, experience, fellowships, type TimelineItem } from "@/lib/profile";

function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative grid gap-4 md:grid-cols-2">
      {items.map((it) => (
        <li
          key={`${it.org}-${it.title}`}
          className="group relative rounded-2xl border border-line/10 bg-surface p-6 transition-colors hover:border-accent/40"
        >
          <span aria-hidden="true" className="absolute left-0 top-6 h-8 w-[3px] rounded-r bg-accent opacity-60 transition-opacity group-hover:opacity-100" />
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{it.title}</p>
          <h3 className="mt-2 font-display text-2xl font-bold text-fg">{it.org}</h3>
          {it.detail && <p className="mt-2 text-sm leading-relaxed text-muted">{it.detail}</p>}
        </li>
      ))}
    </ol>
  );
}

export function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-heading" className="relative bg-surface/50">
      <div className="mx-auto max-w-page px-4 py-24 sm:px-8 sm:py-32 lg:px-12">
        <SectionHeading
          index="04"
          eyebrow="Experience"
          id="experience-heading"
          title={
            <>
              Where I&apos;ve <span className="italic text-accent">put in the reps.</span>
            </>
          }
        />
        <Tabs
          tabs={[
            { label: "Experience", content: <Timeline items={experience} /> },
            { label: "Fellowships & leadership", content: <Timeline items={fellowships} /> },
            { label: "Education", content: <Timeline items={education} /> },
          ]}
        />
      </div>
    </section>
  );
}
