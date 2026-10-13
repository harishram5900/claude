"use client";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button, Card, cx, Field, inputCls } from "@/components/ui";
import { useStore } from "@/lib/store";

function SignIn() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, user, onboarded, signIn, accountsAvailable } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const nextPath = params.get("next");
  const dest = nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : null;

  // Already signed in when the page opens: go straight in. (After signing in here, onSubmit navigates.)
  useEffect(() => {
    if (ready && user && !busy) router.replace(dest ?? (onboarded ? "/dashboard" : "/start"));
  }, [ready, user, onboarded, dest, router, busy]);

  return (
    <Card className="mx-auto mt-6 max-w-md p-7 rise">
      <div className="eyebrow">Welcome back</div>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Sign in</h1>
      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          const er = await signIn(email, password);
          if (er) {
            setErr(er);
            setBusy(false);
          } else router.replace(dest ?? "/dashboard");
        }}
      >
        <Field label="Email">
          <input type="email" required autoFocus className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" data-testid="email" />
        </Field>
        <Field label="Password">
          <div className="relative">
            <input type={show ? "text" : "password"} required className={cx(inputCls, "pr-10")} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" data-testid="password" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
        {ready && !accountsAvailable && <p className="text-sm text-warn">Accounts are being switched on for this site. For now, use Get started; your work is saved in this browser.</p>}
        {err && <p className="text-sm text-bad" data-testid="signin-error">{err}</p>}
        <Button type="submit" className="w-full" disabled={busy || !ready} data-testid="signin">
          {busy && <Loader2 size={16} className="animate-spin" />} Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New to AdmitLens?{" "}
        <Link href="/start" className="text-brand">
          Get started
        </Link>
      </p>
    </Card>
  );
}

export default function Page() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}
