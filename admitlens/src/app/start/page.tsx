"use client";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, FileUp, GraduationCap, Loader2, Map, PenLine, ShieldCheck, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CollegePicker } from "@/components/CollegePicker";
import { CommonAppImport } from "@/components/CommonAppImport";
import { Button, Card, cx, Field, inputCls } from "@/components/ui";
import { mergeImport } from "@/lib/commonapp";
import { STATUS_OPTIONS } from "@/lib/grantscout";
import { useStore, type Goal } from "@/lib/store";
import { EMPTY_FUNDING, STATES } from "@/lib/types";

const GOALS: { id: Goal; title: string; body: string; icon: typeof Trophy }[] = [
  { id: "admissions", title: "Get into my dream college", body: "A harsh, realistic evaluation from that college's point of view, your chances, and what to fix.", icon: GraduationCap },
  { id: "scholarships", title: "Find scholarships", body: "Awards you actually qualify for, matched to your grades, location and status.", icon: Trophy },
  { id: "essays", title: "Review my essays", body: "Line-by-line feedback on your personal statement and supplements.", icon: PenLine },
  { id: "roadmap", title: "Build a roadmap", body: "A grade-by-grade plan to your dream school, for 9th to 11th graders.", icon: Map },
];

const QUICK_STATUS: [string, string][] = [
  ["citizen", "U.S. citizen"],
  ["pr", "Green card holder"],
  ["visa", "On a visa"],
  ["daca", "DACA"],
  ["other", "Something else"],
  ["", "Prefer not to say"],
];
const VISAS = ["h4", "l2", "other_dependent", "f1", "j1"];
const label = (k: string) => STATUS_OPTIONS.find(([v]) => v === k)?.[1] ?? k;

const STEPS = ["Name", "Grade", "Goals", "Status", "Account", "Application", "College"];

