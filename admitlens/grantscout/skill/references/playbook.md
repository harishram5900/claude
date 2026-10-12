# GrantScout: Student Funding Finder (Claude Cowork hand-off)

> **Claude: when this file is attached, start right away.** Don't summarize the file. Greet the student in one line, say that their status, income and background answers are optional, private and never printed, then ask the A2 intake questions in a single numbered message. After they answer, follow Part A from A1 to the end without waiting for more instructions.

**One file. Drop it into Claude Cowork and say: "Run GrantScout for me."**

GrantScout finds 75 to 100 grants, scholarships, fellowships, paid internships, funded programs, competitions and founder accelerators that one student is actually eligible for. It checks immigration and citizenship status, grade, age, location and background before listing anything. Results are sorted from closest to farthest (county and city, local hub, state, country, home country, continent, world). At the end the student gets a PDF they can download and share with friends.

This file has five parts:

| Part | Who reads it | What it is |
|---|---|---|
| A | Claude | Step-by-step playbook. Follow it exactly. |
| B | Everyone | How student funding works, and where unused money hides |
| C | Claude + team | Taxonomy and eligibility rules (citizenship and status) |
| D | Claude | Source map by location ring |
| E | Claude | The engine source code (`grant_scout.py`) |

> **For the person sharing this file:** you don't need to edit anything. Each student opens a new Cowork task, attaches this file and answers about 10 questions. If your team keeps a shared folder, put `library.json` there. Every run adds to it, so each student's search makes the next one faster and better. That shared folder is the RAG memory.

---

## PART A: Playbook for Claude

You are running GrantScout for one student. Your job is to give them a correct, ranked and shareable list of at least `min_results` (default 75) and at most `max_results` (default 100) opportunities that they appear eligible for. You then hand them the PDF.

### A0. Non-negotiable rules

1. **Trust is the product.** A wrong eligibility claim or a scam listing does more damage than a missing award. Never list anything that charges an application fee, "guarantees" an award, or asks for bank, SSN or credit-card details. The engine drops these automatically, so always run listings through it.
2. **Privacy.** Most users are minors. Ask only what matching needs. Immigration status, income and background are optional, kept in the local profile only, and never printed in the PDF. Never ask for an SSN, A-number, passport number or exact address. If a student prefers not to give their status, leave `residence_status` empty. The engine will then list only awards open to all statuses, and you should tell them that.
3. **Sponsor page = source of truth.** Aggregators (Fastweb, Bold.org, Scholarships.com, Going Merry, opportunity blogs) are for discovery only. Follow each lead to the sponsor's own page and record that URL.
4. **Copy eligibility wording exactly.** Put the sponsor's eligibility sentence in `citizenship_text`, then map it to `status_rules` using C3. If the wording is ambiguous (for example "legal resident" or "eligible to work in the U.S."), map it conservatively and add the flag `"ambiguous_status_wording"`.
5. **Respect sites.** Read pages the way a person would: one page at a time. Don't bulk-crawl, don't bypass logins or CAPTCHAs, and honor robots.txt and terms.
6. **Today's date matters.** Mark past-deadline annual awards as next cycle (the engine estimates the next date and labels it "est."). Drop one-time programs whose deadline has passed.

### A1. Set up (once per task)

1. Copy `scripts/grant_scout.py` from this skill into the working folder.
2. `python grant_scout.py template` should print a profile template. If `reportlab` is missing, the engine installs it on first PDF build. You can also run `pip install reportlab` yourself.
3. If the user has a shared team folder with `library.json`, copy it in. Otherwise create one with `python grant_scout.py seed --out library.json`. Seeds are leads, not facts: each one must be verified (A6) before it counts as verified.

### A2. Intake interview (short and friendly)

Ask in one or two messages. Each item marked optional should say "(optional, private, not printed)".

