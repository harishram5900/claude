#!/usr/bin/env python3
"""
GrantScout engine: eligibility filter, RAG retrieval, predictive priority
scoring, location-ring sorting, "connect the dots" insights and PDF export
for student grants, scholarships, fellowships, internships and accelerators.

Stdlib + reportlab only. Claude Cowork does the web research; this engine
makes the results correct, ranked, private and printable.

Commands
  template                       print a blank student profile JSON
  seed      --out library.json   write the built-in seed library (leads to verify)
  retrieve  --profile p.json --library library.json [--k 150]
                                 RAG: pull the best already-known records for a profile
  queries   --profile p.json     print the convergent + divergent search plan
  build     --profile p.json --records found.json [--library library.json]
            [--out-dir out] [--strict]
                                 validate, merge into library, filter, score,
                                 sort by location ring, write PDF + CSV + JSON
"""
import argparse
import csv
import datetime as dt
import json
import math
import os
import re
import sys
from collections import Counter, defaultdict

TODAY = dt.date.today()

# ---------------------------------------------------------------------------
# 1. Immigration / citizenship eligibility model
# ---------------------------------------------------------------------------
# A record lists the tokens it accepts in `status_rules`, each scoped to a
# country ("US:citizen", "IN:oci") or the global token "ANY". A profile expands
# into every token it satisfies; a record is status-eligible when the two
# sets intersect. Empty `status_rules` = unknown wording -> flagged for review.

RESIDENCE_STATUS_TOKENS = {
    "citizen":        ["citizen", "citizen_or_pr", "fafsa_eligible", "work_authorized"],
    "national":       ["citizen", "citizen_or_pr", "fafsa_eligible", "work_authorized"],
    "pr":             ["pr", "citizen_or_pr", "eligible_noncitizen", "fafsa_eligible", "work_authorized"],
    "conditional_pr": ["pr", "citizen_or_pr", "eligible_noncitizen", "fafsa_eligible", "work_authorized"],
    "refugee":        ["refugee_asylee", "eligible_noncitizen", "fafsa_eligible", "work_authorized"],
    "asylee":         ["refugee_asylee", "eligible_noncitizen", "fafsa_eligible", "work_authorized"],
    "parolee":        ["eligible_noncitizen", "fafsa_eligible", "noncitizen"],
    "t_visa":         ["eligible_noncitizen", "fafsa_eligible", "noncitizen"],
    "vawa":           ["eligible_noncitizen", "fafsa_eligible", "noncitizen"],
    "h4":             ["dependent_visa", "noncitizen"],
    "l2":             ["dependent_visa", "noncitizen"],
    "other_dependent": ["dependent_visa", "noncitizen"],
    "f1":             ["student_visa", "international", "noncitizen"],
    "j1":             ["student_visa", "international", "noncitizen"],
    "daca":           ["daca", "status_friendly", "noncitizen", "work_authorized"],
    "tps":            ["tps", "status_friendly", "noncitizen", "work_authorized"],
    "undocumented":   ["undocumented", "status_friendly", "noncitizen"],
    "pending_ac":     ["pending_ac", "noncitizen"],
    "international":  ["international", "noncitizen"],  # lives outside the award country
}
STATUS_LABELS = {
    "citizen": "Citizen", "national": "U.S. national", "pr": "Permanent resident",
    "conditional_pr": "Conditional PR", "refugee": "Refugee", "asylee": "Asylee",
    "parolee": "Parolee", "t_visa": "T-visa", "vawa": "VAWA", "h4": "H-4 dependent",
    "l2": "L-2 dependent", "other_dependent": "Other dependent visa", "f1": "F-1 student",
    "j1": "J-1", "daca": "DACA", "tps": "TPS", "undocumented": "Undocumented",
    "pending_ac": "Pending green card", "international": "International",
}


def profile_tokens(p):
    """Every eligibility token this student satisfies."""
    toks = {"ANY"}
    loc = p.get("location", {})
    cc = (loc.get("country") or "US").upper()
    status = (p.get("residence_status") or "").lower()
    toks.add(f"{cc}:resident_any")
    for t in RESIDENCE_STATUS_TOKENS.get(status, []):
        toks.add(f"{cc}:{t}")
    if p.get("has_work_authorization"):
        toks.add(f"{cc}:work_authorized")
    for c in p.get("citizenships", []) or []:
        c = c.upper()
        toks.add(f"{c}:citizen")
        toks.add(f"{c}:citizen_or_pr")
        if c != cc:
            toks.add(f"{c}:citizen_abroad")
            toks.add(f"{c}:diaspora")
            toks.add(f"{cc}:international_citizen_of_{c}")
    for tie in p.get("country_ties", []) or []:          # e.g. "IN:oci", "IN:pio", "MX:heritage"
        c, _, kind = tie.partition(":")
        toks.add(f"{c.upper()}:{kind.lower()}")
        toks.add(f"{c.upper()}:diaspora")
    return toks


COUNTRY_NAMES = {"IN": "India", "US": "the United States", "MX": "Mexico", "CN": "China", "PH": "the Philippines",
                 "NG": "Nigeria", "PK": "Pakistan", "BD": "Bangladesh", "KR": "South Korea", "VN": "Vietnam",
                 "CA": "Canada", "GB": "the United Kingdom", "NP": "Nepal", "LK": "Sri Lanka"}


def country_name(cc):
    return COUNTRY_NAMES.get(cc.upper(), cc.upper())


def heritage_countries(p):
    cc = (p.get("location", {}).get("country") or "US").upper()
    out = {c.upper() for c in p.get("citizenships", []) or []}
    out |= {t.split(":")[0].upper() for t in p.get("country_ties", []) or []}
    out.discard(cc)
    return out


# ---------------------------------------------------------------------------
# 2. Location rings (sort order the user asked for)
# ---------------------------------------------------------------------------
RINGS = [
    (1, "Your county & city"),
    (2, "Your local hub / metro region"),
    (3, "Your state"),
    (4, "Your country (national)"),
    (5, "Home-country & diaspora funding"),
    (6, "Your continent"),
    (7, "Global / open worldwide"),
]
RING_NAME = dict(RINGS)
LEVEL_TO_RING = {"school": 1, "district": 1, "city": 1, "county": 1,
                 "metro": 2, "region": 2, "state": 3, "province": 3,
                 "national": 4, "continent": 6, "global": 7}


def _eq(a, b):
    return (a or "").strip().lower() == (b or "").strip().lower()


def geo_match(rec, p):
    """Return (eligible_geographically, ring)."""
    g = rec.get("geo") or {"level": "global"}
    level = (g.get("level") or "global").lower()
    loc = p.get("location", {})
    cc = (loc.get("country") or "US").upper()
    gcc = (g.get("country") or "").upper()
    if level == "global":
        return True, 7
    if level == "continent":
        return _eq(g.get("continent"), loc.get("continent")), 6
    if level == "national":
        if not gcc or gcc == cc:
            return True, 4
        if gcc in heritage_countries(p):
            return True, 5
        # national award of another country: eligible only if status tokens allow it
        return "open_to_nonresidents" in (rec.get("flags") or []), 5
    # sub-national: must be inside the student's country
    if gcc and gcc != cc:
        return False, 9
    ring = LEVEL_TO_RING.get(level, 4)
    for field in ("state", "metro", "county", "city"):
        want = g.get(field)
        if want:
            have = loc.get(field)
            wants = want if isinstance(want, list) else [want]
            if not any(_eq(w, have) for w in wants):
                return False, ring
    return True, ring


# ---------------------------------------------------------------------------
# 3. Record schema helpers
# ---------------------------------------------------------------------------
VEHICLES = ["scholarship", "grant", "fellowship", "prize", "competition", "internship",
            "accelerator", "program_stipend", "free_program", "microgrant", "tuition_waiver",
            "fee_waiver", "work_study", "service_conditional", "forgivable_loan",
            "dual_enrollment"]
GIFT_VEHICLES = set(VEHICLES) - {"forgivable_loan"}
SCAM_PATTERNS = re.compile(
    r"guaranteed|processing fee|application fee required|bank account|routing number|"
    r"social security number|\bssn\b|credit card|you('| ha)ve (already )?won|act now", re.I)

RECORD_TEMPLATE = {
    "name": "", "sponsor": "", "sponsor_type": "foundation", "source_url": "",
    "vehicle": "scholarship", "selection_basis": ["merit"],
    "amount_min": 0, "amount_max": 0, "amount_text": "", "program_value_usd": 0,
    "renewable": False, "number_of_awards": None,
    "open_date": None, "deadline": None, "deadline_typical": None, "cycle": "annual",
    "grade_levels": [], "age_min": None, "age_max": None, "gpa_min": None,
    "status_rules": [], "citizenship_text": "",
    "geo": {"level": "national", "country": "US"}, "host_location": "",
    "background_focus": [], "background_required": False,
    "fields_of_study": [], "fields_required": False,
    "interests": [], "need_based": False,
    "application_materials": [], "essay_prompts": "", "application_fee": 0,
    "description": "", "last_verified": None, "status": "open",
    "flags": [], "unclaimed_signal": False, "seed": False,
}


