export type ImpactLevel = "school" | "local" | "state" | "national" | "international";
export type AwardLevel = "school" | "regional" | "state" | "national" | "international";
export type RecStrength = "unknown" | "average" | "strong" | "exceptional";
export type AppPlan = "ED" | "ED2" | "EA" | "REA" | "RD";

export interface Activity {
  id: string;
  name: string;
  role: string;
  category: string;
  years: number; // grades participated, 1–4
  hoursPerWeek: number;
  weeksPerYear: number;
  leadership: boolean;
  founder: boolean;
  impact: ImpactLevel;
  description: string;
}

export interface Award {
  id: string;
  name: string;
  level: AwardLevel;
}

export interface Profile {
  name: string;
  grade: number; // 9–12 (13 = gap year / graduated)
  state: string; // two-letter
  highSchool: string;
  intendedMajor: string;
  gpaUnweighted: number | null;
  gpaWeighted: number | null;
  classRankPercent: number | null; // top X%
  apCount: number; // AP / IB HL / dual-enrollment college courses completed or in progress
  honorsCount: number;
  rigor: 1 | 2 | 3 | 4 | 5; // 5 = most demanding curriculum available at school
  sat: number | null;
  act: number | null;
  submitTests: boolean;
  activities: Activity[];
  awards: Award[];
  personalStatement: string;
  recs: RecStrength;
  firstGen: boolean;
  lowIncome: boolean;
  recruitedAthlete: boolean;
  legacyAt: string[]; // college ids
  significantResponsibilities: boolean; // work, caregiving
  importedFrom?: string;
  funding?: FundingExtras;
}

/** GrantScout intake. Status, income and background are optional, stay on this device, and are never printed. */
export interface FundingExtras {
  age: number | null;
  city: string;
  county: string;
  metro: string;
  country: string; // ISO-2
  residenceStatus: string; // "" = prefer not to say
  hasWorkAuthorization: boolean;
  citizenships: string[]; // ISO-2, other than country of residence
  countryTies: string[]; // e.g. "IN:oci"
  heritage: string[];
  background: string[]; // first_gen, low_income, military_family, foster_youth, disability, ...
  parentEmployers: string[];
  extraInterests: string[];
  wants: string[];
  story: string;
}

export const EMPTY_FUNDING: FundingExtras = {
  age: null,
  city: "",
  county: "",
  metro: "",
  country: "US",
  residenceStatus: "",
  hasWorkAuthorization: false,
  citizenships: [],
  countryTies: [],
  heritage: [],
  background: [],
  parentEmployers: [],
  extraInterests: [],
  wants: [],
  story: "",
};

export const EMPTY_PROFILE: Profile = {
  name: "",
  grade: 11,
  state: "IL",
  highSchool: "",
  intendedMajor: "",
  gpaUnweighted: null,
  gpaWeighted: null,
  classRankPercent: null,
  apCount: 0,
  honorsCount: 0,
  rigor: 3,
  sat: null,
  act: null,
  submitTests: true,
  activities: [],
  awards: [],
  personalStatement: "",
  recs: "unknown",
  firstGen: false,
  lowIncome: false,
  recruitedAthlete: false,
  legacyAt: [],
  significantResponsibilities: false,
};

export type TrackerStatus =
  | "Researching"
  | "Applying"
  | "Submitted"
  | "Admitted"
  | "Waitlisted"
  | "Denied"
  | "Committed";

export interface TrackerEntry {
  collegeId: string;
  collegeName: string;
  plan: AppPlan;
  status: TrackerStatus;
  deadline: string; // ISO date
  checklist: Record<string, boolean>;
  notes: string;
  addedAt: number;
}

export interface SavedEssay {
  id: string;
  title: string;
  prompt: string;
  collegeId: string | null;
  text: string;
  updatedAt: number;
}

export const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","PR","International",
];
