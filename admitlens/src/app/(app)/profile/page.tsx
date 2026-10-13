"use client";
import { Award as AwardIcon, BookOpen, Plus, RotateCcw, ShieldCheck, Sparkles, Trash2, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { STATUS_OPTIONS } from "@/lib/grantscout";
import { Badge, Button, Card, CardHeader, cx, Field, inputCls, PageHeader, Progress } from "@/components/ui";
import { CollegePicker } from "@/components/CollegePicker";
import { getCollege } from "@/data/colleges";
import { CommonAppImport } from "@/components/CommonAppImport";
import { mergeImport } from "@/lib/commonapp";
import { useStore } from "@/lib/store";
import { EMPTY_FUNDING, STATES, type Activity, type Award, type Profile } from "@/lib/types";

const uid = () => Math.random().toString(36).slice(2, 9);
const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

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
          <input className={inputCls} value={a.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Robotics Team" />
        </Field>
        <Field label="Your role">
          <input className={inputCls} value={a.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g. Captain" />
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
          <input className={inputCls} maxLength={150} value={a.description} onChange={(e) => set("description", e.target.value)} placeholder="What you did and what came of it, with numbers" />
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
  if (!ready) return null;
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setProfile((prev) => ({ ...prev, [k]: v }));
  const words = p.personalStatement.trim() ? p.personalStatement.trim().split(/\s+/).length : 0;

  return (
    <div className="rise">
      <PageHeader
        eyebrow="Your application"
        title="Profile"
        subtitle="Fill this in once. Your evaluation, essays, scholarships and roadmap all read from it. Changes save to your account automatically."
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
        <CommonAppImport onApply={(partial) => setProfile((prev) => mergeImport(prev, partial))} />

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
              <input className={inputCls} value={p.intendedMajor} onChange={(e) => set("intendedMajor", e.target.value)} placeholder="e.g. Computer Science" />
            </Field>
            <Field label="High school" className="sm:col-span-2">
              <input className={inputCls} value={p.highSchool} onChange={(e) => set("highSchool", e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Scholarship eligibility" subtitle="Private. Used only to hide awards you can't receive; never shown in reports." icon={<ShieldCheck size={16} />} action={<Link href="/scholarships" className="text-sm text-brand">Full funding profile →</Link>} />
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Citizenship / visa status">
              <select className={inputCls} value={p.funding?.residenceStatus ?? ""} onChange={(e) => setProfile((prev) => ({ ...prev, funding: { ...EMPTY_FUNDING, ...(prev.funding ?? {}), residenceStatus: e.target.value } }))}>
                {STATUS_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="City" hint="Finds local awards">
              <input className={inputCls} value={p.funding?.city ?? ""} onChange={(e) => setProfile((prev) => ({ ...prev, funding: { ...EMPTY_FUNDING, ...(prev.funding ?? {}), city: e.target.value } }))} />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" className="accent-[var(--brand)]" checked={!!p.funding?.hasWorkAuthorization} onChange={(e) => setProfile((prev) => ({ ...prev, funding: { ...EMPTY_FUNDING, ...(prev.funding ?? {}), hasWorkAuthorization: e.target.checked } }))} /> U.S. work authorization
            </label>
          </div>
        </Card>

        <Card>
          <CardHeader title="Academics" subtitle="Readers check GPA against how hard your schedule was" icon={<BookOpen size={16} />} />
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Unweighted GPA (4.0 scale)">
              <input type="number" step="0.01" min={0} max={4} className={inputCls} value={p.gpaUnweighted ?? ""} onChange={(e) => set("gpaUnweighted", numOrNull(e.target.value))} placeholder="Not entered" />
            </Field>
            <Field label="Weighted GPA">
              <input type="number" step="0.01" min={0} max={5.5} className={inputCls} value={p.gpaWeighted ?? ""} onChange={(e) => set("gpaWeighted", numOrNull(e.target.value))} placeholder="Not entered" />
            </Field>
            <Field label="Class rank: top __%" hint="Leave blank if your school doesn't rank">
              <input type="number" min={1} max={100} className={inputCls} value={p.classRankPercent ?? ""} onChange={(e) => set("classRankPercent", numOrNull(e.target.value))} placeholder="Not entered" />
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
              <input type="number" min={400} max={1600} step={10} className={inputCls} value={p.sat ?? ""} onChange={(e) => set("sat", numOrNull(e.target.value))} placeholder="Not entered" />
            </Field>
            <Field label="ACT (composite)">
              <input type="number" min={1} max={36} className={inputCls} value={p.act ?? ""} onChange={(e) => set("act", numOrNull(e.target.value))} placeholder="Not entered" />
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
                <input className={inputCls} value={a.name} onChange={(e) => set("awards", p.awards.map((x) => (x.id === a.id ? { ...x, name: e.target.value } : x)))} placeholder="e.g. National Merit Commended Scholar" />
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

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="danger"
            onClick={() => {
              if (confirm("Erase your profile, tracker, essays and roadmap progress from your account? This can't be undone.")) resetAll();
            }}
          >
            <RotateCcw size={15} /> Erase all my data
          </Button>
        </div>
      </div>
    </div>
  );
}