def norm_record(r):
    out = dict(RECORD_TEMPLATE)
    out.update({k: v for k, v in r.items() if v is not None or k not in out})
    out["geo"] = dict(out.get("geo") or {"level": "global"})
    for k in ("selection_basis", "grade_levels", "status_rules", "background_focus",
              "fields_of_study", "interests", "application_materials", "flags"):
        v = out.get(k) or []
        out[k] = [v] if isinstance(v, str) else list(v)
    out["vehicle"] = (out.get("vehicle") or "scholarship").lower()
    for k in ("amount_min", "amount_max", "program_value_usd", "application_fee"):
        try:
            out[k] = float(out.get(k) or 0)
        except (TypeError, ValueError):
            out[k] = 0.0
    return out


def rec_key(r):
    name = re.sub(r"[^a-z0-9]", "", (r.get("name") or "").lower())
    sponsor = re.sub(r"[^a-z0-9]", "", (r.get("sponsor") or "").lower())
    return f"{name}|{sponsor}"


def parse_date(s):
    if not s:
        return None
    try:
        return dt.date.fromisoformat(str(s)[:10])
    except ValueError:
        return None


def next_deadline(r):
    """(date or None, is_next_cycle_estimate)."""
    d = parse_date(r.get("deadline"))
    if d and d >= TODAY:
        return d, False
    typ = r.get("deadline_typical")
    if typ and re.fullmatch(r"\d{2}-\d{2}", str(typ)):
        m, dd = map(int, str(typ).split("-"))
        try:
            cand = dt.date(TODAY.year, m, dd)
        except ValueError:
            cand = dt.date(TODAY.year, m, 28)
        if cand < TODAY:
            cand = cand.replace(year=TODAY.year + 1)
        return cand, True
    if d and d < TODAY and (r.get("cycle") or "annual") == "annual":
        try:
            return d.replace(year=d.year + 1 if d.replace(year=TODAY.year) < TODAY else TODAY.year), True
        except ValueError:
            return None, True
    return None, False


# ---------------------------------------------------------------------------
# 4. Lightweight RAG (TF-IDF retrieval over the shared team library)
# ---------------------------------------------------------------------------
STOP = set("a an and the of for to in on at by with from or is are be as this that your you "
           "students student program award awards scholarship scholarships".split())


def tokenize(text):
    return [w for w in re.findall(r"[a-z0-9]+", (text or "").lower()) if w not in STOP and len(w) > 1]


def record_text(r):
    parts = [r.get("name"), r.get("sponsor"), r.get("description"), r.get("vehicle"),
             " ".join(r.get("selection_basis") or []), " ".join(r.get("fields_of_study") or []),
             " ".join(r.get("background_focus") or []), " ".join(r.get("interests") or []),
             r.get("essay_prompts")]
    return " ".join(str(p) for p in parts if p)


def profile_text(p):
    parts = [" ".join(p.get("intended_majors", [])), " ".join(p.get("interests_activities", [])),
             " ".join(p.get("background", [])), " ".join(p.get("heritage", [])),
             " ".join(p.get("affiliations", [])), " ".join(p.get("wants", [])),
             p.get("goals", ""), p.get("story", "")]
    return " ".join(x for x in parts if x)


class TfIdf:
    def __init__(self, docs):
        self.docs = [Counter(tokenize(d)) for d in docs]
        n = len(self.docs) or 1
        df = Counter()
        for d in self.docs:
            df.update(d.keys())
        self.idf = {w: math.log((n + 1) / (c + 1)) + 1 for w, c in df.items()}
        self.vecs = [self._vec(d) for d in self.docs]

    def _vec(self, counts):
        v = {w: (1 + math.log(c)) * self.idf.get(w, 1.0) for w, c in counts.items()}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1.0
        return {w: x / norm for w, x in v.items()}

    def score(self, query):
        q = self._vec(Counter(tokenize(query)))
        return [sum(q.get(w, 0) * x for w, x in v.items()) for v in self.vecs]


# ---------------------------------------------------------------------------
# 5. Eligibility filter
# ---------------------------------------------------------------------------
def grade_ok(r, p):
    gl = [str(g).lower() for g in r.get("grade_levels") or []]
    if not gl or "any" in gl:
        return True
    g = str(p.get("grade", "")).lower()
    aliases = {g}
    if g in ("12", "senior"):
        aliases |= {"12", "senior", "graduating_senior"}
    if g.startswith("college"):
        aliases |= {"college", "undergrad"}
    return bool(aliases & set(gl))


def check_eligibility(r, p, toks, strict=False):
    """Return (eligible, reasons_excluded, review_flags)."""
    why, review = [], []
    if (r.get("status") or "open").lower() in ("closed", "discontinued"):
        why.append("closed/discontinued")
    if r.get("application_fee", 0) > 0:
        why.append("charges an application fee (scam rule)")
    blob = " ".join(str(r.get(k) or "") for k in ("description", "citizenship_text", "essay_prompts"))
    if SCAM_PATTERNS.search(blob):
        why.append("scam warning signs in wording")
    if r.get("vehicle") not in GIFT_VEHICLES:
        review.append("not gift aid - repayment possible")
    wants = [w.lower() for w in p.get("wants", [])]
    if wants and r.get("vehicle") not in wants and "all" not in wants:
        alias = {"program_stipend": "internship", "free_program": "fellowship", "prize": "competition",
                 "microgrant": "grant", "tuition_waiver": "grant", "fee_waiver": "grant",
                 "work_study": "grant", "service_conditional": "scholarship",
                 "dual_enrollment": "grant"}
        if alias.get(r.get("vehicle")) not in wants:
            why.append("type not wanted")
    rules = r.get("status_rules") or []
    if rules:
        if not set(rules) & toks:
            why.append("citizenship / immigration status not eligible")
    else:
        if strict:
            why.append("eligibility wording unknown (strict mode)")
        review.append("status wording not confirmed - read eligibility before applying")
    geo_ok, ring = geo_match(r, p)
    if not geo_ok:
        why.append("outside geographic area")
    if not grade_ok(r, p):
        why.append("grade level")
    age = p.get("age")
    if age is not None:
        if r.get("age_min") and age < r["age_min"]:
            why.append(f"age < {r['age_min']}")
        if r.get("age_max") and age > r["age_max"]:
            why.append(f"age > {r['age_max']}")
    if r.get("gpa_min") and p.get("gpa") is not None and p["gpa"] < float(r["gpa_min"]):
        why.append(f"GPA below {r['gpa_min']}")
    bg = {b.lower() for b in (p.get("background", []) + p.get("heritage", []))}
    focus = {b.lower() for b in r.get("background_focus") or []}
    if r.get("background_required") and focus and not (focus & bg):
        why.append("background-specific award")
    majors = {m.lower() for m in p.get("intended_majors", [])}
    fields = {f.lower() for f in r.get("fields_of_study") or []}
    if r.get("fields_required") and fields and not _fuzzy_overlap(fields, majors):
        why.append("field of study")
    d, est = next_deadline(r)
    if d is None and parse_date(r.get("deadline")) and (r.get("cycle") == "one-time"):
        why.append("deadline passed")
    if est:
        review.append("deadline is last cycle's date - confirm the new date")
    lv = parse_date(r.get("last_verified"))
    if not lv:
        review.append("not yet verified on sponsor page")
    elif (TODAY - lv).days > 365:
        review.append("stale: last verified over 12 months ago")
    return (not why), why, review, ring


def _fuzzy_overlap(a, b):
    return any(x in y or y in x for x in a for y in b)


# ---------------------------------------------------------------------------
# 6. Predictive priority score
# ---------------------------------------------------------------------------
BASE_WIN = {1: 0.20, 2: 0.12, 3: 0.06, 4: 0.015, 5: 0.05, 6: 0.01, 7: 0.006}


def win_probability(r, ring):
    """Heuristic estimate - smaller pools and narrower eligibility = better odds."""
    p = BASE_WIN.get(ring, 0.01)
    n = r.get("number_of_awards")
    if isinstance(n, (int, float)) and n:
        p *= min(4.0, 1 + math.log10(max(n, 1)))
    restrict = len(r.get("status_rules") or []) and "ANY" not in r["status_rules"]
    if restrict:
        p *= 1.3
    if r.get("background_required"):
        p *= 1.5
    if r.get("fields_required"):
        p *= 1.3
    effort = {"essay", "video", "portfolio", "project", "interview"} & set(r.get("application_materials") or [])
    p *= 1 + 0.15 * len(effort)  # effort scares applicants away
    if "no_essay" in (r.get("selection_basis") or []):
        p *= 0.2  # sweepstakes: huge pools
    if r.get("vehicle") in ("grant", "tuition_waiver", "fee_waiver", "work_study") and r.get("need_based"):
        p = max(p, 0.6)  # entitlement-style aid: meet criteria and file = funded
    return max(0.001, min(p, 0.9))


