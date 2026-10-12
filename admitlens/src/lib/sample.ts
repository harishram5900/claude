import { EMPTY_PROFILE, type Profile } from "./types";

export const SAMPLE_PROFILE: Profile = {
  ...EMPTY_PROFILE,
  name: "Maya Rivera (sample)",
  grade: 12,
  state: "IL",
  highSchool: "Lincoln Park High School",
  intendedMajor: "Environmental Engineering",
  gpaUnweighted: 3.86,
  gpaWeighted: 4.41,
  classRankPercent: 6,
  apCount: 8,
  honorsCount: 5,
  rigor: 4,
  sat: 1460,
  act: null,
  submitTests: true,
  recs: "strong",
  firstGen: true,
  lowIncome: false,
  activities: [
    { id: "s1", name: "Chicago River water-quality project", role: "Founder & lead researcher", category: "Research", years: 2, hoursPerWeek: 6, weeksPerYear: 40, leadership: true, founder: true, impact: "local", description: "Sampled 14 sites monthly; shared data with Friends of the Chicago River." },
    { id: "s2", name: "Science Olympiad", role: "Captain", category: "Science", years: 4, hoursPerWeek: 7, weeksPerYear: 30, leadership: true, founder: false, impact: "state", description: "State medalist in Water Quality and Chem Lab." },
    { id: "s3", name: "Family restaurant", role: "Cashier and bookkeeper", category: "Work", years: 3, hoursPerWeek: 14, weeksPerYear: 48, leadership: false, founder: false, impact: "local", description: "Run weekend register, manage supplier invoices." },
    { id: "s4", name: "Varsity cross country", role: "Runner", category: "Athletics", years: 3, hoursPerWeek: 10, weeksPerYear: 14, leadership: false, founder: false, impact: "school", description: "" },
    { id: "s5", name: "Spanish tutoring", role: "Volunteer tutor", category: "Service", years: 2, hoursPerWeek: 2, weeksPerYear: 30, leadership: false, founder: false, impact: "local", description: "Tutor ESL middle schoolers at the library." },
  ],
  awards: [
    { id: "w1", name: "Science Olympiad State Medal (Water Quality)", level: "state" },
    { id: "w2", name: "AP Scholar with Distinction", level: "national" },
    { id: "w3", name: "Illinois State Scholar", level: "state" },
  ],
  significantResponsibilities: true,
  personalStatement: `The radiator in my grandmother's Pilsen apartment hissed every winter morning at 5:40, and that is when she started the tamales. By the time I was nine I could spread masa faster than my uncle, but I could not answer the question she asked every December: "Why does the steam know when to stop?" Nobody in our family had studied physics. I borrowed a thermometer from Mr. Okafor's lab, propped it against the pot for three Saturdays, and wrote down 47 readings in a spiral notebook that still smells like corn husks.

The numbers did not explain anything at first. Then, in sophomore chemistry, we covered phase changes, and I stayed after class to show Mr. Okafor the notebook. He laughed, then asked a better question: what would happen at altitude? That question became a science fair project, then a summer measuring boiling points with a borrowed pressure sensor, and then something bigger. If I could measure steam in a kitchen, I could measure the river four blocks from our restaurant.

So I did. For two years I have sampled fourteen sites along the Chicago River every month: dissolved oxygen, nitrates, E. coli. I recruited six classmates, wrote a field protocol in English and Spanish, and sent our spreadsheets to Friends of the Chicago River, who now use two of our sites in their annual report. The work is not glamorous. Most Saturdays it means cold hands, a cooler of sample bottles on the Blue Line, and explaining to curious fishermen why a teenager is pouring river water into test tubes.

I used to think curiosity was something you either had or didn't. Now I think it is a habit of noticing, of treating the kitchen as a lab and the people in it as collaborators. I still don't fully understand why the steam stops. But I have stopped needing the answer handed to me, and I have started asking my little cousins the same question she asked me.`,
};
