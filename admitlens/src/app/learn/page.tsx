import { ArrowUpRight, BookOpenText, Landmark, MessagesSquare, PenLine } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { RESOURCES, type Resource } from "@/data/resources";

export const metadata = { title: "Learn from real admits" };

const SECTIONS: { kind: Resource["kind"]; icon: typeof PenLine; blurb: string }[] = [
  { kind: "Essays that worked", icon: PenLine, blurb: "Real essays by admitted students, published by the colleges themselves with permission." },
  { kind: "Student blogs", icon: MessagesSquare, blurb: "Current students writing on official admissions sites about life, classes, and applying." },
  { kind: "From the admissions office", icon: Landmark, blurb: "What admissions offices say, in their own words, about how they read." },
  { kind: "Applications & aid", icon: BookOpenText, blurb: "Primary sources for prompts, costs, and financial aid." },
];

export default function LearnPage() {
  return (
    <div className="rise">
      <PageHeader
        eyebrow="Learn from real admits"
        title="Hear it from the students who got in"
        subtitle="Every link goes to a college's or agency's own website: essays admitted students chose to share, blogs written by current students, and admissions offices explaining how they decide."
      />
      <div className="space-y-12">
        {SECTIONS.map(({ kind, icon: Icon, blurb }) => (
          <section key={kind}>
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-line pb-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand">
                  <Icon size={16} />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-tight">{kind}</h2>
                  <p className="text-sm text-muted">{blurb}</p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {RESOURCES.filter((r) => r.kind === kind).map((r) => (
                <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="group">
                  <Card className="flex h-full flex-col p-5 transition group-hover:-translate-y-0.5 group-hover:border-brand">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted">{r.publisher}</div>
                    <div className="mt-1 flex items-start justify-between gap-2">
                      <h3 className="font-display text-lg font-semibold leading-snug">{r.title}</h3>
                      <ArrowUpRight size={18} className="mt-1 shrink-0 text-muted transition group-hover:text-brand" />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{r.takeaway}</p>
                    <div className="mt-auto pt-4 text-xs text-muted">{new URL(r.url).hostname.replace(/^www\./, "")}</div>
                  </Card>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-12 max-w-2xl text-xs text-muted">
        AdmitLens links to these pages and summarizes them in its own words. We don't copy students' essays or posts. Read them on the original sites, where the authors and colleges chose to publish them.
      </p>
    </div>
  );
}
