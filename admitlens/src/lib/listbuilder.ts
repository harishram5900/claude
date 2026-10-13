// Suggests a balanced application list from the student's estimated chances.
// Counselors commonly recommend ~2–4 reaches, ~3–4 targets and ~2–3 likely schools,
// with at least one likely school the family can afford.
import { COLLEGES, type College } from "@/data/colleges";
import { chanceOnly } from "./engine";
import type { Profile } from "./types";

export interface Suggestion {
  college: College;
  chance: number;
  bucket: "Reach" | "Target" | "Likely";
  reasons: string[];
}

const GENERIC = new Set(["science", "sciences", "studies", "study", "arts", "general", "applied", "program", "major", "undecided", "and"]);

/** Returns the college's signature program that relates to the student's major, if any. */
function majorFit(c: College, major: string): string | null {
  if (!major) return null;
  // Generic words ("science", "studies") would match unrelated programs: Computer Science ≠ marine science.
  const keys = major.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3 && !GENERIC.has(w));
  const hit = (item: string) => {
    const hay = item.toLowerCase();
    return keys.some((k) => new RegExp(`\\b${k}`).test(hay) || Object.entries(alias).some(([root, words]) => k.startsWith(root.slice(0, 5)) && words.some((w) => new RegExp(`\\b${w}\\b`).test(hay))));
  };
  const alias: Record<string, string[]> = {
    computer: ["computing", "computer", "eecs", "cs"],
    engineering: ["engineering"],
    business: ["business", "wharton", "ross", "stern", "haas", "kelley", "mccombs", "management"],
    biology: ["medical", "health", "medicine", "biological", "public health"],
    nursing: ["nursing", "health"],
    journalism: ["journalism", "communications"],
    film: ["film", "cinematic", "theater"],
  };
  return c.knownFor.find(hit) ?? null;
}

export function buildList(p: Profile, exclude: string[] = []) {
  const rows = COLLEGES.filter((c) => !exclude.includes(c.id)).map((c) => ({ c, chance: chanceOnly(p, c), fit: majorFit(c, p.intendedMajor), home: c.state === p.state }));
  const reasonsFor = (r: (typeof rows)[number]) => {
    const out: string[] = [];
    if (r.fit) out.push(`Related program: ${r.fit}`);
    if (r.home && r.c.control === "Public") out.push("In-state public: lower tuition and an admissions edge");
    if (r.c.coa && r.c.coa < 40000) out.push(`Sticker cost about $${Math.round(r.c.coa / 1000)}k/yr`);
    if (r.c.testPolicy === "optional" && !p.sat && !p.act) out.push("Test-optional");
    return out;
  };
  const score = (r: (typeof rows)[number]) => (r.fit ? 2 : 0) + (r.home && r.c.control === "Public" ? 1.5 : 0);

  const reach = rows
    .filter((r) => r.chance >= 0.04 && r.chance < 0.3)
    .sort((a, b) => score(b) - score(a) || a.c.admitRate - b.c.admitRate)
    .slice(0, 4);
  const target = rows
    .filter((r) => r.chance >= 0.35 && r.chance < 0.72 && r.c.admitRate >= 0.15)
    .sort((a, b) => score(b) - score(a) || a.c.admitRate - b.c.admitRate)
    .slice(0, 4);
  const likely = rows
    .filter((r) => r.chance >= 0.8)
    .sort((a, b) => score(b) - score(a) || (a.c.coa || 99999) - (b.c.coa || 99999) || a.c.admitRate - b.c.admitRate)
    .slice(0, 3);

  const pack = (list: typeof rows, bucket: Suggestion["bucket"]): Suggestion[] => list.map((r) => ({ college: r.c, chance: r.chance, bucket, reasons: reasonsFor(r) }));
  return { reach: pack(reach, "Reach"), target: pack(target, "Target"), likely: pack(likely, "Likely") };
}
