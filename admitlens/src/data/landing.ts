// Example inputs for the landing page's product screens. No person, no name: every number on
// those screens is computed live by the same engine students use.
import { EMPTY_PROFILE, type Profile } from "@/lib/types";

export const DRAFT_1 = `Ever since I was little, I have always been passionate about technology. Computers have always fascinated me and I knew from a young age that I wanted to make a difference in the world through engineering. In high school I joined the robotics team, which taught me the value of hard work and teamwork. It was really a very important experience for me and it changed my life in so many ways.

During my sophomore year our team faced many challenges. Things were not always easy, but we never gave up. I learned that hard work pays off and that failure is just a stepping stone to success. I stepped out of my comfort zone and became a leader. I am a hard worker and I am a natural leader, and I am always willing to help others.

I also started a coding club because I wanted to give back to my community. Helping others is something that I really enjoy and it is very meaningful to me. Through these experiences I have grown so much as a person.

In college I want to continue to pursue my passion for computer science. I believe that I can make the world a better place, and I know that your school is the perfect place for me to achieve my dreams and reach my full potential.`;

export const DRAFT_2 = `The first time our robot drove itself across the gym, it hit the wall at full speed, and thirty-five people turned to look at me. I had written the camera code the night before, certain that four hundred lines of Python could see the way a driver sees.

They could not. In the replay, the robot chased a glare on the gym floor that I had never noticed: the late sun through the high windows. For two weeks I measured the light at six times of day, rewrote the filter three times, and taped a cardboard visor to the camera when nothing else worked. The visor stayed on through the state finals. Nobody asked about it, and I was proud of that.

The glare taught me something I now use far from robots. A machine only notices what you teach it to notice, and people are not so different. On Saturdays I teach a free coding class at the Naper Boulevard library. When a ten-year-old named Theo stopped raising his hand, I did not explain the loop again. I asked him what he saw first on the screen. He pointed at the error message. Nobody had told him it was a clue, not a verdict.

I still lose track of time debugging. But I have stopped looking for the answer first. I start by asking what I have not been taught to see.`;

export const LANDING_PROFILE: Profile = {
  ...EMPTY_PROFILE,
  grade: 12,
  state: "IL",
  intendedMajor: "Computer Science",
  gpaUnweighted: 3.93,
  gpaWeighted: 4.42,
  classRankPercent: 4,
  apCount: 8,
  honorsCount: 3,
  rigor: 5,
  sat: 1510,
  recs: "strong",
  activities: [
    { id: "l1", name: "Robotics team", role: "Captain", category: "Robotics", years: 4, hoursPerWeek: 12, weeksPerYear: 38, leadership: true, founder: false, impact: "state", description: "Led 30 students to state finals; wrote the vision code." },
    { id: "l2", name: "Library coding class", role: "Founder", category: "Service", years: 2, hoursPerWeek: 4, weeksPerYear: 36, leadership: true, founder: true, impact: "local", description: "Free Saturday classes; 90 students over two years." },
    { id: "l3", name: "Hospital volunteer", role: "Volunteer", category: "Service", years: 2, hoursPerWeek: 3, weeksPerYear: 30, leadership: false, founder: false, impact: "local", description: "" },
  ],
  awards: [
    { id: "w1", name: "State science fair, 2nd place", level: "state" },
    { id: "w2", name: "AP Scholar with Distinction", level: "national" },
  ],
  personalStatement: DRAFT_1,
};
