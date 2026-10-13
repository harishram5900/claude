import { EMPTY_PROFILE, type Activity, type Profile } from "../src/lib/types";

let n = 0;
export const act = (o: Partial<Activity>): Activity => ({
  id: `a${n++}`, name: "Club", role: "Member", category: "Academic", years: 2, hoursPerWeek: 3, weeksPerYear: 30,
  leadership: false, founder: false, impact: "school", description: "", ...o,
});

const ESSAY_A = `The radiator in my grandmother's Pilsen apartment hissed every winter morning at 5:40, and that is when she started the tamales. By the time I was nine I could spread masa faster than my uncle, but I could not answer the question she asked every December: "Why does the steam know when to stop?" Nobody in our family had studied physics. I borrowed a thermometer from Mr. Okafor's lab, propped it against the pot for three Saturdays, and wrote down 47 readings in a spiral notebook that still smells like corn husks.
The numbers did not explain anything at first. Then, in sophomore chemistry, we covered phase changes, and I stayed after class to show Mr. Okafor the notebook. He laughed, then asked a better question: what would happen at altitude? That question became a science fair project, then a summer measuring boiling points with a borrowed pressure sensor, then a regional award I accepted wearing my grandmother's apron as a joke she still tells.
I used to think curiosity was something you either had or didn't. Now I think it is a habit of noticing, of treating the kitchen as a lab and the people in it as collaborators. I still don't fully understand why the steam stops. But I have stopped needing the answer handed to me, and I have started asking my little cousins the same question she asked me.`;

const ESSAY_C = `Ever since I was little I have always been passionate about helping people. I am a hard worker and I am dedicated to everything I do. My passion for making a difference in the world is very important to me. I learned that hard work pays off and I learned that you should never give up on your dreams. Volunteering at the hospital was a life-changing experience that really opened my eyes and took me out of my comfort zone. I realized that I want to make the world a better place. At the end of the day, I know that I will follow my dreams and make a difference in my community. This experience taught me the value of hard work and it taught me so much about myself and about other people and about the things that really matter in life. I am determined to succeed and I am motivated to give back to the community.`;

export const STRONG: Profile = {
  ...EMPTY_PROFILE, name: "Ava Strong", grade: 12, state: "IL", intendedMajor: "Computer Science",
  gpaUnweighted: 4.0, gpaWeighted: 4.6, classRankPercent: 1, apCount: 11, honorsCount: 6, rigor: 5,
  sat: 1570, act: null, submitTests: true, recs: "exceptional",
  activities: [
    act({ name: "Robotics Team", role: "Captain", category: "Robotics", years: 4, hoursPerWeek: 15, leadership: true, impact: "national" }),
    act({ name: "Open-source accessibility app", role: "Founder", category: "Computer Science", years: 2, hoursPerWeek: 8, leadership: true, founder: true, impact: "international" }),
    act({ name: "Math tutoring nonprofit", role: "Director", category: "Service", years: 3, hoursPerWeek: 5, leadership: true, impact: "state" }),
    act({ name: "Orchestra", role: "First violin", category: "Music", years: 4, hoursPerWeek: 6, impact: "state" }),
  ],
  awards: [{ id: "w1", name: "USACO Platinum", level: "national" }, { id: "w2", name: "Regeneron STS Scholar", level: "national" }, { id: "w3", name: "AIME qualifier", level: "national" }],
  personalStatement: ESSAY_A,
};

export const SOLID: Profile = {
  ...EMPTY_PROFILE, name: "Ben Solid", grade: 12, state: "IL", intendedMajor: "Biology",
  gpaUnweighted: 3.8, gpaWeighted: 4.3, classRankPercent: 10, apCount: 6, honorsCount: 5, rigor: 4,
  sat: 1400, submitTests: true, recs: "strong",
  activities: [
    act({ name: "Hospital volunteer", role: "Volunteer", category: "Health", years: 2, hoursPerWeek: 4, impact: "local" }),
    act({ name: "Science Olympiad", role: "Member", category: "Science", years: 3, hoursPerWeek: 4, impact: "regional" as never }),
    act({ name: "Varsity soccer", role: "Player", category: "Athletics", years: 4, hoursPerWeek: 10 }),
    act({ name: "NHS", role: "Member", category: "Service", years: 2, hoursPerWeek: 2 }),
  ].map((a) => (a.impact === ("regional" as never) ? { ...a, impact: "local" as const } : a)),
  awards: [{ id: "w1", name: "AP Scholar with Distinction", level: "national" }, { id: "w2", name: "Honor roll", level: "school" }],
  personalStatement: ESSAY_C,
};

export const AVERAGE: Profile = {
  ...EMPTY_PROFILE, name: "Cam Average", grade: 12, state: "IL", intendedMajor: "Business",
  gpaUnweighted: 3.3, gpaWeighted: 3.6, apCount: 2, honorsCount: 3, rigor: 3, sat: 1120, submitTests: true, recs: "average",
  activities: [act({ name: "DECA", role: "Member", category: "Business", years: 2, hoursPerWeek: 2 }), act({ name: "Part-time job", role: "Cashier", category: "Work", years: 2, hoursPerWeek: 15 })],
  awards: [],
  personalStatement: ESSAY_C,
};

export const WEAK: Profile = {
  ...EMPTY_PROFILE, name: "Dee Struggling", grade: 12, state: "TX", intendedMajor: "Undecided",
  gpaUnweighted: 2.7, gpaWeighted: 2.8, apCount: 0, honorsCount: 0, rigor: 2, sat: 950, submitTests: true, recs: "unknown",
  activities: [], awards: [], personalStatement: "",
};

export const ESSAYS = { ESSAY_A, ESSAY_C, get ESSAY_B() { return ESSAY_B; } };

// A strong, specific essay used only by the calibration pool (never shown in the app).
export const ESSAY_B = `The radiator in my grandmother's Pilsen apartment hissed every winter morning at 5:40, and that is when she started the tamales. By the time I was nine I could spread masa faster than my uncle, but I could not answer the question she asked every December: "Why does the steam know when to stop?" Nobody in our family had studied physics. I borrowed a thermometer from Mr. Okafor's lab, propped it against the pot for three Saturdays, and wrote down 47 readings in a spiral notebook that still smells like corn husks.

The numbers did not explain anything at first. Then, in sophomore chemistry, we covered phase changes, and I stayed after class to show Mr. Okafor the notebook. He laughed, then asked a better question: what would happen at altitude? That question became a science fair project, then a summer measuring boiling points with a borrowed pressure sensor, and then something bigger. If I could measure steam in a kitchen, I could measure the river four blocks from our restaurant.

So I did. For two years I have sampled fourteen sites along the Chicago River every month: dissolved oxygen, nitrates, E. coli. I recruited six classmates, wrote a field protocol in English and Spanish, and sent our spreadsheets to Friends of the Chicago River, who now use two of our sites in their annual report. The work is not glamorous. Most Saturdays it means cold hands, a cooler of sample bottles on the Blue Line, and explaining to curious fishermen why a teenager is pouring river water into test tubes.

I used to think curiosity was something you either had or didn't. Now I think it is a habit of noticing, of treating the kitchen as a lab and the people in it as collaborators. I still don't fully understand why the steam stops. But I have stopped needing the answer handed to me, and I have started asking my little cousins the same question she asked me.`;
