"use client";
import { AlertTriangle, Check, FileJson, PlusCircle, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { SCAM_PATTERNS, VEHICLE_LABEL, type FundingRecord, type GeoLevel, type Vehicle } from "@/lib/grantscout";
import { useStore } from "@/lib/store";
import { Badge, Button, Card, CardHeader, cx, Field, inputCls } from "../ui";

// Aggregators are for discovery only; the sponsor's own page is the source of truth.
const AGGREGATORS = /fastweb|bold\.org|scholarships\.com|goingmerry|scholarshipowl|niche\.com|unigo|opportunitiesforyouth|opportunitydesk|scholarshipportal|collegeboard\.org\/scholarship-search/i;

// Plain-language eligibility choices mapped to GrantScout status tokens (playbook C3).
const RULES: [string, string, string[]][] = [
  ["any", "Open to everyone, regardless of citizenship or status", ["ANY"]],
  ["resident", "Any student living or attending school in the U.S.", ["US:resident_any"]],
  ["citizen", "U.S. citizens only", ["US:citizen"]],
  ["cpr", "U.S. citizens or permanent residents", ["US:citizen", "US:pr"]],
  ["fafsa", "Citizens or eligible noncitizens / must file the FAFSA", ["US:fafsa_eligible"]],
  ["daca", "Includes DACA, TPS or undocumented students", ["US:daca", "US:tps", "US:undocumented"]],
  ["intl", "International or visa-holder students welcome", ["US:international", "US:student_visa", "US:dependent_visa"]],
  ["work", "Must be legally eligible to work in the U.S.", ["US:work_authorized"]],
  ["unknown", "Not stated on the sponsor page", []],
];

// Leads GrantScout itself warns about (third-party "fully funded" listing, a program last run in 2018,
// unverified costs). Skipped on import until a person verifies them.
const UNSAFE_LEADS = /stanford venture fellowship|campus 1871|kinn founder sprint/i;

const blank = { name: "", sponsor: "", url: "", vehicle: "scholarship" as Vehicle, amount: "", deadline: "", level: "county" as GeoLevel, place: "", wording: "", rule: "unknown", grades: "", gpa: "", essay: false, confirmed: false, annual: true };

export function AddAward({ state }: { state: string }) {
  const { customAwards, setCustomAwards } = useStore();
  const [f, setF] = useState(blank);
  const [saved, setSaved] = useState<string | null>(null);
  const [imported, setImported] = useState<string | null>(null);

  // Import found.json / library.json produced by the GrantScout Cowork skill (deep local research).
  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const list: Partial<FundingRecord>[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results.map((x: { rec: FundingRecord }) => x.rec) : [];
      let added = 0;
      let skipped = 0;
      const ok: FundingRecord[] = [];
      for (const r of list) {
        const bad = !r?.name || !r?.sponsor || !/^https?:\/\//.test(r.source_url ?? "") || (r.application_fee ?? 0) > 0 || SCAM_PATTERNS.test(`${r.description ?? ""} ${r.citizenship_text ?? ""}`) || /^test /i.test(r.name ?? "") || (UNSAFE_LEADS.test(r.name ?? "") && !r.last_verified);
        if (bad) {
          skipped++;
          continue;
        }
        ok.push({ ...(r as FundingRecord), user_added: true });
        added++;
      }
      setCustomAwards((l) => {
        const keys = new Set(ok.map((r) => `${r.name}|${r.sponsor}`));
        return [...l.filter((x) => !keys.has(`${x.name}|${x.sponsor}`)), ...ok];
      });
      setImported(`Imported ${added} award${added === 1 ? "" : "s"}${skipped ? `, skipped ${skipped} (missing sponsor page, fees, scam wording, test records or unverified risky leads)` : ""}.`);
    } catch {
      setImported("That file isn't valid GrantScout JSON.");
    }
  };
  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setF((x) => ({ ...x, [k]: v }));

  const scam = SCAM_PATTERNS.test(`${f.name} ${f.wording}`);
  const aggregator = AGGREGATORS.test(f.url);
  const ambiguous = /legal resident|eligible to work|lawfully present/i.test(f.wording);
  const canSave = f.name && f.sponsor && /^https?:\/\//.test(f.url) && !scam && !aggregator;

  const save = () => {
    const amt = Number(f.amount.replace(/[^0-9.]/g, "")) || 0;
    const geo: FundingRecord["geo"] =
      f.level === "global" ? { level: "global" } : f.level === "national" ? { level: "national", country: "US" } : f.level === "state" ? { level: "state", country: "US", state } : { level: f.level, country: "US", state, [f.level === "metro" ? "metro" : f.level === "city" ? "city" : "county"]: f.place.replace(/\s+county$/i, "") };
    const rec: FundingRecord = {
      name: f.name.trim(),
      sponsor: f.sponsor.trim(),
      source_url: f.url.trim(),
      vehicle: f.vehicle,
      amount_max: amt || undefined,
      amount_text: f.amount && !amt ? f.amount : undefined,
      deadline: f.deadline || null,
      cycle: f.annual ? "annual" : "one-time",
      geo,
      status_rules: RULES.find((r) => r[0] === f.rule)![2],
      citizenship_text: f.wording,
      grade_levels: f.grades ? f.grades.split(",").map((g) => g.trim()).filter(Boolean) : [],
      gpa_min: f.gpa ? Number(f.gpa) : null,
      application_materials: f.essay ? ["essay"] : [],
      last_verified: f.confirmed ? new Date().toISOString().slice(0, 10) : null,
      flags: ambiguous ? ["ambiguous_status_wording"] : [],
      unclaimed_signal: ["county", "city", "school", "district"].includes(f.level),
      description: `Added by you from ${new URL(f.url).hostname}`,
      user_added: true,
    };
    setCustomAwards((l) => [...l.filter((x) => !(x.name === rec.name && x.sponsor === rec.sponsor)), rec]);
    setSaved(rec.name);
    setF(blank);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <Card>
        <CardHeader title="Add an award you found" subtitle="Local awards are where the odds are best. Add them here and they're ranked and filtered with everything else." icon={<PlusCircle size={16} />} />
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <Field label="Award name"><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="DuPage Foundation STEM Scholarship" /></Field>
          <Field label="Sponsor"><input className={inputCls} value={f.sponsor} onChange={(e) => set("sponsor", e.target.value)} placeholder="DuPage Foundation" /></Field>
          <Field label="Sponsor's own page (not an aggregator)" className="sm:col-span-2">
            <input className={inputCls} value={f.url} onChange={(e) => set("url", e.target.value)} placeholder="https://www.dupagefoundation.org/scholarships" />
          </Field>
          {aggregator && <p className="flex gap-2 rounded-xl bg-warn-soft/60 px-3 py-2 text-xs text-warn sm:col-span-2"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> That's a scholarship aggregator. Use it to discover awards, then open the sponsor's own page and paste that link. Aggregator details are often out of date.</p>}
          <Field label="Type">
            <select className={inputCls} value={f.vehicle} onChange={(e) => set("vehicle", e.target.value as Vehicle)}>
              {Object.entries(VEHICLE_LABEL).filter(([k]) => k !== "forgivable_loan").map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field label="Amount"><input className={inputCls} value={f.amount} onChange={(e) => set("amount", e.target.value)} placeholder="$2,500" /></Field>
          <Field label="Who can apply (area)">
            <select className={inputCls} value={f.level} onChange={(e) => set("level", e.target.value as GeoLevel)}>
              <option value="county">One county</option>
              <option value="city">One city</option>
              <option value="metro">Metro / region</option>
              <option value="state">My state ({state})</option>
              <option value="national">Whole U.S.</option>
              <option value="global">Anyone, worldwide</option>
            </select>
          </Field>
          {["county", "city", "metro"].includes(f.level) && (
            <Field label={`Which ${f.level}`}><input className={inputCls} value={f.place} onChange={(e) => set("place", e.target.value)} placeholder={f.level === "county" ? "DuPage" : f.level === "city" ? "Naperville" : "Chicagoland"} /></Field>
          )}
          <Field label="Deadline"><input type="date" className={inputCls} value={f.deadline} onChange={(e) => set("deadline", e.target.value)} /></Field>
          <Field label="Grades (optional)" hint="e.g. 11, 12"><input className={inputCls} value={f.grades} onChange={(e) => set("grades", e.target.value)} /></Field>
          <Field label="Minimum GPA (optional)"><input type="number" step="0.1" className={inputCls} value={f.gpa} onChange={(e) => set("gpa", e.target.value)} /></Field>
          <Field label="Eligibility wording, copied exactly from the sponsor page" className="sm:col-span-2">
            <textarea className={cx(inputCls, "min-h-16")} value={f.wording} onChange={(e) => set("wording", e.target.value)} placeholder="Applicants must be U.S. citizens, permanent residents or DACA recipients." />
          </Field>
          <Field label="That wording means…" className="sm:col-span-2">
            <select className={inputCls} value={f.rule} onChange={(e) => set("rule", e.target.value)}>
              {RULES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          {ambiguous && <p className="rounded-xl bg-warn-soft/60 px-3 py-2 text-xs text-warn sm:col-span-2">This wording is ambiguous. It'll be flagged so you check with the sponsor before applying.</p>}
          <div className="flex flex-wrap gap-4 text-sm sm:col-span-2">
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-[var(--brand)]" checked={f.essay} onChange={(e) => set("essay", e.target.checked)} /> Requires an essay</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-[var(--brand)]" checked={f.annual} onChange={(e) => set("annual", e.target.checked)} /> Runs every year</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-[var(--brand)]" checked={f.confirmed} onChange={(e) => set("confirmed", e.target.checked)} /> I confirmed these details on the sponsor's page</label>
          </div>
          {scam && <p className="flex gap-2 rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad sm:col-span-2"><ShieldAlert size={16} className="mt-0.5 shrink-0" /> This looks like a scam: legitimate scholarships never guarantee a win, charge fees, or ask for bank or SSN details.</p>}
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button onClick={save} disabled={!canSave}><PlusCircle size={15} /> Add to my list</Button>
            {saved && <span className="flex items-center gap-1 text-sm text-good"><Check size={14} /> Added "{saved}"</span>}
          </div>
        </div>
      </Card>
      <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center gap-2 font-display font-semibold"><FileJson size={16} className="text-brand" /> Import from GrantScout in Claude</div>
        <p className="mt-1 text-sm text-muted">Ran the GrantScout skill in Claude Cowork for deep local research? Import its <code>found.json</code> or <code>library.json</code> and every record is filtered and ranked here.</p>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:bg-surface-2">
          <FileJson size={14} /> Choose JSON file
          <input type="file" accept="application/json,.json" className="hidden" data-testid="gs-import" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        </label>
        {imported && <p className="mt-2 text-sm text-good">{imported}</p>}
      </Card>
      <Card>
        <CardHeader title={`Awards you've added (${customAwards.length})`} subtitle="Saved on this device only" />
        <ul className="divide-y divide-line">
          {customAwards.length === 0 && <li className="px-5 py-6 text-sm text-muted">Nothing yet. Use the research plan to find local awards, then add them here.</li>}
          {customAwards.map((r) => (
            <li key={`${r.name}|${r.sponsor}`} className="flex items-start justify-between gap-3 px-5 py-3 text-sm">
              <div className="min-w-0">
                <a href={r.source_url} target="_blank" rel="noreferrer" className="font-medium hover:text-brand">{r.name}</a>
                <div className="text-xs text-muted">{r.sponsor} · {r.geo?.level}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.last_verified ? <Badge tone="good">Verified {r.last_verified}</Badge> : <Badge tone="warn">Not yet verified</Badge>}
                  {(r.status_rules ?? []).length === 0 && <Badge tone="warn">Eligibility unknown</Badge>}
                </div>
              </div>
              <button onClick={() => setCustomAwards((l) => l.filter((x) => x !== r))} className="rounded-lg p-1.5 text-muted hover:bg-bad-soft hover:text-bad" aria-label={`Remove ${r.name}`}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </Card>
      </div>
    </div>
  );
}
