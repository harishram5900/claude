// Deterministic essay analysis. Every metric comes from the text itself, so two different
// essays never receive the same feedback, and the same essay always scores the same.
import type { College } from "@/data/colleges";

export interface EssayIssue {
  kind: "cliche" | "filler" | "passive" | "telling" | "generic-why" | "long-sentence" | "opening";
  excerpt: string;
  advice: string;
}

export interface EssayAnalysis {
  words: number;
  limit: number;
  sentences: number;
  avgSentenceLength: number;
  sentenceVariety: number; // std dev of sentence length
  vocabularyRichness: number; // type/token ratio on first 400 words
  scores: {
    voice: number;
    specificity: number;
    structure: number;
    reflection: number;
    mechanics: number;
    fit: number | null; // only for college-specific essays
  };
  overall: number; // 0–100
  grade: string;
  issues: EssayIssue[];
  strengths: string[];
  nextSteps: string[];
}

export const COMMON_APP_PROMPTS = [
  "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.",
  "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?",
  "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?",
  "Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?",
  "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.",
  "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?",
  "Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design.",
];

const CLICHES = [
  "ever since i was little",
  "ever since i was a child",
  "since i was young",
  "webster's dictionary defines",
  "dictionary defines",
  "i have always been passionate",
  "my passion for",
  "make a difference",
  "make the world a better place",
  "change the world",
  "taught me the value of",
  "taught me so much",
  "out of my comfort zone",
  "comfort zone",
  "hard work pays off",
  "i learned that",
  "at the end of the day",
  "in today's society",
  "everything happens for a reason",
  "never give up",
  "follow my dreams",
  "dream school",
  "i realized that",
  "a life-changing experience",
  "life changing",
  "opened my eyes",
  "thinking outside the box",
  "rollercoaster of emotions",
  "little did i know",
  "the rest is history",
  "since the dawn of time",
  "i am a hard worker",
  "well-rounded",
  "giving back to the community",
  "mission trip",
];

const GENERIC_WHY = [
  "prestigious",
  "world-renowned",
  "world renowned",
  "top-ranked",
  "highly ranked",
  "diverse community",
  "beautiful campus",
  "excellent academics",
  "great reputation",
  "strong alumni network",
  "renowned faculty",
  "amazing opportunities",
  "perfect fit",
];

const FILLERS = ["very", "really", "extremely", "basically", "actually", "literally", "just", "things", "stuff", "a lot", "so many", "incredibly"];

const TELLING = ["i am passionate", "i am hardworking", "i am dedicated", "i am determined", "i am resilient", "i am a leader", "i am creative", "i am curious", "i am motivated"];

const REFLECTION_MARKERS = ["i wonder", "i still", "now i", "i began to", "i noticed", "i understand", "i started", "i question", "i used to", "i no longer", "instead of", "which meant", "because", "why"];

const SENSORY = ["smell", "sound", "taste", "texture", "humid", "bright", "quiet", "loud", "cold", "warm", "sticky", "rough", "glow", "echo", "creak", "whisper", "bitter", "sweet", "sharp", "dim"];

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export function letter(score: number): string {
  if (score >= 93) return "A+";
  if (score >= 88) return "A";
  if (score >= 84) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 71) return "B-";
  if (score >= 67) return "C+";
  if (score >= 62) return "C";
  if (score >= 58) return "C-";
  if (score >= 50) return "D";
  return "F";
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z"“'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function count(haystack: string, needle: string): number {
  let i = 0;
  let n = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    n++;
    i += needle.length;
  }
  return n;
}

function wordCount(re: RegExp, text: string) {
  return (text.match(re) || []).length;
}