1. First name (printed on the PDF) and grade (6 to 12, or college year), plus age.
2. City, county, nearby metro or regional hub (for example "Chicagoland", "Bay Area", "Research Triangle"), state or province, and country.
3. Citizenship and immigration status where they live. Use the status list in C2 and allow "prefer not to say". Also ask whether they have work authorization, since some paid internships require it.
4. Other countries they are a citizen of, or have OCI, PIO, NRI or similar ties to. This unlocks home-country funding (ring 5).
5. GPA (unweighted is fine) and any test scores (optional).
6. Intended majors or career, plus top activities and interests (robotics, startup, debate, art, sports, service and so on).
7. Heritage, language community, religion, first-gen, low-income, military family, foster care, disability and other background (all optional).
8. Parent or guardian employers and union memberships (optional). Employer scholarships are often under-applied.
9. What they want: scholarships, grants, fellowships, internships, accelerators, competitions, or all of these.
10. One or two sentences on their goals or story. This feeds the RAG fit score.

Write `profile.json` using the template fields. Use `residence_status` codes from C2, and ISO-2 country codes in `citizenships` and `country_ties` (for example `"IN:oci"`).

### A3. Retrieve first (RAG)

Run `python grant_scout.py retrieve --profile profile.json --library library.json`.

This ranks everything your team has already found against this student. It uses TF-IDF similarity on their majors, activities, background and story, and applies all eligibility filters. Re-verify the top retrieved records whose `last_verified` is older than 60 days, or empty. Then count how many eligible records you already have in each ring.

### A4. Research in two passes

Run `python grant_scout.py queries --profile profile.json`. It prints a search plan per ring, plus "divergent angles".

**Ring quotas.** Collect about 140 raw candidates so that 75 to 100 survive the filter. Aim for these minimums in eligible results:

| Ring | Minimum | Ring | Minimum |
|---|---|---|---|
| 1. County & city | 15 | 5. Home country or diaspora (if the student has ties) | 5 |
| 2. Local hub or metro | 10 | 6. Continent | 3 |
| 3. State | 15 | 7. Global | 10 |
| 4. National | 20 | | |

If a ring is really empty (for example a small rural county), note it and fill the gap from the next ring out.

**Pass 1: Convergent (precision).** Go through the plan's queries for each ring. For each hit, open the sponsor page and extract a record (A5). Priority sources, nearest first:

- the county or city community foundation (one common application often covers dozens of awards)
- the school or district counselor bulletin
- Rotary, Lions, Kiwanis, Elks, Optimist and other civic clubs
- local credit unions, utilities, hospitals and large local employers
- the state aid agency
- state professional associations
- national foundations

**Pass 2: Divergent ("max temperature": connect the dots).** You can't change your sampling temperature inside Cowork. You get the same effect by deliberately brainstorming wide, then verifying strictly. For each divergent angle, and for at least 10 combinations of your own, search and follow the chain. Useful moves:

- **Intersections.** Combine two of the student's traits (for example *Telugu + engineering*, *robotics + Illinois*, *first-gen + startup*). Intersections have tiny applicant pools.
- **Past-winner trails.** Open a sponsor's "past recipients" page. Winners' bios and LinkedIn pages list the other awards they won. Harvest those.
- **Sponsor siblings.** A community foundation, company or association that funds one award often funds several others on the same site.
- **Upstream funders.** Fully funded summer programs, research internships and fellowships pay out value. Winning them strengthens later applications, which compounds.
- **Home-country government.** Look at ministries of external or overseas affairs, embassies' education desks and state-government diaspora programs, plus diaspora associations in the student's country of residence.
- **Status-friendly hubs.** For DACA, TPS, undocumented, H-4 and F-1 students, use the lists kept by immigrant-student nonprofits and "regardless of citizenship" college merit aid.
- **Unclaimed money.** Work through every item of the checklist in B3 for this student.

Record why each divergent find connects to the student in the `description` field. The engine shows it in "Why it fits".

### A5. Record format: write `found.json` as a JSON list

