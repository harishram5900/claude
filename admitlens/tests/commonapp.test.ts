// Parser test against text laid out like a Common App PDF export.
import { parseCommonApp } from "../src/lib/commonapp";

const sample = `Profile
Legal name First/given name: Jordan Last/family/surname: Lee
Address 1200 W Harrison St, Chicago, IL 60607
Education
Current or most recent secondary/high school: Whitney M. Young Magnet High School Date of entry 08/2022 School type Public
Graduation date: June 2026
Grades
Graduating class size (approx.): 480
Class rank reporting: Exact
Class rank: 12
Cumulative GPA: 3.92
GPA scale: 4
GPA weighting: Unweighted
Courses & Grades
AP Calculus BC, AP Physics C Mechanics, AP Biology, AP English Language, AP US History
Testing
SAT Highest evidence-based reading and writing score: 720 Highest math score: 780
Honors
Honors title: USACO Gold Division Grade level: 11 Level(s) of recognition: National
Honors title: Illinois State Scholar Grade level: 12 Level(s) of recognition: State
Activities
Activity type: Robotics Position/leadership description and organization name: Team Captain Organization name: FRC Team 1234 Please describe this activity, including what you accomplished and any recognition you received, etc.: Led 30 students to the state championship; built swerve drive Participation grade levels: 9, 10, 11, 12 Timing of participation: All year Hours spent per week: 12 Weeks spent per year: 40
Activity type: Community Service (Volunteer) Position/leadership description and organization name: Founder Organization name: Code for Pilsen Please describe this activity, including what you accomplished and any recognition you received, etc.: Founded city coding workshops for 80 kids Participation grade levels: 10, 11, 12 Timing of participation: School year Hours spent per week: 4 Weeks spent per year: 30
Writing
Personal essay
Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design.
${"I spent the summer rebuilding a bicycle from parts I found in the alley behind our building. ".repeat(14)}
Additional information
`;

const r = parseCommonApp(sample);
const p = r.profile;
const checks: [string, boolean][] = [
  ["name", p.name === "Jordan Lee"],
  ["state", p.state === "IL"],
  ["gpa", p.gpaUnweighted === 3.92],
  ["rank %", p.classRankPercent === 3],
  ["sat", p.sat === 1500],
  ["ap count", p.apCount === 5],
  ["2 honors", p.awards?.length === 2 && p.awards[0].level === "national"],
  ["2 activities", p.activities?.length === 2],
  ["captain is leadership", !!p.activities?.[0].leadership && p.activities[0].years === 4 && p.activities[0].hoursPerWeek === 12],
  ["founder detected", !!p.activities?.[1].founder],
  ["org names", p.activities?.[0].name === "FRC Team 1234" && p.activities?.[1].name === "Code for Pilsen"],
  ["category with parens", p.activities?.[1].category === "Community Service (Volunteer)"],
  ["essay", (p.personalStatement ?? "").startsWith("I spent the summer")],
];
let fail = 0;
for (const [n, ok] of checks) {
  if (!ok) fail++;
  console.log(`${ok ? "✓" : "✗"} ${n}`);
}
if (fail) console.log(JSON.stringify(p, null, 1));
console.log(`found: ${r.found.join(", ")}`);
process.exit(fail ? 1 : 0);
