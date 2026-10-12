"use client";
import { Award as AwardIcon, BookOpen, Check, FileUp, Loader2, Plus, RotateCcw, Sparkles, Trash2, Upload, UserRound, Users } from "lucide-react";
import { useRef, useState } from "react";
import { Badge, Button, Card, CardHeader, cx, Field, inputCls, PageHeader, Progress } from "@/components/ui";
import { CollegePicker } from "@/components/CollegePicker";
import { getCollege } from "@/data/colleges";
import { extractPdfText, parseCommonApp } from "@/lib/commonapp";
import { SAMPLE_PROFILE } from "@/lib/sample";
import { useStore } from "@/lib/store";
import { STATES, type Activity, type Award, type Profile } from "@/lib/types";
import { useAiStatus } from "@/lib/useCollege";

const uid = () => Math.random().toString(36).slice(2, 9);
const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

function CommonAppImport({ onMerge }: { onMerge: (p: Partial<Profile>, found: string[], missing: string[]) => void }) {
  const ai = useAiStatus();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [useAi, setUseAi] = useState(true);

  const run = async (text: string) => {
    setErr(null);
    if (ai && useAi) {
      setBusy("Reading your application with AI…");
      try {
        const res = await fetch("/api/ai/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        const now = new Date();
        const seniorYear = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
        const p: Partial<Profile> = {
          importedFrom: "Common App (AI)",
          name: d.name || undefined,
          state: d.state || undefined,
          highSchool: d.highSchool || undefined,
          intendedMajor: d.intendedMajor || undefined,
          grade: d.graduationYear ? Math.max(9, Math.min(12, 12 - (d.graduationYear - seniorYear))) : undefined,
          gpaUnweighted: d.gpaUnweighted,
          gpaWeighted: d.gpaWeighted,
          classRankPercent: d.classRankPercent,
          apCount: d.apCount || undefined,
          sat: d.sat,
          act: d.act,
          activities: d.activities?.map((a: Omit<Activity, "id">) => ({ ...a, id: uid() })),
          awards: d.awards?.map((a: Omit<Award, "id">) => ({ ...a, id: uid() })),
          personalStatement: d.personalStatement || undefined,
          firstGen: d.firstGen || undefined,
          lowIncome: d.feeWaiver || undefined,
        };
        Object.keys(p).forEach((k) => (p as Record<string, unknown>)[k] === undefined && delete (p as Record<string, unknown>)[k]);
        const found = Object.keys(p).filter((k) => k !== "importedFrom");
        onMerge(p, found, []);
        setBusy(null);
        return;
      } catch (e) {
        setErr(`AI parsing failed (${e instanceof Error ? e.message : "error"}). Used the built-in parser instead.`);
      }
    }
    const r = parseCommonApp(text);
    onMerge(r.profile, r.found, r.missing);
    setBusy(null);
  };

  const onFile = async (f: File) => {
    setBusy("Extracting text from PDF…");
    try {
      const text = await extractPdfText(f);
      await run(text);
    } catch {
      setErr("Couldn't read that PDF. Try the paste option instead.");
      setBusy(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="glow">
        <CardHeader
          title="Import from Common App"
          subtitle="Bring in your whole application at once instead of retyping it."
          icon={<FileUp size={16} />}
        />
        <div className="grid gap-5 p-5 md:grid-cols-2">
          <div>
            <ol className="mb-4 space-y-1.5 text-sm text-muted">
              <li>1. In Common App, open <b className="text-ink">My Colleges → any college → Review and submit</b>.</li>
              <li>2. Click <b className="text-ink">Preview</b> and download the PDF.</li>
              <li>3. Drop it here. It's parsed in your browser and saved only on this device.</li>
            </ol>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) onFile(f);
              }}
              onClick={() => fileRef.current?.click()}
              className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line bg-surface/60 px-4 py-8 text-center transition hover:border-brand"
            >
              {busy ? <Loader2 className="animate-spin text-brand" /> : <Upload className="text-brand" />}
              <div className="mt-2 text-sm font-medium">{busy ?? "Drop your Common App PDF or click to upload"}</div>
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            </div>
            {ai && (
              <label className="mt-3 flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} className="accent-[var(--brand)]" />
                Use AI for more accurate parsing (sends the text to the AdmitLens server)
              </label>
            )}
          </div>
          <div className="flex flex-col">
            <div className="mb-1.5 text-sm font-medium">…or paste application text</div>
            <textarea className={cx(inputCls, "min-h-36 flex-1 font-mono text-xs")} placeholder="Paste text copied from your Common App preview…" value={paste} onChange={(e) => setPaste(e.target.value)} />
            <Button variant="secondary" className="mt-2 self-start" disabled={paste.length < 100 || !!busy} onClick={() => run(paste)}>
              Parse text
            </Button>
          </div>
        </div>
        {err && <div className="border-t border-line px-5 py-3 text-sm text-warn">{err}</div>}
        <div className="border-t border-line px-5 py-3 text-xs text-muted">
          Common App doesn't offer a public API that lets outside apps read your application, so AdmitLens imports the PDF you export yourself. Always double-check imported fields below.
        </div>
      </div>
    </Card>
  );
}