def award_value(r):
    v = max(r.get("amount_max") or 0, r.get("amount_min") or 0, r.get("program_value_usd") or 0)
    if r.get("renewable") and r.get("amount_max"):
        v = max(v, r["amount_max"] * 4 if v == r["amount_max"] else v)
    return v


def priority(r, p, ring, fit, review):
    value = award_value(r)
    winp = win_probability(r, ring)
    ev = value * winp
    s = 0.0
    s += 30 * min(1.0, fit * 2.5)                                   # profile fit (RAG similarity + attributes)
    s += 20 * min(1.0, math.log10(value + 1) / 5) if value else 4   # size of award
    s += 20 * min(1.0, math.log10(ev + 1) / 4)                      # expected value = predictive odds x size
    d, est = next_deadline(r)
    if d:
        days = (d - TODAY).days
        s += 10 if 7 <= days <= 90 else 6 if days > 90 else 3      # urgency window
    s += 8 if r.get("unclaimed_signal") else 0                      # money that often goes unused
    s += 7 if r.get("vehicle") in ("scholarship", "grant", "microgrant", "tuition_waiver") else 4
    s += 5 if parse_date(r.get("last_verified")) else 0
    s -= 3 * len([x for x in review if x.startswith("status wording")])
    return round(max(0, min(100, s)), 1), round(winp, 4), round(ev)


def attribute_fit(r, p):
    bonus = 0.0
    majors = {m.lower() for m in p.get("intended_majors", [])}
    if _fuzzy_overlap({f.lower() for f in r.get("fields_of_study") or []}, majors):
        bonus += 0.15
    bg = {b.lower() for b in p.get("background", []) + p.get("heritage", [])}
    if {b.lower() for b in r.get("background_focus") or []} & bg:
        bonus += 0.15
    acts = {a.lower() for a in p.get("interests_activities", [])}
    if _fuzzy_overlap({i.lower() for i in r.get("interests") or []}, acts):
        bonus += 0.1
    return bonus


def why_match(r, p, ring):
    bits = [RING_NAME[ring].replace("Your ", "").replace("your ", "")]
    majors = {m.lower() for m in p.get("intended_majors", [])}
    f = [x for x in r.get("fields_of_study") or [] if _fuzzy_overlap({x.lower()}, majors)]
    if f:
        bits.append("major: " + ", ".join(f[:2]))
    acts = {a.lower() for a in p.get("interests_activities", [])}
    i = [x for x in r.get("interests") or [] if _fuzzy_overlap({x.lower()}, acts)]
    if i:
        bits.append("fits your " + ", ".join(i[:2]))
    if "ANY" in (r.get("status_rules") or []):
        bits.append("open to all statuses")
    elif "status_friendly" in " ".join(r.get("status_rules") or []):
        bits.append("status-friendly")
    if r.get("unclaimed_signal"):
        bits.append("often under-claimed")
    return "; ".join(bits)


# ---------------------------------------------------------------------------
# 7. "Connect the dots" insight engine
# ---------------------------------------------------------------------------
ESSAY_THEMES = {
    "Leadership & initiative": ["leader", "leadership", "initiative", "founded", "started"],
    "Overcoming adversity": ["adversity", "challenge", "obstacle", "hardship", "overcome", "resilien"],
    "Community impact & service": ["community", "service", "volunteer", "impact"],
    "Career goals & major": ["career", "goal", "major", "future", "aspir"],
    "Identity & heritage": ["identity", "heritage", "culture", "background", "immigrant"],
    "Innovation & entrepreneurship": ["innovat", "entrepreneur", "startup", "venture", "build", "invent"],
    "Research & STEM project": ["research", "science", "project", "experiment", "engineering"],
    "Creative portfolio": ["portfolio", "art", "writing", "music", "film", "creative"],
}


def essay_clusters(items):
    clusters = defaultdict(list)
    for it in items:
        r = it["rec"]
        if not ({"essay", "video", "portfolio"} & set(r.get("application_materials") or [])):
            continue
        text = (r.get("essay_prompts") or "") + " " + (r.get("description") or "")
        tl = text.lower()
        best = None
        for theme, kws in ESSAY_THEMES.items():
            hits = sum(tl.count(k) for k in kws)
            if hits and (best is None or hits > best[1]):
                best = (theme, hits)
        clusters[best[0] if best else "General personal statement"].append(r["name"])
    return dict(sorted(clusters.items(), key=lambda kv: -len(kv[1])))


def unclaimed_checklist(p, toks):
    cc = (p.get("location", {}).get("country") or "US").upper()
    st = p.get("location", {}).get("state", "your state")
    county = p.get("location", {}).get("county", "your county")
    out = []
    if cc == "US":
        if f"US:fafsa_eligible" in toks:
            out.append("File the FAFSA as soon as it opens (Oct 1 most years). NCAN estimates ~$3.6B in Pell "
                       "Grants went unclaimed by the class of 2022 because eligible students never filed. "
                       "The FAFSA also unlocks state grants, FSEOG, work-study and most college need aid.")
        elif "US:status_friendly" in toks or "US:noncitizen" in toks:
            out.append(f"You can't use federal aid, but check {st}'s state aid application for students who "
                       "can't file the FAFSA (e.g. Illinois Alternative Application under the RISE Act, "
                       "California Dream Act Application). Rules changed in several states in 2025 - re-check.")
        out.append("Complete the CSS Profile only for colleges that require it; many waive the fee for "
                   "low-income students.")
        out.append("Ask for SAT/ACT/AP and college-application fee waivers (College Board, ACT, Common App, "
                   "NACAC) - these are money you keep.")
        out.append(f"Search the {county} County community foundation's common scholarship application: one "
                   "form often enters you into dozens of small local awards that get few applicants.")
        out.append("Ask your school counselor for the local scholarship bulletin (Rotary, Lions, Kiwanis, "
                   "Elks lodges, PTA, credit unions, local businesses). Many award money every year with "
                   "fewer than 10 applicants.")
    if p.get("parent_employers"):
        out.append("Check parent employer(s) for dependent scholarships or tuition benefits: "
                   + ", ".join(p["parent_employers"]) + ". Also check any labor union memberships.")
    for h in p.get("heritage", []):
        out.append(f"{h} community associations, temples/churches and cultural societies often run "
                   "scholarships advertised only inside the community.")
    for c in heritage_countries(p):
        out.append(f"Government of {country_name(c)} diaspora programs (ministry of external/overseas affairs, embassy "
                   "education desks) sometimes fund citizens or diaspora students abroad.")
    out.append("After admission, ask each college's aid office for an appeal / special-circumstances review "
               "and about named endowed scholarships that need a separate short application.")
    return out


def lateral_angles(p):
    """Divergent 'connect the dots' angles - high-temperature brainstorming, made explicit."""
    loc = p.get("location", {})
    st, city, county = loc.get("state", ""), loc.get("city", ""), loc.get("county", "")
    majors = p.get("intended_majors", []) or ["undeclared"]
    acts = p.get("interests_activities", [])
    ideas = []
    for m in majors:
        ideas.append(f"{st} professional association for {m} (state chapters fund students heading into the field)")
        ideas.append(f"Companies headquartered in {city or st} that hire {m} grads - their foundations sponsor local students")
    for a in acts:
        ideas.append(f"{a} + {st}: state-level {a} competitions and youth grants (smaller pools than national)")
        ideas.append(f"{a} + your heritage/identity: niche awards where both overlap")
    for h in p.get("heritage", []):
        ideas.append(f"{h} + {majors[0]}: heritage professional societies (e.g. engineers/doctors associations)")
        ideas.append(f"{h} business owners in {city or county}: chambers of commerce run scholarships")
    for b in p.get("background", []):
        ideas.append(f"{b.replace('_', ' ')} + {st}: state-specific circumstance awards")
    ideas.append(f"Utilities, hospitals, banks and credit unions serving {county or city} (customer-family scholarships)")
    ideas.append(f"{st} legislators' scholarship / tuition-waiver programs and state treasurer 529 contests")
    ideas.append("Funded summer research at nearby universities (stipend + recommendation letters that win later awards)")
    ideas.append("Microgrants for a project you already run - often < 20 applicants per round")
    return ideas


