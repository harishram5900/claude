import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

type Award = { mark: string; title: string; detail: string };

const awards: Award[] = [
  { mark: "★", title: "Harvard x VTSP", detail: "Community Award" },
  { mark: "2nd", title: "Congressional App Challenge", detail: "2nd Place" },
  { mark: "3rd", title: "Butter Pitch Competition", detail: "3rd Place · Canary OS" },
  { mark: "✦", title: "TEAMS Pitch Competition", detail: "Recognition" },
  { mark: "115/800", title: "DPI iOS App Dev Internship", detail: "Selected from 800 applicants · 115 accepted" },
];

/** Infinite marquee of badges; also rendered as a static list for screen readers. */
export function Recognition() {
  return (
    <section id="recognition" aria-labelledby="recognition-heading" className="grain relative overflow-hidden bg-black">
      <div className="relative z-10 mx-auto max-w-page px-4 pt-24 sm:px-8 sm:pt-32 lg:px-12">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel index="04">Recognition</SectionLabel>
            <h2 id="recognition-heading" className="mt-8 font-display text-display-md font-bold text-cream">
              Judged by others<span className="text-gold-light">.</span>
            </h2>
          </div>
        </Reveal>
      </div>

      {/* Accessible, static version */}
      <ul className="sr-only">
        {awards.map((a) => (
          <li key={a.title}>
            {a.title} — {a.detail}
          </li>
        ))}
      </ul>

      <div
        aria-hidden="true"
        className="relative z-10 mt-14 pb-24 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)] sm:pb-32"
      >
        <div className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused]">
          {[...awards, ...awards].map((a, i) => (
            <div
              key={i}
              className="flex w-[19rem] shrink-0 items-center gap-5 rounded-2xl border border-cream/10 bg-charcoal/70 p-5 sm:w-[23rem] sm:p-6"
            >
              <span className="flex h-16 min-w-16 shrink-0 items-center justify-center rounded-full border border-gold-light/50 bg-gradient-to-br from-gold/25 to-transparent px-3 font-display text-lg font-bold text-gold-light">
                {a.mark}
              </span>
              <span>
                <span className="block font-display text-lg font-semibold leading-tight text-cream">{a.title}</span>
                <span className="mt-1 block text-sm text-gray-light">{a.detail}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