export function analyzeEssay(text: string, opts: { limit?: number; college?: College | null } = {}): EssayAnalysis {
  const limit = opts.limit ?? 650;
  const college = opts.college ?? null;
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const tokens = clean.split(/\s+/).filter(Boolean);
  const words = tokens.length;
  const sents = splitSentences(clean);
  const lens = sents.map((s) => s.split(/\s+/).length);
  const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const variety = lens.length ? Math.sqrt(lens.reduce((a, b) => a + (b - avg) ** 2, 0) / lens.length) : 0;
  const sample = tokens.slice(0, 400).map((t) => t.toLowerCase().replace(/[^a-z']/g, "")).filter(Boolean);
  const ttr = sample.length ? new Set(sample).size / sample.length : 0;

  const issues: EssayIssue[] = [];
  const strengths: string[] = [];
  const nextSteps: string[] = [];

  if (words < 40) {
    return {
      words,
      limit,
      sentences: sents.length,
      avgSentenceLength: Math.round(avg * 10) / 10,
      sentenceVariety: Math.round(variety * 10) / 10,
      vocabularyRichness: Math.round(ttr * 100) / 100,
      scores: { voice: 0, specificity: 0, structure: 0, reflection: 0, mechanics: 0, fit: college ? 0 : null },
      overall: 0,
      grade: "—",
      issues: [],
      strengths: [],
      nextSteps: ["Write at least a full paragraph (40+ words) to get a real reading."],
    };
  }

  // --- Clichés and telling statements
  let clicheHits = 0;
  for (const c of CLICHES) {
    const n = count(lower, c);
    if (n > 0) {
      clicheHits += n;
      if (issues.filter((i) => i.kind === "cliche").length < 6)
        issues.push({ kind: "cliche", excerpt: c, advice: `"${c}" appears in thousands of essays a reader sees each season. Replace it with the specific moment that made you feel this.` });
    }
  }
  let tellingHits = 0;
  for (const t of TELLING) {
    if (lower.includes(t)) {
      tellingHits++;
      issues.push({ kind: "telling", excerpt: t, advice: `Telling a reader "${t.replace("i am ", "you are ")}" persuades no one. Show one scene where that trait cost you something or changed an outcome.` });
    }
  }

  // --- Fillers
  let fillerHits = 0;
  for (const f of FILLERS) fillerHits += wordCount(new RegExp(`\\b${f}\\b`, "gi"), clean);
  const fillerRate = (fillerHits / Math.max(words, 1)) * 100;
  if (fillerRate > 1.5) issues.push({ kind: "filler", excerpt: `${fillerHits} filler words`, advice: "Cut intensifiers like very/really/just/things. Each one is a word you could spend on a detail." });

  // --- Passive voice
  const passiveMatches = clean.match(/\b(was|were|been|being|is|are)\s+\w+ed\b/gi) || [];
  if (passiveMatches.length > 3)
    issues.push({ kind: "passive", excerpt: passiveMatches.slice(0, 2).join("; "), advice: `${passiveMatches.length} passive constructions. Put yourself back in the driver's seat: who did the action?` });

  // --- Long sentences
  sents.forEach((s) => {
    const n = s.split(/\s+/).length;
    if (n > 42 && issues.filter((i) => i.kind === "long-sentence").length < 2)
      issues.push({ kind: "long-sentence", excerpt: s.slice(0, 90) + "…", advice: `This sentence runs ${n} words. Split it so the key idea lands.` });
  });

  // --- Opening
  const first = sents[0] ?? "";
  const firstLower = first.toLowerCase();
  let openingScore = 60;
  if (/^(webster|merriam|the dictionary|according to)/.test(firstLower) || firstLower.includes("defines")) {
    openingScore = 25;
    issues.push({ kind: "opening", excerpt: first.slice(0, 80), advice: "Dictionary-definition openings are a well-known red flag for readers. Start inside a moment instead." });
  } else if (/^["“]/.test(first)) {
    openingScore = 70;
  } else if (/^(i have always|ever since|since i was|my name is|hello|hi,)/.test(firstLower)) {
    openingScore = 35;
    issues.push({ kind: "opening", excerpt: first.slice(0, 80), advice: "This opening is a throat-clear. Start with the most vivid or surprising image in the essay." });
  } else if (first.split(/\s+/).length <= 12) {
    openingScore = 80; // short punchy opener
  }

  // --- Specificity: numbers, proper nouns mid-sentence, sensory words, dialogue
  const numbers = wordCount(/\b\d[\d,.:%]*\b/g, clean);
  const properNouns = (clean.match(/(?<![.!?]\s)(?<!^)\b[A-Z][a-z]{2,}\b/g) || []).filter((w) => !["I", "The", "My", "When", "But", "And", "It"].includes(w)).length;
  const sensory = SENSORY.reduce((a, s) => a + count(lower, s), 0);
  const dialogue = wordCount(/["“][^"”]{3,}["”]/g, clean);
  const per100 = (n: number) => (n / Math.max(words, 1)) * 100;
  const specificity = clamp(35 + per100(numbers) * 9 + per100(properNouns) * 4 + per100(sensory) * 10 + Math.min(dialogue, 3) * 5 - clicheHits * 4 - tellingHits * 5);

  // --- Voice: first person presence, vocabulary richness, sentence variety, low filler
  const iCount = wordCount(/\b(I|me|my|myself)\b/g, clean);
  const iRate = per100(iCount);
  const iBalance = iRate < 2 ? 45 : iRate > 9 ? 60 : 85; // too little = not about you; too much = monotone
  const voice = clamp(iBalance * 0.35 + ttr * 100 * 0.45 + Math.min(variety, 12) * 2.2 - fillerRate * 4 - clicheHits * 2);

  // --- Reflection
  const reflectionHits = REFLECTION_MARKERS.reduce((a, m) => a + count(lower, m), 0);
  const learnedCliche = count(lower, "i learned") + count(lower, "taught me");
  const lastThird = lower.slice(Math.floor(lower.length * 0.66));
  const endsReflective = REFLECTION_MARKERS.some((m) => lastThird.includes(m));
  const reflection = clamp(35 + Math.min(per100(reflectionHits), 4) * 10 + (endsReflective ? 15 : 0) - learnedCliche * 6);

  // --- Structure: length relative to limit, paragraphing, opening
  const paragraphs = clean.split(/\n\s*\n|\n/).filter((p) => p.trim().length > 0).length;
  const lengthRatio = words / limit;
  let lengthScore = 100;
  if (lengthRatio > 1) lengthScore = 20; // over the limit is a hard fail in the portal
  else if (lengthRatio < 0.5) lengthScore = 45;
  else if (lengthRatio < 0.75) lengthScore = 70;
  else lengthScore = 95;
  const paraScore = words > 250 ? (paragraphs >= 3 ? 90 : paragraphs === 2 ? 65 : 40) : 75;
  const structure = clamp(lengthScore * 0.45 + paraScore * 0.25 + openingScore * 0.3);

  // --- Mechanics
  const doubleSpaces = count(clean, "  ");
  const lowerStarts = sents.filter((s) => /^[a-z]/.test(s)).length;
  const exclam = count(clean, "!");
  const mechanics = clamp(95 - Math.max(0, avg - 26) * 2 - lowerStarts * 6 - doubleSpaces * 2 - Math.max(0, exclam - 2) * 4 - Math.max(0, passiveMatches.length - 3) * 2);

  // --- Fit (only for college-specific essays)
  let fit: number | null = null;
  if (college) {
    const named = lower.includes(college.short.toLowerCase()) || lower.includes(college.name.toLowerCase());
    const resourceHits = college.knownFor.filter((k) => {
      const key = k.toLowerCase().split(/[\s(]/).filter((w) => w.length > 3).slice(0, 2);
      return key.length > 0 && key.every((w) => lower.includes(w));
    });
    const genericHits = GENERIC_WHY.filter((g) => lower.includes(g));
    genericHits.slice(0, 3).forEach((g) =>
      issues.push({ kind: "generic-why", excerpt: g, advice: `"${g}" could describe 200 schools. Name a course, professor, lab, tradition, or program only ${college.short} has.` }),
    );
    fit = clamp(30 + (named ? 10 : 0) + resourceHits.length * 18 + per100(properNouns) * 3 - genericHits.length * 10);
    if (resourceHits.length) strengths.push(`You connect yourself to ${college.short}-specific resources (${resourceHits.slice(0, 2).join(", ")}).`);
    else nextSteps.push(`Reference at least two things unique to ${college.short}, for example ${college.knownFor.slice(0, 2).join(" or ")}, and say what you would do with them.`);
  }

  const parts = [voice, specificity, structure, reflection, mechanics];
  const weights = [0.24, 0.26, 0.16, 0.22, 0.12];
  let overall = parts.reduce((a, s, i) => a + s * weights[i], 0);
  if (fit !== null) overall = overall * 0.7 + fit * 0.3;
  overall = Math.round(clamp(overall));

  // Strengths
  if (specificity >= 70) strengths.push("Concrete, specific detail: a reader can picture what happened.");
  if (voice >= 70) strengths.push("A distinct voice with varied sentence rhythm and vocabulary.");
  if (reflection >= 70) strengths.push("Real reflection on how your thinking changed, not just what happened.");
  if (openingScore >= 70) strengths.push("A strong opening line that pulls the reader in.");
  if (lengthRatio >= 0.8 && lengthRatio <= 1) strengths.push("Good use of the word budget.");
  if (dialogue > 0) strengths.push("Dialogue brings other people onto the page.");

  // Next steps (weakest first)
  const ranked = [
    ["specificity", specificity, "Add sensory or numerical detail to your two most important moments. Name the place, the person, the exact words said."],
    ["reflection", reflection, "Spend your final third on what changed in how you think or act now. Avoid 'I learned that…' and show the new behavior."],
    ["voice", voice, "Read it aloud. Wherever it sounds like a brochure, rewrite it the way you'd tell a friend."],
    ["structure", structure, lengthRatio > 1 ? `Cut ${words - limit} words. The portal will not accept it over ${limit}.` : lengthRatio < 0.75 ? `You have ${limit - words} words of room. Use them to deepen one scene, not to add new topics.` : "Break the essay into clear movements: scene → tension → turn → reflection."],
    ["mechanics", mechanics, "Tighten long sentences and convert passive constructions to active voice."],
  ] as const;
  [...ranked].sort((a, b) => a[1] - b[1]).slice(0, 3).forEach((r) => nextSteps.push(r[2]));

  return {
    words,
    limit,
    sentences: sents.length,
    avgSentenceLength: Math.round(avg * 10) / 10,
    sentenceVariety: Math.round(variety * 10) / 10,
    vocabularyRichness: Math.round(ttr * 100) / 100,
    scores: {
      voice: Math.round(voice),
      specificity: Math.round(specificity),
      structure: Math.round(structure),
      reflection: Math.round(reflection),
      mechanics: Math.round(mechanics),
      fit: fit === null ? null : Math.round(fit),
    },
    overall,
    grade: letter(overall),
    issues,
    strengths,
    nextSteps,
  };
}