# ---------------------------------------------------------------------------
# 8. Search plan for Claude (convergent + divergent queries)
# ---------------------------------------------------------------------------
def search_plan(p):
    loc = p.get("location", {})
    city, county, metro = loc.get("city", ""), loc.get("county", ""), loc.get("metro", "")
    st, cc, cont = loc.get("state", ""), loc.get("country", "US"), loc.get("continent", "")
    grade = p.get("grade", "")
    lvl = "high school" if str(grade).isdigit() else "college"
    majors = p.get("intended_majors", [])
    acts = p.get("interests_activities", [])
    status = p.get("residence_status", "")
    plan = defaultdict(list)
    for place, ring in ((f"{city} {st}", 1), (f"{county} County {st}", 1), (metro, 2), (st, 3)):
        if not place.strip():
            continue
        plan[ring] += [f"{place} community foundation scholarships {lvl} students",
                       f"{place} scholarships {lvl} {TODAY.year}-{TODAY.year + 1}",
                       f"{place} Rotary OR Lions OR Kiwanis OR Elks scholarship",
                       f"{place} youth grant OR microgrant student project",
                       f"{place} paid internship {lvl} students"]
        for m in majors[:2]:
            plan[ring].append(f"{place} {m} scholarship")
        for a in acts[:3]:
            plan[ring].append(f"{place} {a} competition OR fellowship students")
    plan[3] += [f"{st} state grant program student aid agency", f"{st} tuition waiver programs",
                f"{st} youth entrepreneurship competition {TODAY.year + 1}"]
    plan[4] += [f"national scholarships {lvl} {TODAY.year + 1} deadline", "fully funded summer program high school",
                "student founder fellowship OR accelerator teen", "paid research internship high school students"]
    for m in majors:
        plan[4].append(f"{m} national scholarship {lvl}")
    if status in ("daca", "tps", "undocumented"):
        plan[4] += ["scholarships open to undocumented and DACA students", "TheDream.US Golden Door Scholars partners",
                    f"{st} Dream Act state aid undocumented"]
    if status in ("h4", "l2", "other_dependent", "f1", "j1", "pending_ac"):
        plan[4] += ["scholarships regardless of citizenship status high school",
                    "scholarships open to H-4 dependent visa students", "merit scholarships no citizenship requirement",
                    "colleges that give merit aid to international and visa-holder students"]
    for c in heritage_countries(p):
        n = country_name(c).replace("the ", "")
        plan[5] += [f"Government of {n} scholarship for diaspora / overseas citizen students",
                    f"{n} ministry scholarship students studying abroad", f"{n} heritage association scholarship {cc}"]
    for h in p.get("heritage", []):
        plan[5].append(f"{h} association scholarship {cc}")
    if cont:
        plan[6] += [f"{cont} youth innovation prize", f"{cont} student fellowship open to all nationalities"]
    plan[7] += ["global youth fellowship ages 15-18 fully funded", "international high school competition scholarship prize",
                "open worldwide student entrepreneur grant", "emergent ventures OR rise global OR breakthrough junior challenge"]
    divergent = lateral_angles(p)
    return {"rings": {RING_NAME[k]: v for k, v in sorted(plan.items())}, "divergent_angles": divergent}


# ---------------------------------------------------------------------------
# 9. Build pipeline
# ---------------------------------------------------------------------------
def load_json(path, default):
    if path and os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return default


def merge_library(library, new):
    """Add or refresh records. Keeps the newest verified copy; records eligibility drift."""
    idx = {rec_key(r): i for i, r in enumerate(library)}
    added = updated = 0
    for r in new:
        r = norm_record(r)
        k = rec_key(r)
        if k in idx:
            old = library[idx[k]]
            if (old.get("citizenship_text") or "") != (r.get("citizenship_text") or "") and r.get("citizenship_text"):
                r.setdefault("flags", []).append("eligibility wording changed since last scrape")
            if (parse_date(r.get("last_verified")) or dt.date.min) >= (parse_date(old.get("last_verified")) or dt.date.min):
                library[idx[k]] = {**old, **{k2: v for k2, v in r.items() if v not in (None, "", [], 0)}}
                updated += 1
        else:
            idx[k] = len(library)
            library.append(r)
            added += 1
    return added, updated


def rank(profile, records, strict=False):
    toks = profile_tokens(profile)
    recs = [norm_record(r) for r in records]
    seen, uniq = set(), []
    for r in recs:
        k = rec_key(r)
        if k not in seen:
            seen.add(k)
            uniq.append(r)
    tfidf = TfIdf([record_text(r) for r in uniq])
    sims = tfidf.score(profile_text(profile))
    kept, dropped = [], Counter()
    for r, sim in zip(uniq, sims):
        ok, why, review, ring = check_eligibility(r, profile, toks, strict)
        if not ok:
            for w in why:
                dropped[w] += 1
            continue
        fit = sim + attribute_fit(r, profile)
        score, winp, ev = priority(r, profile, ring, fit, review)
        d, est = next_deadline(r)
        kept.append({"rec": r, "ring": ring, "score": score, "win_prob": winp, "expected_value": ev,
                     "deadline": d.isoformat() if d else "", "deadline_estimated": est,
                     "review": review, "why": why_match(r, profile, ring)})
    kept.sort(key=lambda x: (x["ring"], -x["score"]))
    return kept, dropped


def pick(kept, lo, hi):
    """Keep sort-by-ring order but make sure the strongest records survive the cap."""
    if len(kept) <= hi:
        return kept
    best = sorted(kept, key=lambda x: -x["score"])[:hi]
    keep_ids = {id(x) for x in best}
    return [x for x in kept if id(x) in keep_ids]


def build(args):
    profile = load_json(args.profile, None)
    if not profile:
        sys.exit("profile not found")
    found = load_json(args.records, [])
    library = load_json(args.library, []) if args.library else []
    added, updated = merge_library(library, found)
    if args.library:
        with open(args.library, "w") as f:
            json.dump(library, f, indent=1, default=str)
    pool = library if args.library else [norm_record(r) for r in found]
    kept, dropped = rank(profile, pool, args.strict)
    lo, hi = int(profile.get("min_results", 75)), int(profile.get("max_results", 100))
    final = pick(kept, lo, hi)
    os.makedirs(args.out_dir, exist_ok=True)
    slug = re.sub(r"[^a-z0-9]+", "-", (profile.get("name") or "student").lower()).strip("-")
    base = os.path.join(args.out_dir, f"grantscout-{slug}-{TODAY.isoformat()}")
    ring_counts = Counter(x["ring"] for x in final)
    report = {
        "generated": TODAY.isoformat(), "count": len(final), "target": [lo, hi],
        "ring_counts": {RING_NAME[k]: v for k, v in sorted(ring_counts.items())},
        "dropped_reasons": dict(dropped), "library_added": added, "library_updated": updated,
        "thin_rings": [RING_NAME[r] for r, _ in RINGS
                       if ring_counts.get(r, 0) < 5 and (r != 5 or heritage_countries(profile))],
        "needs_review": sum(1 for x in final if x["review"]),
    }
    with open(base + ".json", "w") as f:
        json.dump({"report": report, "results": [{**x, "rec": x["rec"]} for x in final]}, f, indent=1, default=str)
    write_csv(base + ".csv", final)
    insights = {
        "top": sorted(final, key=lambda x: -x["score"])[:15],
        "essays": essay_clusters(final),
        "unclaimed": unclaimed_checklist(profile, profile_tokens(profile)),
        "lateral": lateral_angles(profile),
        "calendar": deadline_calendar(final),
        "total_value": sum(award_value(x["rec"]) for x in final),
        "total_ev": sum(x["expected_value"] for x in final),
    }
    write_pdf(base + ".pdf", profile, final, insights, report)
    report["pdf"] = base + ".pdf"
    print(json.dumps(report, indent=1))
    if len(final) < lo:
        print(f"\nONLY {len(final)} ELIGIBLE RESULTS (< {lo}). Keep researching - start with these thin rings: "
              + ", ".join(report["thin_rings"]), file=sys.stderr)
        sys.exit(3)


def deadline_calendar(final):
    cal = defaultdict(list)
    for x in final:
        if x["deadline"]:
            d = dt.date.fromisoformat(x["deadline"])
            cal[d.strftime("%Y-%m")].append((d.isoformat(), x["rec"]["name"], x["deadline_estimated"]))
    return {k: sorted(v) for k, v in sorted(cal.items())}


def write_csv(path, final):
    cols = ["ring", "score", "name", "sponsor", "vehicle", "amount", "deadline", "deadline_estimated",
            "win_prob", "expected_value", "why", "review", "source_url"]
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(cols)
        for x in final:
            r = x["rec"]
            w.writerow([RING_NAME[x["ring"]], x["score"], r["name"], r["sponsor"], r["vehicle"], money(r),
                        x["deadline"], x["deadline_estimated"], x["win_prob"], x["expected_value"], x["why"],
                        " | ".join(x["review"]), r["source_url"]])


def money(r):
    if r.get("amount_text"):
        return r["amount_text"]
    lo, hi, pv = r.get("amount_min") or 0, r.get("amount_max") or 0, r.get("program_value_usd") or 0
    if hi and lo and hi != lo:
        return f"${lo:,.0f}-${hi:,.0f}"
    if hi or lo:
        return f"${max(hi, lo):,.0f}"
    if pv:
        return f"Fully funded (~${pv:,.0f} value)"
    return "Varies"


