import { ArrowRight, ClipboardList, FileUp, GraduationCap, Map, PenLine, ShieldCheck, Trophy } from "lucide-react";
import Link from "next/link";
import { ButtonLink, Card, fmtPct } from "@/components/ui";
import { COLLEGES, getCollege } from "@/data/colleges";
import { SCHOLARSHIPS } from "@/data/scholarships";
import { evaluate } from "@/lib/engine";
import { SAMPLE_PROFILE } from "@/lib/sample";

const FEATURES = [
  { icon: GraduationCap, title: "Admissions simulator", body: "A reader calibrated to the exact college you pick grades every part of your file on a 1–6 scale, estimates your chances and writes the committee memo.", href: "/simulate" },
  { icon: PenLine, title: "Essay Lab", body: "Live scoring for voice, specificity, structure and reflection. College-specific 'why us' checks. Coaching, never ghostwriting.", href: "/essays" },
  { icon: Trophy, title: "Scholarship matching", body: `${SCHOLARSHIPS.length} major national and state programs ranked by your grade, GPA, state, major and circumstances.`, href: "/scholarships" },
  { icon: ClipboardList, title: "College tracker", body: "Every deadline, checklist and decision in one place, with list-balance checks counselors swear by.", href: "/tracker" },
  { icon: Map, title: "Roadmap", body: "A grade-by-grade map from 9th grade to decision day, built around the gaps your dream school would flag.", href: "/roadmap" },
  { icon: FileUp, title: "Common App import", body: "Upload your Common App PDF once. Every tool reads from the same profile.", href: "/profile" },
];

export default function Home() {
  const demo = ["harvard", "umich", "uiuc", "uic"].map((id) => evaluate(SAMPLE_PROFILE, getCollege(id)!));
  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="relative -mx-4 -mt-8 overflow-hidden px-4 pb-6 pt-16 sm:-mx-6 sm:-mt-10 sm:px-6 sm:pt-24">
        <div className="grid-bg absolute inset-0 opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" aria-hidden />
        <div className="glow absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="rise mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-good" /> Calibrated on published admissions data from {COLLEGES.length} colleges · live data for every US college
          </div>
          <h1 className="rise font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            See your application <span className="bg-gradient-to-r from-brand to-brand-2 bg-clip-text text-transparent">the way they will.</span>
          </h1>
          <p className="rise mx-auto mt-6 max-w-xl text-lg text-muted">
            A Harvard reader and a UIC reader don't grade the same file the same way. AdmitLens simulates the admissions officer at the college you choose, tells you your odds and shows exactly how to raise them.
          </p>
          <div className="rise mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/profile" className="px-5 py-3 text-base">
              <FileUp size={18} /> Import Common App
            </ButtonLink>
            <ButtonLink href="/simulate" variant="secondary" className="px-5 py-3 text-base">
              Try the simulator <ArrowRight size={18} />
            </ButtonLink>
          </div>
        </div>

        {/* Live demo */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="mb-3 text-center text-sm text-muted">
            Same student: <b className="text-ink">3.86 GPA · 1460 SAT · state science medalist · first-gen</b>. Four different readers:
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {demo.map((e) => (
              <Card key={e.college.id} className="rise p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{e.college.short}</div>
                  <div className="text-xs text-muted">{(e.college.admitRate * 100).toFixed(e.college.admitRate < 0.1 ? 1 : 0)}% admit</div>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div className="font-display text-4xl font-semibold tabular-nums">{fmtPct(e.chance)}</div>
                  <div className="text-right text-xs">
                    <div className="text-muted">Academic rating</div>
                    <div className="font-display text-lg font-semibold">{e.dimensions[0].rating}/6</div>
                  </div>
                </div>
                <div className="mt-3 line-clamp-3 border-t border-line pt-3 text-xs italic text-muted">{e.committeeLine}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Everything between you and the acceptance letter</h2>
          <p className="mt-3 text-muted">One profile powers every tool, so you never fill out the same information twice.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.title} href={f.href} className="group">
              <Card className="h-full p-6 transition group-hover:-translate-y-0.5 group-hover:border-brand">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                  <f.icon size={20} />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{f.body}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* How grading differs */}
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Graded by the standard that actually applies to you</h2>
          <p className="mt-4 text-muted">
            Every college in AdmitLens carries its own admit rate, middle-50% test scores, typical GPA, test policy, early-round advantage, residency preferences and stated priorities. The reader's harshness, the weight on essays versus grades and the ceiling on anyone's odds all shift with the school.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "1–6 reader ratings, the scale highly selective offices use internally",
              "What-if simulation: every suggestion is re-scored to show the real gain",
              "Deterministic and tested: no two different files get the same read",
              "Optional AI deep read in the voice of a reader at your chosen school",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <ShieldCheck size={18} className="shrink-0 text-good" /> {t}
              </li>
            ))}
          </ul>
          <ButtonLink href="/about" variant="secondary" className="mt-6">
            How the model works
          </ButtonLink>
        </div>
        <Card className="p-6">
          <div className="mb-4 text-sm font-medium">Academic rating for the same 3.86 / 1460 transcript</div>
          <div className="space-y-3">
            {["harvard", "stanford", "umich", "uiuc", "purdue", "uic"].map((id) => {
              const e = evaluate(SAMPLE_PROFILE, getCollege(id)!);
              const r = e.dimensions[0].rating;
              return (
                <div key={id} className="flex items-center gap-3">
                  <div className="w-24 text-sm">{e.college.short}</div>
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <div key={n} className={`h-6 flex-1 rounded ${n === r ? (r <= 2 ? "bg-good" : r === 3 ? "bg-brand" : "bg-bad") : "bg-surface-2"}`} />
                    ))}
                  </div>
                  <div className="w-10 text-right font-display font-semibold">{r}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted">
            <span>1 · exceptional</span>
            <span>6 · not competitive</span>
          </div>
        </Card>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-10 text-center shadow-card">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Your dream school is a plan, not a lottery ticket.</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">Start with your profile. It takes five minutes, or thirty seconds with a Common App PDF.</p>
        <ButtonLink href="/profile" className="mt-6 px-6 py-3 text-base">
          Build my profile <ArrowRight size={18} />
        </ButtonLink>
      </section>
    </div>
  );
}
