// GrantScout engine tests: eligibility by status, rings, scam filter, deadlines, ordering, privacy.
import { FUNDING_LIBRARY } from "../src/data/funding";
import { lateralAngles, rank, nextDeadline, revealsStatus, unclaimedChecklist, searchPlan, type FundingProfile, type FundingRecord } from "../src/lib/grantscout";

let fail = 0;
const check = (n: string, ok: boolean, d = "") => { if (!ok) fail++; console.log(`${ok ? "✓" : "✗"} ${n} ${d}`); };
const today = new Date("2026-10-12T12:00:00");
const base: FundingProfile = {
  name: "Aarav", grade: "12", age: 17, gpa: 3.9,
  location: { city: "Naperville", county: "DuPage", metro: "Chicagoland", state: "IL", country: "US", continent: "North America" },
  residence_status: "citizen", has_work_authorization: true, citizenships: [], country_ties: [], heritage: [], background: [],
  intended_majors: ["computer science"], interests_activities: ["robotics", "startup"], parent_employers: [], affiliations: [], wants: [], story: "I build robots and want to start a company.",
};
const names = (p: FundingProfile, recs = FUNDING_LIBRARY) => new Set(rank(p, recs, { today }).kept.map((x) => x.rec.name));

const citizen = names(base);
check("citizen: Pell included", citizen.has("Federal Pell Grant"));
check("citizen: NASA internship included", citizen.has("NASA OSTEM High School Internships"));
check("citizen: DACA-only Golden Door excluded", !citizen.has("Golden Door Scholars"));
check("IL student: Illinois MAP included", citizen.has("Illinois MAP Grant"));
check("IL student: Cal Grant excluded (other state)", !citizen.has("Cal Grant / California Dream Act"));
check("no India ties: SPDC excluded", !citizen.has("Scholarship Programme for Diaspora Children (SPDC)"));
check("grade 12: Young Scholars (grade 7) excluded", !citizen.has("Jack Kent Cooke Young Scholars Program"));

const h4 = names({ ...base, residence_status: "h4", has_work_authorization: false, citizenships: ["IN"], country_ties: ["IN:oci"] });
check("H-4: Pell excluded (not FAFSA-eligible)", !h4.has("Federal Pell Grant"));
check("H-4: Coca-Cola (citizen/PR/eligible noncitizen) excluded", !h4.has("Coca-Cola Scholars Program"));
check("H-4: Burger King Scholars (any U.S. resident) included", h4.has("Burger King Scholars"));
check("H-4: QuestBridge mapped conservatively (ambiguous wording) and excluded", !h4.has("QuestBridge National College Match"));
check("H-4: ISEF (open to all) included", h4.has("Regeneron International Science & Engineering Fair (ISEF)"));
check("H-4: work-authorized internship excluded", !h4.has("Bank of America Student Leaders"));
check("India ties: SPDC included", h4.has("Scholarship Programme for Diaspora Children (SPDC)"));
const spdc = rank({ ...base, residence_status: "h4", citizenships: ["IN"] }, FUNDING_LIBRARY, { today }).kept.find((x) => x.rec.name.startsWith("Scholarship Programme"));
check("home-country award lands in ring 5", spdc?.ring === 5);

const daca = names({ ...base, residence_status: "daca" });
check("DACA: Golden Door included", daca.has("Golden Door Scholars"));
check("DACA: TheDream.US included", daca.has("TheDream.US National Scholarship"));
check("DACA: NASA (citizens only) excluded", !daca.has("NASA OSTEM High School Internships"));
check("DACA: Illinois MAP (RISE Act alternative application) included", daca.has("Illinois MAP Grant"));

const unsaid = rank({ ...base, residence_status: "", has_work_authorization: false }, FUNDING_LIBRARY, { today }).kept;
check("prefer not to say: only open-to-all, any-resident or unconfirmed-wording awards", unsaid.every((x) => { const r = x.rec.status_rules ?? []; return !r.length || r.includes("ANY") || r.includes("US:resident_any"); }));