# ---------------------------------------------------------------------------
# 10. PDF (shareable: never prints status, income or background)
# ---------------------------------------------------------------------------
def write_pdf(path, profile, final, ins, report):
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter, landscape
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                        PageBreak)
    except ImportError:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "reportlab"])
        return write_pdf(path, profile, final, ins, report)
    from xml.sax.saxutils import escape as esc

    ink, accent, soft = colors.HexColor("#1d2433"), colors.HexColor("#2f6f5e"), colors.HexColor("#eef4f1")
    ss = getSampleStyleSheet()
    H1 = ParagraphStyle("H1", parent=ss["Title"], textColor=ink, fontSize=24, leading=28, alignment=0)
    H2 = ParagraphStyle("H2", parent=ss["Heading2"], textColor=accent, fontSize=15, spaceBefore=10)
    H3 = ParagraphStyle("H3", parent=ss["Heading3"], textColor=ink, fontSize=11.5)
    B = ParagraphStyle("B", parent=ss["BodyText"], fontSize=9.5, leading=12.5, textColor=ink)
    S = ParagraphStyle("S", parent=B, fontSize=7.6, leading=9.4)
    SB = ParagraphStyle("SB", parent=S, fontName="Helvetica-Bold")

    doc = SimpleDocTemplate(path, pagesize=landscape(letter), leftMargin=0.5 * inch, rightMargin=0.5 * inch,
                            topMargin=0.5 * inch, bottomMargin=0.5 * inch,
                            title="GrantScout funding list", author="GrantScout")
    loc = profile.get("location", {})
    who = profile.get("name") or "Student"
    story = [Paragraph(f"Funding opportunities for {esc(who)}", H1),
             Paragraph(f"{esc(loc.get('city', ''))}, {esc(loc.get('state', ''))} &middot; grade "
                       f"{esc(str(profile.get('grade', '')))} &middot; generated {TODAY:%B %d, %Y}", B),
             Spacer(1, 8)]
    stats = [["Opportunities", "Listed value (approx.)", "Expected value*", "Need a closer look"],
             [str(len(final)), f"${ins['total_value']:,.0f}", f"${ins['total_ev']:,.0f}", str(report["needs_review"])]]
    t = Table(stats, colWidths=[2.4 * inch] * 4)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), accent), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                           ("FONTSIZE", (0, 1), (-1, 1), 16), ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                           ("BOTTOMPADDING", (0, 1), (-1, 1), 8), ("BOX", (0, 0), (-1, -1), 0.5, accent)]))
    story += [t, Spacer(1, 6),
              Paragraph("*Expected value = award size x an estimated chance of winning. Smaller, local and "
                        "narrowly-targeted awards score higher odds. It is an estimate for prioritising, not a promise. "
                        "Every listing was filtered to awards this student appears eligible for; eligibility details "
                        "used for filtering are kept private and are not printed here. Always confirm on the sponsor's "
                        "page before applying. Legit awards never charge a fee or ask for bank/SSN details.", S),
              Spacer(1, 8)]

    story.append(Paragraph("Start here: top 15 by priority", H2))
    rows = [[Paragraph(h, SB) for h in ("#", "Opportunity", "Amount", "Deadline", "Where", "Why it fits")]]
    for i, x in enumerate(ins["top"], 1):
        r = x["rec"]
        rows.append([Paragraph(str(i), S), link_para(r, SB, esc), Paragraph(esc(money(r)), S),
                     Paragraph(esc(fmt_deadline(x)), S), Paragraph(esc(RING_NAME[x["ring"]]), S),
                     Paragraph(esc(x["why"]), S)])
    story.append(styled_table(rows, [0.3, 3.0, 1.3, 1.1, 1.7, 2.6], inch, colors, TableStyle, soft, accent, Table))

    story.append(PageBreak())
    story.append(Paragraph("Free money people leave on the table", H2))
    for line in ins["unclaimed"]:
        story.append(Paragraph("&bull; " + esc(line), B))
    story.append(Paragraph("Write once, apply many: essay reuse plan", H2))
    for theme, names in list(ins["essays"].items())[:8]:
        story.append(Paragraph(f"<b>{esc(theme)}</b> ({len(names)}): " + esc(", ".join(names[:8]))
                               + (" ..." if len(names) > 8 else ""), B))
    story.append(Paragraph("Connecting the dots: angles worth a second search", H2))
    for line in ins["lateral"][:12]:
        story.append(Paragraph("&bull; " + esc(line), B))

    story.append(PageBreak())
    story.append(Paragraph("Deadline calendar", H2))
    for month, items in ins["calendar"].items():
        label = dt.date.fromisoformat(month + "-01").strftime("%B %Y")
        body = "; ".join(f"{d[8:]} {esc(n)}{' (est.)' if e else ''}" for d, n, e in items)
        story.append(Paragraph(f"<b>{label}</b>: {body}", B))

    groups = defaultdict(list)
    for x in final:
        groups[x["ring"]].append(x)
    num = 0
    for ring in sorted(groups):
        story.append(PageBreak())
        story.append(Paragraph(f"{RING_NAME[ring]} ({len(groups[ring])})", H2))
        block = [[Paragraph(h, SB) for h in
                  ("#", "Opportunity / sponsor", "Type", "Amount", "Deadline", "Score", "Why it fits / notes")]]
        for x in groups[ring]:
            num += 1
            r = x["rec"]
            notes = esc(x["why"])
            if x["review"]:
                notes += "<br/><font color='#9a5b00'>Check: " + esc("; ".join(x["review"][:2])) + "</font>"
            host = f"<br/><font color='#555555'>{esc(r['host_location'])}</font>" if r.get("host_location") else ""
            block.append([Paragraph(str(num), S),
                          Paragraph(link_markup(r, esc) + f"<br/>{esc(r.get('sponsor') or '')}{host}", S),
                          Paragraph(esc(r["vehicle"].replace("_", " ")), S), Paragraph(esc(money(r)), S),
                          Paragraph(esc(fmt_deadline(x)), S), Paragraph(f"{x['score']:.0f}", S), Paragraph(notes, S)])
        story.append(styled_table(block, [0.3, 3.0, 0.9, 1.2, 1.0, 0.5, 3.1], inch, colors, TableStyle,
                                  soft, accent, Table))

    story.append(PageBreak())
    story.append(Paragraph("How to use this list", H2))
    for line in [
        "Work top-down inside each section: local awards have the smallest applicant pools.",
        "Put every deadline in a calendar the day you read this. Start essays 3 weeks before.",
        "Reuse essays across the clusters above; tailor the first and last paragraph for each sponsor.",
        "Report outside scholarships to your college: some colleges reduce their own aid - ask how they treat it.",
        "Prize money and stipends can be taxable; keep award letters.",
        "Share this PDF freely - it contains no private eligibility details.",
    ]:
        story.append(Paragraph("&bull; " + line, B))
    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)


def _footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7)
    canvas.setFillGray(0.45)
    canvas.drawString(36, 20, f"GrantScout - community-built funding finder - verify every listing on the sponsor's site "
                              f"- page {doc.page}")
    canvas.restoreState()


def link_markup(r, esc):
    name = esc(r.get("name") or "")
    url = r.get("source_url") or ""
    if url.startswith("http"):
        return f"<link href='{esc(url)}' color='#2f6f5e'><b>{name}</b></link>"
    return f"<b>{name}</b>"


def link_para(r, style, esc):
    from reportlab.platypus import Paragraph
    return Paragraph(link_markup(r, esc), style)


def fmt_deadline(x):
    if not x["deadline"]:
        return "Rolling / see site"
    d = dt.date.fromisoformat(x["deadline"])
    return d.strftime("%b %d, %Y") + (" (est.)" if x["deadline_estimated"] else "")


def styled_table(rows, widths, inch, colors, TableStyle, soft, accent, Table):
    t = Table(rows, colWidths=[w * inch for w in widths], repeatRows=1)
    style = [("BACKGROUND", (0, 0), (-1, 0), soft), ("LINEBELOW", (0, 0), (-1, 0), 0.8, accent),
             ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 1), (-1, -1), 0.25, colors.HexColor("#d5dbe0")),
             ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]
    t.setStyle(TableStyle(style))
    return t


# ---------------------------------------------------------------------------
# 11. Seed library (leads only: Claude must verify each on the sponsor page)
# ---------------------------------------------------------------------------
US_FED = ["US:fafsa_eligible"]
US_CPR = ["US:citizen", "US:pr"]
US_ALL = ["US:resident_any"]
STATUS_FRIENDLY = ["US:daca", "US:tps", "US:undocumented"]


def lead(name, sponsor, url, vehicle, **kw):
    r = {"name": name, "sponsor": sponsor, "source_url": url, "vehicle": vehicle, "seed": True,
         "description": kw.pop("desc", "")}
    r.update(kw)
    return r