export default function Start() {
  const router = useRouter();
  const { ready, user, accountsAvailable, profile, setProfile, goals, setGoals, setOnboarded, setDreamCollege, signUp } = useStore();
  const [step, setStep] = useState(0);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [statusChoice, setStatusChoice] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  // Prefill from anything already entered (e.g. a refresh mid-way).
  useEffect(() => {
    if (!ready) return;
    const [f = "", ...rest] = profile.name.split(" ");
    setFirst((x) => x || f);
    setLast((x) => x || rest.join(" "));
    const st = profile.funding?.residenceStatus;
    if (st !== undefined && statusChoice === null && profile.funding) setStatusChoice(VISAS.includes(st) ? "visa" : ["citizen", "pr", "daca", ""].includes(st) ? st : "other");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready)
    return (
      <div className="grid place-items-center py-32 text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );

  const f = { ...EMPTY_FUNDING, ...(profile.funding ?? {}) };
  const setFunding = (patch: Partial<typeof f>) => setProfile((p) => ({ ...p, funding: { ...EMPTY_FUNDING, ...(p.funding ?? {}), ...patch } }));
  const senior = profile.grade >= 12;
  const next = () => {
    setErr(null);
    let s = step + 1;
    if (s === 4 && (user || !accountsAvailable)) s = 5; // already signed in, or accounts not switched on yet
    setStep(s);
    window.scrollTo({ top: 0 });
  };
  const back = () => {
    setErr(null);
    setStep((s) => (s === 5 && (user || !accountsAvailable) ? 3 : Math.max(0, s - 1)));
  };

  const finish = (collegeId: string | null) => {
    setOnboarded(true);
    if (collegeId) {
      setDreamCollege(collegeId);
      router.push(`/evaluate?college=${encodeURIComponent(collegeId)}`);
      return;
    }
    const first = goals[0];
    router.push(first === "scholarships" ? "/scholarships" : first === "essays" ? "/essays" : first === "roadmap" ? "/roadmap" : "/dashboard");
  };

  const createAccount = async () => {
    setBusy(true);
    setErr(null);
    const e = await signUp(email, password, `${first} ${last}`.trim());
    setBusy(false);
    if (e) setErr(e);
    else next();
  };

  return (
    <div className="mx-auto max-w-2xl rise">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          {!user && accountsAvailable && (
            <Link href="/signin" className="hover:text-ink">
              Already have an account? <span className="text-brand">Sign in</span>
            </Link>
          )}
        </div>
        <div className="mt-2 flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className={cx("h-1.5 flex-1 rounded-full transition", i <= step ? "bg-brand" : "bg-line")} />
          ))}
        </div>
      </div>

      {step === 0 && (
        <Card className="p-7">
          <div className="eyebrow">Let's get to know you</div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">What's your name?</h1>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!first.trim()) return setErr("Enter your first name.");
              setProfile((p) => ({ ...p, name: `${first.trim()} ${last.trim()}`.trim() }));
              next();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="First name">
                <input autoFocus className={inputCls} value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" data-testid="first" />
              </Field>
              <Field label="Last name">
                <input className={inputCls} value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" data-testid="last" />
              </Field>
            </div>
            {err && <p className="text-sm text-bad">{err}</p>}
            <Button type="submit" className="w-full sm:w-auto">
              Continue <ArrowRight size={16} />
            </Button>
          </form>
        </Card>
      )}

      {step === 1 && (
        <Card className="p-7">
          <div className="eyebrow">Hi {first}</div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">What grade are you in?</h1>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              [9, "9th grade"],
              [10, "10th grade"],
              [11, "11th grade"],
              [12, "12th grade (senior)"],
              [13, "Graduated / gap year"],
            ].map(([g, l]) => (
              <button
                key={g}
                onClick={() => {
                  setProfile((p) => ({ ...p, grade: g as number }));
                  if ((g as number) >= 12) setGoals(goals.filter((x) => x !== "roadmap"));
                  next();
                }}
                className={cx("rounded-xl border px-4 py-4 text-left text-sm font-medium transition hover:border-brand", profile.grade === g ? "border-brand bg-brand-soft text-brand ring-2 ring-brand/40" : "border-line bg-surface")}
              >
                {l}
              </button>
            ))}
          </div>
          <Nav back={back} />
        </Card>
      )}

      {step === 2 && (
        <Card className="p-7">
          <div className="eyebrow">Your goals</div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">What do you need help with?</h1>
          <p className="mt-1 text-sm text-muted">Pick everything that applies.</p>
          <div className="mt-6 grid gap-2">
            {GOALS.map((g) => {
              const disabled = g.id === "roadmap" && senior;
              const on = goals.includes(g.id);
              return (
                <button
                  key={g.id}
                  disabled={disabled}
                  onClick={() => setGoals(on ? goals.filter((x) => x !== g.id) : [...goals, g.id])}
                  className={cx("flex items-start gap-3 rounded-xl border p-4 text-left transition", disabled ? "cursor-not-allowed opacity-50" : "hover:border-brand", on ? "border-brand bg-brand-soft" : "border-line bg-surface")}
                  aria-pressed={on}
                >
                  <span className={cx("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", on ? "bg-brand text-[var(--surface)]" : "bg-surface-2 text-brand")}>
                    {on ? <Check size={16} /> : <g.icon size={16} />}
                  </span>
                  <span>
                    <span className="block font-medium">{g.title}</span>
                    <span className="block text-sm text-muted">{disabled ? "Roadmaps are for 9th to 11th graders. As a senior, your evaluation shows what to fix before you submit." : g.body}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {err && <p className="mt-3 text-sm text-bad">{err}</p>}
          <Nav back={back} next={() => (goals.length ? next() : setErr("Pick at least one."))} />
        </Card>
      )}

      {step === 3 && (
        <Card className="p-7">
          <div className="eyebrow">For scholarship matching</div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Where do you live, and what's your citizenship or visa status?</h1>
          <p className="mt-2 flex gap-2 text-sm text-muted">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-good" />
            Many scholarships are limited by citizenship or visa type. This is used only to hide awards you can't receive. It's never shown in reports or shared. Never give any scholarship your SSN, A-number or passport number.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="State you live in">
              <select className={inputCls} value={profile.state} onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value }))} data-testid="state">
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="City (optional)" hint="Finds local awards">
              <input className={inputCls} value={f.city} onChange={(e) => setFunding({ city: e.target.value })} placeholder="Naperville" />
            </Field>
          </div>
          <div className="mt-5 text-sm font-medium">Citizenship / visa status</div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {QUICK_STATUS.map(([k, l]) => (
              <button
                key={k || "none"}
                onClick={() => {
                  setStatusChoice(k);
                  if (k === "citizen" || k === "pr" || k === "daca" || k === "") setFunding({ residenceStatus: k, hasWorkAuthorization: k === "citizen" || k === "pr" || k === "daca" });
                  else setFunding({ residenceStatus: k === "visa" ? "h4" : "refugee", hasWorkAuthorization: false });
                }}
                className={cx("rounded-xl border px-3 py-3 text-sm transition hover:border-brand", statusChoice === k ? "border-brand bg-brand-soft font-medium text-brand ring-2 ring-brand/40" : "border-line bg-surface")}
                data-testid={`status-${k || "none"}`}
              >
                {l}
              </button>
            ))}
          </div>
          {(statusChoice === "visa" || statusChoice === "other") && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={statusChoice === "visa" ? "Which visa?" : "Which describes you?"}>
                <select className={inputCls} value={f.residenceStatus} onChange={(e) => setFunding({ residenceStatus: e.target.value })} data-testid="status-detail">
                  {STATUS_OPTIONS.filter(([k]) => (statusChoice === "visa" ? VISAS.includes(k) : k && !VISAS.includes(k) && !["citizen", "pr", "daca"].includes(k))).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <input type="checkbox" className="accent-[var(--brand)]" checked={f.hasWorkAuthorization} onChange={(e) => setFunding({ hasWorkAuthorization: e.target.checked })} /> I have U.S. work authorization
              </label>
            </div>
          )}
          {statusChoice !== null && <p className="mt-3 text-xs text-muted">Saved as: {statusChoice === "" ? "prefer not to say (you'll see awards open to everyone)" : label(f.residenceStatus)}</p>}
          {err && <p className="mt-3 text-sm text-bad">{err}</p>}
          <Nav back={back} next={() => (statusChoice === null ? setErr("Choose one, or 'Prefer not to say'.") : next())} />
        </Card>
      )}

      {step === 4 && !user && (
        <Card className="p-7">
          <div className="eyebrow">Save your progress</div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted">Everything you add is saved to your account, so you can come back on any device.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createAccount();
            }}
          >
            <Field label="Email">
              <input type="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" data-testid="email" />
            </Field>
            <Field label="Password" hint="At least 8 characters">
              <div className="relative">
                <input type={showPw ? "text" : "password"} required minLength={8} className={cx(inputCls, "pr-10")} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" data-testid="password" />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted" aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            {err && <p className="text-sm text-bad" data-testid="signup-error">{err}</p>}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button type="button" onClick={back} className="flex items-center gap-1 text-sm text-muted hover:text-ink">
                <ArrowLeft size={15} /> Back
              </button>
              <Button type="submit" disabled={busy} data-testid="create-account">
                {busy ? <Loader2 size={16} className="animate-spin" /> : null} Create account
              </Button>
            </div>
          </form>
        </Card>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <Card className="p-7">
            <div className="eyebrow">Your application</div>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Upload your Common App</h1>
            <p className="mt-1 text-sm text-muted">We'll fill in your grades, test scores, activities, honors and essay so you don't have to type them. You'll check everything before it's saved.</p>
          </Card>
          <CommonAppImport
            compact
            onApply={(partial) => {
              setProfile((p) => mergeImport(p, partial));
              setImported(true);
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={back} className="flex items-center gap-1 text-sm text-muted hover:text-ink">
              <ArrowLeft size={15} /> Back
            </button>
            <div className="flex flex-wrap gap-2">
              {!imported && (
                <Button variant="secondary" onClick={next}>
                  {senior ? "Skip for now" : "I don't have one yet"}
                </Button>
              )}
              <Button onClick={next} disabled={!imported} data-testid="after-import">
                <FileUp size={16} /> Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 6 && (
        <Card className="p-7">
          <div className="eyebrow">Last step</div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">{goals.includes("admissions") || goals.includes("roadmap") ? "Which college is your dream school?" : "You're all set"}</h1>
          {goals.includes("admissions") || goals.includes("roadmap") ? (
            <>
              <p className="mt-1 text-sm text-muted">Its admissions office will evaluate your full application: ratings for each part, your chances, and a written review of how your file would be read there.</p>
              <CollegePicker onPick={(c) => finish(c.id)} placeholder="Search any U.S. college…" className="mt-6" />
              <div className="mt-6 flex items-center justify-between">
                <button onClick={back} className="flex items-center gap-1 text-sm text-muted hover:text-ink">
                  <ArrowLeft size={15} /> Back
                </button>
                <button onClick={() => finish(null)} className="text-sm text-muted hover:text-ink">
                  I'll choose later
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">Your profile is saved. {goals.includes("scholarships") ? "Your scholarship matches are ready." : ""}</p>
              <Button className="mt-6" onClick={() => finish(null)}>
                {goals[0] === "scholarships" ? "See my scholarships" : goals[0] === "essays" ? "Open my essays" : "Go to my dashboard"} <ArrowRight size={16} />
              </Button>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

function Nav({ back, next }: { back: () => void; next?: () => void }) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <button onClick={back} className="flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} /> Back
      </button>
      {next && (
        <Button onClick={next} data-testid="next">
          Continue <ArrowRight size={16} />
        </Button>
      )}
    </div>
  );
}
