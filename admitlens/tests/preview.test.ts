// A realistic Common App print preview: watermark, running headers, page numbers, print stamp,
// numbered activities, citizenship and the full prompt list. Only real application data may come through.
import { readFileSync } from "node:fs";
import { parseCommonApp, pdfToText } from "../src/lib/commonapp";

async function main() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const text = await pdfToText(pdfjs as never, new Uint8Array(readFileSync("tests/fixtures/commonapp-preview.pdf")));
  const { profile: p, funding, found, missing } = parseCommonApp(text);
  const all = JSON.stringify(p);
  const essay = p.personalStatement ?? "";
  const acts = p.activities ?? [];
  const checks: [string, boolean][] = [
    ["name", p.name === "Aarav Sharma"],
    ["state", p.state === "IL"],
    ["school", p.highSchool === "Naperville North High School"],
    ["gpa", p.gpaUnweighted === 3.97],
    ["rank 18/740 → top 2%", p.classRankPercent === 2],
    ["sat 1540", p.sat === 1540],
    ["6 AP courses", p.apCount === 6],
    ["1 honors course", p.honorsCount === 1],
    ["3 honors", p.awards?.length === 3 && p.awards[0].name === "USACO Gold Division" && p.awards[0].level === "national"],
    ["4 activities", acts.length === 4],
    ["activity names are org names", acts.map((a) => a.name).join("|") === "FRC Team 4096 Ctrl-Z|CodeBridge Naperville|Naperville North Speech & Debate|Mathnasium of Naperville"],
    ["roles", acts[0]?.role === "Captain and lead programmer" && acts[1]?.role === "Founder"],
    ["description intact", acts[0]?.description.startsWith("Led 35-member team") && !acts[0].description.includes("intend")],
    ["hours/weeks/years", acts[0]?.hoursPerWeek === 14 && acts[0]?.weeksPerYear === 40 && acts[0]?.years === 4],
    ["founder + leadership", !!acts[1]?.founder && !!acts[0]?.leadership],
    ["major", p.intendedMajor === "Computer Science"],
    ["essay starts at the essay", essay.startsWith("The first time our robot")],
    ["essay ends at the essay", essay.trim().endsWith("start with a better question.")],
    ["essay has no prompt or instructions", !/Describe a topic|650 words is your limit|What do we want to know/.test(essay)],
    ["no watermark anywhere", !/PREVIEW/.test(all)],
    ["no page numbers", !/Page \d+ of \d+/.test(all)],
    ["no CAID / URL / print stamp", !/CAID|41234567|commonapp\.org|4:18 PM|10\/12\/2026/.test(all)],
    ["visa → H-4", funding.residenceStatus === "h4"],
    ["citizenship → IN", JSON.stringify(funding.citizenships) === '["IN"]'],
    ["city", funding.city === "Naperville"],
    ["age from birth date", typeof funding.age === "number" && funding.age >= 16 && funding.age <= 18],
    ["not first-gen (parent has graduate degree)", !p.firstGen],
  ];
  let fail = 0;
  for (const [n, ok] of checks) {
    if (!ok) fail++;
    console.log(`${ok ? "✓" : "✗"} ${n}`);
  }
  if (fail) {
    console.log(JSON.stringify({ ...p, personalStatement: essay.slice(0, 200) + " … " + essay.slice(-120) }, null, 1).slice(0, 4000));
    console.log(JSON.stringify(funding));
    console.log("---TEXT---\n" + text.slice(0, 3000));
  }
  console.log(`found: ${found.join(", ")} | missing: ${missing.join(", ")}`);
  process.exit(fail ? 1 : 0);
}
main();
