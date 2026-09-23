/** Small numbered editorial eyebrow, e.g. "02 — The flagship". */
export function SectionLabel({
  index,
  children,
  tone = "dark",
}: {
  index: string;
  children: React.ReactNode;
  tone?: "dark" | "light";
}) {
  const color = tone === "dark" ? "text-gold-light" : "text-gold";
  return (
    <p className={`flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] ${color}`}>
      <span className="font-display text-sm tracking-normal">{index}</span>
      <span className={`h-px w-8 ${tone === "dark" ? "bg-gold-light/50" : "bg-gold/60"}`} />
      {children}
    </p>
  );
}
