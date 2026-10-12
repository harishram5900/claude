import { ArrowRight, ArrowUpRight, ClipboardList, FileUp, GraduationCap, Library, Map, PenLine, Trophy } from "lucide-react";
import Link from "next/link";
import { ButtonLink, Card, fmtPct } from "@/components/ui";
import { COLLEGES, getCollege } from "@/data/colleges";
import { RESOURCES } from "@/data/resources";
import { FUNDING_LIBRARY } from "@/data/funding";
import { evaluate } from "@/lib/engine";
import { SAMPLE_PROFILE } from "@/lib/sample";

const FEATURES = [
  { icon: GraduationCap, title: "Admissions simulator", body: "A reader calibrated to the college you choose rates every part of your file from 1 to 6, estimates your odds and explains its reasoning.", href: "/simulate" },
  { icon: PenLine, title: "Essay Lab", body: "Live feedback on voice, specificity, structure and reflection, plus checks for 'why us' essays that could describe any school.", href: "/essays" },
  { icon: Map, title: "Roadmap", body: "A grade-by-grade plan to your dream school, prioritized by the gaps its readers would flag.", href: "/roadmap" },
  { icon: ClipboardList, title: "List builder & tracker", body: "A balanced list of reaches, targets and likely schools, with deadlines and checklists filled in.", href: "/tracker" },
  { icon: Trophy, title: "GrantScout funding finder", body: "Scholarships, grants, fellowships and paid programs filtered by your citizenship status, grade and location, sorted closest first and ranked by your odds.", href: "/scholarships" },
  { icon: Library, title: "Learn from real admits", body: "Essays and blogs by admitted students, published on the colleges' own sites.", href: "/learn" },
];

const FAQ = [
  {
    q: "How accurate are the chances?",
    a: "They're estimates from a transparent model, not predictions. Each college is anchored to its real admit rate, test ranges and typical GPA. The most selective end is fitted to real outcomes from Harvard's admissions data released in SFFA v. Harvard, where the model matches actual admit rates for every academic decile to within about 20%. No outside tool can see the rest of the applicant pool or a school's institutional needs, so use AdmitLens to find your biggest levers, not to forecast your fate.",
  },
  {
    q: "Does it connect to my Common App account?",
    a: "Common App doesn't let outside apps sign in to student accounts. Instead, download your application PDF from Common App's Preview and upload it. AdmitLens reads it in your browser and shows you every field to confirm before saving.",
  },
  {
    q: "Where does my information go?",
    a: "Your profile, essays and tracker are saved only in your browser on this device. Nothing is sent to a server unless you request an AI read, and AdmitLens has no accounts to breach.",
  },
  {
    q: "Will it write my essays?",
    a: "No. AdmitLens points out what's working and what isn't, line by line, but the words stay yours. Colleges expect your own writing.",
  },
];

