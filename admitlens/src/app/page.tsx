import { ArrowRight, ArrowUpRight, Check, GraduationCap, Map, PenLine, Trophy } from "lucide-react";
import Link from "next/link";
import { ProgramsDemo } from "@/components/landing/ProgramsDemo";
import { LandingNav } from "@/components/landing/LandingNav";
import { PauseToggle } from "@/components/landing/PauseToggle";
import { Phone, Ring } from "@/components/landing/Phone";
import { PrivacyPanel } from "@/components/landing/PrivacyPanel";
import { ReadersCarousel } from "@/components/landing/ReadersCarousel";
import { Reveal } from "@/components/landing/Reveal";
import { EvalScreen, NoteScreen, ProfileScreen, RetryScreen, RoadmapScreen, ScholarshipScreen } from "@/components/landing/Screens";
import { COLLEGES } from "@/data/colleges";
import { FUNDING_LIBRARY } from "@/data/funding";
import { RESOURCES } from "@/data/resources";
import { landingData } from "@/lib/landing";

// Example screens are computed by the real engines; refresh daily so scholarship deadlines stay current.
export const revalidate = 86400;

const pct = (x: number) => `${Math.round(x * 100)}%`;

const FAQ: [string, string][] = [
  ["How accurate are the chances?", "They're estimates from a transparent model, not predictions. Each college is anchored to its real admit rate, test ranges and typical GPA, and the most selective end is fitted to real outcomes from Harvard's admissions data released in SFFA v. Harvard. Nobody outside a college can see the rest of the applicant pool, so use your evaluation to find your biggest levers."],
  ["Do I have to enter my info for every college?", "No. You enter your grades, scores, activities, honors and essay once in your profile. It saves to your account automatically, and every college and program you evaluate uses it."],
  ["Does my major change my chances?", "At universities that admit by school or major, yes. NYU Stern, UIUC Computer Science and Berkeley EECS admit far fewer students than their universities overall, and drama or film programs decide mainly on auditions and portfolios. Pick the program and the evaluation changes with it. Where a program's admit rate is published we use it and cite the source; where it isn't, we say so."],
  ["Why do you ask about citizenship or visa status?", "Many scholarships are limited to citizens, permanent residents or specific statuses. Your answer only hides awards you can't receive. It's optional, and it never appears in a report or PDF."],
  ["Is AdmitLens free?", "Yes. There's nothing to buy and no premium tier."],
  ["Will it write my essays?", "No. It shows what's working and what isn't, line by line, and how a revision changes your odds. The words stay yours, which is what colleges expect."],
  ["Which colleges can I be evaluated for?", `${COLLEGES.length} colleges are profiled in depth, and any of the 6,000+ U.S. colleges in the Department of Education's College Scorecard can be searched and evaluated.`],
  ["I'm not a senior yet. Is this for me?", "Yes. 9th to 11th graders get a grade-by-grade roadmap built from what their dream school's readers look for, plus scholarships they can start on now."],
];

const PRIVACY = ["Your profile saves privately to your account", "Your visa answer only filters scholarships", "Passwords are hashed; sessions are signed", "Nothing is sold, shared or used for ads"];

function SectionHead({ eyebrow, title, body, center = false, onIvy = false }: { eyebrow: string; title: React.ReactNode; body?: string; center?: boolean; onIvy?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <div className={`eyebrow ${onIvy ? "!text-[#e0b65a]" : ""}`}>{eyebrow}</div>
      <h2 className="font-display mt-4 text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">{title}</h2>
      {body && <p className={`mt-4 text-[17px] leading-relaxed ${onIvy ? "text-[#f5f2ea]/75" : "text-muted"}`}>{body}</p>}
    </div>
  );
}