SEEDS = [
    # --- Federal / entitlement aid (US) ---
    lead("Federal Pell Grant", "U.S. Department of Education", "https://studentaid.gov/understand-aid/types/grants/pell",
      "grant", amount_text="Up to ~$7,395/yr (check current max)", amount_max=7395, renewable=True, need_based=True,
      status_rules=US_FED, grade_levels=["12", "college"], deadline_typical="06-30", sponsor_type="federal",
      unclaimed_signal=True, selection_basis=["need"], citizenship_text="U.S. citizen or eligible noncitizen",
      desc="Need-based federal grant unlocked by filing the FAFSA. Billions go unclaimed each year."),
    lead("Federal Supplemental Educational Opportunity Grant (FSEOG)", "U.S. Department of Education",
      "https://studentaid.gov/understand-aid/types/grants/fseog", "grant", amount_text="$100-$4,000/yr",
      amount_min=100, amount_max=4000, need_based=True, status_rules=US_FED, grade_levels=["12", "college"],
      unclaimed_signal=True, sponsor_type="federal", selection_basis=["need"],
      desc="Campus-based need grant; funds run out early - file FAFSA as early as possible."),
    lead("Federal Work-Study", "U.S. Department of Education", "https://studentaid.gov/understand-aid/types/work-study",
      "work_study", amount_text="Varies (part-time earnings)", need_based=True, status_rules=US_FED,
      grade_levels=["12", "college"], unclaimed_signal=True, sponsor_type="federal", selection_basis=["need"]),
    # --- National US scholarships ---
    lead("Coca-Cola Scholars Program", "Coca-Cola Scholars Foundation", "https://www.coca-colascholarsfoundation.org/apply/",
      "scholarship", amount_max=20000, number_of_awards=150, grade_levels=["12"], deadline_typical="09-30",
      status_rules=["US:citizen", "US:pr", "US:eligible_noncitizen"], selection_basis=["leadership", "service"],
      application_materials=["essay", "transcript"], interests=["leadership", "community service"],
      desc="Leadership and service scholarship for high school seniors."),
    lead("The Gates Scholarship", "Gates Foundation", "https://www.thegatesscholarship.org/", "scholarship",
      amount_text="Full cost of attendance (last-dollar)", program_value_usd=60000, number_of_awards=300,
      grade_levels=["12"], deadline_typical="09-15", status_rules=US_CPR + ["US:national"], need_based=True,
      background_focus=["Black", "Hispanic", "Asian American", "Pacific Islander", "Native American"],
      background_required=True, selection_basis=["need", "merit", "leadership"],
      application_materials=["essay", "transcript", "recommendation"],
      desc="Pell-eligible minority seniors. Background rules are a changing legal area - re-verify."),
    lead("QuestBridge National College Match", "QuestBridge", "https://www.questbridge.org/", "scholarship",
      amount_text="Full four-year scholarship at partner colleges", program_value_usd=300000, grade_levels=["12"],
      deadline_typical="09-26", status_rules=US_ALL, need_based=True, selection_basis=["need", "merit"],
      application_materials=["essay", "transcript", "recommendation"], unclaimed_signal=False,
      citizenship_text="Open to students attending high school in the U.S. regardless of citizenship (verify)",
      desc="Full-ride match for high-achieving low-income seniors."),
    lead("QuestBridge College Prep Scholars", "QuestBridge", "https://www.questbridge.org/high-school-students/college-prep-scholars",
      "free_program", program_value_usd=3000, grade_levels=["11"], deadline_typical="03-25", status_rules=US_ALL,
      need_based=True, selection_basis=["need", "merit"], application_materials=["essay", "transcript"],
      desc="Juniors: summer programs, college prep and a head start on National College Match."),
    lead("Jack Kent Cooke College Scholarship", "Jack Kent Cooke Foundation",
      "https://www.jkcf.org/our-scholarships/college-scholarship-program/", "scholarship",
      amount_text="Up to $55,000/yr", amount_max=55000, renewable=True, grade_levels=["12"], deadline_typical="11-13",
      need_based=True, selection_basis=["need", "merit"], application_materials=["essay", "transcript", "recommendation"],
      desc="High-achieving seniors with financial need."),
    lead("Horatio Alger National Scholarship", "Horatio Alger Association", "https://scholars.horatioalger.org/",
      "scholarship", amount_max=25000, number_of_awards=100, grade_levels=["12"], deadline_typical="10-25",
      status_rules=["US:citizen"], need_based=True, selection_basis=["need", "essay"],
      application_materials=["essay"], desc="Students who have overcome adversity; strong financial need."),
    lead("Elks Most Valuable Student Scholarship", "Elks National Foundation", "https://www.elks.org/scholars/scholarships/mvs.cfm",
      "scholarship", amount_text="$1,000-$12,500/yr", amount_min=4000, amount_max=50000, number_of_awards=500,
      grade_levels=["12"], deadline_typical="11-12", status_rules=["US:citizen"], selection_basis=["merit", "need", "leadership"],
      application_materials=["essay", "transcript"], desc="Seniors; scholarship, leadership and need."),
    lead("Ron Brown Scholar Program", "CAP Charitable Foundation", "https://www.ronbrown.org/", "scholarship",
      amount_max=40000, grade_levels=["12"], deadline_typical="01-09", status_rules=US_CPR,
      background_focus=["Black"], background_required=True, selection_basis=["leadership", "service", "essay"],
      application_materials=["essay", "recommendation"], desc="Black/African American seniors; leadership and service."),
    lead("Hispanic Scholarship Fund", "Hispanic Scholarship Fund", "https://www.hsf.net/scholarship", "scholarship",
      amount_text="$500-$5,000", amount_min=500, amount_max=5000, grade_levels=["12", "college"],
      deadline_typical="02-15", status_rules=["US:citizen", "US:pr", "US:eligible_noncitizen", "US:daca"],
      background_focus=["Hispanic", "Latino"], background_required=True, gpa_min=3.0, selection_basis=["merit", "need"],
      desc="Students of Hispanic heritage; DACA eligible per sponsor (verify)."),
    lead("TheDream.US National Scholarship", "TheDream.US", "https://www.thedream.us/scholarships/national-scholarship/",
      "scholarship", amount_text="Up to $33,000 for a bachelor's", amount_max=33000, grade_levels=["12", "college"],
      deadline_typical="02-28", status_rules=STATUS_FRIENDLY, selection_basis=["need", "merit"],
      unclaimed_signal=True, desc="DACA/TPS/undocumented students at partner colleges."),
    lead("Golden Door Scholars", "Golden Door Scholars", "https://www.goldendoorscholars.org/", "scholarship",
      amount_text="Full tuition, room and board at partner colleges", program_value_usd=200000, grade_levels=["12"],
      deadline_typical="10-24", status_rules=STATUS_FRIENDLY, selection_basis=["merit", "need"],
      application_materials=["essay"], desc="Full scholarships for DACA/TPS/undocumented students."),
    lead("APIA Scholars", "APIA Scholars", "https://apiascholars.org/", "scholarship", amount_min=2500, amount_max=20000,
      grade_levels=["12", "college"], deadline_typical="01-15",
      status_rules=["US:citizen", "US:pr", "US:eligible_noncitizen", "US:daca", "US:tps", "US:undocumented"],
      background_focus=["Asian American", "Pacific Islander", "Indian", "South Asian"], background_required=True,
      need_based=True, selection_basis=["need", "essay"], application_materials=["essay"],
      desc="Asian and Pacific Islander American students; historically status-inclusive (verify)."),
    lead("Burger King Scholars", "Burger King Foundation", "https://burgerkingfoundation.org/programs/burger-king-scholars",
      "scholarship", amount_min=1000, amount_max=60000, grade_levels=["12", "college"], deadline_typical="12-15",
      status_rules=US_ALL, selection_basis=["merit", "service", "need"], number_of_awards=1000,
      desc="High school seniors and students in the U.S., Canada and Puerto Rico (verify status wording)."),
    lead("National Merit Scholarship Program", "National Merit Scholarship Corporation", "https://www.nationalmerit.org/",
      "scholarship", amount_text="$2,500 + corporate/college awards", amount_max=2500, grade_levels=["11"],
      deadline_typical="10-15", status_rules=US_CPR, selection_basis=["test_score"], number_of_awards=7000,
      desc="Enter by taking the PSAT/NMSQT in grade 11."),
    lead("United States Senate Youth Program", "Hearst Foundations", "https://ussenateyouth.org/", "scholarship",
      amount_max=10000, number_of_awards=104, grade_levels=["11", "12"], status_rules=US_CPR,
      selection_basis=["leadership"], interests=["student government", "debate", "civics"],
      desc="$10,000 scholarship + Washington week for student government leaders; selected through your state."),
    lead("Amazon Future Engineer Scholarship", "Amazon", "https://www.amazonfutureengineer.com/scholarships",
      "scholarship", amount_text="$40,000 + paid internship", amount_max=40000, grade_levels=["12"],
      deadline_typical="12-15", fields_of_study=["computer science", "software engineering"], fields_required=True,
      need_based=True, selection_basis=["need", "merit"], interests=["coding", "robotics"],
      desc="Seniors planning to study computer science; need-based (verify status wording)."),
    lead("Dell Scholars Program", "Michael & Susan Dell Foundation", "https://www.dellscholars.org/", "scholarship",
      amount_max=20000, grade_levels=["12"], deadline_typical="12-01", need_based=True, gpa_min=2.4,
      selection_basis=["need", "grit"], desc="Pell-eligible seniors in approved college-readiness programs."),
    lead("Cameron Impact Scholarship", "Bryan Cameron Education Foundation",
      "https://www.bryancameroneducationfoundation.org/", "scholarship", amount_text="Full tuition, 4 years",
      program_value_usd=200000, grade_levels=["12"], deadline_typical="09-15", status_rules=US_CPR, gpa_min=3.7,
      selection_basis=["merit", "leadership", "service"], desc="Merit scholarship for service and leadership."),
    lead("Coolidge Scholarship", "Calvin Coolidge Presidential Foundation", "https://coolidgescholars.org/",
      "scholarship", amount_text="Full tuition, room, board", program_value_usd=250000, grade_levels=["11"],
      deadline_typical="12-04", selection_basis=["merit", "essay"], application_materials=["essay"],
      interests=["history", "public policy", "civics"], desc="Juniors with interest in public service (verify status rules)."),
    lead("Prudential Emerging Visionaries", "Prudential Financial",
      "https://www.prudential.com/emergingvisionaries", "prize", amount_min=5000, amount_max=15000, age_min=14, age_max=18,
      deadline_typical="11-15", selection_basis=["project", "service"], interests=["financial literacy", "community service", "startup"],
      application_materials=["essay"], desc="Young people solving financial or societal challenges in their communities."),
    # --- STEM / research / competitions ---
    lead("Regeneron Science Talent Search", "Society for Science", "https://www.societyforscience.org/regeneron-sts/",
      "competition", amount_text="Up to $250,000", amount_max=250000, number_of_awards=300, grade_levels=["12"],
      deadline_typical="11-12", status_rules=["US:resident_any", "US:citizen"], selection_basis=["project"],
      application_materials=["project", "essay"], interests=["research", "science", "engineering"],
      fields_of_study=["science", "engineering", "math", "computer science"],
      desc="Original research by seniors in U.S. schools or U.S. citizens abroad."),
    lead("Regeneron International Science & Engineering Fair (ISEF)", "Society for Science",
      "https://www.societyforscience.org/isef/", "competition", amount_text="$9M+ in prizes", amount_max=75000,
      grade_levels=["9", "10", "11", "12"], status_rules=["ANY"], geo={"level": "global"}, selection_basis=["project"],
      application_materials=["project"], interests=["research", "science", "engineering", "robotics"],
      desc="Qualify through an affiliated local/regional fair - start with your county fair."),
    lead("Davidson Fellows Scholarship", "Davidson Institute", "https://www.davidsongifted.org/gifted-programs/fellows-scholarship/",
      "scholarship", amount_text="$10,000-$50,000", amount_min=10000, amount_max=50000, age_max=18,
      deadline_typical="02-12", status_rules=US_CPR, selection_basis=["project"], application_materials=["project", "essay", "video"],
      interests=["research", "science", "music", "literature", "technology"], desc="Significant work by students 18 and under."),
    lead("Research Science Institute (RSI)", "Center for Excellence in Education", "https://www.cee.org/programs/research-science-institute",
      "free_program", program_value_usd=10000, grade_levels=["11"], deadline_typical="12-10", status_rules=["ANY"],
      geo={"level": "global"}, host_location="MIT, Cambridge, MA", selection_basis=["merit", "test_score"],
      application_materials=["essay", "recommendation", "transcript"], interests=["research", "science", "math"],
      desc="Free 6-week summer research program; international students admitted."),
    lead("Summer Science Program (SSP)", "Summer Science Program", "https://summerscience.org/", "free_program",
      program_value_usd=8000, grade_levels=["11"], deadline_typical="02-20", status_rules=["ANY"], geo={"level": "global"},
      need_based=True, selection_basis=["merit"], interests=["science", "astrophysics", "chemistry", "research"],
      desc="Need-based aid up to full cost; open to students worldwide."),
    lead("MIT MITES Summer", "MIT Office of Engineering Outreach", "https://mites.mit.edu/", "free_program",
      program_value_usd=12000, grade_levels=["11"], deadline_typical="02-01", status_rules=US_CPR,
      selection_basis=["merit"], interests=["engineering", "science", "coding"],
      desc="Free residential STEM program for rising seniors."),
    lead("NASA OSTEM High School Internships", "NASA", "https://intern.nasa.gov/", "internship",
      amount_text="Paid internship", program_value_usd=6000, age_min=16, grade_levels=["10", "11", "12", "college"],
      deadline_typical="02-27", status_rules=["US:citizen"], selection_basis=["merit"],
      interests=["engineering", "space", "coding", "research"], citizenship_text="U.S. citizens only",
      desc="Paid NASA internships for students 16+."),
    lead("Bank of America Student Leaders", "Bank of America", "https://about.bankofamerica.com/en/making-an-impact/student-leaders",
      "internship", amount_text="Paid 8-week nonprofit internship + DC summit", program_value_usd=6000,
      grade_levels=["11", "12"], deadline_typical="01-17", status_rules=["US:work_authorized"],
      selection_basis=["leadership", "service"], interests=["community service", "leadership"],
      citizenship_text="Must be legally eligible to work in the U.S.", desc="Paid summer internships in participating markets."),
    lead("Breakthrough Junior Challenge", "Breakthrough Prize Foundation", "https://breakthroughjuniorchallenge.org/",
      "competition", amount_text="$250,000 scholarship + prizes for teacher and school", amount_max=250000,
      age_min=13, age_max=18, deadline_typical="06-25", status_rules=["ANY"], geo={"level": "global"},
      selection_basis=["video"], application_materials=["video"], interests=["science", "math", "physics", "biology"],
      desc="Explain a big science or math idea in a short video. Open worldwide."),
    lead("Conrad Challenge", "Conrad Foundation", "https://www.conradchallenge.org/", "competition",
      amount_text="Scholarships + prizes", amount_max=10000, age_min=13, age_max=18, deadline_typical="11-30",
      status_rules=["ANY"], geo={"level": "global"}, selection_basis=["project", "entrepreneurship"],
      application_materials=["project"], interests=["startup", "innovation", "engineering", "science"],
      desc="Global innovation and entrepreneurship challenge for teams."),
    lead("Diamond Challenge", "University of Delaware Horn Entrepreneurship", "https://diamondchallenge.org/",
      "competition", amount_text="Up to $100,000 in prizes", amount_max=15000, age_min=14, age_max=18,
      deadline_typical="12-01", status_rules=["ANY"], geo={"level": "global"}, selection_basis=["entrepreneurship"],
      application_materials=["project"], interests=["startup", "entrepreneurship", "social impact"],
      desc="Global high school entrepreneurship competition (business and social innovation tracks)."),
    lead("Scholastic Art & Writing Awards", "Alliance for Young Artists & Writers", "https://www.artandwriting.org/",
      "competition", amount_text="Up to $12,500", amount_max=12500, grade_levels=["7", "8", "9", "10", "11", "12"],
      deadline_typical="12-10", status_rules=US_ALL, selection_basis=["talent"], application_materials=["portfolio"],
      interests=["art", "writing", "photography", "film", "poetry"], desc="Regional then national awards; small entry fee waivers available."),
    lead("YoungArts National Arts Competition", "National YoungArts Foundation", "https://youngarts.org/", "prize",
      amount_text="Up to $10,000", amount_max=10000, age_min=15, age_max=18, deadline_typical="10-16",
      selection_basis=["talent"], application_materials=["portfolio"],
      interests=["art", "music", "dance", "theater", "writing", "film", "design"],
      desc="Artists 15-18 / grades 10-12 (verify status wording)."),
    # --- Founder / fellowship / accelerator (incl. names the requester asked for) ---
    lead("Thiel Fellowship", "Thiel Foundation", "https://thielfellowship.org/", "fellowship",
      amount_text="$200,000 over two years", amount_max=200000, age_max=22, status_rules=["ANY"],
      geo={"level": "global"}, cycle="rolling", selection_basis=["entrepreneurship"], interests=["startup", "research", "innovation"],
      desc="For young people who want to build instead of (or before) college."),
    lead("Z Fellows", "Z Fellows", "https://www.zfellows.com/", "fellowship", amount_max=10000, status_rules=["ANY"],
      geo={"level": "global"}, cycle="rolling", selection_basis=["entrepreneurship"], interests=["startup", "coding", "engineering"],
      desc="One-week program + $10K for technical builders of any age, including high schoolers."),
    lead("Emergent Ventures", "Mercatus Center", "https://www.mercatus.org/emergent-ventures", "microgrant",
      amount_text="$1,000-$50,000+", amount_min=1000, amount_max=50000, status_rules=["ANY"], geo={"level": "global"},
      cycle="rolling", selection_basis=["project"], interests=["startup", "research", "writing", "innovation"],
      desc="Fast grants for ambitious individuals of any age, anywhere; short application."),
    lead("Rise (Schmidt Futures & Rhodes Trust)", "Rise", "https://www.risefortheworld.org/", "fellowship",
      amount_text="Lifelong benefits incl. scholarships & funding", program_value_usd=20000, age_min=15, age_max=17,
      deadline_typical="01-21", status_rules=["ANY"], geo={"level": "global"}, selection_basis=["project", "service"],
      application_materials=["project", "video"], interests=["service", "startup", "research"],
      desc="Global program for 15-17 year olds who serve others; open to every nationality."),
    lead("KINN Founder Sprint Studio", "The KINN", "https://www.thekinn.co/", "accelerator",
      amount_text="Accelerator program (check costs/scholarships)", host_location="Venice, CA (Los Angeles)",
      geo={"level": "national", "country": "US"}, interests=["startup", "entrepreneurship"],
      selection_basis=["entrepreneurship"], cycle="rolling",
      desc="Founder sprint at KINN, a Venice-CA founder community. Verify student eligibility, fees and next cohort."),
    lead("Campus 1871 (1871 Chicago student startup weekend)", "1871", "https://1871.com/", "accelerator",
      amount_text="Free weekend + grand prize (historically)", program_value_usd=1000, grade_levels=["college"],
      geo={"level": "metro", "country": "US", "metro": "Chicagoland", "state": "IL"}, host_location="Chicago, IL",
      interests=["startup", "entrepreneurship"], selection_basis=["entrepreneurship"],
      desc="1871's student founder weekend for partner-university students. Last confirmed editions 2014-2018 - "
           "check 1871.com for current student programs before listing."),
    lead("Stanford Venture Fellowship (third-party program)", "Program organiser (verify)",
      "https://opportunitiesforyouth.org/2026/03/16/stanford-venture-fellowship-2026-fully-funded-trip-to-stanford-university/",
      "fellowship", amount_text="Fully funded week (as advertised)", program_value_usd=3000, age_min=14,
      deadline_typical="03-31", geo={"level": "global"}, host_location="Stanford area, CA",
      interests=["startup", "entrepreneurship"], selection_basis=["entrepreneurship"],
      desc="Advertised as a fully funded one-week founder fellowship. Not a Stanford University program - verify organiser "
           "and confirm there are no fees before listing."),
    # --- State examples (template for the 'one scraper per state agency' rule) ---
    lead("Illinois MAP Grant", "Illinois Student Assistance Commission", "https://www.isac.org/students/during-college/types-of-financial-aid/grants/monetary-award-program/",
      "grant", amount_text="Up to ~$8,400/yr (varies)", amount_max=8400, renewable=True, need_based=True,
      geo={"level": "state", "country": "US", "state": "IL"}, grade_levels=["12", "college"],
      status_rules=US_FED + STATUS_FRIENDLY, unclaimed_signal=True, sponsor_type="state",
      citizenship_text="FAFSA filers, or eligible non-FAFSA students via the Alternative Application (RISE Act) - verify",
      desc="Illinois need-based grant; funds are first-come - file early."),
    lead("Illinois AIM HIGH Grant", "Illinois public universities / ISAC", "https://www.isac.org/", "grant",
      amount_text="Varies by university", need_based=True, geo={"level": "state", "country": "US", "state": "IL"},
      grade_levels=["12", "college"], status_rules=US_FED + STATUS_FRIENDLY, sponsor_type="state",
      desc="Merit + need grant at Illinois public universities (verify status rules per campus)."),
    lead("Cal Grant / California Dream Act", "California Student Aid Commission", "https://www.csac.ca.gov/",
      "grant", amount_text="Up to full UC/CSU tuition", amount_max=14000, renewable=True, need_based=True,
      geo={"level": "state", "country": "US", "state": "CA"}, grade_levels=["12", "college"], deadline_typical="04-02",
      status_rules=US_FED + STATUS_FRIENDLY, unclaimed_signal=True, sponsor_type="state",
      desc="California's main grant; undocumented/AB 540 students apply via the CA Dream Act Application."),
    # --- Home-country / diaspora (India examples) ---
    lead("Scholarship Programme for Diaspora Children (SPDC)", "Ministry of External Affairs, Government of India",
      "https://spdcindia.gov.in/", "scholarship", amount_text="Up to US$4,000/yr", amount_max=4000, renewable=True,
      geo={"level": "national", "country": "IN"}, grade_levels=["12", "college"],
      status_rules=["IN:oci", "IN:pio", "IN:citizen_abroad", "IN:nri", "IN:diaspora"], sponsor_type="government",
      unclaimed_signal=True, selection_basis=["merit"], host_location="Undergraduate study in India",
      desc="For children of NRIs/PIOs/OCIs to study undergraduate courses in India."),
    lead("Know India Programme (KIP)", "Ministry of External Affairs, Government of India", "https://kip.gov.in/",
      "free_program", amount_text="Fully hosted 3-week visit", program_value_usd=3000, age_min=21, age_max=35,
      geo={"level": "national", "country": "IN"}, status_rules=["IN:diaspora", "IN:oci", "IN:pio"],
      host_location="India", desc="Diaspora youth orientation programme; travel/hosting covered (verify)."),
    lead("Tata Scholarship at Cornell", "Tata Education and Development Trust / Cornell", "https://admissions.cornell.edu/",
      "scholarship", amount_text="Need-based full aid at Cornell", program_value_usd=80000,
      geo={"level": "national", "country": "IN"}, grade_levels=["12"], status_rules=["IN:citizen"], need_based=True,
      host_location="Cornell University, NY", desc="Indian citizens admitted to Cornell undergrad with financial need."),
]


