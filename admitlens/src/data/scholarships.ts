// Nationally available scholarships. Amounts and deadlines reflect each program's typical
// cycle and shift year to year. Students should always confirm on the official site linked.

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  amount: string;
  amountValue: number; // for sorting, USD (max)
  deadline: string; // typical month
  deadlineMonth: number; // 1–12
  grades: number[]; // eligible current grades (12 = seniors)
  minGpa?: number;
  needBased?: boolean;
  firstGen?: boolean;
  majors?: string[]; // keywords; empty = any
  states?: string[];
  tags: string[];
  url: string;
  blurb: string;
}

export const SCHOLARSHIPS: Scholarship[] = [
  { id: "coca-cola", name: "Coca-Cola Scholars Program", provider: "Coca-Cola Scholars Foundation", amount: "$20,000", amountValue: 20000, deadline: "Sep 30", deadlineMonth: 9, grades: [12], minGpa: 3.0, tags: ["leadership", "service", "merit"], url: "https://www.coca-colascholarsfoundation.org", blurb: "150 seniors recognized for leadership and service impact. Merit-based; no essay in round one." },
  { id: "gates", name: "The Gates Scholarship", provider: "Gates Foundation", amount: "Full cost of attendance", amountValue: 300000, deadline: "Sep 15", deadlineMonth: 9, grades: [12], minGpa: 3.3, needBased: true, tags: ["need-based", "minority", "full-ride"], url: "https://www.thegatesscholarship.org", blurb: "Full last-dollar scholarship for outstanding Pell-eligible minority seniors." },
  { id: "questbridge", name: "QuestBridge National College Match", provider: "QuestBridge", amount: "Full 4-year scholarship", amountValue: 350000, deadline: "Sep 26", deadlineMonth: 9, grades: [12], minGpa: 3.5, needBased: true, tags: ["need-based", "full-ride", "elite colleges"], url: "https://www.questbridge.org", blurb: "Matches high-achieving low-income seniors with full scholarships at 50+ partner colleges." },
  { id: "questbridge-csp", name: "QuestBridge College Prep Scholars", provider: "QuestBridge", amount: "Summer programs + early advantages", amountValue: 5000, deadline: "Mar 25", deadlineMonth: 3, grades: [11], minGpa: 3.5, needBased: true, tags: ["need-based", "juniors"], url: "https://www.questbridge.org", blurb: "Juniors receive summer program awards, college admissions conference invites and a head start on National College Match." },
  { id: "jkc", name: "Jack Kent Cooke College Scholarship", provider: "Jack Kent Cooke Foundation", amount: "Up to $55,000/yr", amountValue: 220000, deadline: "Nov", deadlineMonth: 11, grades: [12], minGpa: 3.5, needBased: true, tags: ["need-based", "merit"], url: "https://www.jkcf.org", blurb: "One of the largest undergraduate awards in the country for high-achieving students with financial need." },
  { id: "jkc-young", name: "Jack Kent Cooke Young Scholars", provider: "Jack Kent Cooke Foundation", amount: "Advising + enrichment funding", amountValue: 40000, deadline: "Apr", deadlineMonth: 4, grades: [7], needBased: true, tags: ["need-based", "middle school"], url: "https://www.jkcf.org", blurb: "For 7th graders with need: five years of advising and funding for academics and arts." },
  { id: "dell", name: "Dell Scholars Program", provider: "Michael & Susan Dell Foundation", amount: "$20,000 + laptop + support", amountValue: 20000, deadline: "Dec 1", deadlineMonth: 12, grades: [12], minGpa: 2.4, needBased: true, tags: ["need-based", "grit", "Pell-eligible"], url: "https://www.dellscholars.org", blurb: "Values grit and determination over perfect grades. Pell-eligible students in a college readiness program." },
  { id: "elks", name: "Elks Most Valuable Student", provider: "Elks National Foundation", amount: "$4,000–$50,000", amountValue: 50000, deadline: "Nov 12", deadlineMonth: 11, grades: [12], tags: ["leadership", "need", "merit"], url: "https://www.elks.org/scholars", blurb: "500 awards judged on scholarship, leadership and financial need." },
  { id: "burger-king", name: "Burger King Scholars", provider: "Burger King Foundation", amount: "$1,000–$60,000", amountValue: 60000, deadline: "Dec 15", deadlineMonth: 12, grades: [12], minGpa: 2.5, tags: ["work", "service"], url: "https://burgerkingfoundation.org", blurb: "Rewards students who balance work, school and community involvement." },
  { id: "horatio-alger", name: "Horatio Alger National Scholarship", provider: "Horatio Alger Association", amount: "$25,000", amountValue: 25000, deadline: "Oct 25", deadlineMonth: 10, grades: [12], minGpa: 2.0, needBased: true, tags: ["adversity", "need-based"], url: "https://scholars.horatioalger.org", blurb: "For students who have overcome significant adversity, with family income under ~$65k." },
  { id: "ron-brown", name: "Ron Brown Scholar Program", provider: "CAP Charitable Foundation", amount: "$40,000", amountValue: 40000, deadline: "Jan 9", deadlineMonth: 1, grades: [12], tags: ["Black students", "leadership", "service"], url: "https://www.ronbrown.org", blurb: "For Black/African American seniors with academic promise, leadership and community service." },
  { id: "hsf", name: "Hispanic Scholarship Fund", provider: "HSF", amount: "$500–$5,000", amountValue: 5000, deadline: "Feb 15", deadlineMonth: 2, grades: [12], minGpa: 3.0, tags: ["Hispanic/Latino", "FAFSA"], url: "https://www.hsf.net", blurb: "Merit-based awards for students of Hispanic heritage, plus mentoring." },
  { id: "uncf", name: "UNCF Scholarships (General)", provider: "United Negro College Fund", amount: "$500–$10,000", amountValue: 10000, deadline: "Varies", deadlineMonth: 3, grades: [12], minGpa: 2.5, needBased: true, tags: ["HBCU", "Black students"], url: "https://uncf.org/scholarships", blurb: "Hundreds of programs through one portal, many for HBCU-bound students." },
  { id: "apiasf", name: "APIA Scholars", provider: "APIA Scholars", amount: "$2,500–$20,000", amountValue: 20000, deadline: "Jan", deadlineMonth: 1, grades: [12], minGpa: 2.7, tags: ["Asian American", "Pacific Islander"], url: "https://apiascholars.org", blurb: "For Asian American and Pacific Islander students, prioritizing need and first-gen." },
  { id: "cobell", name: "Cobell Scholarship", provider: "Indigenous Education, Inc.", amount: "Up to $5,000+", amountValue: 5000, deadline: "Mar 31", deadlineMonth: 3, grades: [12], tags: ["Native American", "tribal enrollment"], url: "https://cobellscholar.org", blurb: "For enrolled members of federally recognized tribes." },
  { id: "national-merit", name: "National Merit Scholarship", provider: "NMSC", amount: "$2,500 + corporate/college awards", amountValue: 2500, deadline: "PSAT in Oct of junior year", deadlineMonth: 10, grades: [10, 11], tags: ["PSAT", "merit", "test scores"], url: "https://www.nationalmerit.org", blurb: "Qualify through the PSAT/NMSQT in 11th grade. Semifinalists often unlock large college merit awards." },
  { id: "regeneron-sts", name: "Regeneron Science Talent Search", provider: "Society for Science", amount: "Up to $250,000", amountValue: 250000, deadline: "Nov", deadlineMonth: 11, grades: [12], majors: ["science", "biology", "chemistry", "physics", "engineering", "computer", "math", "medicine"], tags: ["research", "STEM"], url: "https://www.societyforscience.org/regeneron-sts", blurb: "The nation's oldest and most prestigious science research competition for seniors." },
  { id: "isef", name: "Regeneron ISEF", provider: "Society for Science", amount: "Up to $75,000", amountValue: 75000, deadline: "Via affiliated fair (winter)", deadlineMonth: 1, grades: [9, 10, 11, 12], majors: ["science", "engineering", "computer", "math", "biology"], tags: ["research", "STEM", "competition"], url: "https://www.societyforscience.org/isef", blurb: "Qualify through local and state science fairs. Huge for STEM applicants." },
  { id: "davidson", name: "Davidson Fellows", provider: "Davidson Institute", amount: "$10,000–$50,000", amountValue: 50000, deadline: "Feb", deadlineMonth: 2, grades: [9, 10, 11, 12], tags: ["significant work", "STEM", "humanities"], url: "https://www.davidsongifted.org/gifted-programs/fellows-scholarship", blurb: "For students under 18 who completed a significant piece of work in STEM, literature, music or philosophy." },
  { id: "cameron", name: "Cameron Impact Scholarship", provider: "Bryan Cameron Education Foundation", amount: "Full tuition", amountValue: 200000, deadline: "Sep", deadlineMonth: 9, grades: [12], minGpa: 3.7, tags: ["leadership", "service", "full-tuition"], url: "https://www.bryancameroneducationfoundation.org", blurb: "Full-tuition merit award for leaders committed to community impact." },
  { id: "coolidge", name: "Coolidge Scholarship", provider: "Calvin Coolidge Foundation", amount: "Full cost of attendance", amountValue: 300000, deadline: "Jan", deadlineMonth: 1, grades: [11], tags: ["juniors", "public service", "full-ride"], url: "https://coolidgescholars.org", blurb: "Full-ride for juniors with interest in public service and American political ideas." },
  { id: "stamps", name: "Stamps Scholars", provider: "Stamps Scholars & partner universities", amount: "Up to full cost + enrichment", amountValue: 300000, deadline: "Via partner school (Nov–Dec)", deadlineMonth: 11, grades: [12], minGpa: 3.8, tags: ["merit", "full-ride", "leadership"], url: "https://www.stampsscholars.org", blurb: "Merit awards at 40+ partner universities. Apply by the school's early deadline." },
  { id: "morehead", name: "Morehead-Cain Scholarship", provider: "UNC Chapel Hill", amount: "Full cost + summer enrichment", amountValue: 350000, deadline: "Oct 15", deadlineMonth: 10, grades: [12], minGpa: 3.8, tags: ["merit", "full-ride", "UNC"], url: "https://www.moreheadcain.org", blurb: "UNC's flagship merit scholarship. Apply by UNC's early action deadline." },
  { id: "robertson", name: "Robertson Scholars Leadership Program", provider: "Duke & UNC", amount: "Full cost + summers", amountValue: 350000, deadline: "Nov", deadlineMonth: 11, grades: [12], minGpa: 3.8, tags: ["merit", "full-ride", "leadership"], url: "https://robertsonscholars.org", blurb: "Leadership award spanning Duke and UNC." },
  { id: "jefferson", name: "Jefferson Scholars", provider: "UVA", amount: "Full cost of attendance", amountValue: 350000, deadline: "Via school nomination (fall)", deadlineMonth: 10, grades: [12], minGpa: 3.8, tags: ["merit", "full-ride", "UVA"], url: "https://www.jeffersonscholars.org", blurb: "UVA's premier merit award. Requires a nomination from your high school." },
  { id: "foot-locker", name: "Foot Locker Scholar Athletes", provider: "Foot Locker Foundation", amount: "$20,000", amountValue: 20000, deadline: "Dec", deadlineMonth: 12, grades: [12], minGpa: 3.0, tags: ["athletes", "leadership"], url: "https://www.footlockerscholarathletes.com", blurb: "For student-athletes who show leadership off the field." },
  { id: "doodle", name: "Doodle for Google", provider: "Google", amount: "$30,000", amountValue: 30000, deadline: "Mar", deadlineMonth: 3, grades: [9, 10, 11, 12], majors: ["art", "design"], tags: ["art", "competition"], url: "https://doodles.google.com/d4g", blurb: "National art competition with a college scholarship for the winner." },
  { id: "scholastic", name: "Scholastic Art & Writing Awards", provider: "Alliance for Young Artists & Writers", amount: "Up to $12,500", amountValue: 12500, deadline: "Dec", deadlineMonth: 12, grades: [9, 10, 11, 12], majors: ["art", "english", "writing", "film", "design", "journalism"], tags: ["art", "writing", "competition"], url: "https://www.artandwriting.org", blurb: "The most prestigious recognition program for teen creatives. National medals carry real weight in admissions." },
  { id: "nsda", name: "NSDA National Tournament Scholarships", provider: "National Speech & Debate Association", amount: "Up to $5,000", amountValue: 5000, deadline: "Via qualification", deadlineMonth: 6, grades: [9, 10, 11, 12], majors: ["political", "law", "communication"], tags: ["debate", "competition"], url: "https://www.speechanddebate.org", blurb: "Scholarships for finalists at the national speech and debate tournament." },
  { id: "deca", name: "DECA Scholarships", provider: "DECA Inc.", amount: "$1,000–$5,000", amountValue: 5000, deadline: "Jan", deadlineMonth: 1, grades: [12], majors: ["business", "marketing", "finance", "economics"], tags: ["business", "DECA"], url: "https://www.deca.org/scholarships", blurb: "For DECA members heading into business-related majors." },
  { id: "swe", name: "Society of Women Engineers Scholarships", provider: "SWE", amount: "$1,000–$15,000", amountValue: 15000, deadline: "Feb", deadlineMonth: 2, grades: [12], majors: ["engineering", "computer"], tags: ["women in STEM"], url: "https://swe.org/scholarships", blurb: "Hundreds of awards for women entering ABET-accredited engineering or CS programs." },
  { id: "ncwit", name: "NCWIT Award for Aspirations in Computing", provider: "NCWIT", amount: "Recognition + prizes", amountValue: 1000, deadline: "Nov", deadlineMonth: 11, grades: [9, 10, 11, 12], majors: ["computer", "engineering"], tags: ["women in tech", "recognition"], url: "https://www.aspirations.org", blurb: "National recognition for women, genderqueer and nonbinary students in computing. Strong signal on applications." },
  { id: "congressional-app", name: "Congressional App Challenge", provider: "U.S. House of Representatives", amount: "Recognition", amountValue: 0, deadline: "Oct–Nov", deadlineMonth: 11, grades: [9, 10, 11, 12], majors: ["computer"], tags: ["coding", "competition"], url: "https://www.congressionalappchallenge.us", blurb: "District-level coding competition. Winning apps are displayed in the U.S. Capitol." },
  { id: "amc", name: "MAA American Mathematics Competitions", provider: "MAA", amount: "Recognition (pathway to USAMO)", amountValue: 0, deadline: "Nov registration", deadlineMonth: 11, grades: [9, 10, 11, 12], majors: ["math", "computer", "engineering", "physics", "economics"], tags: ["math", "competition"], url: "https://maa.org/student-programs/amc", blurb: "AMC 10/12 → AIME → USAMO. AIME qualification is a meaningful signal at top STEM schools." },
  { id: "voice-of-democracy", name: "VFW Voice of Democracy", provider: "Veterans of Foreign Wars", amount: "Up to $35,000", amountValue: 35000, deadline: "Oct 31", deadlineMonth: 10, grades: [9, 10, 11, 12], tags: ["audio essay", "civics"], url: "https://www.vfw.org/community/youth-and-education/youth-scholarships", blurb: "Audio-essay competition on a patriotic theme." },
  { id: "ayn-rand", name: "Atlas Shrugged Essay Contest", provider: "Ayn Rand Institute", amount: "Up to $10,000", amountValue: 10000, deadline: "Varies", deadlineMonth: 4, grades: [12], majors: ["english", "philosophy"], tags: ["essay contest"], url: "https://aynrand.org/students/essay-contests", blurb: "Essay competition on the novel." },
  { id: "taco-bell", name: "Taco Bell Live Más Scholarship", provider: "Taco Bell Foundation", amount: "$5,000–$25,000", amountValue: 25000, deadline: "Jan", deadlineMonth: 1, grades: [12], tags: ["passion", "video"], url: "https://www.tacobellfoundation.org/live-mas-scholarship", blurb: "No grades or test scores, just a 2-minute video about your passion." },
  { id: "equitable", name: "Equitable Excellence Scholarship", provider: "Equitable Foundation", amount: "$2,500–$25,000", amountValue: 25000, deadline: "Dec", deadlineMonth: 12, grades: [12], tags: ["impact", "service"], url: "https://equitable.com/foundation/equitable-excellence-scholarship", blurb: "For seniors who show ambition and self-drive through impact in their communities." },
  { id: "first-gen-sh", name: "First Generation Matching Grant (state programs)", provider: "State higher-ed agencies", amount: "Varies", amountValue: 5000, deadline: "Spring (after FAFSA)", deadlineMonth: 3, grades: [12], firstGen: true, needBased: true, tags: ["first-gen", "state aid"], url: "https://studentaid.gov", blurb: "Many states run first-generation grants tied to FAFSA filing. Ask your counselor about your state's program." },
  { id: "il-map", name: "Illinois MAP Grant", provider: "ISAC", amount: "Up to ~$8,400/yr", amountValue: 33600, deadline: "File FAFSA early (Oct 1+)", deadlineMonth: 10, grades: [12], needBased: true, states: ["IL"], tags: ["state aid", "need-based"], url: "https://www.isac.org", blurb: "Illinois need-based grant, first come first served. File the FAFSA as soon as it opens." },
  { id: "aim-high", name: "Illinois AIM HIGH", provider: "Illinois public universities (incl. UIC, UIUC)", amount: "Varies", amountValue: 20000, deadline: "Via university", deadlineMonth: 2, grades: [12], needBased: true, states: ["IL"], tags: ["state aid", "merit+need"], url: "https://www.isac.org", blurb: "Merit-and-need aid for Illinois residents attending Illinois public universities." },
  { id: "cal-grant", name: "Cal Grant", provider: "California Student Aid Commission", amount: "Up to full UC tuition", amountValue: 60000, deadline: "Apr 2 (FAFSA/CADAA)", deadlineMonth: 4, grades: [12], needBased: true, states: ["CA"], tags: ["state aid"], url: "https://www.csac.ca.gov", blurb: "California's main grant. Covers full tuition at UC/CSU for eligible students." },
  { id: "tx-grant", name: "TEXAS Grant", provider: "Texas Higher Education Coordinating Board", amount: "Tuition & fees", amountValue: 40000, deadline: "Jan 15 priority (FAFSA/TASFA)", deadlineMonth: 1, grades: [12], needBased: true, states: ["TX"], tags: ["state aid"], url: "https://www.collegeforalltexans.com", blurb: "Need-based grant for Texas residents at Texas public universities." },
  { id: "bright-futures", name: "Florida Bright Futures", provider: "Florida Dept. of Education", amount: "Up to 100% tuition", amountValue: 25000, deadline: "Aug 31 after graduation", deadlineMonth: 8, grades: [12], minGpa: 3.0, states: ["FL"], tags: ["state aid", "merit"], url: "https://www.floridastudentfinancialaidsg.org", blurb: "Merit scholarship for Florida residents attending in-state schools; tied to GPA, test scores and service hours." },
  { id: "ny-excelsior", name: "NY Excelsior Scholarship", provider: "NYS HESC", amount: "Full SUNY/CUNY tuition", amountValue: 30000, deadline: "Summer", deadlineMonth: 7, grades: [12], needBased: true, states: ["NY"], tags: ["state aid"], url: "https://www.hesc.ny.gov", blurb: "Tuition-free SUNY/CUNY for New York families under the income cap." },
  { id: "ga-hope", name: "Georgia HOPE / Zell Miller", provider: "Georgia Student Finance Commission", amount: "Up to full tuition", amountValue: 40000, deadline: "Automatic via GSFAPP/FAFSA", deadlineMonth: 6, grades: [12], minGpa: 3.0, states: ["GA"], tags: ["state aid", "merit"], url: "https://www.gafutures.org", blurb: "Merit scholarship for Georgia residents at Georgia colleges." },
  { id: "pell", name: "Federal Pell Grant", provider: "U.S. Department of Education", amount: "Up to ~$7,400/yr", amountValue: 29600, deadline: "File FAFSA (opens Oct 1)", deadlineMonth: 10, grades: [12], needBased: true, tags: ["federal aid"], url: "https://studentaid.gov", blurb: "Free federal grant for students with need. Every student should file the FAFSA." },
];

