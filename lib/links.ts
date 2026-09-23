/**
 * Every external link on the site lives here so it can be edited in one place.
 * Anything still set to REPLACE_ME renders as an inert placeholder link
 * (see `isPlaceholder`) — fill these in before sharing the site.
 */
export const REPLACE_ME = "[REPLACE ME]";

export const links = {
  email: "harishram7971@gmail.com",
  linkedin: "https://www.linkedin.com/in/harish-ramasubramanian/",
  resume: REPLACE_ME, // e.g. "/resume.pdf" (drop the file in /public)
  instagram: "https://www.instagram.com/harishking8346/",
  youtube: REPLACE_ME, // e.g. "https://youtube.com/@founderharish"
  levelUpWaitlist: "https://levelup-waitlist.vercel.app",
} as const;

export const isPlaceholder = (value: string) => value === REPLACE_ME;

/** Returns a usable href, or "#contact" while the value is still a placeholder. */
export function hrefFor(value: string, kind: "url" | "email" = "url") {
  if (isPlaceholder(value)) return "#contact";
  return kind === "email" ? `mailto:${value}` : value;
}
