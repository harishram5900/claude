// Schools and programs inside universities that admit by school or major. Program-level admit rates
// are rarely published, so each one carries its basis:
//   official: the university published it
//   reported: published by the university but only found via third-party summaries; treat as approximate
// Programs without a rate use the university's overall admit rate; the program still changes how the
// file is read (what is weighted, what is required).

export type ProgramKind = "standard" | "stem" | "business" | "arts" | "nursing";

export interface Program {
  id: string;
  name: string; // shown in the picker
  short: string; // e.g. "Tisch Drama"
  kind: ProgramKind;
  majors: string[]; // keywords used to pre-select from the student's intended major
  /** Program admit rate, when one is available. */
  rate?: { value: number; basis: "official" | "reported"; note: string; url?: string };
  /** Odds relative to the university overall, when only relative rates are available. */
  relativeOdds?: { value: number; note: string; url?: string };
  requires?: string[];
  review: string; // how this school or program reads applications
}

const STEM_MAJORS = ["engineering", "computer", "software", "electrical", "mechanical", "civil", "chemical engineering", "aerospace", "biomedical engineering", "robotics", "data science"];
const BUSINESS_MAJORS = ["business", "finance", "accounting", "marketing", "management", "economics and business", "entrepreneurship"];
const NURSING_MAJORS = ["nursing"];