```json
{
  "name": "DuPage Foundation STEM Scholarship",
  "sponsor": "DuPage Foundation", "sponsor_type": "community_foundation",
  "source_url": "https://<sponsor page, not aggregator>",
  "vehicle": "scholarship",
  "selection_basis": ["merit", "essay"],
  "amount_min": 1000, "amount_max": 5000, "amount_text": "$1,000-$5,000",
  "program_value_usd": 0, "renewable": false, "number_of_awards": 10,
  "deadline": "2027-02-15", "deadline_typical": "02-15", "cycle": "annual",
  "grade_levels": ["12"], "age_min": null, "age_max": null, "gpa_min": 3.0,
  "status_rules": ["US:citizen", "US:pr", "US:daca"],
  "citizenship_text": "Applicants must be U.S. citizens, permanent residents or DACA recipients.",
  "geo": {"level": "county", "country": "US", "state": "IL", "county": "DuPage"},
  "host_location": "",
  "background_focus": [], "background_required": false,
  "fields_of_study": ["engineering", "computer science"], "fields_required": true,
  "interests": ["robotics"], "need_based": false,
  "application_materials": ["essay", "transcript", "recommendation"],
  "essay_prompts": "Describe a problem in your community you used STEM to solve.",
  "application_fee": 0,
  "description": "Why it fits / how you found it",
  "last_verified": "2026-10-12", "status": "open",
  "flags": [], "unclaimed_signal": false
}
```

Allowed values:

- **`vehicle`:** scholarship, grant, fellowship, prize, competition, internship, accelerator, program_stipend, free_program, microgrant, tuition_waiver, fee_waiver, work_study, service_conditional, forgivable_loan, dual_enrollment.
- **`geo.level`:** school, district, city, county, metro, region, state, province, national, continent, global.
  - Use **global** when anyone anywhere can apply, even if the program happens in one place. Put that place in `host_location`.
  - Use **national + country** for a national award of the residence country or of a home country.
- **`unclaimed_signal`:** set `true` when it is entitlement or formula aid, a local award with few applicants, an employer or union award, or the sponsor says funds went unawarded.

### A6. Verify the seeds and anything stale

For each seed or retrieved record you intend to keep:

1. Open its `source_url`.
2. Confirm the program still exists, then update the exact deadline, amount, `citizenship_text`, `status_rules` and grade or age limits.
3. Set `last_verified` to today.
4. If it was discontinued, set `"status": "discontinued"`. If the eligibility wording changed, the engine flags the change automatically.

Add the updated records to `found.json`.

### A7. Build, check, loop

```
python grant_scout.py build --profile profile.json --records found.json --library library.json --out-dir out
```

- **Exit code 3** means fewer than `min_results` eligible results. The report lists `thin_rings`: go back to A4 for those rings and rebuild.
- If `needs_review` is more than about 20% of results, fix the records with unknown `status_rules` and rebuild. Use `--strict` to hide unknowns entirely.
- Read `dropped_reasons`. If many records failed on status, you searched in the wrong pool. Refocus using C2 and D.

### A8. Deliver

1. Give the student `out/grantscout-<name>-<date>.pdf` as a download. Also give them the `.csv` if they want a spreadsheet.
2. In chat, write five lines: count by ring, the three most urgent deadlines, the top three "start here" picks, and one unclaimed-money action they can do this week.
3. Save `library.json` back to the shared team folder so the next student's run benefits.
4. Offer to draft the first essay for the biggest essay-reuse cluster.

---

## PART B: How student funding works

### B1. The money map

- **Gift aid you never repay:** scholarships, grants, fellowships, prizes, stipends, fully funded programs, microgrants, tuition and fee waivers.
- **Earned aid:** work-study, paid internships and research stipends.
- **Conditional aid:** service-conditional awards such as ROTC, teaching and nursing service awards, plus forgivable loans. Label these clearly.
- **Not gift aid:** loans and income-share agreements. GrantScout excludes or flags them.

There are two very different kinds of money, and they need different strategies:

