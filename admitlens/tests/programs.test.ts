// Program-level evaluation: the school or major inside a university changes the admit rate used,
// how the file is weighted, and what the reader says.
import { getCollege } from "../src/data/colleges";
import { DRAFT_2, LANDING_PROFILE } from "../src/data/landing";
import { getProgram, PROGRAMS, suggestProgram } from "../src/data/programs";
import { evaluate } from "../src/lib/engine";
import { applyProgram } from "../src/lib/programs";

const p = { ...LANDING_PROFILE, personalStatement: DRAFT_2 };
const ev = (cid: string, pid: string | null, prof = p) => evaluate(prof, applyProgram(getCollege(cid)!, getProgram(cid, pid)));
const checks: [string, boolean][] = [
  ["acting → Tisch Drama", suggestProgram("nyu", "Acting")?.id === "tisch-drama"],
  ["finance → Stern", suggestProgram("nyu", "Finance")?.id === "stern"],
  ["CS at UIUC → Siebel CS", suggestProgram("uiuc", "Computer Science")?.id === "cs"],
  ["mechanical engineering at Cornell → Engineering", suggestProgram("cornell", "Mechanical Engineering")?.id === "eng"],
  ["no programs for whole-university admits", suggestProgram("harvard", "Computer Science") === null],
  ["every program has a review note", Object.values(PROGRAMS).flat().every((x) => x.review.length > 20)],
  ["published rates cite a source", Object.values(PROGRAMS).flat().every((x) => !x.rate || !!x.rate.url)],
  ["UIUC CS uses its own admit rate", Math.abs(applyProgram(getCollege("uiuc")!, getProgram("uiuc", "cs")).admitRate - 0.074) < 1e-9],
  ["UIUC CS is much harder than UIUC overall", ev("uiuc", "cs").chance < ev("uiuc", null).chance * 0.5],
  ["NYU Stern is harder than NYU overall", ev("nyu", "stern").chance < ev("nyu", null).chance],
  ["Tisch Drama outcome depends on audition", /audition/i.test(ev("nyu", "tisch-drama").decision) && ev("nyu", "tisch-drama").flags.some((f) => /audition/i.test(f))],
  ["arts chance moves less with academics", (() => {
    const weak = { ...p, gpaUnweighted: 3.3, sat: 1200 };
    const dDrama = ev("nyu", "tisch-drama").chance - ev("nyu", "tisch-drama", weak).chance;
    const dCas = ev("nyu", null).chance - ev("nyu", null, weak).chance;
    return dDrama < dCas;
  })()],
  ["engineering weighs a weak SAT harder than A&S at the same rate", (() => {
    const low = { ...p, sat: 1300 };
    const eng = ev("cornell", "eng", low).chance / ev("cornell", "eng").chance;
    const as = ev("cornell", "cas", low).chance / ev("cornell", "cas").chance;
    return eng < as;
  })()],
  ["review process names the program", ev("uiuc", "cs").reviewProcess.includes("Computer Science")],
  ["evaluation is written for the program", ev("nyu", "stern").evaluation.includes("NYU Stern")],
];
let fail = 0;
for (const [n, ok] of checks) {
  if (!ok) fail++;
  console.log(`${ok ? "✓" : "✗"} ${n}`);
}
process.exit(fail ? 1 : 0);