export const PROGRAMS: Record<string, Program[]> = {
  nyu: [
    { id: "cas", name: "College of Arts & Science", short: "NYU CAS", kind: "standard", majors: ["biology", "economics", "psychology", "politics", "history", "english", "mathematics", "neuroscience", "chemistry", "philosophy", "computer science", "physics"], rate: { value: 0.045, basis: "official", note: "NYU reported CAS, Stern and Nursing each admitted under 5% of applicants for the Class of 2029.", url: "https://nyunews.com/news/2025/03/27/nyu-admission-rate-class-of-2029/" }, review: "Reads for intellectual depth in the subjects you name; the 'Why NYU' answer should connect to specific CAS departments." },
    { id: "stern", name: "Stern School of Business", short: "NYU Stern", kind: "business", majors: BUSINESS_MAJORS, rate: { value: 0.04, basis: "official", note: "NYU reported Stern admitted under 5% of applicants for the Class of 2029.", url: "https://nyunews.com/news/2025/03/27/nyu-admission-rate-class-of-2029/" }, review: "Expects strong math (calculus is typical), and looks for business-related initiative and leadership, not just interest." },
    { id: "nursing", name: "Rory Meyers College of Nursing", short: "NYU Nursing", kind: "nursing", majors: NURSING_MAJORS, rate: { value: 0.045, basis: "official", note: "NYU reported Nursing admitted under 5% of applicants for the Class of 2029.", url: "https://nyunews.com/news/2025/03/27/nyu-admission-rate-class-of-2029/" }, review: "Looks for strong lab science grades and evidence of patient-facing or health-care service." },
    { id: "tisch-drama", name: "Tisch School of the Arts: Drama", short: "Tisch Drama", kind: "arts", majors: ["acting", "drama", "theatre", "theater", "musical theatre"], requires: ["Audition (in person or recorded)"], review: "Admission is driven mainly by the artistic review (audition). Academics are a threshold, not the deciding factor." },
    { id: "tisch-film", name: "Tisch School of the Arts: Film & Television", short: "Tisch Film", kind: "arts", majors: ["film", "television", "cinema", "screenwriting", "directing"], requires: ["Creative portfolio"], review: "The creative portfolio carries most of the decision; academics must clear NYU's bar." },
    { id: "steinhardt", name: "Steinhardt School of Culture, Education & Human Development", short: "NYU Steinhardt", kind: "standard", majors: ["education", "media", "communication", "nutrition", "applied psychology", "music business", "music technology"], review: "Reads for fit with a specific program; music and performance programs add an audition or portfolio." },
    { id: "tandon", name: "Tandon School of Engineering", short: "NYU Tandon", kind: "stem", majors: STEM_MAJORS, review: "Weighs math and physics coursework and scores heavily; hands-on technical projects help." },
    { id: "gallatin", name: "Gallatin School of Individualized Study", short: "NYU Gallatin", kind: "standard", majors: ["individualized", "interdisciplinary"], review: "Looks for self-direction: a clear, interdisciplinary question you want to design your own study around." },
  ],
  cornell: [
    { id: "cas", name: "College of Arts & Sciences", short: "Cornell A&S", kind: "standard", majors: ["biology", "economics", "psychology", "government", "history", "english", "mathematics", "physics", "chemistry", "philosophy", "computer science"], review: "Reads for intellectual curiosity across the liberal arts; essays should show why A&S specifically." },
    { id: "eng", name: "College of Engineering", short: "Cornell Engineering", kind: "stem", majors: STEM_MAJORS, review: "Weighs calculus, physics and chemistry heavily; engineering-specific essay on why Cornell Engineering." },
    { id: "dyson", name: "Dyson School of Applied Economics & Management", short: "Cornell Dyson", kind: "business", majors: BUSINESS_MAJORS, review: "Business school within CALS: expects strong math and evidence of business initiative." },
    { id: "hotel", name: "Nolan School of Hotel Administration", short: "Cornell Hotel", kind: "business", majors: ["hospitality", "hotel", "real estate"], review: "Looks for interest and experience in hospitality, service and leadership." },
    { id: "ilr", name: "School of Industrial & Labor Relations", short: "Cornell ILR", kind: "standard", majors: ["labor", "industrial relations", "public policy", "law", "human resources"], review: "Looks for interest in work, labor, law and policy, shown in activities and the ILR essay." },
    { id: "cals", name: "College of Agriculture & Life Sciences", short: "Cornell CALS", kind: "standard", majors: ["agriculture", "environmental", "animal science", "nutrition", "food science", "plant", "biology"], review: "Reads for applied interest in life, environmental and food sciences." },
    { id: "humec", name: "College of Human Ecology", short: "Cornell Human Ecology", kind: "standard", majors: ["human development", "design", "fashion", "global health", "nutrition"], review: "Reads for interest in improving human lives through design, health or policy." },
    { id: "aap", name: "College of Architecture, Art & Planning", short: "Cornell AAP", kind: "arts", majors: ["architecture", "fine arts", "urban planning"], requires: ["Portfolio (Architecture and Art)"], review: "The portfolio and interview weigh heavily for Architecture and Art." },
  ],
  cmu: [
    { id: "scs", name: "School of Computer Science", short: "CMU SCS", kind: "stem", majors: ["computer science", "artificial intelligence", "robotics", "software"], relativeOdds: { value: 0.37, note: "Ratio from college-level rates reported for the Class of 2024 (about 7% for SCS vs. about 17% overall), applied to CMU's current rate. Third-party summaries; approximate.", url: "https://www.collegetransitions.com/blog/how-to-get-into-carnegie-mellon" }, review: "Among the most selective CS programs anywhere; expects top math and evidence of building things." },
    { id: "cit", name: "College of Engineering", short: "CMU Engineering", kind: "stem", majors: ["engineering", "electrical", "mechanical", "civil", "chemical engineering", "biomedical engineering"], relativeOdds: { value: 1.1, note: "Ratio from college-level rates reported for the Class of 2024 (about 17–20%). Approximate.", url: "https://www.collegetransitions.com/blog/how-to-get-into-carnegie-mellon" }, review: "Weighs math and physics heavily." },
    { id: "tepper", name: "Tepper School of Business", short: "CMU Tepper", kind: "business", majors: BUSINESS_MAJORS, relativeOdds: { value: 1.3, note: "Ratio from college-level rates reported for the Class of 2024 (about 19–23%). Approximate.", url: "https://www.collegetransitions.com/blog/how-to-get-into-carnegie-mellon" }, review: "Quantitative business program: expects strong math." },
    { id: "mcs", name: "Mellon College of Science", short: "CMU MCS", kind: "stem", majors: ["biology", "chemistry", "physics", "mathematics"], relativeOdds: { value: 1.2, note: "Ratio from college-level rates reported for the Class of 2024 (about 18–22%). Approximate.", url: "https://www.collegetransitions.com/blog/how-to-get-into-carnegie-mellon" }, review: "Reads for depth in math and science." },
    { id: "dietrich", name: "Dietrich College of Humanities & Social Sciences", short: "CMU Dietrich", kind: "standard", majors: ["economics", "psychology", "statistics", "history", "english", "policy", "philosophy"], relativeOdds: { value: 1.6, note: "Ratio from college-level rates reported for the Class of 2024 (about 24–26%). Approximate.", url: "https://www.collegetransitions.com/blog/how-to-get-into-carnegie-mellon" }, review: "Reads for intellectual range and analytical strength." },
    { id: "drama", name: "College of Fine Arts: School of Drama", short: "CMU Drama", kind: "arts", majors: ["acting", "drama", "theatre", "theater", "musical theatre", "design"], requires: ["Audition or portfolio"], relativeOdds: { value: 0.18, note: "Reported around 3–4% for the Class of 2024. Approximate; decided mainly by audition.", url: "https://www.collegetransitions.com/blog/how-to-get-into-carnegie-mellon" }, review: "Audition or portfolio decides most of the outcome." },
  ],
  uiuc: [
    { id: "cs", name: "Grainger College of Engineering: Computer Science", short: "UIUC CS", kind: "stem", majors: ["computer science", "software", "artificial intelligence"], rate: { value: 0.074, basis: "reported", note: "Fall 2025 admit rate for first-choice Computer Science applicants, from UIUC's published admit rates (via third-party summary).", url: "https://www.collegetransitions.com/blog/how-to-get-into-the-university-of-illinois-urbana-champaign-uiuc/" }, review: "Siebel School CS is far more selective than UIUC overall; expects top math and coding experience." },
    { id: "csx", name: "Computer Science + X (blended degrees)", short: "UIUC CS + X", kind: "stem", majors: ["cs +", "computer science and", "data science"], rate: { value: 0.174, basis: "reported", note: "Fall 2025 admit rate for CS + X programs (first-choice applicants), via third-party summary.", url: "https://www.collegetransitions.com/blog/how-to-get-into-the-university-of-illinois-urbana-champaign-uiuc/" }, review: "Blended CS degrees; read for both computing and the paired field." },
    { id: "grainger", name: "Grainger College of Engineering (other majors)", short: "UIUC Engineering", kind: "stem", majors: ["engineering", "electrical", "mechanical", "civil", "aerospace", "chemical engineering", "bioengineering"], rate: { value: 0.212, basis: "reported", note: "Fall 2025 admit rate for Grainger Engineering (first-choice applicants), via third-party summary.", url: "https://www.collegetransitions.com/blog/how-to-get-into-the-university-of-illinois-urbana-champaign-uiuc/" }, review: "Weighs math, physics and chemistry heavily." },
    { id: "gies", name: "Gies College of Business", short: "UIUC Gies", kind: "business", majors: BUSINESS_MAJORS, rate: { value: 0.209, basis: "reported", note: "Fall 2025 admit rate for Gies (first-choice applicants), via third-party summary.", url: "https://www.collegetransitions.com/blog/how-to-get-into-the-university-of-illinois-urbana-champaign-uiuc/" }, review: "Looks for strong math and business-related initiative." },
    { id: "las", name: "College of Liberal Arts & Sciences", short: "UIUC LAS", kind: "standard", majors: ["psychology", "biology", "economics", "political science", "history", "english", "chemistry", "mathematics"], review: "Reads for academic preparation in the intended major." },
  ],
  berkeley: [
    { id: "eecs", name: "College of Engineering: EECS", short: "Berkeley EECS", kind: "stem", majors: ["electrical engineering", "eecs", "computer engineering"], rate: { value: 0.05, basis: "reported", note: "Reported around 5% for Fall 2025. Approximate.", url: "https://www.collegetransitions.com/blog/how-your-intended-major-shapes-your-uc-admission-odds/" }, review: "One of the most selective majors in the UC system; expects top math, physics and technical projects." },
    { id: "coe", name: "College of Engineering (other majors)", short: "Berkeley Engineering", kind: "stem", majors: ["engineering", "mechanical", "civil", "bioengineering", "industrial engineering", "materials"], rate: { value: 0.071, basis: "official", note: "Berkeley Engineering reported 7.1% of 29,672 freshman applicants admitted (2022–23).", url: "https://engineering.berkeley.edu/?p=9766" }, review: "Major-specific review; math and physics weigh heavily." },
    { id: "ls-cs", name: "College of Letters & Science: Computer Science", short: "Berkeley L&S CS", kind: "stem", majors: ["computer science", "data science"], rate: { value: 0.065, basis: "reported", note: "Reported about 6.5% for Fall 2025 (San Francisco Chronicle, via Hoodline).", url: "https://hoodline.com/2026/03/bay-area-teens-face-admissions-roulette-by-uc-major/" }, review: "Admits to the CS major in L&S are far more selective than L&S overall." },
    { id: "ls", name: "College of Letters & Science (other majors)", short: "Berkeley L&S", kind: "standard", majors: ["psychology", "economics", "political science", "biology", "history", "english", "mathematics", "physics"], review: "Reads with UC's 13 comprehensive review factors; the Personal Insight Questions matter." },
  ],
  umich: [
    { id: "lsa", name: "College of Literature, Science & the Arts (LSA)", short: "Michigan LSA", kind: "standard", majors: ["psychology", "economics", "political science", "biology", "history", "english", "mathematics", "computer science"], review: "Reads for academic preparation and curiosity; the 'Why Michigan' essay should name LSA specifics." },
    { id: "eng", name: "College of Engineering", short: "Michigan Engineering", kind: "stem", majors: STEM_MAJORS, review: "Weighs math, physics and chemistry heavily." },
    { id: "ross", name: "Ross School of Business (direct admit)", short: "Michigan Ross", kind: "business", majors: BUSINESS_MAJORS, review: "Direct-admit BBA is highly competitive; expects strong math and demonstrated business initiative." },
    { id: "smtd", name: "School of Music, Theatre & Dance", short: "Michigan SMTD", kind: "arts", majors: ["music", "musical theatre", "acting", "dance", "theatre", "theater"], requires: ["Audition or portfolio"], review: "Audition or portfolio carries most of the decision." },
    { id: "stamps", name: "Stamps School of Art & Design", short: "Michigan Stamps", kind: "arts", majors: ["art", "design", "illustration"], requires: ["Portfolio"], review: "Portfolio carries most of the decision." },
  ],
  penn: [
    { id: "college", name: "College of Arts & Sciences", short: "Penn College", kind: "standard", majors: ["economics", "biology", "history", "english", "political science", "psychology", "mathematics", "physics"], review: "Reads for intellectual curiosity; the Penn-specific essay should connect to the College." },
    { id: "wharton", name: "The Wharton School", short: "Wharton", kind: "business", majors: BUSINESS_MAJORS, review: "Expects strong math and real business initiative, not just interest." },
    { id: "seas", name: "School of Engineering & Applied Science", short: "Penn Engineering", kind: "stem", majors: STEM_MAJORS, review: "Weighs math and science heavily." },
    { id: "nursing", name: "School of Nursing", short: "Penn Nursing", kind: "nursing", majors: NURSING_MAJORS, review: "Looks for strong science grades and health-care service." },
  ],
  usc: [
    { id: "dornsife", name: "Dornsife College of Letters, Arts & Sciences", short: "USC Dornsife", kind: "standard", majors: ["psychology", "economics", "political science", "biology", "history", "english"], review: "Reads for academic strength and fit with the intended major." },
    { id: "viterbi", name: "Viterbi School of Engineering", short: "USC Viterbi", kind: "stem", majors: STEM_MAJORS, review: "Weighs math and science heavily." },
    { id: "marshall", name: "Marshall School of Business", short: "USC Marshall", kind: "business", majors: BUSINESS_MAJORS, review: "Looks for business initiative and leadership." },
    { id: "sca", name: "School of Cinematic Arts", short: "USC Cinematic Arts", kind: "arts", majors: ["film", "cinema", "screenwriting", "animation", "game design", "television"], requires: ["Creative portfolio"], review: "The creative portfolio carries most of the decision." },
    { id: "drama", name: "School of Dramatic Arts (BFA)", short: "USC Dramatic Arts", kind: "arts", majors: ["acting", "drama", "theatre", "theater"], requires: ["Audition"], review: "BFA programs are decided mainly by audition." },
    { id: "thornton", name: "Thornton School of Music", short: "USC Thornton", kind: "arts", majors: ["music", "composition", "performance"], requires: ["Audition or portfolio"], review: "Audition or portfolio carries most of the decision." },
  ],
  northwestern: [
    { id: "weinberg", name: "Weinberg College of Arts & Sciences", short: "Northwestern Weinberg", kind: "standard", majors: ["economics", "psychology", "biology", "political science", "history", "english", "mathematics"], review: "Reads for intellectual curiosity and academic strength." },
    { id: "mccormick", name: "McCormick School of Engineering", short: "Northwestern McCormick", kind: "stem", majors: STEM_MAJORS, review: "Weighs math and science heavily." },
    { id: "medill", name: "Medill School of Journalism", short: "Northwestern Medill", kind: "standard", majors: ["journalism", "media", "integrated marketing"], review: "Looks for writing and reporting experience." },
    { id: "communication", name: "School of Communication", short: "Northwestern Communication", kind: "standard", majors: ["theatre", "theater", "communication", "radio", "film", "performance studies"], review: "Theatre is not audition-based for admission, but involvement in the field is read closely." },
    { id: "bienen", name: "Bienen School of Music", short: "Northwestern Bienen", kind: "arts", majors: ["music", "composition", "performance"], requires: ["Audition"], review: "Audition carries most of the decision." },
  ],
  georgetown: [
    { id: "college", name: "Georgetown College of Arts & Sciences", short: "Georgetown College", kind: "standard", majors: ["government", "economics", "history", "english", "biology", "psychology"], review: "Reads for academic strength and the school-specific essay." },
    { id: "sfs", name: "Walsh School of Foreign Service", short: "Georgetown SFS", kind: "standard", majors: ["international relations", "foreign service", "international affairs", "global"], review: "Looks for sustained interest in international affairs and languages." },
    { id: "msb", name: "McDonough School of Business", short: "Georgetown McDonough", kind: "business", majors: BUSINESS_MAJORS, review: "Looks for business initiative and leadership." },
    { id: "nursing", name: "School of Nursing", short: "Georgetown Nursing", kind: "nursing", majors: NURSING_MAJORS.concat(["health", "global health"]), review: "Looks for science preparation and health-care service." },
  ],
  utaustin: [
    { id: "cs", name: "Computer Science (College of Natural Sciences)", short: "UT Austin CS", kind: "stem", majors: ["computer science", "software"], review: "Far more selective than UT overall; expects top math and coding experience." },
    { id: "mccombs", name: "McCombs School of Business", short: "UT McCombs", kind: "business", majors: BUSINESS_MAJORS, review: "Far more selective than UT overall; looks for business initiative and leadership." },
    { id: "cockrell", name: "Cockrell School of Engineering", short: "UT Engineering", kind: "stem", majors: ["engineering", "electrical", "mechanical", "civil", "chemical engineering", "aerospace", "biomedical engineering"], review: "Weighs math and science heavily." },
    { id: "cns", name: "College of Natural Sciences (other majors)", short: "UT Natural Sciences", kind: "standard", majors: ["biology", "chemistry", "physics", "mathematics", "neuroscience"], review: "Reads for science preparation." },
    { id: "cola", name: "College of Liberal Arts", short: "UT Liberal Arts", kind: "standard", majors: ["economics", "psychology", "government", "history", "english"], review: "Reads for academic preparation and fit." },
    { id: "fine-arts", name: "College of Fine Arts", short: "UT Fine Arts", kind: "arts", majors: ["music", "acting", "theatre", "theater", "dance", "art", "design"], requires: ["Audition or portfolio"], review: "Audition or portfolio carries most of the decision." },
  ],
  uw: [
    { id: "allen", name: "Paul G. Allen School of Computer Science & Engineering (direct)", short: "UW Allen School", kind: "stem", majors: ["computer science", "computer engineering", "software"], review: "Direct-to-major admission is far more selective than UW overall." },
    { id: "eng", name: "College of Engineering", short: "UW Engineering", kind: "stem", majors: ["engineering", "electrical", "mechanical", "civil", "aerospace", "bioengineering"], review: "Weighs math and science heavily." },
    { id: "as", name: "College of Arts & Sciences", short: "UW Arts & Sciences", kind: "standard", majors: ["psychology", "economics", "biology", "political science", "history", "english"], review: "Reads for academic preparation." },
  ],
  duke: [
    { id: "trinity", name: "Trinity College of Arts & Sciences", short: "Duke Trinity", kind: "standard", majors: ["economics", "public policy", "biology", "psychology", "history", "english", "computer science"], review: "Reads for intellectual curiosity and impact." },
    { id: "pratt", name: "Pratt School of Engineering", short: "Duke Pratt", kind: "stem", majors: STEM_MAJORS, review: "Weighs math and science heavily." },
  ],
  columbia: [
    { id: "cc", name: "Columbia College", short: "Columbia College", kind: "standard", majors: ["economics", "political science", "history", "english", "biology", "philosophy", "computer science"], review: "Reads for intellectual engagement with the Core Curriculum." },
    { id: "seas", name: "Fu Foundation School of Engineering & Applied Science", short: "Columbia Engineering", kind: "stem", majors: STEM_MAJORS, review: "Weighs math and science heavily." },
  ],
};

/** The program that best matches the student's intended major, if any. */
export function suggestProgram(collegeId: string, major: string): Program | null {
  const list = PROGRAMS[collegeId];
  if (!list || !major.trim()) return null;
  const m = major.toLowerCase();
  let best: { p: Program; score: number } | null = null;
  for (const p of list) {
    for (const k of p.majors) {
      // Exact match beats a keyword inside the major, which beats the major inside a longer keyword.
      const score = m === k ? 1000 : m.includes(k) ? 100 + k.length : k.includes(m) ? m.length : 0;
      if (score && (!best || score > best.score)) best = { p, score };
    }
  }
  return best?.p ?? null;
}

export function getProgram(collegeId: string, programId: string | null | undefined): Program | null {
  if (!programId) return null;
  return PROGRAMS[collegeId]?.find((p) => p.id === programId) ?? null;
}