1. **Entitlement or formula aid** (Pell, state need grants, many tuition waivers). Meet the criteria, file on time, and you're funded. You aren't competing against anyone; the only way to lose is by not filing or filing late. This is where most unused money is.
2. **Competitive awards** (most scholarships, fellowships and prizes). Your odds depend on how many people apply. National awards draw tens of thousands of applicants. A county Rotary award may draw 8. That's why GrantScout sorts local first and computes an expected value.

### B2. How GrantScout prioritizes (the "predictive analysis")

Each opportunity gets a 0 to 100 priority score:

| Points | Factor |
|---|---|
| 30 | Profile fit: RAG similarity between the student's story, majors and activities and the award text, plus exact matches on major, background and interests |
| 20 | Award size, on a log scale (renewable awards count as 4 years) |
| 20 | Expected value: size × estimated chance of winning |
| 10 | Deadline urgency: 7 to 90 days out is the sweet spot |
| 8 | Unclaimed-money signal |
| 7 | Gift aid beats prizes and programs |
| 5 | Verified on the sponsor page within 12 months |

The chance of winning starts from a base rate by ring: about 20% county, 12% metro, 6% state, 1.5% national, 5% home-country and 0.6% global. It then rises with more awards available, narrower eligibility (fewer competitors) and effortful applications such as essays, video and portfolio, since many applicants quit those. Sweepstakes and no-essay awards get cut to 20% of their odds, because huge pools mean poor odds. These are prioritizing estimates, not promises.

The PDF is sorted by ring (closest first), then by score within each ring. A "Start here: top 15" page pulls the best items from all rings to the front.

### B3. Unused and "surplus" money: what's real

- **Unclaimed federal grants are real and well measured.** NCAN estimated about **$3.6 billion** in Pell Grants went unclaimed by the high school class of 2022, because roughly 767,000 Pell-eligible students never completed the FAFSA. The estimate for the class of 2021 was about $3.75 billion. These are modeled estimates, but the pattern is consistent year after year. The fix is simple: file the FAFSA, or the state alternative application, early.
- **Campus-based and state aid runs out.** FSEOG, work-study and several state grants (for example Illinois MAP) are first-come, first-served. Filing in October rather than March can decide whether you get funded.
- **Local awards go under-applied.** Community foundations and civic clubs regularly report awards with only a handful of applicants, and some award money goes unawarded because nobody applied.
- **"Billions in unclaimed private scholarships" is mostly a myth.** That claim gets repeated without evidence. Real private-award money doesn't sit in a vault; it goes to whoever applies. GrantScout therefore targets *low-competition* awards, not mythical "unclaimed" ones.

GrantScout prints a personalised "Free money people leave on the table" checklist for each student:

- FAFSA or the state alternative application
- CSS Profile fee waivers
- SAT, ACT, AP and application fee waivers
- the community foundation common application
- the counselor bulletin
- parent employer and union benefits
- heritage, religious and language associations
- home-country diaspora programs
- college aid appeals and named endowed scholarships

### B4. Practical rules students should know

- **Stacking and displacement.** Some colleges reduce their own grant aid when a student wins outside scholarships. Ask each college how it treats outside awards.
- **Taxes.** Prize money, stipends and scholarship money spent on room and board can be taxable income. Keep award letters.
- **Timeline.**

| Grade | What to do |
|---|---|
| 9 to 10 | Competitions, funded summer programs, microgrants. These build the record that wins later. |
| 11 | PSAT (National Merit), research programs, junior awards (Coolidge, QuestBridge Prep, USSYP) |
| 12 | Big scholarship season runs September to March. File the FAFSA on the day it opens. |

- **Reuse essays.** GrantScout groups awards by essay theme so one strong essay can be adapted 5 to 10 times.

---

## PART C: Taxonomy and eligibility reference

### C1. Tag every award on four independent axes

These are filters, not folders. One award can be merit-based, DACA-friendly, Hispanic-focused and state-limited all at once.

