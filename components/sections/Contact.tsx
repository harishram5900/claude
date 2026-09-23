import { Magnetic } from "@/components/ui/Magnetic";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { hrefFor, isPlaceholder, links } from "@/lib/links";

const channels = [
  { label: "Email", value: links.email, href: hrefFor(links.email, "email") },
  { label: "LinkedIn", value: links.linkedin, href: hrefFor(links.linkedin) },
  { label: "Resume", value: links.resume, href: hrefFor(links.resume) },
  { label: "Instagram", value: links.instagram, href: hrefFor(links.instagram) },
  { label: "YouTube", value: links.youtube, href: hrefFor(links.youtube) },
];

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="grain relative overflow-hidden bg-black">
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-1/2 left-1/2 h-[60rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(176,141,62,0.25),transparent_60%)] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-page px-4 py-28 sm:px-8 sm:py-36 lg:px-12 lg:py-48">
        <Reveal>
          <SectionLabel index="08">Contact</SectionLabel>
        </Reveal>
        <Reveal>
          <h2 id="contact-heading" className="mt-10 font-display text-display-xl font-bold text-cream">
            Let&apos;s build something
            <br />
            <span className="italic text-gold-light">that matters.</span>
          </h2>
        </Reveal>

        <Reveal className="mt-12">
          <Magnetic strength={0.2}>
            <a
              href={hrefFor(links.email, "email")}
              className="inline-flex items-center gap-3 rounded-full bg-gold-light px-8 py-4 text-base font-semibold text-black transition-colors hover:bg-cream"
            >
              Get in touch <span aria-hidden="true">→</span>
            </a>
          </Magnetic>
        </Reveal>

        <Reveal group step={0.07} className="mt-20 grid grid-cols-1 border-t border-cream/15 sm:grid-cols-2 lg:grid-cols-5">
          {channels.map((c) => (
            <RevealItem key={c.label}>
              <a
                href={c.href}
                {...(!isPlaceholder(c.value) && c.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group flex items-center justify-between border-b border-cream/15 py-6 pr-4 transition-colors hover:text-gold-light lg:border-b-0 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0"
              >
                <span>
                  <span className="block text-xs uppercase tracking-[0.25em] text-gray-light">{c.label}</span>
                  <span className="mt-1 block text-sm text-cream/80 group-hover:text-gold-light">
                    {isPlaceholder(c.value) ? c.value : c.label === "Email" ? c.value : "Open"}
                  </span>
                </span>
                <span aria-hidden="true" className="text-gold-light transition-transform group-hover:translate-x-1">
                  ↗
                </span>
              </a>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
