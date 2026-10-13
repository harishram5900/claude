import type { College } from "@/data/colleges";
import { getProgram, type Program } from "@/data/programs";

/**
 * A college as seen by one of its schools or programs: the program's admit rate when one is published
 * (or the university's rate when it isn't), and the program's review notes. The engine reads the
 * returned College like any other, plus `program.kind` for how the file is weighted.
 */
export function applyProgram(c: College, prog: Program | null | undefined): College {
  if (!prog) return c;
  let rate = c.admitRate;
  let rateNote = `${c.short} doesn't publish a separate admit rate for ${prog.short}, so this uses ${c.short}'s overall rate. The program still changes how your file is read.`;
  let rateUrl: string | undefined;
  if (prog.rate) {
    rate = prog.rate.value;
    rateNote = `${prog.rate.basis === "official" ? "Published" : "Reported"}: ${prog.rate.note}`;
    rateUrl = prog.rate.url;
  } else if (prog.relativeOdds) {
    const odds = (c.admitRate / (1 - c.admitRate)) * prog.relativeOdds.value;
    rate = odds / (1 + odds);
    rateNote = prog.relativeOdds.note;
    rateUrl = prog.relativeOdds.url;
  }
  const scale = rate / c.admitRate;
  return {
    ...c,
    admitRate: rate,
    earlyRate: c.earlyRate ? Math.min(0.95, c.earlyRate * scale) : c.earlyRate,
    short: prog.short,
    name: `${c.name}: ${prog.name}`,
    values: [prog.review, ...c.values],
    program: { id: prog.id, name: prog.name, kind: prog.kind, requires: prog.requires, review: prog.review, rateNote, rateUrl, parentShort: c.short, parentRate: c.admitRate },
  };
}

export function collegeForProgram(c: College, programs: Record<string, string>): College {
  return applyProgram(c, getProgram(c.id, programs[c.id]));
}