1. **Selection basis:** merit, GPA threshold, test score, need, need and merit, project or research, entrepreneurship, essay, leadership, service, arts, performing arts, athletic, field of study, competition or olympiad, video, no-essay or sweepstakes (low value, often lead-gen), employer or union, affiliation, circumstance, local, college-specific.
2. **Funding vehicle:** see the A5 list. Scholarship and grant are often paid to the college; prizes and stipends are often paid to the student. Federal and state grants have strict citizenship rules. ROTC and the service academies require citizenship.
3. **Citizenship and immigration eligibility:** see C2 and C3.
4. **Identity, background and location:** heritage, ethnicity and language community; first-gen; low-income; gender; LGBTQ+; disability; medical history; foster or homeless youth; military-connected; first-responder families; religion; rural; single-parent or teen parent; incarcerated parent; English learner; county, city or school.
   - Record whether the background is required or only preferred.
   - Refresh race-focused records often. The legal ground shifted after SFFA v. Harvard (2023), and later suits and guidance followed.
   - Tribal awards are a political-membership category.

### C2. Residence status codes (profile `residence_status`)

| Code | Status | Federal aid | Typical state aid | Private awards |
|---|---|---|---|---|
| `citizen`, `national` | U.S. citizen or national | Yes | Yes if resident | Nearly all |
| `pr`, `conditional_pr` | Green card | Yes | Usually | Most ("citizen or PR" is the most common rule) |
| `refugee`, `asylee` | Refugee or asylee | Yes (eligible noncitizen) | Usually | Many, plus refugee-specific funds |
| `parolee`, `t_visa`, `vawa` | Other eligible noncitizens | Generally | Varies | Varies |
| `h4`, `l2`, `other_dependent` | Dependent visas | No | Some states (domicile-based) | Only "all students" or "regardless of citizenship" awards. Institutional merit aid matters most. |
| `f1`, `j1` | Student or exchange visa | No | Rarely | International-student and college merit aid |
| `daca` | DACA | No | Some states (Dream Acts) | DACA-friendly awards |
| `tps` | TPS | No | Varies | Often grouped with DACA |
| `undocumented` | No status | No | Some states | "Regardless of status" awards |
| `pending_ac` | Adjustment pending | No, until approved | Varies | Varies. Re-run once approved. |
| *(empty)* | Prefer not to say | n/a | n/a | Engine shows only "open to all" and "any resident" awards |

State laws on undocumented and DACA students changed in 2025, so re-check each cycle against studentaid.gov and the state aid agency.

### C3. Mapping eligibility wording to `status_rules` tokens

Tokens are `COUNTRY:kind`, plus the global token `ANY`.

| Sponsor wording | `status_rules` |
|---|---|
| "Open to all students regardless of citizenship or immigration status" / "worldwide" | `["ANY"]` |
| "Must attend high school in the U.S." / "U.S. residents" with no status words | `["US:resident_any"]` |
| "U.S. citizens" | `["US:citizen"]` |
| "U.S. citizens or permanent residents" | `["US:citizen", "US:pr"]` |
| "Citizen or eligible noncitizen" / "must complete the FAFSA" | `["US:fafsa_eligible"]` |
| "...including refugees, asylees" | add `"US:refugee_asylee"` or `"US:eligible_noncitizen"` |
| "DACA recipients eligible" | add `"US:daca"` |
| "Undocumented, DACA and TPS students" | `["US:daca", "US:tps", "US:undocumented"]` (or `"US:status_friendly"`) |
| "International students / F-1 welcome" | add `"US:international"` or `"US:student_visa"` |
| "Dependent visa holders (H-4, L-2) eligible" | add `"US:dependent_visa"` |
| "Must be legally eligible to work in the U.S." | `["US:work_authorized"]`, and flag `ambiguous_status_wording` |
| "Legal resident" (unclear) | `["US:citizen", "US:pr"]`, and flag `ambiguous_status_wording` |
| "Indian citizens" | `["IN:citizen"]` |
| "NRI / PIO / OCI children" | `["IN:nri", "IN:pio", "IN:oci", "IN:citizen_abroad"]` |
| "Citizens of <country> living abroad" | `["<CC>:citizen_abroad"]` |
| Not stated anywhere on the sponsor page | `[]` (engine flags it for review; `--strict` hides it) |

