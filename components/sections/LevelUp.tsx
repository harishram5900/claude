import { Counter } from "@/components/ui/Counter";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { AgentPipeline } from "@/components/sections/AgentPipeline";
import { links } from "@/lib/links";

const traction = [
  { value: 100, suffix: "+", label: "Businesses in the Chicago beta", note: "10+ tracked closely" },
  { value: 50000, suffix: "+", label: "Platform users", note: "across 70+ countries" },
  { value: 36000, suffix: "+", label: "Unique visitors to V1", note: "GA4-verified, built solo" },
  { value: 200, suffix: "+", label: "Student startups helped", note: "off the ground" },
];

const recognition = [
  "Harvard x VTSP Community Award",
  "2nd place, Congressional App Challenge",
  "Recognized — TEAMS (Tamil Entrepreneur Association USA) pitch competition",
];

const stack = [
  "Next.js",
  "Tailwind",
  "Framer Motion",
  "LLM research + scripting",
  "AI video generation",
  "Automated editing pipeline",
  "Direct publishing APIs",
];

/** The flagship case study — deliberately the largest section on the page. */
export function LevelUp() {
  return (
    <section id="work" aria-labelledby="work-heading" className="grain relative overflow-hidden bg-black">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[50rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(176,141,62,0.18),transparent_65%)] blur-2xl" />

      <div className="relative z-10 mx-auto max-w-page px-4 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        {/* ---------- Title block ---------- */}
        <Reveal>
          <SectionLabel index="02">The flagship</SectionLabel>
        </Reveal>
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <h2 id="work-heading" className="font-display text-display-lg font-bold text-cream">
              Level&nbsp;Up<span className="text-gold-light">.</span>
            </h2>
            <p className="mt-6 max-w-2xl font-display text-2xl leading-snug text-cream/90 sm:text-3xl">
              A team of AI agents that runs a company&apos;s marketing{" "}
              <span className="italic text-gold-light">end-to-end.</span>
            </p>
          </Reveal>
          <Reveal className="flex flex-col justify-end gap-4 lg:col-span-5">
            <p className="text-base leading-relaxed text-gray-light sm:text-lg">
              Trend and competitor research, brand-specific scripts and content, video editing, visual asset
              generation, content review, publishing across TikTok, Instagram Reels, YouTube Shorts and Facebook — and
              performance-based adjustment after every post.
            </p>
            <a
              href={links.levelUpWaitlist}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex w-fit items-center gap-2 border-b border-gold-light/40 pb-1 text-sm font-medium text-gold-light transition-colors hover:border-gold-light"
            >
              Join the live waitlist
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                ↗
              </span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Reveal>
        </div>

        {/* ---------- The agent pipeline visual ---------- */}
        <AgentPipeline />

        {/* ---------- Traction numbers ---------- */}
        <Reveal group className="mt-20 grid grid-cols-1 gap-px overflow-hidden rounded-3xl bg-cream/10 sm:grid-cols-2 lg:grid-cols-4">
          {traction.map((t) => (
            <RevealItem key={t.label} className="bg-black p-7 sm:p-9">
              <p className="font-display text-5xl font-bold text-gold-light sm:text-6xl">
                <Counter value={t.value} suffix={t.suffix} />
              </p>
              <p className="mt-4 text-sm font-medium text-cream">{t.label}</p>
              <p className="mt-1 text-sm text-gray-light">{t.note}</p>
            </RevealItem>
          ))}
        </Reveal>

        <Reveal className="mt-6 rounded-3xl border border-gold-light/25 bg-gradient-to-r from-gold/15 via-transparent to-transparent p-7 sm:p-9">
          <p className="font-display text-3xl font-bold text-cream sm:text-4xl">
            <span className="text-gold-light">2X</span> client results at{" "}
            <span className="text-gold-light">half</span> the effort.
          </p>
          <p className="mt-2 text-sm text-gray-light">Chicago beta — 100+ businesses, 10+ tracked closely.</p>
        </Reveal>

        {/* ---------- Story: origin → today → status ---------- */}
        <Reveal group step={0.12} className="mt-24 grid gap-12 lg:grid-cols-3 lg:gap-10">
          <RevealItem className="border-t border-cream/15 pt-6">
            <p className="text-xs uppercase tracking-[0.25em] text-gold-light">The origin · V1</p>
            <p className="mt-4 leading-relaxed text-cream/85">
              Built solo, ~5–6 months before Level Up became a company. It analyzed viral scripts and content in a
              creator&apos;s niche and auto-wrote content scripts — no signup required — and drew{" "}
              <strong className="font-semibold text-cream">36,000+ unique visitors</strong> that validated the idea.
            </p>
          </RevealItem>
          <RevealItem className="border-t border-cream/15 pt-6">
            <p className="text-xs uppercase tracking-[0.25em] text-gold-light">Today · V2</p>
            <p className="mt-4 leading-relaxed text-cream/85">
              Building the full autonomous agent system full-time with co-founder &amp; CTO{" "}
              <strong className="font-semibold text-cream">Prajith Kocherla</strong> (previously founded Lexiwrit) and
              a <strong className="font-semibold text-cream">23-person team</strong>.
            </p>
          </RevealItem>
          <RevealItem className="border-t border-cream/15 pt-6">
            <p className="text-xs uppercase tracking-[0.25em] text-gold-light">Status</p>
            <p className="mt-4 leading-relaxed text-cream/85">
              <strong className="font-semibold text-cream">Pre-revenue by design</strong> — prioritizing product and
              real users before turning on monetization. Preparing a Y&nbsp;Combinator application.
            </p>
          </RevealItem>
        </Reveal>

        {/* ---------- Recognition + stack ---------- */}
        <div className="mt-20 grid gap-10 lg:grid-cols-2">
          <Reveal>
            <h3 className="text-xs uppercase tracking-[0.25em] text-gray-light">Recognition</h3>
            <ul className="mt-5 space-y-3">
              {recognition.map((r) => (
                <li key={r} className="flex gap-3 text-cream/90">
                  <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-gold-light" />
                  {r}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal>
            <h3 className="text-xs uppercase tracking-[0.25em] text-gray-light">Stack</h3>
            <ul className="mt-5 flex flex-wrap gap-2">
              {stack.map((s) => (
                <li key={s} className="rounded-full border border-cream/15 px-4 py-1.5 text-sm text-cream/85">
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
