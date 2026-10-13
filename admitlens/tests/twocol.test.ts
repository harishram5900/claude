// Real Common App print layout: two columns with wrapped question labels, running header and
// footer, a horizontal PREVIEW watermark, numbered Activity/Honor headings, course levels and AP exams.
import { readFileSync } from "node:fs";
import { parseCommonApp, pdfToText } from "../src/lib/commonapp";

async function main() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const text = await pdfToText(pdfjs as never, new Uint8Array(readFileSync("tests/fixtures/commonapp-twocol.pdf")));
  const { profile: p, funding, warnings } = parseCommonApp(text);
  const acts = p.activities ?? [];
  const essay = p.personalStatement ?? "";
  const all = JSON.stringify(p);
  const checks: [string, boolean][] = [
    ["name", p.name === "Jordan Okafor"],
    ["school (wrapped label)", p.highSchool === "Lane Technical College Prep High School"],
    ["weighted GPA on 5-pt scale", p.gpaWeighted === 4.31 && p.gpaUnweighted == null],
    ["no class rank invented (school doesn't rank)", p.classRankPercent == null],
    ["SAT from wrapped label", p.sat === 1490],
    ["AP/IB/DE from course levels + AP exams", p.apCount === 6],
    ["honors course", p.honorsCount === 1],
    ["rigor from course list", p.rigor === 4],
    ["3 honors with levels", p.awards?.map((a) => `${a.name}|${a.level}`).join(";") === "National Merit Semifinalist|national;Illinois Science Olympiad, 1st place Chemistry Lab|state;Principal's Honor Roll|school"],
    ["3 activities", acts.length === 3],
    ["activity names", acts.map((a) => a.name).join("|") === "Lane Tech Science Olympiad|Chicago Public Library, Lincoln Park|Mariano's"],
    ["roles", acts.map((a) => a.role).join("|") === "Co-captain|Volunteer tutor|Cashier"],
    ["descriptions are the answer only", acts[0]?.description === "Led 28-member team to 2nd at state; built the chemistry lab protocol binder; tutored 10 freshmen"],
    ["no question text in any description", acts.every((a) => !/including what you accomplished|recognition you received|etc\./i.test(a.description))],
    ["hours/weeks/years from the PDF", acts.map((a) => `${a.hoursPerWeek}/${a.weeksPerYear}/${a.years}`).join(" ") === "8/30/4 4/40/3 15/48/2"],
    ["co-captain is leadership", !!acts[0]?.leadership && !acts[2]?.leadership],
    ["not first-gen (parent 2 has a bachelor's)", p.firstGen === false],
    ["major", p.intendedMajor === "Chemical Engineering"],
    ["essay starts at the essay", essay.startsWith("My grandmother measures rice")],
    ["essay ends at the essay", essay.trim().endsWith("keep asking her why.")],
    ["essay keeps its 4 paragraphs", essay.split(/\n\n/).length === 4],
    ["no prompt in essay", !/Some students have a background/.test(essay)],
    ["no header/footer/watermark anywhere", !/PREVIEW|Application Preview|CAID|52018834|Printed|\d of 4/.test(all)],
    ["green card → pr", funding.residenceStatus === "pr"],
    ["city + age", funding.city === "Chicago" && funding.age != null],
    ["no missing-field warnings", !warnings.some((w) => /not found/.test(w))],
  ];
  let fail = 0;
  for (const [n, ok] of checks) {
    if (!ok) fail++;
    console.log(`${ok ? "✓" : "✗"} ${n}`);
  }
  if (fail) console.log(JSON.stringify({ ...p, personalStatement: essay.slice(0, 160) }, null, 1).slice(0, 3000), funding, warnings);
  process.exit(fail ? 1 : 0);
}
main();
