/**
 * Every external link on the site lives here so it can be edited in one place.
 * Anything still set to REPLACE_ME is hidden from the site until it's filled in.
 */
export const REPLACE_ME = "[REPLACE ME]";

export const links = {
  email: "harishram7971@gmail.com",
  linkedin: "https://www.linkedin.com/in/harish-ramasubramanian/",
  instagram: "https://www.instagram.com/harishking8346/",
  resume: REPLACE_ME, // e.g. "/resume.pdf" (drop the file in /public)
  youtube: REPLACE_ME, // e.g. "https://youtube.com/@yourchannel"
} as const;

export const isPlaceholder = (value: string) => value === REPLACE_ME;
