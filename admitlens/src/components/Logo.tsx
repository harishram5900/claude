export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="al-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6d5ef5" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#al-g)" />
      <circle cx="32" cy="32" r="17" fill="none" stroke="#fff" strokeWidth="4.5" />
      <path d="M23.5 39.5 32 22l8.5 17.5" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="45.5" cy="18.5" r="3.5" fill="#fbbf24" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-xl font-semibold tracking-tight">
        Admit<span className="text-brand">Lens</span>
      </span>
    </span>
  );
}
