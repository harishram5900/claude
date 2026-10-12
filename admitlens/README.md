# AdmitLens

See your college application the way admissions will. AdmitLens simulates the reader at the
college you choose (a Harvard reader grades very differently from a UIC reader), estimates your
chances, critiques every part of your file and shows what would raise your odds.

## Features

- **Admissions simulator**: 1–6 reader ratings per dimension, calibrated chance with a range, a reader memo in the voice of that school's office, and what-if improvements that are re-simulated to show the real gain. Includes a "same file, different readers" comparison.
- **College data**: 139 colleges with detailed admissions profiles (admit and early rates, middle-50% SAT/ACT, typical GPA, test policy, legacy policy, residency preference, priorities, signature programs, supplement themes), plus live search across every US four-year college through the Dept. of Education College Scorecard API.
- **Essay Lab**: live scoring (voice, specificity, structure, reflection, mechanics, college fit), cliché, filler and passive-voice detection, "why us" specificity checks, and an optional AI reader critique. It coaches; it does not ghostwrite.
- **GrantScout funding finder** (ported from the GrantScout Cowork skill in `grantscout/skill`): eligibility filtering by citizenship and immigration status (U.S. statuses plus home-country and diaspora ties), grade, age, GPA, background and field. Results are sorted by location ring (county → metro → state → national → home country → global) and ranked by GrantScout's priority score (fit via TF-IDF, award size, expected value from estimated odds, urgency, unclaimed-money signal). It also includes a scam filter, a free-money checklist, an essay-reuse plan, "connect the dots" search angles, a per-ring research plan, an "add an award" form, import of GrantScout `found.json`/`library.json`, CSV export and a shareable PDF that never prints status, income or background and hides status-revealing awards by default.
- **Tracker**: statuses, plans, auto-filled deadlines, per-college checklists and a list-balance check.
- **Roadmap**: a grade-by-grade map to the student's dream school, with milestones prioritized by the gaps that school's reader would flag.
- **Common App import**: upload the Common App preview PDF (parsed in the browser) or paste the text. Common App has no public API for third-party apps, so import works from the student's own export.
- Light, dark and system themes. Responsive down to phone width. All student data stays in localStorage.

## Run

```bash
cd admitlens
npm install
npm run dev     # http://localhost:3000
npm test        # admissions engine, SFFA calibration, GrantScout, Common App parser and PDF tests
```

## Environment variables (optional)

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Enables AI deep reads, AI essay critique and AI-assisted Common App parsing (Claude Opus 5.5). Without it the deterministic engine still powers everything. |
| `COLLEGE_SCORECARD_API_KEY` | Free key from https://api.data.gov/signup for live all-US college search. Falls back to `DEMO_KEY`, which is rate-limited. |

## Deploy to Vercel

Import the repo in Vercel, set **Root Directory** to `admitlens`, and add the env vars above.

## How the model works

See `/about` in the app and `src/lib/engine.ts`. Each dimension is scored as a z-score against
the chosen college's admitted class. Dimensions are weighted by selectivity tier and combined in a
logistic model anchored at the real admit rate, with early-plan, residency, legacy (only where
still considered), first-gen and context adjustments, plus a soft ceiling on unhooked odds.
Race and ethnicity are not used. `tests/engine.test.ts` checks selectivity ordering, ceilings,
monotonicity over 300 random cases, distinct results for 200 random applicants, determinism, and
essay discrimination.