const scam: FundingRecord[] = [
  { name: "Guaranteed Scholarship", sponsor: "X", source_url: "", vehicle: "scholarship", status_rules: ["ANY"], description: "You are guaranteed to win!" },
  { name: "Fee Scholarship", sponsor: "Y", source_url: "", vehicle: "scholarship", status_rules: ["ANY"], application_fee: 25 },
  { name: "Legit Local Award", sponsor: "DuPage Foundation", source_url: "", vehicle: "scholarship", status_rules: ["US:resident_any"], geo: { level: "county", country: "US", state: "IL", county: "DuPage" }, amount_max: 2000, deadline: "2027-02-15" },
];
const sr = rank(base, scam, { today });
check("scams dropped, legit local kept", sr.kept.length === 1 && sr.kept[0].rec.name === "Legit Local Award");
check("local award is ring 1", sr.kept[0].ring === 1);
check("other county excluded", rank({ ...base, location: { ...base.location, county: "Cook" } }, scam, { today }).kept.length === 0);

const all = rank(base, [...FUNDING_LIBRARY, ...scam], { today }).kept;
check("sorted closest ring first", all.every((x, i) => i === 0 || all[i - 1].ring <= x.ring));
check("every result has a reason it fits", all.every((x) => x.why.length > 0));

const [d, est] = nextDeadline({ name: "a", sponsor: "b", source_url: "", vehicle: "scholarship", deadline_typical: "09-30" }, today);
check("past typical deadline rolls to next year (est.)", !!d && d.getFullYear() === 2027 && est);
const [d2, est2] = nextDeadline({ name: "a", sponsor: "b", source_url: "", vehicle: "scholarship", deadline: "2026-12-01" }, today);
check("future exact deadline kept as-is", !!d2 && d2.getMonth() === 11 && !est2);
check("one-time program with past deadline dropped", rank(base, [{ name: "Old", sponsor: "Z", source_url: "", vehicle: "grant", status_rules: ["ANY"], deadline: "2026-01-01", cycle: "one-time" }], { today }).kept.length === 0);

const wantsOnly = rank({ ...base, wants: ["internship"] }, FUNDING_LIBRARY, { today }).kept;
check("wants filter keeps only internships", wantsOnly.length > 0 && wantsOnly.every((x) => ["internship", "program_stipend"].includes(x.rec.vehicle)));

const list = unclaimedChecklist(base).join(" ");
check("citizen gets FAFSA advice", list.includes("FAFSA as soon as it opens"));
const list2 = unclaimedChecklist({ ...base, residence_status: "daca" }).join(" ");
check("DACA gets state alternative-application advice instead", list2.includes("can't use federal aid"));
check("search plan covers county, state, national and global rings", (() => { const rings = searchPlan(base, today).map(([r]) => r); return [1, 3, 4, 7].every((r) => rings.includes(r)); })());

const fitAarav = rank(base, FUNDING_LIBRARY, { today }).kept;
check("'art' does not match 'startup'", !fitAarav.find((x) => x.rec.name.startsWith("Scholastic"))?.why.includes("fits your art"));
check("'robotics' matches the robotics interest", fitAarav.find((x) => x.rec.name.startsWith("Regeneron International"))!.why.includes("robotics"));

// Privacy: the shareable report must not reveal status, heritage, background, employers or home-country ties.
const priv: FundingProfile = { ...base, residence_status: "daca", citizenships: ["IN"], country_ties: ["IN:oci"], heritage: ["Telugu"], background: ["foster_youth"], parent_employers: ["Boeing"] };
const shared = [...unclaimedChecklist(priv, { shareable: true }), ...lateralAngles(priv, { shareable: true })].join(" ");
check("shareable copy omits heritage, background, employer and home country", !/Telugu|foster|Boeing|India|federal aid, but/.test(shared));
const privateCopy = [...unclaimedChecklist(priv), ...lateralAngles(priv)].join(" ");
check("private on-screen copy keeps personalized advice", /Telugu/.test(privateCopy) && /Boeing/.test(privateCopy));
const byName = (n: string) => rank(priv, FUNDING_LIBRARY, { today }).kept.find((x) => x.rec.name === n)!;
check("DACA-only award flagged as status-revealing", revealsStatus(byName("Golden Door Scholars")));
check("diaspora award flagged as status-revealing", revealsStatus(byName("Scholarship Programme for Diaspora Children (SPDC)")));
check("open-to-all award not flagged", !revealsStatus(byName("Regeneron International Science & Engineering Fair (ISEF)")));
check("broad state grant not flagged", !revealsStatus(byName("Illinois MAP Grant")));

console.log(`\ncitizen: ${citizen.size} results, H-4: ${h4.size}, DACA: ${daca.size}, prefer-not-to-say: ${unsaid.length}`);
process.exit(fail ? 1 : 0);
