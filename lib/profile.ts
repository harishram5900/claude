/**
 * All portfolio content lives here. Edit this file to update the site —
 * components only handle layout and motion.
 */

export const profile = {
  name: "Harish Ramasubramanian",
  shortName: "Harish R.",
  location: "Aurora, IL",
  school: "Metea Valley High School",
  /** Typed, rotating roles in the hero. */
  roles: [
    "Founder & CEO of LevelUp",
    "Co-founder of Pippin",
    "Co-founder of High Agency",
    "Co-founder of Canary OS",
    "VenturEd Fellow",
  ],
  tagline: "I build AI products that help the next builder actually get seen.",
  /**
   * Portrait shown in the hero. Drop a square photo at /public/harish.jpg and
   * set this to "/harish.jpg". While null, a monogram is shown instead.
   */
  portrait: null as string | null,
};

export const stats = [
  { value: 50000, suffix: "+", label: "Platform users" },
  { value: 70, suffix: "+", label: "Countries reached" },
  { value: 200, suffix: "+", label: "Student startups helped" },
  { value: 23, suffix: "", label: "Person team" },
];

export const about = [
  "I'm an 18-year-old founder from Aurora, Illinois. I started my first company solo — before I had a co-founder, before I had funding — because I kept running into the same problem: great products don't automatically get customers.",
  "Everything I've built since traces back to that obsession. LevelUp gives founders an AI marketing team. Pippin teaches the next generation to build with AI. High Agency connects young operators with mentors. Canary OS protects elderly people from scam calls.",
  "Based in Aurora, building for the world — relocating to San Francisco full-time after Y Combinator.",
];

export type Venture = {
  name: string;
  role: string;
  kind: string;
  summary: string;
  points: string[];
  links: { label: string; href: string }[];
  metric?: { value: string; label: string };
  flagship?: boolean;
};

export const ventures: Venture[] = [
  {
    name: "LevelUp",
    role: "Founder & CEO",
    kind: "AI marketing agents",
    flagship: true,
    summary:
      "Meet Lev — the AI CMO you build yourself. LevelUp is a team of AI agents that finds real opportunities across Reddit, Instagram, TikTok, YouTube, Facebook and X, drafts the work in your brand's voice, and only interrupts you for the calls that matter.",
    points: [
      "Nine agents share one \"brand brain\" — product brief, voice, ICP and competitor map — so nothing drifts off-message",
      "Seven-stage pipeline: research → write → edit → design → review → publish → optimize",
      "Guardrails first: reads platform rules before posting, discloses every time, stops at the first removal",
      "V1, built solo, drew 36,000+ unique visitors (GA4-verified) with no signup",
      "100+ businesses in a Chicago beta; now building V2 with co-founder & CTO Prajith Kocherla",
    ],
    links: [
      { label: "levelupmarketing.vercel.app", href: "https://levelupmarketing.vercel.app" },
      { label: "Waitlist", href: "https://levelup-waitlist.vercel.app" },
    ],
    metric: { value: "50,000+", label: "users across 70+ countries" },
  },
  {
    name: "Pippin",
    role: "Co-founder",
    kind: "AI literacy · Edtech",
    summary:
      "A Duolingo-style, gamified app that teaches AI literacy and vibe-coding — working effectively with AI coding agents like Cursor and Replit. Guided by a mascot named Pip.",
    points: ["Mascot: Pip", "Early-stage — building toward a future YC application"],
    links: [{ label: "pippin-delta.vercel.app", href: "https://pippin-delta.vercel.app" }],
  },
  {
    name: "High Agency",
    role: "Co-founder",
    kind: "Launchpad for young operators",
    summary:
      "A selective cohort for ambitious young operators who'd rather build the thing than study it. Members get introduced to mentors from Fortune 500 companies and Ivy League schools, and every challenge ends in a real, public artifact.",
    points: ["Co-founded with 3 other founders", "Founding batch free; admission weighs drive over résumé"],
    links: [{ label: "high-agency.io", href: "https://high-agency.io" }],
    metric: { value: "200+", label: "applicants" },
  },
  {
    name: "Canary OS",
    role: "Co-founder",
    kind: "AI scam detection",
    summary:
      "A scam-detection app built on real-time audio machine-learning models that flag likely scam calls as they happen — protecting elderly users. Pitched directly to senior living homes.",
    points: ["Real-time audio ML on live calls", "3rd place, Butter Pitch Competition"],
    links: [],
  },
  {
    name: "MindHack",
    role: "Co-founder & organizer",
    kind: "Student event",
    summary: "Co-founded and helped organize an event bringing together undergraduate and master's students.",
    points: [],
    links: [],
    metric: { value: "100+", label: "students" },
  },
];

