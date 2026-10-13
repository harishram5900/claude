"use client";
import { Loader2, Lock } from "lucide-react";
import { usePathname } from "next/navigation";
import { ButtonLink, Card } from "@/components/ui";
import { useStore } from "@/lib/store";

/** Every personal tool needs an account, so each student's work is saved to them. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { ready, user, accountsAvailable } = useStore();
  const path = usePathname();
  if (!ready)
    return (
      <div className="grid place-items-center py-32 text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!user && !accountsAvailable)
    return (
      <>
        <div className="mb-6 rounded-xl border border-line bg-warn-soft/50 px-4 py-2.5 text-sm text-warn">Accounts are being switched on for this site. Until then, your work is saved in this browser.</div>
        {children}
      </>
    );
  if (!user)
    return (
      <Card className="mx-auto mt-10 max-w-lg p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
          <Lock size={20} />
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold">Sign in to continue</h1>
        <p className="mt-2 text-sm text-muted">Your profile, evaluations, essays, scholarships and tracker are saved to your account so you can pick up where you left off on any device.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/start">Get started</ButtonLink>
          <ButtonLink href={`/signin?next=${encodeURIComponent(path)}`} variant="secondary">Sign in</ButtonLink>
        </div>
      </Card>
    );
  return <>{children}</>;
}