function ActivityRow({ a, onChange, onRemove, index }: { a: Activity; onChange: (a: Activity) => void; onRemove: () => void; index: number }) {
  const set = <K extends keyof Activity>(k: K, v: Activity[K]) => onChange({ ...a, [k]: v });
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="mb-3 flex items-center justify-between">
        <Badge tone="brand">Activity {index + 1}</Badge>
        <button onClick={onRemove} className="rounded-lg p-1.5 text-muted hover:bg-bad-soft hover:text-bad" aria-label="Remove activity">
          <Trash2 size={15} />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Activity / organization">
          <input className={inputCls} value={a.name} onChange={(e) => set("name", e.target.value)} placeholder="Robotics Team" />
        </Field>
        <Field label="Your role">
          <input className={inputCls} value={a.role} onChange={(e) => set("role", e.target.value)} placeholder="Captain" />
        </Field>
        <Field label="Reach / impact level" hint="The widest level your work reached">
          <select className={inputCls} value={a.impact} onChange={(e) => set("impact", e.target.value as Activity["impact"])}>
            <option value="school">School</option>
            <option value="local">Local / city / regional</option>
            <option value="state">State</option>
            <option value="national">National</option>
            <option value="international">International</option>
          </select>
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Years">
            <input type="number" min={1} max={4} className={inputCls} value={a.years} onChange={(e) => set("years", Number(e.target.value))} />
          </Field>
          <Field label="Hrs/wk">
            <input type="number" min={0} max={60} className={inputCls} value={a.hoursPerWeek} onChange={(e) => set("hoursPerWeek", Number(e.target.value))} />
          </Field>
          <Field label="Wks/yr">
            <input type="number" min={1} max={52} className={inputCls} value={a.weeksPerYear} onChange={(e) => set("weeksPerYear", Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Description (150 characters, like Common App)" className="sm:col-span-2">
          <input className={inputCls} maxLength={150} value={a.description} onChange={(e) => set("description", e.target.value)} placeholder="Led 24-member team to state finals; taught CAD workshops to 60 middle schoolers." />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-[var(--brand)]" checked={a.leadership} onChange={(e) => set("leadership", e.target.checked)} /> Leadership role
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-[var(--brand)]" checked={a.founder} onChange={(e) => set("founder", e.target.checked)} /> I founded it
        </label>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { profile: p, setProfile, profileComplete, ready, resetAll } = useStore();
  const [importMsg, setImportMsg] = useState<{ found: string[]; missing: string[] } | null>(null);
  if (!ready) return null;
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setProfile((prev) => ({ ...prev, [k]: v }));
  const words = p.personalStatement.trim() ? p.personalStatement.trim().split(/\s+/).length : 0;

  return (
    <div className="rise">
      <PageHeader
        eyebrow="Your application"
        title="Profile"
        subtitle="Fill this in once. The simulator, essay lab, scholarships and roadmap all read from it. Everything is stored only in this browser."
        action={
          <div className="w-full max-w-xs rounded-2xl border border-line bg-surface p-4 sm:w-64">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Profile strength</span>
              <span className="tabular-nums">{profileComplete}%</span>
            </div>
            <Progress value={profileComplete} className="mt-2" tone={profileComplete >= 80 ? "good" : "warn"} />
            {p.importedFrom && <div className="mt-2 text-xs text-muted">Imported from {p.importedFrom}</div>}
          </div>
        }
      />

      <div className="space-y-6">
        <CommonAppImport
          onMerge={(partial, found, missing) => {
            setProfile((prev) => ({ ...prev, ...partial }));
            setImportMsg({ found, missing });
          }}
        />
        {importMsg && (
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Check size={16} className="text-good" />
              <span className="font-medium">Imported:</span>
              {importMsg.found.length ? importMsg.found.map((f) => <Badge key={f} tone="good">{f}</Badge>) : <span className="text-muted">nothing recognized</span>}
            </div>
            {importMsg.missing.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted">Not found, add manually:</span>
                {importMsg.missing.map((f) => <Badge key={f} tone="warn">{f}</Badge>)}
              </div>
            )}
          </Card>
        )}

        <Card>
          <CardHeader title="Basics" icon={<UserRound size={16} />} />
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Name">
              <input className={inputCls} value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Current grade">
              <select className={inputCls} value={p.grade} onChange={(e) => set("grade", Number(e.target.value))}>
                {[9, 10, 11, 12].map((g) => <option key={g} value={g}>{g}th grade</option>)}
                <option value={13}>Graduated / gap year</option>
              </select>
            </Field>
            <Field label="State of residence" hint="Public universities favor in-state applicants">
              <select className={inputCls} value={p.state} onChange={(e) => set("state", e.target.value)}>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Intended major">
              <input className={inputCls} value={p.intendedMajor} onChange={(e) => set("intendedMajor", e.target.value)} placeholder="Computer Science" />
            </Field>
            <Field label="High school" className="sm:col-span-2">
              <input className={inputCls} value={p.highSchool} onChange={(e) => set("highSchool", e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Academics" subtitle="Readers check GPA against how hard your schedule was" icon={<BookOpen size={16} />} />
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Unweighted GPA (4.0 scale)">
              <input type="number" step="0.01" min={0} max={4} className={inputCls} value={p.gpaUnweighted ?? ""} onChange={(e) => set("gpaUnweighted", numOrNull(e.target.value))} placeholder="3.85" />
            </Field>
            <Field label="Weighted GPA">
              <input type="number" step="0.01" min={0} max={5.5} className={inputCls} value={p.gpaWeighted ?? ""} onChange={(e) => set("gpaWeighted", numOrNull(e.target.value))} placeholder="4.30" />
            </Field>
            <Field label="Class rank: top __%" hint="Leave blank if your school doesn't rank">
              <input type="number" min={1} max={100} className={inputCls} value={p.classRankPercent ?? ""} onChange={(e) => set("classRankPercent", numOrNull(e.target.value))} placeholder="5" />
            </Field>
            <Field label="AP / IB / dual-enrollment courses" hint="Completed + in progress">
              <input type="number" min={0} max={25} className={inputCls} value={p.apCount} onChange={(e) => set("apCount", Number(e.target.value))} />
            </Field>
            <Field label="Honors courses">
              <input type="number" min={0} max={25} className={inputCls} value={p.honorsCount} onChange={(e) => set("honorsCount", Number(e.target.value))} />
            </Field>
            <Field label="Schedule rigor vs. what your school offers" className="sm:col-span-2 lg:col-span-3">
              <div className="flex gap-1 rounded-xl border border-line bg-surface-2 p-1">
                {(["Minimal", "Some", "Average", "Strong", "Most demanding"] as const).map((l, i) => (
                  <button key={l} type="button" onClick={() => set("rigor", (i + 1) as Profile["rigor"])} className={cx("flex-1 rounded-lg px-2 py-1.5 text-xs sm:text-sm", p.rigor === i + 1 ? "bg-surface font-medium shadow-sm" : "text-muted")}>
                    {l}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <div className="grid gap-4 border-t border-line p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="SAT (best total)">
              <input type="number" min={400} max={1600} step={10} className={inputCls} value={p.sat ?? ""} onChange={(e) => set("sat", numOrNull(e.target.value))} placeholder="1450" />
            </Field>
            <Field label="ACT (composite)">
              <input type="number" min={1} max={36} className={inputCls} value={p.act ?? ""} onChange={(e) => set("act", numOrNull(e.target.value))} placeholder="32" />
            </Field>
            <Field label="Submit scores?" className="sm:col-span-2" hint="Test-optional schools only see scores you choose to send">
              <div className="flex gap-1 rounded-xl border border-line bg-surface-2 p-1">
                {[true, false].map((v) => (
                  <button key={String(v)} type="button" onClick={() => set("submitTests", v)} className={cx("flex-1 rounded-lg py-1.5 text-sm", p.submitTests === v ? "bg-surface font-medium shadow-sm" : "text-muted")}>
                    {v ? "Submit where allowed" : "Apply test-optional"}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader
            title={`Activities (${p.activities.length}/10)`}
            subtitle="Order doesn't matter. The reader weighs your strongest commitments most, like a real file read."
            icon={<Users size={16} />}
            action={
              <Button
                variant="secondary"
                disabled={p.activities.length >= 10}
                onClick={() => set("activities", [...p.activities, { id: uid(), name: "", role: "", category: "", years: 1, hoursPerWeek: 3, weeksPerYear: 30, leadership: false, founder: false, impact: "school", description: "" }])}
              >
                <Plus size={15} /> Add
              </Button>
            }
          />
          <div className="grid gap-3 p-5 lg:grid-cols-2">
            {p.activities.length === 0 && <p className="text-sm text-muted">No activities yet. Add up to 10, just like the Common App.</p>}
            {p.activities.map((a, i) => (
              <ActivityRow key={a.id} index={i} a={a} onChange={(na) => set("activities", p.activities.map((x) => (x.id === a.id ? na : x)))} onRemove={() => set("activities", p.activities.filter((x) => x.id !== a.id))} />
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title={`Honors & awards (${p.awards.length}/5)`}
            icon={<AwardIcon size={16} />}
            action={
              <Button variant="secondary" disabled={p.awards.length >= 5} onClick={() => set("awards", [...p.awards, { id: uid(), name: "", level: "school" }])}>
                <Plus size={15} /> Add
              </Button>
            }
          />
          <div className="space-y-2 p-5">
            {p.awards.length === 0 && <p className="text-sm text-muted">No honors yet. School-level counts too.</p>}
            {p.awards.map((a) => (
              <div key={a.id} className="flex gap-2">
                <input className={inputCls} value={a.name} onChange={(e) => set("awards", p.awards.map((x) => (x.id === a.id ? { ...x, name: e.target.value } : x)))} placeholder="National Merit Commended Scholar" />
                <select className={cx(inputCls, "w-40")} value={a.level} onChange={(e) => set("awards", p.awards.map((x) => (x.id === a.id ? { ...x, level: e.target.value as Award["level"] } : x)))}>
                  {["school", "regional", "state", "national", "international"].map((l) => <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>)}
                </select>
                <button onClick={() => set("awards", p.awards.filter((x) => x.id !== a.id))} className="rounded-lg px-2 text-muted hover:bg-bad-soft hover:text-bad" aria-label="Remove award">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Personal statement" subtitle={`${words}/650 words. Use the Essay Lab for detailed feedback.`} icon={<BookOpen size={16} />} />
          <div className="p-5">
            <textarea className={cx(inputCls, "min-h-56 leading-relaxed")} value={p.personalStatement} onChange={(e) => set("personalStatement", e.target.value)} placeholder="Paste your Common App personal essay…" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Recommendations & context" subtitle="Readers evaluate achievements in the context of your circumstances" icon={<Sparkles size={16} />} />
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <Field label="How strong do you expect your teacher recommendations to be?">
              <select className={inputCls} value={p.recs} onChange={(e) => set("recs", e.target.value as Profile["recs"])}>
                <option value="unknown">Not sure yet</option>
                <option value="average">Typical (teachers know me a little)</option>
                <option value="strong">Strong (teachers know me well)</option>
                <option value="exceptional">Exceptional ("best student in years")</option>
              </select>
            </Field>
            <div className="space-y-2 text-sm">
              {(
                [
                  ["firstGen", "First-generation college student"],
                  ["lowIncome", "Limited family financial resources / fee waiver eligible"],
                  ["significantResponsibilities", "Significant work or family responsibilities"],
                  ["recruitedAthlete", "Being recruited by a college coach"],
                ] as const
              ).map(([k, l]) => (
                <label key={k} className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[var(--brand)]" checked={p[k]} onChange={(e) => set(k, e.target.checked)} /> {l}
                </label>
              ))}
            </div>
            <div className="md:col-span-2">
              <div className="mb-1.5 text-sm font-medium">Legacy (a parent attended)</div>
              <div className="flex flex-wrap items-center gap-2">
                {p.legacyAt.map((id) => (
                  <button key={id} onClick={() => set("legacyAt", p.legacyAt.filter((x) => x !== id))} className="rounded-full border border-line px-2.5 py-1 text-xs hover:border-bad hover:text-bad">
                    {getCollege(id)?.short ?? id} ✕
                  </button>
                ))}
                <CollegePicker onPick={(c) => !p.legacyAt.includes(c.id) && set("legacyAt", [...p.legacyAt, c.id])} placeholder="Add a college…" className="w-64" />
              </div>
              <p className="mt-1 text-xs text-muted">Only counted at schools that still consider legacy status (e.g. MIT, Johns Hopkins, Amherst and the UCs don't).</p>
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap justify-between gap-3">
          <Button variant="secondary" onClick={() => setProfile(SAMPLE_PROFILE)}>
            <Sparkles size={15} /> Load sample student
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm("Delete your profile, tracker, essays and roadmap progress from this browser?")) resetAll();
            }}
          >
            <RotateCcw size={15} /> Erase all my data
          </Button>
        </div>
      </div>
    </div>
  );
}
