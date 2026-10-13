"use client";
import { Lock, MapPin, UserRound } from "lucide-react";
import { useState } from "react";
import { STATUS_OPTIONS, WANT_OPTIONS } from "@/lib/grantscout";
import { useStore } from "@/lib/store";
import { EMPTY_FUNDING, type FundingExtras } from "@/lib/types";
import { Card, cx, Field, inputCls } from "../ui";

const BACKGROUND: [string, string][] = [
  ["first_gen", "First-generation college student"],
  ["low_income", "Low-income / Pell-eligible"],
  ["military_family", "Military-connected family"],
  ["foster_youth", "Foster care or homeless youth"],
  ["disability", "Disability or chronic illness"],
  ["rural", "Rural community"],
  ["single_parent_household", "Single-parent household"],
  ["english_learner", "English learner"],
  ["women", "Woman / girl"],
  ["nonbinary", "Nonbinary or genderqueer"],
];

const TIES: [string, string][] = [
  ["IN:oci", "India: OCI card holder"],
  ["IN:pio", "India: PIO"],
  ["IN:nri", "India: NRI family"],
  ["MX:heritage", "Mexico: heritage / family ties"],
  ["PH:heritage", "Philippines: heritage"],
  ["CN:heritage", "China: heritage"],
  ["NG:heritage", "Nigeria: heritage"],
];

const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export function Intake() {
  const { profile, setProfile } = useStore();
  const f: FundingExtras = { ...EMPTY_FUNDING, ...(profile.funding ?? {}) };
  const set = <K extends keyof FundingExtras>(k: K, v: FundingExtras[K]) => setProfile((p) => ({ ...p, funding: { ...EMPTY_FUNDING, ...(p.funding ?? {}), [k]: v } }));
  const toggle = (k: "background" | "countryTies" | "wants", v: string) => set(k, f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v]);
  // Comma lists are edited as raw text so typing a comma doesn't get swallowed.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const listField = (k: "citizenships" | "heritage" | "parentEmployers" | "extraInterests", placeholder: string) => (
    <input
      className={inputCls}
      placeholder={placeholder}
      value={drafts[k] ?? f[k].join(", ")}
      onChange={(e) => setDrafts((d) => ({ ...d, [k]: e.target.value }))}
      onBlur={(e) => {
        set(k, k === "citizenships" ? list(e.target.value).map((c) => c.toUpperCase().slice(0, 2)) : list(e.target.value));
        setDrafts((d) => ({ ...d, [k]: undefined as unknown as string }));
      }}
    />
  );

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-px bg-line lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-4 bg-surface p-6">
          <div className="flex items-center gap-2 text-sm font-semibold"><MapPin size={15} className="text-brand" /> Where you live</div>
          <p className="-mt-2 text-xs text-muted">Results are sorted closest first, and local awards have the smallest applicant pools.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="City"><input className={inputCls} value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Naperville" /></Field>
            <Field label="County"><input className={inputCls} value={f.county} onChange={(e) => set("county", e.target.value)} placeholder="DuPage" /></Field>
            <Field label="Metro or regional hub"><input className={inputCls} value={f.metro} onChange={(e) => set("metro", e.target.value)} placeholder="Chicagoland" /></Field>
            <Field label="State" hint="From your profile"><input className={cx(inputCls, "opacity-70")} value={profile.state} readOnly /></Field>
            <Field label="Age"><input type="number" min={10} max={30} className={inputCls} value={f.age ?? ""} onChange={(e) => set("age", e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label="Country of residence"><input className={inputCls} value={f.country} maxLength={2} onChange={(e) => set("country", e.target.value.toUpperCase())} /></Field>
          </div>
          <div className="flex items-center gap-2 pt-2 text-sm font-semibold"><UserRound size={15} className="text-brand" /> What you're looking for</div>
          <div className="flex flex-wrap gap-1.5">
            {WANT_OPTIONS.map((w) => (
              <button key={w} type="button" onClick={() => toggle("wants", w)} className={cx("rounded-full border px-3 py-1 text-xs capitalize transition", f.wants.includes(w) ? "border-brand bg-brand-soft text-brand" : "border-line hover:bg-surface-2")}>
                {w}s
              </button>
            ))}
            <span className="self-center text-xs text-muted">{f.wants.length ? "" : "All types"}</span>
          </div>
          <Field label="Extra interests" hint="Activities from your profile are already included">{listField("extraInterests", "robotics, startup, debate")}</Field>
          <Field label="Your goals or story, in a sentence or two" hint="Used to rank how well each award fits you">
            <textarea className={cx(inputCls, "min-h-20")} value={f.story} onChange={(e) => set("story", e.target.value)} placeholder="I build robots for kids in my neighborhood and want to study computer engineering." />
          </Field>
        </div>

        <div className="space-y-4 bg-surface p-6">
          <div className="flex items-center gap-2 text-sm font-semibold"><Lock size={15} className="text-brand" /> Eligibility details (optional and private)</div>
          <p className="-mt-2 text-xs text-muted">
            Many awards are limited by citizenship or immigration status. These answers are saved privately to your account, used only to filter, and never printed in your PDF. Never share an SSN, A-number or passport number with any scholarship.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Citizenship / immigration status">
              <select className={inputCls} value={f.residenceStatus} onChange={(e) => set("residenceStatus", e.target.value)}>
                {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" className="accent-[var(--brand)]" checked={f.hasWorkAuthorization} onChange={(e) => set("hasWorkAuthorization", e.target.checked)} /> I'm authorized to work in the U.S.
            </label>
          </div>
          {!f.residenceStatus && <p className="rounded-xl bg-warn-soft/60 px-3 py-2 text-xs text-warn">With "prefer not to say", you'll only see awards open to all students or to any U.S. resident.</p>}
          <Field label="Other citizenships (2-letter codes)" hint="Unlocks home-country and diaspora funding">{listField("citizenships", "IN, MX")}</Field>
          <div>
            <div className="mb-1.5 text-sm font-medium">Other country ties</div>
            <div className="flex flex-wrap gap-1.5">
              {TIES.map(([v, l]) => (
                <button key={v} type="button" onClick={() => toggle("countryTies", v)} className={cx("rounded-full border px-3 py-1 text-xs transition", f.countryTies.includes(v) ? "border-brand bg-brand-soft text-brand" : "border-line hover:bg-surface-2")}>{l}</button>
              ))}
            </div>
          </div>
          <Field label="Heritage, language or faith community">{listField("heritage", "Indian, Telugu")}</Field>
          <div>
            <div className="mb-1.5 text-sm font-medium">Background</div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {BACKGROUND.map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-[var(--brand)]" checked={v === "first_gen" ? profile.firstGen : v === "low_income" ? profile.lowIncome : f.background.includes(v)} onChange={() => (v === "first_gen" ? setProfile((p) => ({ ...p, firstGen: !p.firstGen })) : v === "low_income" ? setProfile((p) => ({ ...p, lowIncome: !p.lowIncome })) : toggle("background", v))} /> {l}
                </label>
              ))}
            </div>
          </div>
          <Field label="Parent or guardian employers and unions" hint="Employer scholarships are often under-applied">{listField("parentEmployers", "Boeing, SEIU Local 73")}</Field>
        </div>
      </div>
    </Card>
  );
}
