// AdmitLens mark: Ollie the owl's face, reduced to its two reading lenses, a beak and ear tufts.
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="#1d5a46" />
      <path d="M13 18 L11 8 L22 14 Z M51 18 L53 8 L42 14 Z" fill="#164636" />
      <circle cx="22" cy="30" r="10" fill="#fffdf8" stroke="#191d1b" strokeWidth="3" />
      <circle cx="42" cy="30" r="10" fill="#fffdf8" stroke="#191d1b" strokeWidth="3" />
      <path d="M30.5 29 Q32 27 33.5 29" fill="none" stroke="#191d1b" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="23.5" cy="31" r="4" fill="#191d1b" />
      <circle cx="43.5" cy="31" r="4" fill="#191d1b" />
      <circle cx="25" cy="29.5" r="1.4" fill="#fffdf8" />
      <circle cx="45" cy="29.5" r="1.4" fill="#fffdf8" />
      <path d="M28.5 41 L35.5 41 L32 48 Z" fill="#e0a53a" stroke="#e0a53a" strokeWidth="1.5" strokeLinejoin="round" />
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
