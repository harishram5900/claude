// Builds a GrantScout profile from the AdmitLens profile plus the optional funding intake.
import { unweightedGpa } from "./engine";
import type { FundingProfile } from "./grantscout";
import { EMPTY_FUNDING, type Profile } from "./types";

const CONTINENT: Record<string, string> = { US: "North America", CA: "North America", MX: "North America", IN: "Asia", GB: "Europe" };

export function toFundingProfile(p: Profile): FundingProfile {
  const f = { ...EMPTY_FUNDING, ...(p.funding ?? {}) };
  const background = new Set(f.background);
  if (p.firstGen) background.add("first_gen");
  if (p.lowIncome) background.add("low_income");
  const interests = new Set<string>(f.extraInterests.map((x) => x.toLowerCase()));
  for (const a of p.activities) {
    for (const t of [a.name, a.category]) if (t && t.length < 40) interests.add(t.toLowerCase());
  }
  return {
    name: (p.name || "").split(" ")[0],
    grade: p.grade >= 13 ? "college" : String(p.grade),
    age: f.age,
    gpa: unweightedGpa(p),
    location: { city: f.city, county: f.county.replace(/\s+county$/i, ""), metro: f.metro, state: p.state, country: f.country || "US", continent: CONTINENT[f.country || "US"] ?? "" },
    residence_status: f.residenceStatus,
    has_work_authorization: f.hasWorkAuthorization,
    citizenships: f.citizenships,
    country_ties: f.countryTies,
    heritage: f.heritage,
    background: [...background],
    intended_majors: p.intendedMajor ? p.intendedMajor.split(/,|\/| and /).map((s) => s.trim().toLowerCase()).filter(Boolean) : [],
    interests_activities: [...interests],
    parent_employers: f.parentEmployers,
    affiliations: [],
    wants: f.wants,
    story: f.story,
  };
}