# ---------------------------------------------------------------------------
# 12. CLI
# ---------------------------------------------------------------------------
PROFILE_TEMPLATE = {
    "name": "First name only (printed on PDF)",
    "grade": "11",
    "age": 16,
    "gpa": 3.8,
    "tests": {"SAT": None, "ACT": None, "PSAT": None},
    "location": {"city": "Naperville", "county": "DuPage", "metro": "Chicagoland", "state": "IL",
                 "country": "US", "continent": "North America"},
    "residence_status": "citizen | national | pr | conditional_pr | refugee | asylee | parolee | t_visa | vawa | "
                        "h4 | l2 | other_dependent | f1 | j1 | daca | tps | undocumented | pending_ac",
    "has_work_authorization": False,
    "citizenships": ["IN"],
    "country_ties": ["IN:oci"],
    "heritage": ["Indian", "Telugu"],
    "background": ["first_gen", "low_income"],
    "intended_majors": ["computer science"],
    "interests_activities": ["robotics", "startup", "debate"],
    "parent_employers": [],
    "affiliations": [],
    "wants": ["scholarship", "grant", "fellowship", "internship", "accelerator", "competition"],
    "goals": "One or two sentences in the student's words",
    "min_results": 75,
    "max_results": 100,
}


def main():
    ap = argparse.ArgumentParser(description="GrantScout engine")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("template")
    s = sub.add_parser("seed"); s.add_argument("--out", default="library.json")
    r = sub.add_parser("retrieve"); r.add_argument("--profile", required=True)
    r.add_argument("--library", required=True); r.add_argument("--k", type=int, default=150)
    q = sub.add_parser("queries"); q.add_argument("--profile", required=True)
    b = sub.add_parser("build"); b.add_argument("--profile", required=True); b.add_argument("--records", default="")
    b.add_argument("--library", default=""); b.add_argument("--out-dir", default="out")
    b.add_argument("--strict", action="store_true")
    a = ap.parse_args()
    if a.cmd == "template":
        print(json.dumps(PROFILE_TEMPLATE, indent=2))
    elif a.cmd == "seed":
        lib = load_json(a.out, [])
        added, updated = merge_library(lib, SEEDS)
        with open(a.out, "w") as f:
            json.dump(lib, f, indent=1, default=str)
        print(f"seed library: {added} added, {updated} refreshed -> {a.out} ({len(lib)} records)")
    elif a.cmd == "retrieve":
        p = load_json(a.profile, {})
        kept, dropped = rank(p, load_json(a.library, []))
        top = sorted(kept, key=lambda x: -x["score"])[: a.k]
        for x in top:
            print(f"{x['score']:5.1f}  [{RING_NAME[x['ring']]}]  {x['rec']['name']}  ->  {x['rec']['source_url']}")
        print(f"\n{len(kept)} eligible in library; excluded: {dict(dropped)}")
    elif a.cmd == "queries":
        print(json.dumps(search_plan(load_json(a.profile, {})), indent=2))
    elif a.cmd == "build":
        build(a)


if __name__ == "__main__":
    main()
