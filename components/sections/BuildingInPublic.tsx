import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { hrefFor, links } from "@/lib/links";

/** @founderharish — styled as an abstract phone mockup (no fake posts or numbers). */
export function BuildingInPublic() {
  return (
    <section aria-labelledby="social-heading" className="grain relative overflow-hidden bg-black">
      <div className="relative z-10 mx-auto grid max-w-page items-center gap-16 px-4 py-24 sm:px-8 sm:py-32 lg:grid-cols-2 lg:px-12 lg:py-40">
        <Reveal>
          <SectionLabel index="06">Building in public</SectionLabel>
          <h2 id="social-heading" className="mt-8 font-display text-display-md font-bold text-cream">
            The real, unfiltered version<span className="text-gold-light">.</span>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-light">
            I&apos;m growing an Instagram and YouTube presence,{" "}
            <strong className="font-medium text-cream">@founderharish</strong>, in the entrepreneurship, business and
            motivation space — documenting what building multiple companies at 18 actually looks like.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={hrefFor(links.instagram)}
              className="rounded-full bg-cream px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-gold-light"
            >
              Instagram
            </a>
            <a
              href={hrefFor(links.youtube)}
              className="rounded-full border border-cream/25 px-6 py-3 text-sm font-medium text-cream transition-colors hover:border-gold-light hover:text-gold-light"
            >
              YouTube
            </a>
          </div>
        </Reveal>

        <Reveal className="flex justify-center lg:justify-end">
          <Phone />
        </Reveal>
      </div>
    </section>
  );
}

/** Pure-CSS phone with an abstract short-form video frame. Decorative. */
function Phone() {
  return (
    <div aria-hidden="true" className="relative">
      <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(176,141,62,0.3),transparent_65%)] blur-2xl" />
      <div className="relative w-[17rem] rotate-[-4deg] rounded-[2.75rem] border border-cream/15 bg-charcoal p-2.5 shadow-2xl sm:w-[19rem]">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[2.2rem] bg-gradient-to-b from-[#2a261f] via-black to-black">
          {/* Notch */}
          <div className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
          {/* Abstract "video" frame */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(226,198,133,0.45),transparent_45%),radial-gradient(circle_at_75%_70%,rgba(176,141,62,0.35),transparent_50%)]" />
          <div className="absolute inset-x-6 top-1/3 font-display text-3xl font-bold leading-tight text-cream">
            What building at 18
            <span className="italic text-gold-light"> actually</span> looks like.
          </div>
          {/* Side rail */}
          <div className="absolute bottom-24 right-3 flex flex-col items-center gap-5">
            {["♥", "💬", "↗"].map((g) => (
              <span key={g} className="flex h-10 w-10 items-center justify-center rounded-full bg-cream/10 text-cream backdrop-blur">
                {g}
              </span>
            ))}
          </div>
          {/* Handle */}
          <div className="absolute inset-x-4 bottom-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-light font-display text-sm font-bold text-black">
                H
              </span>
              <span className="text-sm font-semibold text-cream">@founderharish</span>
            </div>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-cream/15">
              <div className="h-full w-2/3 rounded-full bg-gold-light" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