function ReaderCard() {
  const e = evaluate(SAMPLE_PROFILE, getCollege("harvard")!);
  const tone = (r: number) => (r <= 2 ? "bg-good-soft text-good" : r === 3 ? "bg-brand-soft text-brand" : r === 4 ? "bg-warn-soft text-warn" : "bg-bad-soft text-bad");
  return (
    <div className="relative">
      <div className="absolute -inset-x-6 -bottom-6 top-10 -z-10 rotate-2 rounded-[28px] border border-line bg-surface-2/70" aria-hidden />
      <Card className="paper overflow-hidden rounded-[24px]">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Reader card · simulated</div>
            <div className="font-display text-lg font-semibold">Harvard College</div>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-semibold tabular-nums">{fmtPct(e.chance)}</div>
            <div className="text-[11px] text-muted">estimated chance</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 px-6 py-5 text-sm">
          {e.dimensions.slice(0, 6).map((d) => (
            <div key={d.key} className="flex items-center justify-between gap-2">
              <span className="truncate text-muted">{d.label}</span>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md font-display text-sm font-semibold ${tone(d.rating)}`}>{d.rating}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-line px-6 py-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Committee note</div>
          <p className="mt-1 font-display text-[15px] italic leading-snug">{e.committeeLine}</p>
        </div>
        <div className="flex items-center justify-between border-t border-line bg-surface-2/60 px-6 py-3 text-xs text-muted">
          <span>Sample applicant · 3.86 GPA · 1460 SAT</span>
          <span className="rounded-full border border-accent/50 px-2 py-0.5 font-medium text-accent">{e.category}</span>
        </div>
      </Card>
    </div>
  );
}

export default function Home() {
  const demo = ["harvard", "umich", "uiuc", "uic"].map((id) => evaluate(SAMPLE_PROFILE, getCollege(id)!));
  const verified = COLLEGES.filter((c) => c.verified).length;
  return (
    <div className="space-y-28">
      {/* Hero */}
      <section className="relative -mx-4 -mt-8 px-4 pt-14 sm:-mx-6 sm:-mt-10 sm:px-6 sm:pt-20">
        <div className="grid-bg absolute inset-0 opacity-50 [mask-image:radial-gradient(60%_60%_at_30%_30%,black,transparent)]" aria-hidden />
        <div className="relative grid items-center gap-14 lg:grid-cols-[1.15fr_1fr]">
          <div className="rise">
            <div className="eyebrow">College admissions, read from the other side of the desk</div>
            <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
              Know how your application <em className="text-brand">reads</em> before anyone else does.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              A reader at Harvard and a reader at UIC hold your file to different standards. AdmitLens simulates the one at the college you choose: what they'd rate, what they'd question, and what would change their mind.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/profile" className="px-5 py-3 text-[15px]">
                <FileUp size={17} /> Import your Common App
              </ButtonLink>
              <ButtonLink href="/simulate" variant="secondary" className="px-5 py-3 text-[15px]">
                Try it with a sample student <ArrowRight size={17} />
              </ButtonLink>
            </div>
            <p className="mt-5 text-xs text-muted">Free · no account · your data stays in your browser</p>
          </div>
          <div className="rise lg:pl-6">
            <ReaderCard />
          </div>
        </div>

        {/* Honest proof strip */}
        <div className="relative mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          {[
            [String(COLLEGES.length), "colleges profiled in depth", `${verified} checked against their latest reported cycle`],
            ["6,000+", "colleges searchable live", "U.S. Dept. of Education College Scorecard"],
            [String(FUNDING_LIBRARY.length), "funding programs screened", "filtered by status, grade and location"],
            ["0", "accounts or data sold", "everything stays on your device"],
          ].map(([n, l, s]) => (
            <div key={l} className="bg-surface px-5 py-5">
              <div className="font-display text-3xl font-semibold tabular-nums">{n}</div>
              <div className="mt-1 text-sm">{l}</div>
              <div className="text-xs text-muted">{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Same file, different readers */}
      <section>
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-xl">
            <div className="eyebrow">Same file, four readers</div>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight">The bar moves with the college.</h2>
          </div>
          <p className="max-w-md text-sm text-muted">
            One student (3.86 GPA, 1460 SAT, state science medalist, first-generation), read by four offices. The academic rating uses the reader's 1–6 scale, where 1 means exceptional for that pool.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {demo.map((e) => (
            <Link key={e.college.id} href={`/simulate?college=${e.college.id}`} className="group">
              <Card className="h-full p-5 transition group-hover:-translate-y-0.5 group-hover:border-brand">
                <div className="flex items-baseline justify-between">
                  <div className="font-display text-xl font-semibold">{e.college.short}</div>
                  <div className="font-mono text-[11px] text-muted">{(e.college.admitRate * 100).toFixed(e.college.admitRate < 0.1 ? 1 : 0)}% admit</div>
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <div className="font-display text-5xl font-medium tabular-nums">{fmtPct(e.chance)}</div>
                    <div className="text-xs text-muted">estimated chance</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-semibold">{e.dimensions[0].rating}<span className="text-sm text-muted">/6</span></div>
                    <div className="text-xs text-muted">academic rating</div>
                  </div>
                </div>
                <div className="rule my-4" />
                <p className="line-clamp-3 text-xs italic leading-relaxed text-muted">{e.committeeLine}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <div className="eyebrow">How it works</div>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-tight">Three steps, about five minutes.</h2>
          <p className="mt-4 text-muted">One profile powers every tool, so you never type the same thing twice.</p>
        </div>
        <ol className="space-y-px overflow-hidden rounded-2xl border border-line bg-line">
          {[
            ["Bring your application", "Upload the PDF from Common App's Preview, or fill in the profile. You review every imported field before it's saved."],
            ["Pick your dream school", "A reader calibrated to that school's admit rate, score ranges and stated priorities rates your file and writes the committee memo."],
            ["Follow the plan", "Every suggestion is re-scored to show its real effect on your odds, then laid out on a grade-by-grade roadmap with a balanced college list."],
          ].map(([t, b], i) => (
            <li key={t} className="flex gap-5 bg-surface p-6">
              <span className="font-mono text-sm text-accent">0{i + 1}</span>
              <div>
                <div className="font-display text-lg font-semibold">{t}</div>
                <p className="mt-1 text-sm text-muted">{b}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section>
        <div className="mb-8 max-w-xl">
          <div className="eyebrow">Everything in one place</div>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-tight">From freshman year to decision day.</h2>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.title} href={f.href} className="group bg-surface p-7 transition hover:bg-surface-2/60">
              <f.icon size={20} className="text-brand" />
              <h3 className="mt-5 flex items-center gap-1 font-display text-xl font-semibold">
                {f.title} <ArrowUpRight size={16} className="text-muted opacity-0 transition group-hover:opacity-100" />
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Real admits */}
      <section className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <div className="eyebrow">From students who got in</div>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-tight">Read the real thing.</h2>
          <p className="mt-4 text-muted">
            Colleges publish essays from admitted students and run blogs written by current undergrads. We collect the official ones in one place and link to the original pages.
          </p>
          <ButtonLink href="/learn" variant="secondary" className="mt-6">
            Browse all resources <ArrowRight size={16} />
          </ButtonLink>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {RESOURCES.filter((r) => r.kind === "Essays that worked" || r.kind === "Student blogs").slice(0, 4).map((r) => (
            <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="group">
              <Card className="h-full p-5 transition group-hover:border-brand">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-muted">
                  <span>{r.kind}</span>
                  <ArrowUpRight size={14} className="transition group-hover:text-brand" />
                </div>
                <div className="mt-3 font-display text-lg font-semibold leading-snug">{r.title}</div>
                <div className="text-sm text-brand">{r.publisher}</div>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{r.takeaway}</p>
              </Card>
            </a>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl">
        <div className="eyebrow">Straight answers</div>
        <h2 className="mt-3 font-display text-4xl font-medium tracking-tight">Questions students ask first</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold">
                {f.q}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="paper relative overflow-hidden rounded-[28px] border border-line px-8 py-16 text-center shadow-card">
        <div className="eyebrow">Start here</div>
        <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-medium tracking-tight sm:text-5xl">Your dream school is a plan, not a lottery ticket.</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">Five minutes to build your profile, or thirty seconds with your Common App PDF.</p>
        <ButtonLink href="/profile" className="mt-8 px-6 py-3 text-[15px]">
          Build my profile <ArrowRight size={17} />
        </ButtonLink>
      </section>
    </div>
  );
}
