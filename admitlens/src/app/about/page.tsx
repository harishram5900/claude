import { Card, PageHeader } from "@/components/ui";
import { COLLEGES } from "@/data/colleges";
import { TIER_INFO, type Tier } from "@/lib/engine";

export const metadata = { title: "How it works" };

export default function About() {
  return (
    <div className="rise mx-auto max-w-3xl">
      <PageHeader eyebrow="Methodology" title="How AdmitLens reads your application" subtitle="What the model does, what data it uses, and where its limits are." />
      <div className="space-y-6 text-[15px] leading-relaxed">
        <Card className="space-y-3 p-6">
          <h2 className="font-display text-xl font-semibold">Data</h2>
          <p>
            AdmitLens ships with detailed admissions profiles for {COLLEGES.length} colleges, drawn from each school's most recent Common Data Set and admissions office publications: overall and early admit rates, middle-50% SAT/ACT, typical GPA of admitted students, test policy, cost, early plans, residency preferences, legacy policy, and what the office says it rewards. The most-viewed schools (the Ivy League, MIT, Duke and UIUC) carry admit rates checked against their latest reported cycle, with the source linked on each college page. Every college page also shows live outcome and net-price data from the federal College Scorecard. Any other accredited four-year college is pulled live from the U.S. Department of Education's College Scorecard, where admit rates and test ranges are federal data and GPA is estimated from selectivity.
          </p>
        </Card>
        <Card className="space-y-3 p-6">
          <h2 className="font-display text-xl font-semibold">The reader model</h2>
          <p>
            Each part of your file (GPA, rigor, testing, activities, honors, essay, recommendations) is scored as a z-score <i>relative to that college's admitted class</i>. A dimension is a "1" when it would stand out even among that school's admits and a "6" when it falls far below them. That's why the same file earns different ratings from different schools.
          </p>
          <p>The weights shift with selectivity. At the most selective schools, activities and essays carry far more weight and there's an academic screen. At accessible schools, GPA and course rigor dominate:</p>
          <ul className="space-y-2">
            {([1, 2, 3, 4, 5] as Tier[]).map((t) => (
              <li key={t} className="rounded-xl border border-line p-3 text-sm">
                <b>{TIER_INFO[t].label}.</b> <span className="text-muted">{TIER_INFO[t].stance}</span>
              </li>
            ))}
          </ul>
          <p>
            Scores combine in a logistic model anchored at the school's real admit rate, with adjustments for early plans (using published early-round rates), in-state preference at publics, legacy where the school still considers it, first-generation and economic context, and recruited-athlete status. A soft ceiling reflects reality: no unhooked applicant is a sure thing at a school that admits 4%. Race and ethnicity are not used.
          </p>
        </Card>
        <Card className="space-y-3 p-6">
          <h2 className="font-display text-xl font-semibold">Calibrated on real admissions outcomes</h2>
          <p>
            Individual applicants' results aren't public, but one detailed dataset is: Harvard's admissions records released in the <i>SFFA v. Harvard</i> case, covering applicants to the Classes of 2014–2019. Economists published admit rates by academic decile for applicants without hooks, from 0.01% in the bottom decile to 14.6% in the top. AdmitLens simulates 120 realistic applicants per decile and fits the most-selective end of its model so its average predictions match those real outcomes, adjusted to today's admit rate. Every decile from 2 to 10 lands within about 20% of the real figure, and an automated test fails if it drifts. The same data sets the legacy effect (about 5× the odds) and recruited-athlete admit rates (about 85%).
          </p>
          <p className="text-sm text-muted">
            Source:{" "}
            <a className="underline underline-offset-2" href="https://gwern.net/doc/sociology/2022-arcidiacono.pdf" target="_blank" rel="noreferrer">
              Arcidiacono, Kinsler &amp; Ransom, "Legacy and Athlete Preferences at Harvard," Economics of Education Review 88 (2022)
            </a>
            . Less selective schools are anchored to their published admit rates and score ranges, since comparable outcome data isn't public for them.
          </p>
        </Card>
        <Card className="space-y-3 p-6">
          <h2 className="font-display text-xl font-semibold">Testing the model</h2>
          <p>
            An automated test suite runs on every change. It checks that the same student always scores lower at more selective schools, that chances never go down when GPA, scores or activities improve (300 random cases), that 200 randomly generated applicants receive distinct chances and distinct written memos, that results are deterministic, and that essays full of clichés score far below specific, reflective writing.
          </p>
        </Card>
        <Card className="space-y-3 p-6">
          <h2 className="font-display text-xl font-semibold">AI deep reads</h2>
          <p>
            When the deployment has an Anthropic API key, you can request a full-text read of your activities and essay from Claude, prompted as a reader at your chosen college and given that school's data plus the model's ratings. The numbers always come from the transparent model above; the AI adds qualitative critique.
          </p>
        </Card>
        <Card id="privacy" className="scroll-mt-24 space-y-3 p-6">
          <h2 className="font-display text-xl font-semibold">Limits and privacy</h2>
          <p>
            Chances are estimates. Real decisions depend on institutional needs, the applicant pool each year, intended major, interviews and factors no model can see, so use your evaluation to find your biggest levers, not to predict your fate. Your profile, essays, tracker and scholarship answers are saved to your private account: passwords are hashed with scrypt, sessions use signed cookies, and data sits in private storage that only the app's server can read. Your Common App PDF is read in your browser and the file itself is never uploaded. Your citizenship or visa answer is used only to filter scholarships and never appears in reports. Nothing is sold or shared. Signing out removes your data from that browser.
          </p>
          <p className="text-sm text-muted">AdmitLens is not affiliated with Common App or any college. Reader voices are modeled on how each type of office reviews files; they are not real admissions staff.</p>
        </Card>
      </div>
    </div>
  );
}