export type Award = { title: string; result: string; detail?: string; highlight?: boolean };

export const awards: Award[] = [
  { title: "Congressional App Challenge", result: "2nd Place", highlight: true },
  { title: "Harvard x VTSP", result: "Community Award Winner", highlight: true },
  { title: "NASA Space Apps Challenge", result: "2nd Place", detail: "Chicago", highlight: true },
  { title: "Young Achiever Award", result: "Recipient", detail: "Recognizing young leaders" },
  { title: "Butter Pitch Competition", result: "3rd Place", detail: "Canary OS" },
  { title: "DPI iOS App Development Internship", result: "Selected", detail: "115 accepted of 800 applicants" },
];

/** Stages Harish has pitched on. */
export const pitches = [
  "TEAMS Global",
  "Harvard x VTSP",
  "Grassroots Tech Community",
  "1 Million Cups",
  "Butter Pitch",
];

export type TimelineItem = { title: string; org: string; detail?: string };

export const experience: TimelineItem[] = [
  { title: "Founder & CEO", org: "LevelUp", detail: "AI agents that run a company's marketing end-to-end." },
  { title: "Co-founder", org: "Pippin", detail: "Gamified AI literacy and vibe-coding app." },
  { title: "Co-founder", org: "High Agency", detail: "Mentorship launchpad for young operators." },
  { title: "Co-founder", org: "Canary OS", detail: "Real-time AI scam-call detection for elderly users." },
  { title: "iOS App Development Intern", org: "DPI", detail: "Selected from 800 applicants (115 accepted)." },
  { title: "Business Development Intern", org: "Taskflows" },
  { title: "Business Development Intern", org: "Linktern" },
  { title: "Public Relations / Outreach Intern", org: "GWP Advisory Firm" },
];

export const education: TimelineItem[] = [
  { title: "High School", org: "Metea Valley High School", detail: "Aurora, Illinois" },
  { title: "Digital Scholar", org: "Metea Valley High School" },
];

export const fellowships: TimelineItem[] = [
  { title: "Fellow", org: "VenturEd", detail: "Entrepreneurship fellowship." },
  {
    title: "President",
    org: "Plastikeers Speech Club",
    detail: "3+ years — my longest-running commitment. Mentoring 150+ middle and high school students in persuasive speaking, vocal projection and stage presence.",
  },
  { title: "Volunteer", org: "Community", detail: "3–4+ hours weekly across Plastikeers, Canary OS outreach and High Agency." },
];

export const skills: { group: string; items: string[] }[] = [
  {
    group: "AI & agents",
    items: [
      "Multi-agent systems",
      "LLM orchestration",
      "Prompt engineering",
      "AI video generation",
      "Audio ML (real-time)",
      "Vibe-coding with Cursor & Replit",
    ],
  },
  {
    group: "Engineering",
    items: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "Swift / iOS", "Vercel", "Publishing APIs"],
  },
  {
    group: "Product & growth",
    items: ["0 → 1 product building", "Growth marketing", "Short-form content", "User research", "Analytics (GA4)", "Waitlists & launches"],
  },
  {
    group: "Leadership",
    items: ["Pitching & fundraising prep", "Public speaking", "Team building (23 people)", "Mentoring", "Event organizing", "Partnerships & outreach"],
  },
];

/** Globe arcs: Aurora, IL to world regions. Illustrative of reach, not per-user data. */
export const home = { lat: 41.76, lng: -88.32 };
export const reachPoints = [
  { lat: 51.5, lng: -0.1 },
  { lat: 19.1, lng: 72.9 },
  { lat: 13.1, lng: 80.3 },
  { lat: 1.35, lng: 103.8 },
  { lat: -33.9, lng: 151.2 },
  { lat: -23.5, lng: -46.6 },
  { lat: 6.5, lng: 3.4 },
  { lat: 35.7, lng: 139.7 },
  { lat: 25.2, lng: 55.3 },
  { lat: 52.5, lng: 13.4 },
  { lat: 43.7, lng: -79.4 },
  { lat: 37.8, lng: -122.4 },
  { lat: 19.4, lng: -99.1 },
  { lat: -1.3, lng: 36.8 },
];
