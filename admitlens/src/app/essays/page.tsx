"use client";
import { AlertCircle, CheckCircle2, FilePlus2, Lightbulb, Loader2, PenLine, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CollegePicker } from "@/components/CollegePicker";
import { Badge, Button, Card, cx, inputCls, PageHeader, Progress } from "@/components/ui";
import { analyzeEssay, COMMON_APP_PROMPTS } from "@/lib/essay";
import { tierOf, TIER_INFO } from "@/lib/engine";
import { useStore } from "@/lib/store";
import type { SavedEssay } from "@/lib/types";
import { useAiStatus, useCollege } from "@/lib/useCollege";

interface AiEssay {
  readerReaction: string;
  biggestProblem: string;
  whatItRevealsAboutYou: string;
  lineEdits: { original: string; issue: string; suggestion: string }[];
  revisionPlan: string[];
  score: number;
}

const uid = () => Math.random().toString(36).slice(2, 9);

function scoreTone(n: number) {
  return n >= 80 ? "good" : n >= 65 ? "brand" : n >= 50 ? "warn" : "bad";
}

export default function EssayLab() {
  const { essays, setEssays, profile, setProfile, ready } = useStore();
  const ai = useAiStatus();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [aiOut, setAiOut] = useState<AiEssay | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);

  // Seed with the personal statement from the profile
  useEffect(() => {
    if (!ready) return;
    if (essays.length === 0) {
      const first: SavedEssay = { id: uid(), title: "Common App personal essay", prompt: COMMON_APP_PROMPTS[6], collegeId: null, text: profile.personalStatement, updatedAt: Date.now() };
      setEssays([first]);
      setActiveId(first.id);
    } else if (!activeId) setActiveId(essays[0].id);
  }, [ready, essays, activeId, profile.personalStatement, setEssays]);

  const essay = essays.find((e) => e.id === activeId) ?? null;
  const { college } = useCollege(essay?.collegeId);
  const limit = essay?.collegeId ? 250 : 650;
  const analysis = useMemo(() => (essay ? analyzeEssay(essay.text, { limit, college }) : null), [essay, limit, college]);

  const update = (patch: Partial<SavedEssay>) => {
    if (!essay) return;
    setEssays((list) => list.map((e) => (e.id === essay.id ? { ...e, ...patch, updatedAt: Date.now() } : e)));
    if (patch.text !== undefined && essay.collegeId === null && essay.title === "Common App personal essay") setProfile((p) => ({ ...p, personalStatement: patch.text! }));
  };

  const runAi = async () => {
    if (!essay) return;
    setAiBusy(true);
    setAiErr(null);
    try {
      const res = await fetch("/api/ai/essay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: essay.text, prompt: essay.prompt, collegeId: college?.source === "dataset" ? college.id : null, limit }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setAiOut(d);
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setAiBusy(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="rise">
      <PageHeader
        eyebrow="Essay Lab"
        title="Write the essay only you could write"
        subtitle="Live feedback on voice, specificity, structure and reflection as you type. Pick a college to get a supplement read against what that school looks for."
      />
      <div className="grid gap-6 lg:grid-cols-[240px_1fr_360px]">
        {/* Essay list */}
        <div className="space-y-2">
          {essays.map((e) => {
            const a = analyzeEssay(e.text, { limit: e.collegeId ? 250 : 650 });
            return (
              <button key={e.id} onClick={() => { setActiveId(e.id); setAiOut(null); }} className={cx("w-full rounded-xl border p-3 text-left transition", e.id === activeId ? "border-brand bg-brand-soft" : "border-line bg-surface hover:bg-surface-2")}>
                <div className="truncate text-sm font-medium">{e.title || "Untitled"}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted">
                  <span>{a.words} words</span>
                  {a.overall > 0 && <span className="font-semibold">{a.grade}</span>}
                </div>
              </button>
            );
          })}
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              const n: SavedEssay = { id: uid(), title: "New supplement", prompt: "Why do you want to attend this college?", collegeId: null, text: "", updatedAt: Date.now() };
              setEssays((l) => [...l, n]);
              setActiveId(n.id);
              setAiOut(null);
            }}
          >
            <FilePlus2 size={15} /> New essay
          </Button>
        </div>

        {/* Editor */}
        {essay && analysis && (
          <Card className="min-w-0">
            <div className="space-y-3 border-b border-line p-4">
              <div className="flex gap-2">
                <input className={cx(inputCls, "font-medium")} value={essay.title} onChange={(e) => update({ title: e.target.value })} />
                {essays.length > 1 && (
                  <button
                    onClick={() => {
                      setEssays((l) => l.filter((x) => x.id !== essay.id));
                      setActiveId(null);
                    }}
                    className="rounded-lg px-2 text-muted hover:bg-bad-soft hover:text-bad"
                    aria-label="Delete essay"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <select className={inputCls} value={COMMON_APP_PROMPTS.includes(essay.prompt) ? essay.prompt : "custom"} onChange={(e) => e.target.value !== "custom" && update({ prompt: e.target.value })}>
                {COMMON_APP_PROMPTS.map((p, i) => (
                  <option key={i} value={p}>
                    Common App #{i + 1}: {p.slice(0, 70)}…
                  </option>
                ))}
                <option value="custom">Custom / supplement prompt</option>
              </select>
              {!COMMON_APP_PROMPTS.includes(essay.prompt) && <input className={inputCls} value={essay.prompt} onChange={(e) => update({ prompt: e.target.value })} placeholder="Paste the supplement prompt" />}
              <div className="flex flex-wrap items-center gap-2">
                <CollegePicker onPick={(c) => update({ collegeId: c.id })} placeholder={college ? `For ${college.short}, change…` : "Writing for a specific college? (optional)"} className="min-w-60 flex-1" />
                {college && (
                  <Button variant="ghost" onClick={() => update({ collegeId: null })}>
                    Clear
                  </Button>
                )}
              </div>
              {college && college.supplements.length > 0 && (
                <div className="text-xs text-muted">
                  <b className="text-ink">{college.short}'s recurring supplement themes:</b> {college.supplements.join(" · ")}
                </div>
              )}
            </div>
            <textarea
              className="min-h-[460px] w-full resize-y bg-transparent p-5 text-[15px] leading-7 outline-none"
              value={essay.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="Start with a moment, not a summary…"
            />
            <div className="flex items-center gap-3 border-t border-line px-5 py-3 text-xs text-muted">
              <span className={cx("tabular-nums", analysis.words > limit && "font-semibold text-bad")}>
                {analysis.words}/{limit} words
              </span>
              <Progress value={(analysis.words / limit) * 100} className="max-w-40" tone={analysis.words > limit ? "bad" : analysis.words / limit > 0.75 ? "good" : "warn"} />
              <span>{analysis.sentences} sentences · avg {analysis.avgSentenceLength} words</span>
            </div>
          </Card>
        )}

        {/* Feedback */}
        {analysis && (
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted">Essay score</div>
                  <div className="font-display text-4xl font-semibold">{analysis.overall ? analysis.grade : "—"}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl tabular-nums">{analysis.overall}</div>
                  <div className="text-xs text-muted">/ 100</div>
                </div>
              </div>
              {college && analysis.overall > 0 && (
                <p className="mt-2 text-xs text-muted">
                  At {college.short} ({TIER_INFO[tierOf(college)].label.toLowerCase()}), readers expect roughly {Math.round(80 - ((tierOf(college) - 1) / 4) * 28)}+ for an essay to help.
                </p>
              )}
              <div className="mt-4 space-y-2.5">
                {Object.entries(analysis.scores).map(([k, v]) =>
                  v == null ? null : (
                    <div key={k}>
                      <div className="flex justify-between text-xs">
                        <span className="capitalize">{k === "fit" ? "College fit" : k}</span>
                        <span className="tabular-nums">{v}</span>
                      </div>
                      <Progress value={v} tone={scoreTone(v)} className="mt-1 h-1.5" />
                    </div>
                  ),
                )}
              </div>
            </Card>

            {analysis.strengths.length > 0 && (
              <Card className="p-4">
                <div className="mb-2 text-sm font-semibold">Working</div>
                <ul className="space-y-1.5 text-sm">
                  {analysis.strengths.map((s) => (
                    <li key={s} className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-good" />{s}</li>
                  ))}
                </ul>
              </Card>
            )}
            {analysis.issues.length > 0 && (
              <Card className="p-4">
                <div className="mb-2 text-sm font-semibold">Flagged ({analysis.issues.length})</div>
                <ul className="space-y-2.5 text-sm">
                  {analysis.issues.slice(0, 8).map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <AlertCircle size={15} className="mt-0.5 shrink-0 text-warn" />
                      <span>
                        <Badge tone="warn" className="mb-1 mr-1">{s.kind.replace("-", " ")}</Badge>
                        <span className="italic text-muted">"{s.excerpt}"</span>
                        <span className="block">{s.advice}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            <Card className="p-4">
              <div className="mb-2 text-sm font-semibold">Next revision</div>
              <ul className="space-y-1.5 text-sm">
                {analysis.nextSteps.map((s) => (
                  <li key={s} className="flex gap-2"><Lightbulb size={15} className="mt-0.5 shrink-0 text-accent" />{s}</li>
                ))}
              </ul>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">AI reader critique</div>
                {ai && (
                  <Button onClick={runAi} disabled={aiBusy || analysis.words < 40}>
                    {aiBusy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Read it
                  </Button>
                )}
              </div>
              {ai === false && <p className="mt-2 text-xs text-muted">Not configured on this deployment. The built-in analysis above still works.</p>}
              {aiErr && <p className="mt-2 text-sm text-bad">{aiErr}</p>}
              {aiOut && (
                <div className="mt-3 space-y-3 text-sm">
                  <p className="font-display text-base italic">"{aiOut.readerReaction}"</p>
                  <p><b>Biggest problem:</b> {aiOut.biggestProblem}</p>
                  <p><b>What it reveals about you:</b> {aiOut.whatItRevealsAboutYou}</p>
                  {aiOut.lineEdits.map((l, i) => (
                    <div key={i} className="rounded-lg border border-line p-3">
                      <div className="italic text-muted">"{l.original}"</div>
                      <div className="mt-1">{l.issue}</div>
                      <div className="mt-1 text-good">→ {l.suggestion}</div>
                    </div>
                  ))}
                  <ol className="list-decimal space-y-1 pl-5">{aiOut.revisionPlan.map((r) => <li key={r}>{r}</li>)}</ol>
                </div>
              )}
            </Card>
            <p className="flex gap-2 text-xs text-muted">
              <PenLine size={14} className="shrink-0" /> AdmitLens coaches. It never writes your essay for you. Colleges expect your own words.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