The same pattern works for any country. For example, a Canadian award for "Canadian citizens or permanent residents" is `["CA:citizen", "CA:pr"]`.

### C4. Pitfalls

- Drop scams: fees, "guaranteed" wins, or requests for bank or SSN details.
- Label or skip lead-gen sweepstakes.
- Hide records that haven't been verified in the past 12 months.
- Diff `citizenship_text` on every re-scrape.
- Store raw ambiguous wording and flag it.
- Collect the minimum about minors (check COPPA for under-13s and state student-privacy laws).
- Get a lawyer to review how race- and status-restricted listings are displayed before any public launch.

---

## PART D: Source map by ring

| Ring | Where to look (sponsor pages first) |
|---|---|
| 1. County & city | County or city community foundation (one of ~700+ in the U.S.; usually has a common application), high school and district scholarship bulletins and counselor PDFs, PTA/PTO, Rotary/Lions/Kiwanis/Elks/Optimist/Soroptimist clubs, VFW/American Legion posts, local credit unions and banks, utilities, hospitals, large local employers, places of worship, local chambers of commerce (including ethnic chambers), library and park-district youth grants, local science fairs (the path into ISEF) |
| 2. Local hub or metro | Regional foundations (for example the Chicago Community Trust and Chicagoland orgs), metro startup hubs (for example 1871 in Chicago), university pre-college and summer research programs nearby, regional companies' foundations, regional pitch competitions and hackathons with cash prizes, metro-wide college-access nonprofits |
| 3. State | The state student aid agency (grants, merit awards, Dream Act or alternative applications, tuition waivers, dual-enrollment funding), the state 529 plan's contests, state professional associations (engineers, nurses, CPAs, bar), state FFA/4-H/DECA/FBLA/HOSA/Skills chapters, the governor's or legislators' scholarship programs, state humanities and arts councils |
| 4. National | studentaid.gov, national foundations, corporate foundations, professional associations by major, heritage and identity organizations, undocumented and DACA-focused funds (TheDream.US, Golden Door and immigrant-student nonprofits' lists), national competitions and olympiads, funded summer programs, founder fellowships and accelerators (Z Fellows, Thiel, KINN Founder Sprint Studio in Venice, CA, Stanford-area founder fellowships: verify organizers), paid internships (NASA OSTEM, corporate HS programs) |
| 5. Home country or diaspora | The home-country ministry of external or overseas affairs. India examples: the MEA's SPDC for NRI/PIO/OCI children studying in India, the Know India Programme for ages 21 to 35, and state-government NRI cells. Also embassy and consulate education desks, home-country-linked awards at foreign universities (for example the Tata Scholarship at Cornell), and diaspora associations in the residence country (language associations such as Telugu, Tamil and Gujarati community groups) |
| 6. Continent | Regional youth prizes and fellowships (for example North American and European youth innovation programs) |
| 7. Global | Programs open worldwide: Rise, Emergent Ventures, Breakthrough Junior Challenge, Conrad Challenge, Diamond Challenge, ISEF (through affiliated fairs), RSI, SSP, Thiel Fellowship, Z Fellows. Global foundations: verify that it's open to every nationality. |

Notes on the named programs from the original request:

- **KINN Founder Sprint Studio:** a Venice, CA founder community. Verify age or student eligibility, cost and cohort dates on the KINN site.
- **"Silicon Valley fellowship":** several programs use similar names, and some are third-party "fully funded" listings. Confirm who runs the program and that it charges no fees.
- **Campus 1871:** the last public editions found were 2014 to 2018, and it was for partner-university students. Check 1871.com for current student programs before listing.

---

## PART E: Engine

The engine is bundled at `scripts/grant_scout.py`. Run it from the skill folder.

*GrantScout is community-built to help students find funding. Listings are leads to verify, not guarantees. Always confirm eligibility and deadlines on the sponsor's official page.*
