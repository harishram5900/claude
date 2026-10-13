"use client";
import { AlertTriangle, Check, FileText, FileUp, Loader2, ShieldCheck, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { extractPdfText, parseCommonApp } from "@/lib/commonapp";
import { STATUS_OPTIONS } from "@/lib/grantscout";
import type { Activity, Award, Profile } from "@/lib/types";
import { useAiStatus } from "@/lib/useCollege";
import { Badge, Button, Card, cx, inputCls } from "./ui";

const uid = () => Math.random().toString(36).slice(2, 9);

type Key = keyof Profile;
interface Row {
  key: Key;
  label: string;
  value: React.ReactNode;
}

const LABELS: Partial<Record<Key, string>> = {
  name: "Name",
  state: "State",
  highSchool: "High school",
  grade: "Current grade",
  intendedMajor: "Intended major",
  gpaUnweighted: "Unweighted GPA",
  gpaWeighted: "Weighted GPA",
  classRankPercent: "Class rank (top %)",
  apCount: "AP / IB courses",
  rigor: "Schedule rigor (estimate)",
  sat: "SAT",
  act: "ACT",
  activities: "Activities",
  awards: "Honors",
  personalStatement: "Personal essay",
  honorsCount: "Honors courses",
  firstGen: "First-generation",
  lowIncome: "Fee waiver / limited resources",
  funding: "Scholarship eligibility (private)",
};

function describe(key: Key, v: unknown): React.ReactNode {
  if (key === "activities")
    return (
      <ol className="space-y-2">
        {(v as Activity[]).map((a, i) => (
          <li key={a.id}>
            <span className="font-medium text-ink">{i + 1}. {a.name}</span>
            {a.role && <span> · {a.role}</span>}
            <span className="text-xs"> · {a.category} · {a.years} yr · {a.hoursPerWeek} hr/wk · {a.weeksPerYear} wk/yr{a.leadership ? " · leadership" : ""}</span>
            {a.description && <div className="text-xs">{a.description}</div>}
          </li>
        ))}
      </ol>
    );
  if (key === "awards")
    return (
      <ul className="space-y-1">
        {(v as Award[]).map((a) => (
          <li key={a.id}><span className="text-ink">{a.name}</span> <span className="text-xs capitalize">({a.level})</span></li>
        ))}
      </ul>
    );
  if (key === "funding") {
    const f = v as NonNullable<Profile["funding"]>;
    const bits = [
      f.residenceStatus && STATUS_OPTIONS.find(([k]) => k === f.residenceStatus)?.[1],
      f.citizenships?.length ? `other citizenship: ${f.citizenships.join(", ")}` : "",
      f.city ? `city: ${f.city}` : "",
      f.age ? `age ${f.age}` : "",
    ].filter(Boolean);
    return `${bits.join(" · ")}. Used only to match scholarships, never shown in reports.`;
  }
  if (key === "personalStatement") {
    const t = String(v);
    return `${t.split(/\s+/).length} words: "${t.slice(0, 110)}…"`;
  }
  if (key === "classRankPercent") return `Top ${v}%`;
  if (key === "rigor") return `${v === 5 ? "Most demanding" : "Strong"}. Adjust in Academics if your school offers more or fewer AP/IB courses.`;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

export function CommonAppImport({ onApply, compact = false }: { onApply: (p: Partial<Profile>) => void; compact?: boolean }) {
  const ai = useAiStatus();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [useAi, setUseAi] = useState(false);
  const [pending, setPending] = useState<{ profile: Partial<Profile>; missing: string[]; fileName: string } | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<string | null>(null);

  const stage = (profile: Partial<Profile>, missing: string[], fileName: string) => {
    const keys = (Object.keys(profile) as Key[]).filter((k) => k in LABELS && profile[k] !== undefined && profile[k] !== null && !(k === "funding" && !Object.keys(profile.funding ?? {}).length));
    if (keys.length === 0) {
      setErr("We couldn't recognize any application fields in that file. Make sure it's the PDF from Common App's Preview, not a scanned image.");
      return;
    }
    setPending({ profile, missing, fileName });
    setSelected(Object.fromEntries(keys.map((k) => [k, true])));
  };

  const parseWithAi = async (text: string): Promise<Partial<Profile> | null> => {
    const res = await fetch("/api/ai/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error);
    const now = new Date();
    const seniorYear = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
    const p: Partial<Profile> = {
      name: d.name || undefined,
      state: d.state || undefined,
      highSchool: d.highSchool || undefined,
      intendedMajor: d.intendedMajor || undefined,
      grade: d.graduationYear ? Math.max(9, Math.min(12, 12 - (d.graduationYear - seniorYear))) : undefined,
      gpaUnweighted: d.gpaUnweighted ?? undefined,
      gpaWeighted: d.gpaWeighted ?? undefined,
      classRankPercent: d.classRankPercent ?? undefined,
      apCount: d.apCount || undefined,
      sat: d.sat ?? undefined,
      act: d.act ?? undefined,
      activities: d.activities?.length ? d.activities.map((a: Omit<Activity, "id">) => ({ ...a, id: uid() })) : undefined,
      awards: d.awards?.length ? d.awards.map((a: Omit<Award, "id">) => ({ ...a, id: uid() })) : undefined,
      personalStatement: d.personalStatement || undefined,
      firstGen: d.firstGen || undefined,
      lowIncome: d.feeWaiver || undefined,
    };
    return p;
  };

  const run = async (text: string, fileName: string) => {
    setErr(null);
    setDone(null);
    if (text.replace(/\s/g, "").length < 80) {
      setErr("This PDF has almost no selectable text. It may be a scan or photo. Download the PDF directly from Common App's Preview instead.");
      setBusy(null);
      return;
    }
    if (ai && useAi) {
      setBusy("Reading your application with AI…");
      try {
        const p = await parseWithAi(text);
        if (p) {
          stage(p, [], fileName);
          setBusy(null);
          return;
        }
      } catch (e) {
        setErr(`AI parsing failed (${e instanceof Error ? e.message : "error"}). Used the built-in parser instead.`);
      }
    }
    const r = parseCommonApp(text);
    stage(Object.keys(r.funding).length ? { ...r.profile, funding: r.funding as Profile["funding"] } : r.profile, r.missing, fileName);
    setBusy(null);
  };

  const onFile = async (f: File) => {
    if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) {
      setErr("Please upload a PDF file.");
      return;
    }
    setBusy("Reading PDF…");
    try {
      const text = await extractPdfText(f);
      await run(text, f.name);
    } catch {
      setErr("We couldn't open that PDF. If it's password-protected, re-download it from Common App, or paste the text instead.");
      setBusy(null);
    }
  };

  const apply = () => {
    if (!pending) return;
    const out: Partial<Profile> = { importedFrom: `Common App (${pending.fileName})` };
    for (const [k, on] of Object.entries(selected)) if (on) (out as Record<string, unknown>)[k] = pending.profile[k as Key];
    // A weighted GPA alone is converted later; flag it so the student can add the unweighted one.
    onApply(out);
    setDone(`Imported ${Object.values(selected).filter(Boolean).length} fields from ${pending.fileName}.${compact ? "" : " You can edit any of them below."}`);
    setPending(null);
  };

  const rows: Row[] = pending
    ? (Object.keys(selected) as Key[]).map((k) => ({ key: k, label: LABELS[k] ?? k, value: describe(k, pending.profile[k]) }))
    : [];
  const onlyWeighted = pending && pending.profile.gpaWeighted != null && pending.profile.gpaUnweighted == null;

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
        <div className="border-b border-line p-6 md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            <FileUp size={14} /> Common App import
          </div>
          <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">Bring your whole application in at once</h3>
          <ol className="mt-4 space-y-2 text-sm text-muted">
            <li><span className="mr-2 font-mono text-xs text-ink">01</span>In Common App, open <b className="text-ink">My Colleges</b>, choose any college, then <b className="text-ink">Review and submit</b>.</li>
            <li><span className="mr-2 font-mono text-xs text-ink">02</span>Click <b className="text-ink">Preview</b> and save the PDF.</li>
            <li><span className="mr-2 font-mono text-xs text-ink">03</span>Upload it here. We fill in your grades, scores, activities, honors and essay, and skip page numbers, headers and the "Preview" watermark. You confirm before anything is saved.</li>
          </ol>
          <p className="mt-4 flex gap-2 text-xs text-muted">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-good" />
            The PDF is read inside your browser and the file itself is never uploaded. Only the fields you confirm are saved to your account. Common App doesn't let outside apps into your account, so this uses the PDF you download yourself.
          </p>
        </div>
        <div className="p-6">
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) onFile(f);
            }}
            onClick={() => fileRef.current?.click()}
            className="grid h-full min-h-44 cursor-pointer place-items-center rounded-2xl border border-dashed border-line bg-surface-2/50 px-4 py-8 text-center transition hover:border-brand hover:bg-brand-soft/40"
          >
            <div>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface shadow-card">
                {busy ? <Loader2 className="animate-spin text-brand" size={20} /> : <Upload className="text-brand" size={20} />}
              </div>
              <div className="mt-3 text-sm font-medium">{busy ?? "Drop your Common App PDF"}</div>
              <div className="text-xs text-muted">{busy ? "This takes a few seconds" : "or click to choose a file"}</div>
            </div>
            <input ref={fileRef} data-testid="ca-file" type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <button className="text-muted underline-offset-4 hover:text-ink hover:underline" onClick={() => setShowPaste((s) => !s)}>
              {showPaste ? "Hide text paste" : "Paste text instead"}
            </button>
            {ai && (
              <label className="flex items-center gap-2 text-muted">
                <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} className="accent-[var(--brand)]" />
                AI-assisted parsing (sends text to the server)
              </label>
            )}
          </div>
          {showPaste && (
            <div className="mt-3">
              <textarea className={cx(inputCls, "min-h-28 font-mono text-xs")} placeholder="Paste text copied from your Common App preview…" value={paste} onChange={(e) => setPaste(e.target.value)} />
              <Button variant="secondary" className="mt-2" disabled={paste.length < 100 || !!busy} onClick={() => run(paste, "pasted text")}>
                Read text
              </Button>
            </div>
          )}
        </div>
      </div>

      {err && (
        <div className="flex gap-2 border-t border-line bg-warn-soft/60 px-6 py-3 text-sm text-warn">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {err}
        </div>
      )}
      {done && (
        <div className="flex gap-2 border-t border-line bg-good-soft/60 px-6 py-3 text-sm text-good" data-testid="ca-done">
          <Check size={16} className="mt-0.5 shrink-0" /> {done}
        </div>
      )}

      {pending && (
        <div className="border-t border-line" data-testid="ca-review">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-brand" />
              <span className="font-medium">Review what we found</span>
              <Badge tone="brand">{rows.length} fields</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setPending(null)}>
                <X size={15} /> Cancel
              </Button>
              <Button onClick={apply} data-testid="ca-apply">
                <Check size={15} /> Apply {Object.values(selected).filter(Boolean).length} fields
              </Button>
            </div>
          </div>
          <div className="divide-y divide-line border-t border-line">
            {rows.map((r) => (
              <label key={r.key} className="flex cursor-pointer items-start gap-3 px-6 py-3 text-sm hover:bg-surface-2/50">
                <input type="checkbox" className="mt-1 accent-[var(--brand)]" checked={!!selected[r.key]} onChange={(e) => setSelected((s) => ({ ...s, [r.key]: e.target.checked }))} />
                <span className="w-40 shrink-0 font-medium">{r.label}</span>
                <span className="min-w-0 flex-1 text-muted">{r.value}</span>
              </label>
            ))}
          </div>
          {(onlyWeighted || pending.missing.length > 0) && (
            <div className="space-y-1 border-t border-line px-6 py-3 text-xs text-muted">
              {onlyWeighted && <p>Your Common App lists a weighted GPA only. After applying, add your unweighted GPA in Academics. Readers compare unweighted GPAs across schools.</p>}
              {pending.missing.length > 0 && <p>Not found in the file (add manually): {pending.missing.join(", ")}.</p>}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
