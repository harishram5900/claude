const paths = {
  linkedin:
    "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 21 11.3 21 14.7V21h-4v-5.6c0-1.34-.02-3.06-1.86-3.06-1.87 0-2.15 1.46-2.15 2.96V21H9z",
  instagram:
    "M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM12 3.6c2.7 0 3 0 4.1.06 2.7.12 4 1.4 4.1 4.1.05 1.07.06 1.4.06 4.1s0 3-.06 4.1c-.12 2.7-1.4 4-4.1 4.1-1.07.05-1.4.06-4.1.06s-3 0-4.1-.06c-2.7-.12-4-1.4-4.1-4.1C3.6 15 3.6 14.7 3.6 12s0-3 .06-4.1c.12-2.7 1.4-4 4.1-4.1C8.9 3.6 9.3 3.6 12 3.6zM12 2c-2.7 0-3.1 0-4.2.06-3.6.17-5.6 2.2-5.8 5.8C2 8.9 2 9.3 2 12s0 3.1.06 4.2c.17 3.6 2.2 5.6 5.8 5.8 1.05.05 1.4.06 4.2.06s3.1 0 4.2-.06c3.6-.17 5.6-2.2 5.8-5.8.05-1.05.06-1.4.06-4.2s0-3.1-.06-4.2c-.16-3.6-2.2-5.6-5.8-5.8C15.1 2 14.7 2 12 2z",
  youtube:
    "M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .6 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-4.8 31 31 0 0 0-.4-4.8zM9.8 15V9l5.8 3z",
};

const names = { linkedin: "LinkedIn", instagram: "Instagram", youtube: "YouTube" };

/** Round icon link to a social profile. */
export function SocialIcon({ kind, href }: { kind: keyof typeof paths; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${names[kind]} (opens in a new tab)`}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-line/15 text-fg/80 transition-colors hover:border-accent hover:text-accent"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={paths[kind]} />
      </svg>
    </a>
  );
}
