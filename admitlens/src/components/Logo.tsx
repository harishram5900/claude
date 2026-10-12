// AdmitLens mark: a lens ring framing an ascending peak (the climb to admission),
// with a brass point of light. Ivy-to-navy field.
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="al-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1d5a46" />
          <stop offset="1" stopColor="#23406b" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#al-g)" />
      <circle cx="32" cy="33" r="17.5" fill="none" stroke="#f5f2ea" strokeWidth="3.6" />
      <path d="M22.5 41 32 23.5 41.5 41" fill="none" stroke="#f5f2ea" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26.6 34.5h10.8" stroke="#f5f2ea" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="46" cy="18" r="3.6" fill="#d9a744" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[1.35rem] font-semibold tracking-tight">
        Admit<span className="italic text-brand">Lens</span>
      </span>
    </span>
  );
}