export default function Home() {
  const d = landingData();
  const verified = COLLEGES.filter((c) => c.verified).length;
  const steps = [
    { n: "01", title: "Enter your application once", body: "Grades, scores, activities, honors and essay. It saves automatically, so you never re-enter it for another college.", screen: <ProfileScreen d={d} />, tone: "ivy" as const, tint: "lp-tint-navy" },
    { n: "02", title: "Pick the college and program", body: "Its admissions reader rates every part of your file from 1 to 6 against the students that school or program admits.", screen: <EvalScreen d={d} />, tone: "paper" as const, tint: "lp-tint-brand" },
    { n: "03", title: "Get the first fix", body: "Every evaluation ends with the one change worth the most points, taken from your own file.", screen: <NoteScreen d={d} />, tone: "paper" as const, tint: "lp-tint-accent" },
    { n: "04", title: "Revise and re-score", body: "Change something and every number is re-read against the same college, so you see what it was worth.", screen: <RetryScreen d={d} />, tone: "paper" as const, tint: "lp-tint-brand" },
  ];
  const grades = [
    { icon: GraduationCap, tag: "Seniors", title: "Know where you stand before you submit.", body: "A written evaluation from the college you choose: how its office would review your file, your ratings, your odds and what to fix first.", screen: <EvalScreen d={d} />, tone: "paper" as const, tint: "lp-tint-brand", href: "/start" },
    { icon: Trophy, tag: "Scholarships", title: "Money you're actually eligible for.", body: `Matched to your GPA, state, grade and citizenship or visa status, closest to home first. The example on this screen qualifies for ${d.scholarshipCount} of ${FUNDING_LIBRARY.length} programs.`, screen: <ScholarshipScreen d={d} />, tone: "paper" as const, tint: "lp-tint-accent", href: "/start" },
    { icon: Map, tag: "9th to 11th grade", title: "A plan for every semester left.", body: "A grade-by-grade roadmap, prioritized by what your dream school's readers would flag in your file today.", screen: <RoadmapScreen d={d} />, tone: "ivy" as const, tint: "lp-tint-navy", href: "/start" },
    { icon: PenLine, tag: "Essays", title: "Feedback on every draft.", body: "Line-by-line notes on voice, specificity and reflection, plus how each revision changes your chances.", screen: <RetryScreen d={d} />, tone: "paper" as const, tint: "lp-tint-brand", href: "/start" },
  ];

  return (
    <div className="overflow-x-clip">
      <LandingNav />

      {/* Hero */}
      <section className="relative px-4 pb-16 pt-32 sm:px-6 sm:pt-40">
        <div className="grid-bg absolute inset-0 opacity-50 [mask-image:radial-gradient(60%_55%_at_50%_25%,black,transparent)]" aria-hidden />
        <Reveal className="relative mx-auto max-w-4xl text-center">
          <div className="eyebrow">Admissions reads and scholarships</div>
          <h1 className="font-display mt-6 text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            Your first read shouldn’t be the <em className="text-brand">real</em> one.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Enter your application once and have it read the way your dream school's office reads it, down to the program you're applying to: rated, questioned and given a verdict. Then see every scholarship you actually qualify for, visa status included.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/start" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-[15px] font-medium text-[var(--surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition hover:brightness-110">
              Get started free <ArrowRight size={17} />
            </Link>
            <Link href="/signin" className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-6 py-3.5 text-[15px] font-medium transition hover:bg-surface-2">
              I have an account
            </Link>
          </div>
        </Reveal>

        <Reveal delay={150} className="relative mx-auto mt-16 max-w-5xl">
          <div className="lp-ivy relative h-[520px] overflow-hidden rounded-[2.25rem] shadow-card sm:h-[580px]">
            <div className="grid-bg absolute inset-0 opacity-20" aria-hidden />
            <div className="absolute inset-x-0 top-12 flex justify-center">
              <Phone tone="paper">
                <EvalScreen d={d} />
              </Phone>
            </div>
            <div className="lp-on-ivy absolute left-8 top-16 hidden max-w-[240px] rounded-2xl p-4 backdrop-blur md:block">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#e0b65a]">In committee</div>
              <p className="font-display mt-1.5 text-[17px] italic leading-snug">{d.mich.committee}</p>
            </div>
            <div className="lp-on-ivy absolute bottom-14 right-8 hidden w-[230px] rounded-2xl p-4 backdrop-blur md:block">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#e0b65a]">Same file at {d.harvard.short}</div>
              <div className="font-display mt-1 text-3xl font-semibold">{pct(d.harvard.after)}</div>
              <div className="text-xs text-[#f5f2ea]/70">{d.harvard.decision}</div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted">Example screens. Every number is computed by AdmitLens for an example application.</p>
        </Reveal>

        <div className="relative mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          {[
            [String(COLLEGES.length), "colleges profiled in depth", `${verified} checked against their latest cycle`],
            ["6,000+", "colleges searchable live", "U.S. Dept. of Education data"],
            [String(FUNDING_LIBRARY.length), "funding programs screened", "by status, grade and location"],
            ["$0", "to use", "no premium tier"],
          ].map(([n, l, s]) => (
            <div key={l} className="bg-surface px-5 py-5">
              <div className="font-display text-3xl font-semibold tabular-nums">{n}</div>
              <div className="mt-1 text-sm">{l}</div>
              <div className="text-xs text-muted">{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHead eyebrow="How it works" title="From profile to plan in four steps." body="One saved profile powers everything, so you never type the same thing twice." />
            <PauseToggle target="steps" />
          </div>
          <div id="steps" className="mt-12 grid gap-5 md:grid-cols-2">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={(i % 2) * 100} className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-card">
                <div className={`${s.tint} relative flex h-[400px] justify-center overflow-hidden pt-8`}>
                  <Phone tone={s.tone}>{s.screen}</Phone>
                </div>
                <div className="flex gap-4 border-t border-line p-6">
                  <span className="font-mono text-sm text-accent">{s.n}</span>
                  <div>
                    <h3 className="font-display text-2xl font-semibold tracking-tight">{s.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{s.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Deep dives */}
      <section className="px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <Reveal className="paper grid items-center gap-10 overflow-hidden rounded-[2rem] border border-line p-6 shadow-card sm:p-12 lg:grid-cols-[0.95fr_1.05fr]">
            <SectionHead eyebrow="Program-specific" title="NYU Tisch isn't NYU Stern." body="Pick the college and the school or major you're applying to. Each one has its own admit rate and its own reader: engineering leans on math, business on leadership, and drama and film on the audition or portfolio." />
            <ProgramsDemo data={d.programs} />
          </Reveal>

          <Reveal className="lp-ivy grid items-center gap-10 overflow-hidden rounded-[2rem] p-6 shadow-card sm:p-12 lg:grid-cols-[0.95fr_1.05fr]">
            <SectionHead onIvy eyebrow="The evaluation" title="Ratings, reasons and a written review." body="Academics, rigor, testing, activities, honors and essay are each rated against the college you pick. Then you get a full paragraph on how that office would review your file, and the change worth the most." />
            <div className="rounded-[1.75rem] bg-surface p-6 text-ink shadow-card sm:p-7">
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <Ring value={d.mich.chance} label={pct(d.mich.chance)} sub={`at ${d.mich.short}`} size={140} />
                <div className="min-w-0">
                  <div className="eyebrow">Likely outcome</div>
                  <div className="font-display mt-2 text-xl font-semibold leading-snug">{d.mich.decision}</div>
                  <p className="mt-2 text-sm text-muted">{d.mich.committee.replace(/"/g, "")}</p>
                </div>
              </div>
              <div className="rule my-5" />
              <div className="flex items-start gap-3 rounded-xl bg-brand-soft/60 p-3.5 text-sm">
                <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-brand" />
                <span>
                  <b>Biggest lever:</b> {d.mich.improvement?.title.toLowerCase() ?? "revise your personal statement"}
                  {d.mich.improvement && <span className="text-good"> (+{d.mich.improvement.gain.toFixed(1)} pts)</span>}
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal className="paper grid items-center gap-10 overflow-hidden rounded-[2rem] border border-line p-6 shadow-card sm:p-12 lg:grid-cols-[0.95fr_1.05fr]">
            <SectionHead eyebrow="Revise and re-score" title="See what a revision is worth." body="The example essay below went from a cliché-heavy first draft to a specific second one. Same student, same college, re-read." />
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 border-b border-line bg-surface-2/60 px-5 py-3 text-xs font-medium text-muted">
                <span />
                <span className="w-14 text-right">Draft 1</span>
                <span className="w-14 text-right text-brand">Draft 2</span>
              </div>
              {[
                ["Essay score", String(d.draft1.score), String(d.draft2.score)],
                ["Essay grade", d.draft1.grade, d.draft2.grade],
                ["Specificity", String(d.draft1.specificity), String(d.draft2.specificity)],
                [`Chance at ${d.mich.short}`, pct(d.mich.before), pct(d.mich.chance)],
                [`Chance at ${d.harvard.short}`, pct(d.harvard.before), pct(d.harvard.after)],
              ].map(([l, a, b]) => (
                <div key={l} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-b border-line px-5 py-4 last:border-0">
                  <span className="text-[15px]">{l}</span>
                  <span className="w-14 text-right font-display text-xl tabular-nums text-muted line-through decoration-1">{a}</span>
                  <span className="w-14 text-right font-display text-2xl font-semibold tabular-nums text-good">{b}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Different readers */}
      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHead eyebrow="Same file, four readers" title="The bar moves with the college." body="One application, read by four offices. Each is calibrated to that school's real admit rate, score ranges and stated priorities." />
          </Reveal>
          <div className="mt-10">
            <ReadersCarousel readers={d.readers} />
          </div>
        </div>
      </section>

      {/* For every grade */}
      <section id="grades" className="scroll-mt-24 border-y border-line bg-surface-2/40 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHead center eyebrow="For every grade" title="From freshman year to decision day." body="The evaluation, the money and the plan, wherever you are in high school." />
          </Reveal>
          <div className="mt-16 space-y-20">
            {grades.map((g, i) => (
              <Reveal key={g.tag} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
                <div className={`${g.tint} relative flex h-[420px] justify-center overflow-hidden rounded-[1.75rem] border border-line pt-12 sm:h-[480px] ${i % 2 ? "md:order-2" : ""}`}>
                  <Phone tone={g.tone}>{g.screen}</Phone>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-brand">
                    <g.icon size={17} /> {g.tag}
                  </div>
                  <h3 className="font-display mt-3 text-4xl font-medium leading-[1.08] tracking-tight sm:text-[2.75rem]">{g.title}</h3>
                  <p className="mt-4 max-w-md text-[17px] leading-relaxed text-muted">{g.body}</p>
                  <Link href={g.href} className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
                    Start free <ArrowRight size={15} />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
        <Reveal className="lp-ivy mx-auto grid max-w-6xl items-start gap-10 overflow-hidden rounded-[2rem] p-6 shadow-card sm:p-12 lg:grid-cols-2">
          <div>
            <SectionHead onIvy eyebrow="Your data" title="Private by design." body="Your application is personal. Here's exactly where each part of it goes." />
            <ul className="mt-8 space-y-4">
              {PRIVACY.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[16px]">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e0b65a] text-[#1d3b31]">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <PrivacyPanel />
        </Reveal>
      </section>

      {/* Real admits */}
      <section className="px-4 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <SectionHead eyebrow="From students who got in" title="Read the real thing." body="Colleges publish essays from admitted students and run blogs written by current undergrads. We collect the official ones and link to the originals." />
            <Link href="/learn" className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium transition hover:bg-surface-2">
              Browse all resources <ArrowRight size={15} />
            </Link>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {RESOURCES.filter((r) => r.kind === "Essays that worked" || r.kind === "Student blogs")
              .slice(0, 4)
              .map((r) => (
                <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="group rounded-2xl border border-line bg-surface p-5 shadow-card transition hover:border-brand">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-muted">
                    <span>{r.kind}</span>
                    <ArrowUpRight size={14} className="transition group-hover:text-brand" />
                  </div>
                  <div className="font-display mt-3 text-lg font-semibold leading-snug">{r.title}</div>
                  <div className="text-sm text-brand">{r.publisher}</div>
                </a>
              ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <SectionHead center eyebrow="Straight answers" title="Questions students ask first" />
          </Reveal>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-24 sm:px-6">
        <Reveal className="paper relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-line px-8 py-16 text-center shadow-card">
          <div className="eyebrow">Start here</div>
          <h2 className="font-display mx-auto mt-4 max-w-2xl text-4xl font-medium tracking-tight sm:text-5xl">Your dream school is a plan, not a lottery ticket.</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">A one-minute questionnaire, then enter your application once. Every college and program uses it.</p>
          <Link href="/start" className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-[15px] font-medium text-[var(--surface)] transition hover:brightness-110">
            Get started free <ArrowRight size={17} />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