export function matchScholarship(s: Scholarship, p: { grade: number; gpa: number | null; state: string; major: string; firstGen: boolean; lowIncome: boolean }) {
  let score = 50;
  const reasons: string[] = [];
  const blockers: string[] = [];
  if (s.grades.includes(p.grade)) {
    score += 15;
  } else if (s.grades.some((g) => g > p.grade)) {
    score -= 5;
    reasons.push(`Opens in grade ${Math.min(...s.grades.filter((g) => g > p.grade))}. Plan ahead`);
  } else blockers.push(`For grade ${s.grades.join("/")}`);
  if (s.minGpa) {
    if (p.gpa == null) score -= 3;
    else if (p.gpa >= s.minGpa) {
      score += 10;
      reasons.push(`You meet the ${s.minGpa.toFixed(1)} GPA minimum`);
    } else blockers.push(`Requires ${s.minGpa.toFixed(1)}+ GPA`);
  }
  if (s.states) {
    if (s.states.includes(p.state)) {
      score += 20;
      reasons.push(`${p.state} residents only, and that's you`);
    } else blockers.push(`${s.states.join("/")} residents only`);
  }
  if (s.majors && s.majors.length) {
    const m = p.major.toLowerCase();
    if (m && s.majors.some((k) => m.includes(k))) {
      score += 18;
      reasons.push(`Fits your interest in ${p.major}`);
    } else score -= 12;
  }
  if (s.needBased) {
    if (p.lowIncome) {
      score += 12;
      reasons.push("Need-based, which fits your situation");
    } else score -= 8;
  }
  if (s.firstGen) {
    if (p.firstGen) {
      score += 12;
      reasons.push("For first-generation students");
    } else blockers.push("First-generation students");
  }
  if (blockers.length) score = Math.min(score, 25);
  return { score: Math.max(0, Math.min(100, score)), reasons, blockers };
}
