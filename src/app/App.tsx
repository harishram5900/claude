/**
 * Harish Ramasubramanian — Portfolio
 * Layout, motion and 3D effects adapted from the adi·dev portfolio template
 * (React + Three.js + GLSL). All content lives in the data block below.
 */
import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import * as THREE from "three";
import {
  Linkedin, Mail, Phone, MapPin, ExternalLink,
  ChevronDown, ArrowRight, Menu, X, CheckCircle,
  Cpu, Globe, Sun, Moon, GraduationCap, Play, Building2, Bug,
  Hammer, Briefcase, AlertTriangle, PartyPopper,
  Heart, Terminal, Box, Zap, Trophy, Rocket, Users, Bot, Sparkles, Instagram, Mic,
} from "lucide-react";
import {
  SiReact, SiTypescript, SiNodedotjs, SiNextdotjs, SiTailwindcss, SiSwift,
  SiVercel, SiCursor, SiReplit, SiGoogleanalytics,
} from "react-icons/si";

const G = `
  @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes badge-bob { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
  @keyframes scan-down { 0%{top:-2px} 100%{top:100%} }
  @keyframes slide-up-mob { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  html{ scroll-behavior:smooth; -webkit-text-size-adjust:100%; }
  body{ -webkit-tap-highlight-color:transparent; overscroll-behavior-y:contain; }
  *{ -webkit-tap-highlight-color:transparent; box-sizing:border-box; }

  ::-webkit-scrollbar{ width:3px; }
  ::-webkit-scrollbar-thumb{ background:rgba(255,43,43,.45); border-radius:2px; }
  ::-webkit-scrollbar-track{ background:transparent; }

  .fd{ font-family:'M PLUS Rounded 1c',sans-serif; }
  .fb{ font-family:'Nunito',sans-serif; }
  .fm{ font-family:'JetBrains Mono',monospace; }

  .gt{ color:#ff2b2b; }
  .gt-p{ color:#ff5c5c; }

  .gc{
    background:#111111; backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
    border:1px solid rgba(255,255,255,.07); transition:all .32s ease;
  }
  .gc:hover{
    background:rgba(255,255,255,.055); border-color:rgba(255,255,255,.16);
    box-shadow:0 24px 56px rgba(0,0,0,.5); transform:translateY(-3px);
  }
  /* no hover lift on touch devices */
  @media (hover:none){ .gc:hover{ transform:none; box-shadow:none; } }

  .gc-s{ background:#111111; backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,.07); }
  .gb{ border:1px solid rgba(255,43,43,.45); box-shadow:0 0 24px rgba(255,43,43,.15); }
  .pbar{ height:2px; background:#ff2b2b; transition:width .08s linear; }
  .dg{ background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1px); background-size:30px 30px; }
  .sw{ position:relative; overflow:hidden; }
  .sl-anim{ position:absolute;left:0;right:0;height:1px;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(255,43,43,.55),transparent);animation:scan-down 3.5s linear infinite; }

  #cr{ position:fixed;pointer-events:none;z-index:9999;width:34px;height:34px;border-radius:50%;border:1.5px solid rgba(255,43,43,.7);transform:translate(-50%,-50%);transition:width .18s,height .18s; }
  #cd{ position:fixed;pointer-events:none;z-index:9999;width:5px;height:5px;border-radius:50%;background:#ff2b2b;transform:translate(-50%,-50%); }
  /* hide custom cursor on touch */
  @media (hover:none){ #cr,#cd{ display:none; } }

  .bf{ animation:badge-bob var(--d,5s) ease-in-out infinite; animation-delay:var(--dl,0s); }
  .sl2{ font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.2em;color:#4b5563; }
  .tll{ background:linear-gradient(to bottom,rgba(255,43,43,.5),rgba(255,43,43,.1),transparent); }

  /* mobile bottom nav */
  .mob-nav{ position:fixed;bottom:0;left:0;right:0;z-index:50;background:rgba(0,0,0,.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,.07);padding:8px 0 max(8px,env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:space-around; }
  /* horizontal scroll for demo tabs */
  .demo-tabs{ display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none; }
  .demo-tabs::-webkit-scrollbar{ display:none; }
  .demo-tab{ flex-shrink:0; }
  /* safe area padding on hero */
  .hero-safe{ padding-top:max(80px,env(safe-area-inset-top,0px)+80px); }

  /* shader uniform sliders */
  .su{ -webkit-appearance:none;appearance:none;width:100%;height:2px;border-radius:1px;background:rgba(255,43,43,.25);outline:none;cursor:pointer; }
  .su::-webkit-slider-thumb{ -webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:#ff2b2b;border:2px solid rgba(255,255,255,.18);cursor:pointer; }
  .su::-moz-range-thumb{ width:13px;height:13px;border-radius:50%;background:#ff2b2b;border:2px solid rgba(255,255,255,.18);cursor:pointer; }
  .su:hover::-webkit-slider-thumb{ background:#ff5c5c; }
  .su:hover::-moz-range-thumb{ background:#ff5c5c; }
`;

const ME = {
  name: "Harish Ramasubramanian", title: "Founder & CEO, LevelUp",
  email: "harishram7971@gmail.com", location: "Aurora, IL",
  linkedin: "https://www.linkedin.com/in/harish-ramasubramanian/",
  instagram: "https://www.instagram.com/harishking8346/",
  // Drop a square photo at public/harish.jpg — until then the hero shows initials.
  photo: "/harish.jpg",
  bio: "I'm an 18-year-old founder from Aurora, Illinois. I started my first company solo — before I had a co-founder, before I had funding — because I kept running into the same problem: great products don't automatically get customers.",
  bio2: "Everything I've built since traces back to that obsession. LevelUp gives founders an AI marketing team. Pippin teaches the next generation to build with AI. High Agency connects young operators with mentors. Canary OS protects elderly people from scam calls. Next stop: San Francisco.",
};

const ROLES = ["Founder & CEO of LevelUp", "Co-founder of Pippin", "Co-founder of High Agency", "Co-founder of Canary OS", "VenturEd Fellow", "Building with AI agents"];

const EDUCATION = [
  { degree: "High School", college: "Metea Valley High School", period: "Aurora, Illinois", note: "Digital Scholar." },
];

const FELLOWSHIPS = [
  { degree: "Fellow", college: "VenturEd", period: "Fellowship", note: "Entrepreneurship fellowship for young founders." },
];

type Exp = { company: string; role: string; period?: string; duration: string; color: string; logo?: string; summary: string; bullets: string[]; tech: string[] };

const EXPERIENCE: Exp[] = [
  {
    company: "LevelUp", role: "Founder & CEO", duration: "Current",
    color: "#ff2b2b",
    summary: "LevelUp is an AI CMO you build yourself — a team of AI agents that finds real opportunities across Reddit, Instagram, TikTok, YouTube, Facebook and X, drafts the work in your brand's voice, and only interrupts you for the calls that matter.",
    bullets: [
      "Built V1 solo — an AI script writer for creators that drew 36,000+ unique visitors (GA4-verified) with no signup",
      "Now building V2 full-time with co-founder & CTO Prajith Kocherla and a 23-person team",
      "Nine agents share one \"brand brain\" (product brief, voice, ICP, competitor map); seven-stage pipeline from research to publish to optimize",
      "100+ businesses in a Chicago beta; 50,000+ platform users across 70+ countries; 200+ student startups helped",
      "Guardrails-first design: reads platform rules before posting, discloses every time, stops at the first removal",
    ],
    tech: ["AI Agents", "LLMs", "Next.js", "Tailwind CSS", "AI Video", "Publishing APIs"],
  },
  {
    company: "Pippin", role: "Co-founder", duration: "Current",
    color: "#ff5c5c",
    summary: "A Duolingo-style, gamified app that teaches AI literacy and vibe-coding — working effectively with AI coding agents like Cursor and Replit. Guided by a mascot named Pip.",
    bullets: [
      "Mascot: Pip — learning to work with AI agents, made to feel like a game",
      "Early-stage and building toward a future Y Combinator application",
    ],
    tech: ["EdTech", "Gamification", "AI Literacy", "Vibe-coding"],
  },
  {
    company: "High Agency", role: "Co-founder", duration: "Current",
    color: "#e0311f",
    summary: "A selective launchpad for ambitious young operators who'd rather build the thing than study it. Members are introduced to mentors from Fortune 500 companies and Ivy League schools, and every challenge ends in a real, public artifact.",
    bullets: [
      "Co-founded with 3 other co-founders",
      "200+ applicants to the program",
      "Founding batch is free; admission weighs drive over résumé",
    ],
    tech: ["Community", "Mentorship", "Operations"],
  },
  {
    company: "Canary OS", role: "Co-founder", duration: "Current",
    color: "#ff8a5c",
    summary: "A scam-detection app built on real-time audio machine-learning models that flag likely scam calls as they happen — protecting elderly users.",
    bullets: [
      "Pitched directly to senior living homes",
      "3rd place, Butter Pitch Competition",
    ],
    tech: ["Audio ML", "Real-time AI", "Mobile"],
  },
  {
    company: "Plastikeers", role: "President, Speech Club", duration: "3+ yrs",
    color: "#ff2b2b",
    summary: "My longest-running commitment. Elected President after years of mentoring younger speakers.",
    bullets: [
      "Mentor 150+ middle and high school students in persuasive speaking, vocal projection and stage presence",
      "Volunteer 3–4+ hours every week across Plastikeers, Canary OS outreach and High Agency",
    ],
    tech: ["Public Speaking", "Mentoring", "Leadership"],
  },
  {
    company: "DPI", role: "iOS App Development Intern", duration: "Summer internship",
    color: "#ff5c5c",
    summary: "Selected for DPI's iOS App Development summer internship — 115 accepted out of 800 applicants.",
    bullets: ["Built iOS apps in Swift as part of a highly selective cohort"],
    tech: ["Swift", "iOS", "Xcode"],
  },
  {
    company: "Taskflows", role: "Business Development Intern", duration: "Internship",
    color: "#e0311f",
    summary: "Business development internship.",
    bullets: [],
    tech: ["Business Development", "Outreach"],
  },
  {
    company: "Linktern", role: "Business Development Intern", duration: "Internship",
    color: "#ff8a5c",
    summary: "Business development internship.",
    bullets: [],
    tech: ["Business Development", "Partnerships"],
  },
  {
    company: "GWP Advisory Firm", role: "Public Relations / Outreach Intern", duration: "Internship",
    color: "#ff2b2b",
    summary: "Public relations and outreach internship.",
    bullets: [],
    tech: ["Public Relations", "Outreach"],
  },
];

const TOOLKIT = [
  { name: "AI Agents", icon: Bot, color: "#ff5c5c", desc: "Multi-agent systems that research, write, review and publish" },
  { name: "LLMs", icon: Sparkles, color: "#f5c542", desc: "Prompting, orchestration and evals for real products" },
  { name: "Next.js", icon: SiNextdotjs, color: "#e5e7eb", desc: "Full-stack React apps, shipped fast" },
  { name: "React", icon: SiReact, color: "#61dafb", desc: "Component-driven UIs with hooks & modern patterns" },
  { name: "TypeScript", icon: SiTypescript, color: "#3178c6", desc: "Type-safe JavaScript for apps that grow" },
  { name: "Tailwind CSS", icon: SiTailwindcss, color: "#38bdf8", desc: "Fast, consistent, responsive styling" },
  { name: "Node.js", icon: SiNodedotjs, color: "#3c873a", desc: "APIs and backend services" },
  { name: "Swift", icon: SiSwift, color: "#f05138", desc: "Native iOS apps (DPI internship)" },
  { name: "Vercel", icon: SiVercel, color: "#e5e7eb", desc: "Deploying and launching in minutes" },
  { name: "Cursor", icon: SiCursor, color: "#e5e7eb", desc: "Vibe-coding with AI pair programmers" },
  { name: "Replit", icon: SiReplit, color: "#f26207", desc: "Rapid prototypes and shareable builds" },
  { name: "GA4", icon: SiGoogleanalytics, color: "#e37400", desc: "Measuring what actually works" },
];

// Beyond the code — the founder skills that turn a build into a company
const CORE_SKILLS = [
  "0 → 1 Product Building", "Prompt Engineering", "Growth Marketing", "Short-form Content",
  "Pitching", "Public Speaking", "Team Building (23 people)", "Partnerships & Outreach",
];

const VENTURE_CHIPS = [
  { name: "LevelUp", url: "levelupmarketing.vercel.app" },
  { name: "LevelUp Waitlist", url: "levelup-waitlist.vercel.app" },
  { name: "Pippin", url: "pippin-delta.vercel.app" },
  { name: "High Agency", url: "high-agency.io" },
];

type Proj = { title: string; sub: string; url?: string; img: string; preview: PreviewKind; tech: string[]; color: string; g1: string; g2: string; desc: string };

const FOUNDED: Proj[] = [
  {
    title: "LevelUp", sub: "The AI CMO you build yourself", url: "levelupmarketing.vercel.app",
    img: "/projects/levelup.png", preview: "levelup",
    tech: ["AI Agents", "LLMs", "Next.js", "Tailwind CSS"], color: "#ff2b2b", g1: "#1f1f1f", g2: "#7f1d1d",
    desc: "\"Meet Lev, the AI CMO you build yourself.\" Nine marketing agents, one brand brain — finds real opportunities across Reddit, Instagram, TikTok, YouTube, Facebook and X, and drafts the work in your voice. Reddit Agent live.",
  },
  {
    title: "LevelUp — Marketing that runs itself", sub: "Seven-agent content pipeline · Waitlist", url: "levelup-waitlist.vercel.app",
    img: "/projects/levelup-waitlist.png", preview: "pipeline",
    tech: ["Next.js", "AI Video", "Publishing APIs"], color: "#ff5c5c", g1: "#1f1f1f", g2: "#7f1d1d",
    desc: "Research → write → edit → design → review → publish → optimize. A team of AI agents that researches your market, edits your videos, creates your visuals and publishes everywhere — then improves on what performs.",
  },
  {
    title: "MindHack", sub: "Student event · Co-founder & organizer",
    img: "/projects/mindhack.png", preview: "mindhack",
    tech: ["Events", "Community"], color: "#e0311f", g1: "#1f1f1f", g2: "#7f1d1d",
    desc: "Co-founded and helped organize an event bringing together 100+ undergraduate and master's students.",
  },
];

const CO_FOUNDED: Proj[] = [
  {
    title: "Pippin", sub: "Duolingo for AI literacy & vibe-coding", url: "pippin-delta.vercel.app",
    img: "/projects/pippin.png", preview: "pippin",
    tech: ["EdTech", "Gamification", "AI"], color: "#ff2b2b", g1: "#1f1f1f", g2: "#7f1d1d",
    desc: "A gamified app that teaches AI literacy and vibe-coding — working effectively with AI coding agents like Cursor and Replit. Mascot: Pip.",
  },
  {
    title: "High Agency", sub: "Launchpad for young operators", url: "high-agency.io",
    img: "/projects/high-agency.png", preview: "highagency",
    tech: ["Community", "Mentorship"], color: "#ff5c5c", g1: "#1f1f1f", g2: "#7f1d1d",
    desc: "A selective cohort connecting young founders with mentors from Fortune 500 companies and Ivy League schools — and with each other. 200+ applicants.",
  },
  {
    title: "Canary OS", sub: "Real-time AI scam-call detection",
    img: "/projects/canary-os.png", preview: "canary",
    tech: ["Audio ML", "Real-time AI"], color: "#e0311f", g1: "#1f1f1f", g2: "#7f1d1d",
    desc: "Real-time audio machine-learning models flag likely scam calls as they happen, protecting elderly users. Pitched to senior living homes. 3rd place, Butter Pitch Competition.",
  },
];

const AWARDS = [
  { result: "2nd Place", title: "Congressional App Challenge", detail: "National app competition", hot: true },
  { result: "Winner", title: "Harvard x VTSP", detail: "Community Award", hot: true },
  { result: "2nd Place", title: "NASA Space Apps Challenge", detail: "Chicago", hot: true },
  { result: "Recipient", title: "Young Achiever Award", detail: "Recognizing young leaders" },
  { result: "3rd Place", title: "Butter Pitch Competition", detail: "Canary OS" },
  { result: "115 / 800", title: "DPI iOS Internship", detail: "Selected — 115 accepted of 800 applicants" },
];

const PITCHES = ["TEAMS Global", "Harvard x VTSP", "Grassroots Tech Community", "1 Million Cups", "Butter Pitch"];

const BADGES = [
  { name: "AI Agents", color: "#ff2b2b", style: { left: "7%", top: "22%" }, d: "5s", dl: "0s" },
  { name: "Next.js", color: "#e5e7eb", style: { left: "80%", top: "18%" }, d: "6s", dl: "-.8s" },
  { name: "LLMs", color: "#ff5c5c", style: { left: "86%", top: "58%" }, d: "4.5s", dl: "-1.5s" },
  { name: "TypeScript", color: "#60a5fa", style: { left: "5%", top: "64%" }, d: "5.5s", dl: "-.3s" },
  { name: "Swift", color: "#fb923c", style: { left: "74%", top: "80%" }, d: "6.5s", dl: "-2s" },
  { name: "Pitching", color: "#94a3b8", style: { left: "20%", top: "86%" }, d: "4s", dl: "-1s" },
  { name: "Growth", color: "#f59e0b", style: { left: "50%", top: "91%" }, d: "5s", dl: "-.6s" },
  { name: "Vibe-coding", color: "#e0311f", style: { left: "17%", top: "10%" }, d: "7s", dl: "-3s" },
];

function useVisible(t = 0.1) { const ref = useRef<HTMLDivElement>(null); const [v, setV] = useState(false); useEffect(() => { const el = ref.current; if (!el) return; const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: t }); obs.observe(el); return () => obs.disconnect(); }, [t]); return [ref, v] as const; }
function useScrollPct() { const [p, setP] = useState(0); useEffect(() => { const h = () => { const s = document.documentElement.scrollTop; const mx = document.documentElement.scrollHeight - window.innerHeight; setP(mx ? (s / mx) * 100 : 0); }; window.addEventListener("scroll", h, { passive: true }); return () => window.removeEventListener("scroll", h); }, []); return p; }

function Cursor() { const ring = useRef<HTMLDivElement>(null); const dot = useRef<HTMLDivElement>(null); const pos = useRef({ x: 0, y: 0 }); const lag = useRef({ x: 0, y: 0 }); useEffect(() => { const mv = (e: MouseEvent) => { pos.current = { x: e.clientX, y: e.clientY }; if (dot.current) { dot.current.style.left = `${e.clientX}px`; dot.current.style.top = `${e.clientY}px`; } }; window.addEventListener("mousemove", mv); let raf: number; const loop = () => { lag.current.x += (pos.current.x - lag.current.x) * .11; lag.current.y += (pos.current.y - lag.current.y) * .11; if (ring.current) { ring.current.style.left = `${lag.current.x}px`; ring.current.style.top = `${lag.current.y}px`; } raf = requestAnimationFrame(loop); }; loop(); return () => { window.removeEventListener("mousemove", mv); cancelAnimationFrame(raf); }; }, []); return <><div id="cr" ref={ring} /><div id="cd" ref={dot} /></>; }

function Particles() { const ref = useRef<HTMLCanvasElement>(null); useEffect(() => { const c = ref.current!; const ctx = c.getContext("2d")!; let raf: number; const mouse = { x: -999, y: -999 }; const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; }; resize(); const ro = new ResizeObserver(resize); ro.observe(c); window.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; }); interface P { x: number; y: number; vx: number; vy: number; r: number; hue: number; } const pts: P[] = Array.from({ length: 100 }, () => ({ x: Math.random() * c.width, y: Math.random() * c.height, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, r: Math.random() * 1.4 + .4, hue: [0, 8, 355][Math.floor(Math.random() * 3)] })); const draw = () => { ctx.clearRect(0, 0, c.width, c.height); pts.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > c.width) p.vx *= -1; if (p.y < 0 || p.y > c.height) p.vy *= -1; const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy; if (d2 < 10000) { const d = Math.sqrt(d2); p.x += dx / d * 1.8; p.y += dy / d * 1.8; } ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `hsla(${p.hue},80%,70%,.6)`; ctx.fill(); }); for (let i = 0; i < pts.length; i++)for (let j = i + 1; j < pts.length; j++) { const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy); if (d < 130) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = `rgba(255,43,43,${(1 - d / 130) * .09})`; ctx.lineWidth = .5; ctx.stroke(); } } raf = requestAnimationFrame(draw); }; draw(); return () => { cancelAnimationFrame(raf); ro.disconnect(); }; }, []); return <canvas ref={ref} className="absolute inset-0 w-full h-full" />; }

// ── Hero 3D strip — real Three.js drifting shapes, tucked along the bottom
// edge so it never competes with the name/text above it ─────────────────────
function HeroGeometry() {
  const mountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = mountRef.current; if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, .1, 100);
    camera.position.z = 7;
    const scene = new THREE.Scene();

    const colors = [0xff2b2b, 0xff5c5c, 0xe0311f, 0xff8a5c];
    interface Shape { mesh: THREE.LineSegments; y: number; vx: number; spin: number; bob: number; pulse: number; }
    const kinds = [
      () => new THREE.IcosahedronGeometry(.34, 0),
      () => new THREE.OctahedronGeometry(.36, 0),
      () => new THREE.TetrahedronGeometry(.36, 0),
    ];
    const shapes: Shape[] = Array.from({ length: 6 }, (_, i) => {
      const geo = kinds[i % kinds.length]();
      const mat = new THREE.LineBasicMaterial({ color: colors[i % colors.length], transparent: true, opacity: .5 });
      const mesh = new THREE.LineSegments(new THREE.WireframeGeometry(geo), mat);
      const y = (Math.random() - .5) * 1.1;
      mesh.position.set(-7 + i * 2.6 + Math.random(), y, -1 - Math.random() * 2);
      scene.add(mesh);
      return { mesh, y, vx: .18 + Math.random() * .12, spin: .3 + Math.random() * .3, bob: Math.random() * Math.PI * 2, pulse: 0 };
    });

    // gentle parallax within the strip only — keeps it playful without pulling focus upward
    const mouse = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width - .5) * 2;
      mouse.y = ((e.clientY - r.top) / r.height - .5) * 2;
    };
    window.addEventListener("mousemove", onMove);
    // playful "boop" — click the strip and the drifting shapes give a little kick
    const onClick = () => shapes.forEach(s => { s.pulse = 1; });
    el.addEventListener("pointerdown", onClick);

    const EDGE = 7.5;
    let raf: number; const timer = new THREE.Timer();
    const animate = () => {
      raf = requestAnimationFrame(animate); timer.update();
      const t = timer.getElapsed();
      shapes.forEach(s => {
        s.mesh.rotation.x = t * s.spin * .6;
        s.mesh.rotation.y = t * s.spin * .8;
        s.mesh.position.x += s.vx * timer.getDelta();
        if (s.mesh.position.x > EDGE) s.mesh.position.x = -EDGE;
        s.mesh.position.y = s.y + Math.sin(t * .8 + s.bob) * .18 - mouse.y * .2;
        s.pulse *= 0.92;
        s.mesh.scale.setScalar(1 + s.pulse * .5);
      });
      camera.position.x += (mouse.x * .3 - camera.position.x) * .04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      if (!el) return;
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("pointerdown", onClick);
      shapes.forEach(s => { s.mesh.geometry.dispose(); (s.mesh.material as THREE.Material).dispose(); });
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);
  return <div ref={mountRef} className="absolute bottom-0 left-0 right-0 h-[140px] sm:h-[180px] cursor-pointer" />;
}

// ── GLSL shaders ────────────────────────────────────────────────────────────
const VERT = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;

const PLASMA_FS = `precision mediump float;
uniform float u_time,uSpeed,uFreq,uIntensity;varying vec2 vUv;
void main(){
  vec2 p=(vUv-.5)*uFreq;float t=u_time*uSpeed;
  float v=sin(p.x*2.+t)+sin(p.y*2.+t*1.3)+sin((p.x+p.y)+t*.9)+sin(sqrt(p.x*p.x+p.y*p.y)*2.+t);
  v=v*.25+.5;
  vec3 c1=vec3(.545,.361,.965),c2=vec3(.133,.827,.933),c3=vec3(.957,.443,.714);
  vec3 col=mix(c1,c2,sin(v*3.14159)*uIntensity*.5+.5);
  col=mix(col,c3,sin(v*6.28318+1.)*.5+.5);
  gl_FragColor=vec4(col,1.);
}`;

const RAYMARCH_FS = `precision mediump float;
uniform float u_time,uSpeed,uSharp,uGlow;varying vec2 vUv;
float sdT(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}
float map(vec3 p){
  float a=u_time*uSpeed,ca=cos(a),sa=sin(a);p.xz=mat2(ca,-sa,sa,ca)*p.xz;
  float b=u_time*uSpeed*.7,cb=cos(b),sb=sin(b);p.xy=mat2(cb,-sb,sb,cb)*p.xy;
  return sdT(p,vec2(.35,.13));
}
vec3 norm(vec3 p){vec2 e=vec2(.0005,0.);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
void main(){
  vec2 uv=(vUv-.5)*2.;vec3 ro=vec3(0.,0.,1.5),rd=normalize(vec3(uv*vec2(1.,.85),-1.));
  float t=0.;for(int i=0;i<56;i++){float d=map(ro+rd*t);if(abs(d)<.001||t>5.)break;t+=d;}
  vec3 col=vec3(.06,.05,.09);
  if(t<5.){vec3 p=ro+rd*t,n=norm(p),ld=normalize(vec3(1.5,2.,3.));
    float diff=max(dot(n,ld),0.),spec=pow(max(dot(reflect(-ld,n),-rd),0.),uSharp);
    vec3 c1=vec3(.545,.361,.965),c2=vec3(.133,.827,.933);
    col=mix(c1,c2,diff)*(.1+diff*.9)+spec*uGlow;}
  col+=vec3(.15,.08,.35)*exp(-3.*length(uv))*uGlow*.5;
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;

const VORONOI_FS = `precision mediump float;
uniform float u_time,uSpeed,uCells,uBright;varying vec2 vUv;
vec2 h2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}
float vor(vec2 x){
  vec2 n=floor(x),f=fract(x);float d1=8.,d2=8.;
  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
    vec2 g=vec2(float(i),float(j)),o=h2(n+g);
    o=.5+.5*sin(u_time*uSpeed+6.28318*o);
    float d=length(g+o-f);
    if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}
  return d2-d1;}
void main(){
  vec2 uv=(vUv-.5)*vec2(1.77,1.);float v=vor(uv*uCells);
  vec3 c1=vec3(.545,.361,.965),c2=vec3(.133,.827,.933),c3=vec3(.957,.443,.714);
  vec3 col=mix(c2,c1,smoothstep(0.,.1,v));col=mix(c3,col,smoothstep(0.,.05,v));
  col*=uBright;col=mix(vec3(.06,.05,.09),col,smoothstep(0.,.04,v)*.85+.15);
  gl_FragColor=vec4(col,1.);
}`;

const FBM_FS = `precision mediump float;
uniform float u_time,uSpeed,uOctaves,uLac;varying vec2 vUv;
float hsh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float ns(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(hsh(i),hsh(i+vec2(1,0)),u.x),mix(hsh(i+vec2(0,1)),hsh(i+vec2(1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);int oct=int(clamp(uOctaves,1.,8.));for(int i=0;i<8;i++){if(i>=oct)break;v+=a*ns(p);p=m*p*uLac*.5;a*=.5;}return v;}
void main(){
  vec2 st=vUv*3.5;float t=u_time*uSpeed;
  vec2 q=vec2(fbm(st+t),fbm(st+vec2(1.)));
  vec2 r=vec2(fbm(st+q+vec2(1.7,9.2)+t*.15),fbm(st+q+vec2(8.3,2.8)+t*.126));
  float f=fbm(st+r);
  vec3 c1=vec3(.545,.361,.965),c2=vec3(.133,.827,.933),c3=vec3(.957,.443,.714);
  vec3 col=mix(c1,c3,clamp(f*f*4.,0.,1.));col=mix(col,c2,clamp(length(q),0.,1.));col*=f*1.8+.4;
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;

// ── Particle shaders ─────────────────────────────────────────────────────────
const PARTICLE_VS = `
attribute vec3 aV0;
attribute float aSd;
uniform float u_time,uSpeed,uGravity,uTurbulence,uSize,uLifetime,uShape;
varying float vLife;
void main(){
  float lt=max(.1,uLifetime);
  float t=mod(u_time*uSpeed+aSd*lt,lt)/lt;
  vLife=t;
  float age=t*lt;
  vec3 pos;
  if(uShape<.5){
    pos=position+aV0*age;
    pos.y-=.5*uGravity*age*age;
  }else if(uShape<1.5){
    pos=vec3(position.x*.3,age*1.5+position.y*.1,position.z*.3);
    pos.y-=.5*max(0.,uGravity)*age*age;
  }else if(uShape<2.5){
    float a=aSd*6.28318+age*uSpeed*2.;
    float r=.9*(1.-t);
    pos=vec3(cos(a)*r,(aSd-.5)*1.4,sin(a)*r);
  }else{
    float a=aSd*6.28318;float r=age*1.2;
    pos=vec3(cos(a)*r,sin(aSd*3.14159)*age*.5,sin(a)*r);
    pos.y-=.5*uGravity*age*age;
  }
  pos.x+=sin(age*3.7+aSd*6.28)*uTurbulence*.5;
  pos.z+=cos(age*2.9+aSd*6.28)*uTurbulence*.5;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);
  gl_PointSize=max(1.,uSize)*(200./max(.1,gl_Position.w));
}`;

const PARTICLE_FS = `precision mediump float;
uniform float uColorA,uColorB;
varying float vLife;
vec3 hsl(float h,float s,float l){
  vec3 rgb=clamp(abs(mod(h*6.+vec3(0,4,2),6.)-3.)-1.,0.,1.);
  return l+s*(rgb-.5)*(1.-abs(2.*l-1.));
}
void main(){
  vec2 uv=gl_PointCoord*2.-1.;
  float r=length(uv);if(r>1.)discard;
  float alpha=(1.-r*r)*(1.-vLife*.9);
  vec3 col=hsl(mix(uColorA,uColorB,vLife)/360.,.9,.65);
  gl_FragColor=vec4(col,alpha);
}`;

interface CtrlCfg { key: string; label: string; min: number; max: number; step: number; def: number; type?: "range" | "mode"; options?: string[]; }
interface DemoCfg { name: string; desc: string; fs: string; controls: CtrlCfg[]; canvasType?: "quad" | "particles"; }

const SHADER_DEMOS: DemoCfg[] = [
  {
    name: "Plasma Wave", desc: "Sine-wave plasma — pure GLSL fragment math", fs: PLASMA_FS, controls: [
      { key: "uSpeed", label: "Speed", min: .1, max: 5, step: .05, def: 1 },
      { key: "uFreq", label: "Frequency", min: .5, max: 8, step: .1, def: 3 },
      { key: "uIntensity", label: "Intensity", min: .2, max: 3, step: .05, def: 1 },
    ]
  },
  {
    name: "Ray March", desc: "SDF ray-marched torus — real-time GLSL lighting", fs: RAYMARCH_FS, controls: [
      { key: "uSpeed", label: "Spin Speed", min: .1, max: 3, step: .05, def: .7 },
      { key: "uSharp", label: "Specular", min: 4, max: 64, step: 1, def: 16 },
      { key: "uGlow", label: "Glow", min: 0, max: 2, step: .05, def: .8 },
    ]
  },
  {
    name: "Voronoi", desc: "Animated Voronoi cells — GPU crystal patterns", fs: VORONOI_FS, controls: [
      { key: "uCells", label: "Cell Density", min: 1, max: 12, step: .5, def: 4 },
      { key: "uSpeed", label: "Speed", min: .1, max: 4, step: .1, def: .8 },
      { key: "uBright", label: "Brightness", min: .3, max: 3, step: .1, def: 1.5 },
    ]
  },
  {
    name: "Fractal FBM", desc: "Fractional Brownian Motion — multi-octave noise", fs: FBM_FS, controls: [
      { key: "uSpeed", label: "Speed", min: .05, max: 2, step: .05, def: .3 },
      { key: "uOctaves", label: "Octaves", min: 1, max: 8, step: 1, def: 5 },
      { key: "uLac", label: "Lacunarity", min: 1.5, max: 3.5, step: .1, def: 2 },
    ]
  },
  {
    name: "Particles", desc: "GPU particle system — shape, gravity, turbulence & color all live", fs: "", canvasType: "particles", controls: [
      { key: "uCount", label: "Particle Count", min: 200, max: 4000, step: 100, def: 1200 },
      { key: "uShape", label: "Emission Shape", min: 0, max: 3, step: 1, def: 0, type: "mode", options: ["Sphere", "Fountain", "Vortex", "Ring"] },
      { key: "uSize", label: "Particle Size", min: 2, max: 24, step: .5, def: 8 },
      { key: "uSpeed", label: "Speed", min: .1, max: 3, step: .05, def: 1 },
      { key: "uGravity", label: "Gravity", min: -2, max: 3, step: .05, def: .5 },
      { key: "uTurbulence", label: "Turbulence", min: 0, max: 1.5, step: .02, def: .2 },
      { key: "uLifetime", label: "Lifetime (s)", min: .3, max: 5, step: .1, def: 2 },
      { key: "uColorA", label: "Color A hue°", min: 0, max: 359, step: 1, def: 260 },
      { key: "uColorB", label: "Color B hue°", min: 0, max: 359, step: 1, def: 320 },
    ]
  },
];

function ShaderCanvas({ demo, params }: { demo: DemoCfg; params: Record<string, number> }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  useEffect(() => { paramsRef.current = params; }, [params]);
  useEffect(() => {
    const el = mountRef.current; if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth || 300, el.clientHeight || 300);
    el.appendChild(renderer.domElement);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10);
    camera.position.z = 1;
    const scene = new THREE.Scene();
    const geo = new THREE.PlaneGeometry(2, 2);
    const unis: Record<string, THREE.IUniform> = { u_time: { value: 0 } };
    demo.controls.forEach(c => { unis[c.key] = { value: c.def }; });
    const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: demo.fs, uniforms: unis });
    scene.add(new THREE.Mesh(geo, mat));
    let raf: number;
    const timer = new THREE.Timer();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      timer.update();
      unis.u_time.value = timer.getElapsed();
      demo.controls.forEach(c => { unis[c.key].value = paramsRef.current[c.key]; });
      renderer.render(scene, camera);
    };
    animate();
    const ro = new ResizeObserver(() => { if (el) renderer.setSize(el.clientWidth, el.clientHeight); });
    ro.observe(el);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); mat.dispose(); geo.dispose(); renderer.dispose(); if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement); };
  }, [demo]);
  return <div ref={mountRef} className="w-full h-full" />;
}

// ── Earth globe (Contact section) ────────────────────────────────────────
function mulberry32(seed: number) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// Real photos go here — see public/textures/README.txt. Until they exist, the
// procedural textures below stand in so the globe still renders correctly.
const DAY_TEX_URL = "/textures/earth-day.jpg";
const NIGHT_TEX_URL = "/textures/earth-night.jpg";

function getLocalHour(): number {
  try { return parseInt(new Intl.DateTimeFormat("en-GB", { timeZone: "America/Chicago", hour: "2-digit", hour12: false }).format(new Date()), 10); }
  catch { return (new Date().getUTCHours() + 19) % 24; }
}
function isLocalNight(): boolean { const h = getLocalHour(); return h >= 18 || h < 6; }

// Shared seeded landmass blobs so the day (filled) and night (lit-dots) fallbacks line up
function landBlobs(rnd: () => number) {
  const blobs: { cx: number; cy: number; r: number }[] = [];
  for (let i = 0; i < 16; i++)blobs.push({ cx: rnd() * 512, cy: 40 + rnd() * 176, r: 22 + rnd() * 46 });
  return blobs;
}

function makeEarthTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = 512; c.height = 256;
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(7);
  const ocean = ctx.createLinearGradient(0, 0, 0, 256);
  ocean.addColorStop(0, "#040814"); ocean.addColorStop(.5, "#0a1830"); ocean.addColorStop(1, "#040814");
  ctx.fillStyle = ocean; ctx.fillRect(0, 0, 512, 256);
  const landColors = ["#1c5f3a", "#2f7a4f", "#c98a3a", "#8a6b2e"];
  for (const { cx, cy, r } of landBlobs(rnd)) {
    ctx.fillStyle = landColors[Math.floor(rnd() * landColors.length)];
    ctx.beginPath();
    const pts = 9;
    for (let j = 0; j <= pts; j++) {
      const a = (j / pts) * Math.PI * 2, rr = r * (.6 + rnd() * .7);
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * .6;
      j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeNightFallbackTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = 512; c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 512, 256);
  const rnd = mulberry32(7);
  for (const { cx, cy, r } of landBlobs(rnd)) {
    const dots = 26;
    for (let j = 0; j < dots; j++) {
      const a = rnd() * Math.PI * 2, rr = r * rnd();
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * .6;
      ctx.fillStyle = `rgba(255,195,110,${.35 + rnd() * .55})`;
      ctx.beginPath(); ctx.arc(x, y, .5 + rnd() * 1.1, 0, Math.PI * 2); ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildStarfield(count: number, radius: number) {
  const pos = new Float32Array(count * 3);
  const rnd = mulberry32(99);
  for (let i = 0; i < count; i++) {
    const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1), r = radius * (.6 + rnd() * .4);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return geo;
}

function EarthGlobeCanvas({ mode }: { mode: "day" | "night" }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef(mode);
  const applyModeRef = useRef<(m: "day" | "night") => void>(() => { });
  useEffect(() => { modeRef.current = mode; applyModeRef.current(mode); }, [mode]);

  useEffect(() => {
    const el = mountRef.current; if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth || 300, el.clientHeight || 300);
    el.appendChild(renderer.domElement);
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const camera = new THREE.PerspectiveCamera(40, (el.clientWidth || 300) / (el.clientHeight || 300), .1, 100);
    camera.position.z = 2.5;
    const scene = new THREE.Scene();

    const starGeo = buildStarfield(500, 9);
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: .035, sizeAttenuation: true, transparent: true, opacity: .75 });
    scene.add(new THREE.Points(starGeo, starMat));

    scene.add(new THREE.AmbientLight(0x8899cc, .55));
    const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(3, 3.5, 4); scene.add(dl);
    const rim = new THREE.DirectionalLight(0xf0b0e0, .5); rim.position.set(-3, -2, -3); scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);

    // Day/night textures: real 8K photos from public/textures if present, else procedural stand-ins
    const dayFallback = makeEarthTexture();
    const nightFallback = makeNightFallbackTexture();
    dayFallback.anisotropy = maxAniso; nightFallback.anisotropy = maxAniso;
    let dayTex: THREE.Texture = dayFallback;
    let nightTex: THREE.Texture = nightFallback;
    const loadedTex: THREE.Texture[] = [];

    const earthGeo = new THREE.SphereGeometry(1, 96, 96);
    const earthMat = new THREE.MeshStandardMaterial({ map: dayFallback, roughness: .85, metalness: 0 });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    group.add(earth);

    const applyMode = (m: "day" | "night") => {
      if (m === "night") {
        earthMat.map = nightTex;
        earthMat.emissiveMap = nightTex;
        earthMat.emissive = new THREE.Color(0xffffff);
        earthMat.emissiveIntensity = 1.1;
        earthMat.roughness = 1;
      } else {
        earthMat.map = dayTex;
        earthMat.emissiveMap = null;
        earthMat.emissive = new THREE.Color(0x000000);
        earthMat.emissiveIntensity = 0;
        earthMat.roughness = .85;
      }
      earthMat.needsUpdate = true;
    };
    applyModeRef.current = applyMode;
    applyMode(modeRef.current);

    const loader = new THREE.TextureLoader();
    loader.load(DAY_TEX_URL, tex => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso; dayTex = tex; loadedTex.push(tex); if (modeRef.current === "day") applyMode("day"); }, undefined, () => { });
    loader.load(NIGHT_TEX_URL, tex => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso; nightTex = tex; loadedTex.push(tex); if (modeRef.current === "night") applyMode("night"); }, undefined, () => { });

    let rotX = .15, rotY = 0, isDrag = false, lx = 0, ly = 0;
    const el2 = renderer.domElement;
    const md = (e: MouseEvent) => { isDrag = true; lx = e.clientX; ly = e.clientY; };
    const mm = (e: MouseEvent) => { if (!isDrag) return; rotY += (e.clientX - lx) * .006; rotX += (e.clientY - ly) * .006; lx = e.clientX; ly = e.clientY; };
    const mu = () => { isDrag = false; };
    const td = (e: TouchEvent) => { isDrag = true; lx = e.touches[0].clientX; ly = e.touches[0].clientY; };
    const tm = (e: TouchEvent) => { if (!isDrag) return; rotY += (e.touches[0].clientX - lx) * .006; rotX += (e.touches[0].clientY - ly) * .006; lx = e.touches[0].clientX; ly = e.touches[0].clientY; };
    el2.addEventListener("mousedown", md); window.addEventListener("mousemove", mm); window.addEventListener("mouseup", mu);
    el2.addEventListener("touchstart", td, { passive: true }); window.addEventListener("touchmove", tm, { passive: true }); window.addEventListener("touchend", mu);

    let raf: number; const timer = new THREE.Timer();
    const animate = () => {
      raf = requestAnimationFrame(animate); timer.update();
      const dt = timer.getDelta();
      if (!isDrag) rotY += dt * .12;
      group.rotation.set(rotX, rotY, 0);
      earth.rotation.y += dt * .03;
      renderer.render(scene, camera);
    };
    animate();
    const ro = new ResizeObserver(() => { if (!el) return; renderer.setSize(el.clientWidth, el.clientHeight); camera.aspect = el.clientWidth / el.clientHeight; camera.updateProjectionMatrix(); });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      el2.removeEventListener("mousedown", md); window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu);
      el2.removeEventListener("touchstart", td); window.removeEventListener("touchmove", tm); window.removeEventListener("touchend", mu);
      earthGeo.dispose(); earthMat.dispose(); dayFallback.dispose(); nightFallback.dispose(); loadedTex.forEach(t => t.dispose());
      starGeo.dispose(); starMat.dispose();
      renderer.dispose();
      if (el.contains(el2)) el.removeChild(el2);
    };
  }, []);
  return <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
}

function ParticleCanvas({ params }: { params: Record<string, number> }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  const countRef = useRef(-1);
  const ptsRef = useRef<THREE.Points | null>(null);
  const geoRef = useRef<THREE.BufferGeometry | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  useEffect(() => { paramsRef.current = params; }, [params]);
  useEffect(() => {
    const el = mountRef.current; if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth || 300, el.clientHeight || 300);
    el.appendChild(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(60, (el.clientWidth || 300) / (el.clientHeight || 300), .01, 100);
    camera.position.z = 3;
    const scene = new THREE.Scene(); sceneRef.current = scene;
    const unis: Record<string, THREE.IUniform> = { u_time: { value: 0 }, uSpeed: { value: 1 }, uGravity: { value: .5 }, uTurbulence: { value: .2 }, uSize: { value: 8 }, uLifetime: { value: 2 }, uShape: { value: 0 }, uColorA: { value: 260 }, uColorB: { value: 320 } };
    const mat = new THREE.ShaderMaterial({ vertexShader: PARTICLE_VS, fragmentShader: PARTICLE_FS, uniforms: unis, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    matRef.current = mat;
    const mkGeo = (n: number) => {
      if (geoRef.current) { geoRef.current.dispose(); if (ptsRef.current) scene.remove(ptsRef.current); }
      const pos = new Float32Array(n * 3), vel = new Float32Array(n * 3), sd = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), r = .05 + Math.random() * .4;
        const sx = Math.sin(ph) * Math.cos(th), sy = Math.sin(ph) * Math.sin(th), sz = Math.cos(ph);
        pos[i * 3] = sx * r; pos[i * 3 + 1] = sy * r; pos[i * 3 + 2] = sz * r;
        const sp = .5 + Math.random() * .5;
        vel[i * 3] = sx * sp; vel[i * 3 + 1] = (sy + .5) * sp; vel[i * 3 + 2] = sz * sp;
        sd[i] = Math.random();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aV0", new THREE.BufferAttribute(vel, 3));
      geo.setAttribute("aSd", new THREE.BufferAttribute(sd, 1));
      geoRef.current = geo;
      const pts = new THREE.Points(geo, mat); ptsRef.current = pts; scene.add(pts);
    };
    mkGeo(1200); countRef.current = 1200;
    let raf: number; const timer = new THREE.Timer();
    const animate = () => {
      raf = requestAnimationFrame(animate); timer.update();
      const p = paramsRef.current;
      const cnt = Math.round(p.uCount ?? 1200);
      if (Math.abs(cnt - countRef.current) > 99) { mkGeo(cnt); countRef.current = cnt; }
      unis.u_time.value = timer.getElapsed();
      unis.uSpeed.value = p.uSpeed ?? 1; unis.uGravity.value = p.uGravity ?? .5;
      unis.uTurbulence.value = p.uTurbulence ?? .2; unis.uSize.value = p.uSize ?? 8;
      unis.uLifetime.value = p.uLifetime ?? 2; unis.uShape.value = Math.round(p.uShape ?? 0);
      unis.uColorA.value = p.uColorA ?? 260; unis.uColorB.value = p.uColorB ?? 320;
      if (ptsRef.current) ptsRef.current.rotation.y += .003;
      renderer.render(scene, camera);
    };
    animate();
    const ro = new ResizeObserver(() => { if (!el) return; renderer.setSize(el.clientWidth, el.clientHeight); camera.aspect = el.clientWidth / el.clientHeight; camera.updateProjectionMatrix(); });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      if (geoRef.current) geoRef.current.dispose();
      if (matRef.current) matRef.current.dispose();
      renderer.dispose(); if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);
  return <div ref={mountRef} className="w-full h-full" />;
}

function Avatar() {
  const [ok, setOk] = useState(true);
  return (
    <div className="relative w-[88px] h-[88px] sm:w-[104px] sm:h-[104px] rounded-full p-[2px]" style={{ background: "conic-gradient(from 180deg,#ff2b2b,#ff8a5c,#ff2b2b)", boxShadow: "0 0 32px rgba(255,43,43,.35)" }}>
      <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
        {ok
          ? <img src={ME.photo} alt={ME.name} className="w-full h-full object-cover" onError={() => setOk(false)} />
          : <span className="fd font-black text-3xl sm:text-4xl gt">HR</span>}
      </div>
      <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-black" />
    </div>
  );
}

type PreviewKind = "levelup" | "pipeline" | "mindhack" | "pippin" | "highagency" | "canary";

/** Designed stand-ins for the project screenshots, drawn in CSS. */
function ProjectPreview({ kind }: { kind: PreviewKind }) {
  const chrome = (label: string, light = false) => (
    <div className={`absolute top-0 inset-x-0 h-6 flex items-center gap-1.5 px-3 ${light ? "bg-black/5" : "bg-white/5"}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-red-500/70" /><span className="w-1.5 h-1.5 rounded-full bg-yellow-500/70" /><span className="w-1.5 h-1.5 rounded-full bg-green-500/70" />
      <span className={`fm text-[8px] ml-2 ${light ? "text-black/40" : "text-white/40"}`}>{label}</span>
    </div>
  );
  if (kind === "levelup") return (
    <div className="absolute inset-0 bg-[#FAFAF8] flex flex-col items-center justify-center pt-5 text-center">
      {chrome("levelupmarketing.vercel.app", true)}
      <div className="w-7 h-8 rounded-lg mb-1.5" style={{ background: "linear-gradient(135deg,#FFF3C4,#F6C445,#D89A1F)" }} />
      <div className="font-semibold text-[#1A1919] text-[15px] sm:text-[17px] leading-tight px-6" style={{ fontFamily: "Sora, Inter, sans-serif" }}>Meet Lev, the AI CMO you build yourself.</div>
      <div className="mt-2 flex gap-1.5">{["Reddit", "Instagram", "TikTok", "YouTube", "X"].map(t => <span key={t} className="text-[8px] px-1.5 py-0.5 rounded-full border border-[#E4DDCD] text-[#6B6459] bg-white">{t}</span>)}</div>
    </div>
  );
  if (kind === "pipeline") return (
    <div className="absolute inset-0 bg-[#0a0908] pt-8 px-4">
      {chrome("levelup-waitlist.vercel.app")}
      <div className="text-[#f5f2ea] text-[15px] font-semibold">Marketing that <span className="italic text-[#f3c04d]">runs itself.</span></div>
      <div className="mt-2.5 grid grid-cols-7 gap-1">
        {["Research", "Write", "Edit", "Design", "Review", "Publish", "Optimize"].map((t, i) => (
          <div key={t} className="rounded-md border border-[#262019] bg-[#131110] px-1 py-1.5 text-center">
            <div className="fm text-[7px] text-[#f3c04d]">0{i + 1}</div><div className="text-[7px] text-[#b3a98d] truncate">{t}</div>
          </div>
        ))}
      </div>
    </div>
  );
  if (kind === "pippin") return (
    <div className="absolute inset-0 flex items-center justify-center gap-4 pt-5" style={{ background: "linear-gradient(135deg,#1a0f0f,#3b0d0d)" }}>
      {chrome("pippin-delta.vercel.app")}
      <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ background: "radial-gradient(circle at 35% 30%,#ff8a5c,#ff2b2b)" }}><span className="fd font-black text-white text-[15px]">Pip</span></div>
      <div className="flex flex-col gap-1.5">{["✓", "✓", "▶", "·"].map((c, i) => <span key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${i < 2 ? "bg-red-500 text-white" : i === 2 ? "border-2 border-red-400 text-red-300" : "border border-white/15 text-white/30"}`} style={{ marginLeft: i % 2 ? 14 : 0 }}>{c}</span>)}</div>
    </div>
  );
  if (kind === "highagency") return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pt-5" style={{ background: "linear-gradient(135deg,#111,#2a0b0b)" }}>
      {chrome("high-agency.io")}
      <div className="fd font-black text-white text-[20px] tracking-tight">HIGH <span className="gt">AGENCY</span></div>
      <div className="fm text-[9px] text-slate-400 mt-1">build the thing · don&apos;t just study it</div>
      <div className="mt-2 fm text-[9px] px-2 py-0.5 rounded-full border border-red-500/40 text-red-300">200+ applicants</div>
    </div>
  );
  if (kind === "canary") return (
    <div className="absolute inset-0 flex items-center justify-center gap-[3px]" style={{ background: "linear-gradient(135deg,#0f0f0f,#3b0d0d)" }}>
      {[6, 12, 20, 9, 28, 38, 16, 30, 44, 22, 12, 26, 40, 18, 8, 14, 32, 22, 10, 6].map((h, i) => (
        <span key={i} className={`w-1.5 rounded-full ${i === 8 || i === 12 ? "bg-red-500" : "bg-white/35"}`} style={{ height: h, animation: `badge-bob ${1.6 + (i % 5) * .3}s ease-in-out infinite`, animationDelay: `${-i * .1}s` }} />
      ))}
      <span className="absolute bottom-3 left-3 fm text-[9px] text-red-300 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />possible scam detected</span>
    </div>
  );
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg,#111,#3b0d0d)" }}>
      <div className="fd font-black text-white text-[22px]">Mind<span className="gt">Hack</span></div>
      <div className="fm text-[10px] text-slate-400 mt-1">100+ undergrad &amp; master&apos;s students</div>
    </div>
  );
}

const NAV_LINKS = ["About", "Experience", "Skills", "Projects", "Awards", "Showcase", "Contact"];
const NAV_ICONS: Record<string, React.ReactNode> = {
  About: <User2 size={18} />, Experience: <Briefcase2 size={18} />, Skills: <Cpu size={18} />,
  Projects: <Box size={18} />, Awards: <Trophy size={18} />, Showcase: <Globe size={18} />, Contact: <Mail size={18} />,
};

// tiny icon aliases (lucide exports these names)
function User2({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>; }
function Briefcase2({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="12" /></svg>; }

function Nav({ progress }: { progress: number }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { threshold: 0.4 });
    NAV_LINKS.forEach(l => { const el = document.getElementById(l.toLowerCase()); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);
  const go = (id: string) => { document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: "smooth" }); setOpen(false); };
  return (
    <>
      {/* Top nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "gc-s border-b border-white/5" : ""}`}>
        <div className="pbar absolute bottom-0 left-0" style={{ width: `${progress}%` }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fd font-black text-xl">
            <span className="gt">harish</span><span className="text-white/30">·dev</span>
          </button>
          <div className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map(l => (<button key={l} onClick={() => go(l)} className={`fm text-[12px] transition-colors tracking-wide ${active === l.toLowerCase() ? "text-red-300" : "text-slate-500 hover:text-red-300"}`}>{l}</button>))}
            <button onClick={() => go("Contact")} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-85 transition-all" style={{ background: "#ff2b2b" }}>Let&apos;s Talk</button>
          </div>
          {/* hamburger only on tablet — hidden on mobile (bottom nav handles it) */}
          <button onClick={() => setOpen(!open)} className="hidden sm:flex lg:hidden text-slate-400 hover:text-white p-2">{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        {open && (<div className="hidden sm:flex lg:hidden gc-s border-t border-white/5 px-6 py-5 flex-col gap-4">{NAV_LINKS.map(l => (<button key={l} onClick={() => go(l)} className="text-left text-slate-400 hover:text-red-300 fm text-sm transition-colors">./{l.toLowerCase()}</button>))}</div>)}
      </nav>

      {/* Mobile bottom nav — visible only on xs screens */}
      <div className="mob-nav sm:hidden">
        {NAV_LINKS.map(l => (
          <button key={l} onClick={() => go(l)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-[40px] ${active === l.toLowerCase() ? "text-red-300" : "text-slate-600"}`}>
            {NAV_ICONS[l]}
            <span className="fm text-[7.5px] tracking-wide">{l}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function Hero() {
  const [ri, setRi] = useState(0); const [txt, setTxt] = useState(""); const [fwd, setFwd] = useState(true);
  useEffect(() => {
    const target = ROLES[ri];
    if (fwd) { if (txt.length < target.length) { const t = setTimeout(() => setTxt(target.slice(0, txt.length + 1)), 52); return () => clearTimeout(t); } const t = setTimeout(() => setFwd(false), 2000); return () => clearTimeout(t); }
    else { if (txt.length > 0) { const t = setTimeout(() => setTxt(d => d.slice(0, -1)), 24); return () => clearTimeout(t); } setRi(i => (i + 1) % ROLES.length); setFwd(true); }
  }, [txt, fwd, ri]);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <HeroGeometry />
      <Particles />
      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[650px] h-[400px] sm:h-[650px] rounded-full" style={{ background: "radial-gradient(circle,rgba(255,43,43,.08) 0%,transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full" style={{ background: "radial-gradient(circle,rgba(255,43,43,.05) 0%,transparent 70%)" }} />
      </div>
      {/* Floating badges — desktop only */}
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        {BADGES.map((b, i) => (<div key={i} className="bf absolute" style={{ ...b.style, "--d": b.d, "--dl": b.dl } as React.CSSProperties}><div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full gc-s fm text-[11px] font-medium" style={{ color: b.color, borderColor: `${b.color}25` }}><div className="w-1.5 h-1.5 rounded-full" style={{ background: b.color }} />{b.name}</div></div>))}
      </div>

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto pt-24 sm:pt-28 pb-24 sm:pb-10">
        {/* Portrait — public/harish.jpg, falls back to initials */}
        <motion.div initial={{ opacity: 0, scale: .85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .6 }} className="flex justify-center mb-5">
          <Avatar />
        </motion.div>

        {/* Terminal pill */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
          <div className="inline-flex items-center gap-2 gc-s rounded-full px-4 py-2 mb-6 border border-white/7 max-w-full overflow-hidden">
            <Terminal size={12} className="text-red-400 shrink-0" />
            <span className="fm text-[10px] sm:text-[11px] text-slate-400 truncate">
              <span className="text-red-400">harish@levelup</span>
              <span className="text-slate-600">:~$</span>
              <span className="text-green-400 ml-1.5">ship it --fast</span>
            </span>
          </div>
        </motion.div>

        {/* Name */}
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .75, delay: .1 }}
          className="fd font-black text-[2.3rem] sm:text-6xl md:text-[5.5rem] text-white leading-[1.02] tracking-tight mb-4">
          Harish<br /><span className="gt">Ramasubramanian</span>
        </motion.h1>

        {/* Typewriter */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .6, delay: .28 }}
          className="fm text-base sm:text-xl md:text-2xl text-slate-500 h-7 sm:h-8 flex items-center justify-center gap-1 mb-4">
          <span className="text-red-300">{txt}</span>
          <span className="text-red-400" style={{ animation: "blink 1s step-end infinite" }}>_</span>
        </motion.div>

        {/* Tagline */}
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .38 }}
          className="text-slate-400 text-base sm:text-lg md:text-xl max-w-xl mx-auto mb-8 leading-relaxed fb px-2">
          <span className="text-slate-500 text-sm">18 · Aurora, IL · Founder of LevelUp · VenturEd Fellow</span>
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .48 }}
          className="flex flex-col xs:flex-row gap-3 justify-center items-center mb-8 px-4">
          <button onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}
            className="group flex items-center gap-2 w-full xs:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-semibold text-white transition-all justify-center"
            style={{ background: "#ff2b2b", boxShadow: "0 0 24px rgba(255,43,43,.3)" }}>
            See My Work <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <a href={`mailto:${ME.email}`}
            className="flex items-center gap-2 w-full xs:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-semibold text-slate-300 gc border-white/10 transition-all justify-center">
            <Mail size={16} /> Say Hello
          </a>
        </motion.div>

        {/* Stat pills */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: .65 }}
          className="grid grid-cols-2 xs:grid-cols-4 gap-2 max-w-sm xs:max-w-none mx-auto px-4 xs:px-0">
          {[["50K+", "Users"], ["70+", "Countries"], ["5", "Ventures"], ["5", "Awards"]].map(([v, l], i) => (
            <div key={i} className="gc-s rounded-xl px-3 py-2.5 text-center border border-white/7">
              <div className="fd font-bold text-white text-sm sm:text-base">{v}</div>
              <div className="fm text-[9px] sm:text-[10px] text-slate-500">{l}</div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: .9 }}
          className="mt-10 sm:mt-14 flex flex-col items-center gap-2 text-slate-700">
          <ChevronDown size={16} className="animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
}

const ABOUT_STEPS = [
  { kind: "json", line: `{` },
  { kind: "json", line: `  "name":     "Harish Ramasubramanian",` },
  { kind: "json", line: `  "location": "Aurora, IL → San Francisco",` },
  { kind: "json", line: `  "building": ["LevelUp","Pippin","High Agency","Canary OS"],` },
  { kind: "json", line: `  "school":   "Metea Valley High School",` },
  { kind: "json", line: `  "fellow":   "VenturEd",` },
  { kind: "json", line: `  "awards":   ["Congressional App Challenge 2nd",` },
  { kind: "json", line: `               "NASA Space Apps Chicago 2nd","Harvard x VTSP"],` },
  { kind: "json", line: `  "available": true // Let's build!` },
  { kind: "json", line: `}` },
  { kind: "cmd", line: `node whoami.js --full` },
  { kind: "prose", line: ME.bio },
  { kind: "prose", line: ME.bio2 },
] as const;

function About() {
  const [ref, v] = useVisible();
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (step < 0 || done) return;
    if (step >= ABOUT_STEPS.length) { setDone(true); return; }
    const upcoming = ABOUT_STEPS[step];
    const delay = upcoming?.kind === "prose" ? 500 : upcoming?.kind === "cmd" ? 320 : 130;
    const t = setTimeout(() => setStep(s => s + 1), delay);
    return () => clearTimeout(t);
  }, [step, done]);

  const runAnim = () => { setStep(0); setDone(false); };
  // auto-play once the card scrolls into view, so visitors don't need to know to click run
  useEffect(() => { if (v && step === -1) runAnim(); }, [v]);

  return (
    <section id="about" className="py-16 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div ref={ref} className={`transition-all duration-1000 ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-14"}`}>
          <div className="text-center mb-10 sm:mb-16">
            <div className="sl2 mb-3">// 01 — ABOUT ME</div>
            <h2 className="fd text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">The Human Behind <span className="gt">the Code</span></h2>
            <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto">Not just a founder — a builder who genuinely loves shipping things people use.</p>
          </div>
          <div className="grid lg:grid-cols-5 gap-6 sm:gap-8">
            <div className="lg:col-span-3 space-y-4 sm:space-y-5">
              {/* Terminal bio card */}
              <div className="gc rounded-2xl p-4 sm:p-7">
                <div className="gc-s rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 border border-white/5">
                  {/* Chrome bar */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                      <span className="fm text-[10px] text-slate-600 ml-1">about.js</span>
                    </div>
                    {step < 0 ? (
                      <button onClick={runAnim}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg fm text-[10px] font-semibold transition-all active:scale-95 animate-pulse hover:animate-none"
                        style={{ background: "rgba(34,197,94,.14)", border: "1px solid rgba(74,222,128,.5)", color: "#4ade80", boxShadow: "0 0 16px rgba(74,222,128,.15)" }}>
                        <Play size={10} fill="currentColor" /> run — meet the human
                      </button>
                    ) : !done ? (
                      <span className="fm text-[10px] font-semibold flex items-center gap-1.5" style={{ color: "#4ade80" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />running…
                      </span>
                    ) : (
                      <button onClick={runAnim}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg fm text-[10px] font-semibold transition-all active:scale-95 hover:opacity-80"
                        style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", color: "#4ade80" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />done · ↻ replay
                      </button>
                    )}
                  </div>
                  {/* Animated output */}
                  <div className="fm text-[9.5px] sm:text-[11px] text-slate-400 leading-relaxed overflow-x-auto" style={{ minHeight: "8.5em" }}>
                    {step < 0 ? (
                      <span className="text-slate-600 italic">{"// click run to meet the human behind the code"}</span>
                    ) : (
                      <>
                        {ABOUT_STEPS.slice(0, step).map((s, i) => (
                          <span key={i} className="block" style={{ animationName: "slide-up-mob", animationDuration: ".18s", animationFillMode: "both" }}>
                            {s.kind === "json" ? (
                              <span className="whitespace-pre">
                                {s.line.startsWith('  "') ? (
                                  <>
                                    <span className="text-slate-600">{s.line.match(/^(\s+)/)?.[1] ?? ""}</span>
                                    <span className="text-red-400">{s.line.match(/"[^"]+"/)?.[0] ?? ""}</span>
                                    <span className="text-slate-500">{s.line.includes(":") ? ":" : ""}</span>
                                    <span className="text-red-300">{s.line.replace(/^\s+"[^"]+"\s*:\s*/, "")}</span>
                                  </>
                                ) : (
                                  <span className="text-slate-400">{s.line}</span>
                                )}
                              </span>
                            ) : s.kind === "cmd" ? (
                              <span className="whitespace-pre block mt-3 mb-2">
                                <span className="text-slate-600">$ </span>
                                <span className="text-red-300">{s.line}</span>
                              </span>
                            ) : (
                              <span className="fb text-[12px] sm:text-[13.5px] text-slate-300 leading-relaxed block mb-3 whitespace-normal">{s.line}</span>
                            )}
                          </span>
                        ))}
                        {!done && <span className="text-red-400" style={{ animation: "blink 1s step-end infinite" }}>▋</span>}
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Contact */}
              <div className="gc rounded-2xl p-4 sm:p-5">
                <div className="sl2 mb-3">// contact</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {[{ icon: Mail, v: ME.email, href: `mailto:${ME.email}` }, { icon: Instagram, v: "instagram.com/harishking8346", href: ME.instagram }, { icon: MapPin, v: ME.location, href: "#" }, { icon: Linkedin, v: "linkedin.com/in/harish-ramasubramanian", href: ME.linkedin }].map(({ icon: Icon, v: val, href }, i) => (
                    <a key={i} href={href} className="flex items-center gap-3 text-slate-400 hover:text-red-300 fm text-[11px] sm:text-[12px] transition-colors min-h-[44px]">
                      <Icon size={14} className="text-red-400 shrink-0" /><span className="truncate">{val}</span>
                    </a>
                  ))}
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {[{ v: "50K+", l: "Users", Icon: Zap }, { v: "5", l: "Ventures", Icon: Rocket }, { v: "70+", l: "Countries", Icon: Globe }, { v: "23", l: "Person Team", Icon: Users }].map((s, i) => (
                  <div key={i} className="gc rounded-xl p-3 sm:p-4 text-center">
                    <s.Icon size={18} className="text-red-400 mb-1 mx-auto" />
                    <div className="fd font-black text-white text-lg sm:text-xl gt-p">{s.v}</div>
                    <div className="fm text-[9px] sm:text-[10px] text-slate-500 mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Education col */}
            <div className="lg:col-span-2 space-y-4">
              <div className="sl2 mb-2">// education &amp; fellowship</div>
              {[...EDUCATION, ...FELLOWSHIPS].map((ed, i) => (
                <div key={i} className="gc rounded-2xl p-5 sm:p-6">
                  {i < EDUCATION.length ? <GraduationCap size={26} className="text-red-400 mb-3" /> : <Rocket size={24} className="text-red-400 mb-3" />}
                  <div className="fm text-[10px] text-red-400 tracking-widest mb-1">{ed.period}</div>
                  <h3 className="fd font-bold text-white text-base sm:text-lg mb-1">{ed.degree}</h3>
                  <p className="text-red-300 text-sm mb-3 fb">{ed.college}</p>
                  <p className="fb text-slate-400 text-sm leading-relaxed italic">"{ed.note}"</p>
                </div>
              ))}
              <div className="gc rounded-2xl p-5 sm:p-6 border border-red-500/20" style={{ background: "linear-gradient(135deg,rgba(255,43,43,.06),rgba(255,43,43,.03))" }}>
                <Heart size={18} className="text-red-400 mb-3" />
                <div className="fd font-bold text-white mb-2">What drives me</div>
                <p className="fb text-slate-400 text-sm leading-relaxed">Making it easier for the next builder to actually get seen. Every company I&apos;ve started comes back to that one problem.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Logo({ exp, round = false }: { exp: Exp; round?: boolean }) {
  if (exp.logo) return <img src={exp.logo} alt={exp.company} className={`w-full h-full object-contain ${round ? "rounded-full" : ""}`} />;
  const initials = exp.company.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return <span className="fd font-black text-[13px] leading-none" style={{ color: exp.color }}>{initials}</span>;
}

function ExperienceCard({ exp, leftSide }: { exp: Exp; leftSide: boolean }) {
  const [ref, v] = useVisible(0.15);
  const hiddenX = leftSide ? "-translate-x-10 sm:-translate-x-24" : "translate-x-10 sm:translate-x-24";
  return (
    <div ref={ref} className={`gc rounded-2xl overflow-hidden border border-white/7 p-4 sm:p-6 transition-all duration-700 ease-out ${v ? "opacity-100 translate-x-0" : `opacity-0 ${hiddenX}`}`} style={{ borderColor: `${exp.color}28` }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${exp.color}70`; el.style.boxShadow = `0 0 0 1px ${exp.color}22,0 24px 56px rgba(0,0,0,.5)`; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${exp.color}28`; el.style.boxShadow = ""; }}>
      <div className={`flex items-start gap-3 mb-3 ${leftSide ? "md:flex-row-reverse md:text-right" : ""}`}>
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-1.5 ${exp.logo ? "bg-white" : "gc-s border border-white/10"}`}>
          <Logo exp={exp} />
        </div>
        <div>
          <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1 ${leftSide ? "md:justify-end" : ""}`}>
            <h3 className="fd font-bold text-white text-base sm:text-lg leading-tight">{exp.role}</h3>
            <span className="fm text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full" style={{ color: exp.color, background: `${exp.color}18`, border: `1px solid ${exp.color}28` }}>{exp.company}</span>
          </div>
          <div className={`flex flex-wrap gap-1.5 fm text-[10px] sm:text-[11px] text-slate-500 ${leftSide ? "md:justify-end" : ""}`}>
            {exp.period && <><span>{exp.period}</span><span>·</span></>}<span>{exp.duration}</span>
          </div>
        </div>
      </div>
      <p className="fb text-slate-300 leading-relaxed mb-4 text-sm sm:text-base">{exp.summary}</p>
      <div className="space-y-2 mb-4">
        {exp.bullets.map((b, j) => (
          <div key={j} className="flex items-start gap-2.5 fb text-[12px] sm:text-[13px] text-slate-400">
            <CheckCircle size={12} className="shrink-0 mt-0.5" style={{ color: exp.color }} />{b}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {exp.tech.map(t => (<span key={t} className="fm text-[9px] sm:text-[10px] px-2 py-0.5 sm:py-1 rounded-lg border" style={{ color: exp.color, background: `${exp.color}0d`, borderColor: `${exp.color}22` }}>{t}</span>))}
      </div>
    </div>
  );
}

function Experience() {
  const [ref, v] = useVisible(); return (
    <section id="experience" className="py-16 sm:py-28 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div ref={ref} className={`transition-all duration-1000 ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-14"}`}>
          <div className="text-center mb-10 sm:mb-16">
            <div className="sl2 mb-3">// 02 — EXPERIENCE</div>
            <h2 className="fd text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">Where I&apos;ve <span className="gt">Grown</span></h2>
            <p className="text-slate-500 text-base sm:text-lg">From a solo build to a 23-person team — every role shaped how I build.</p>
          </div>
          <div className="relative">
            {/* center timeline line — desktop only */}
            <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px tll" />
            <div className="space-y-6 md:space-y-10">
              {EXPERIENCE.map((exp, i) => {
                const leftSide = i % 2 === 0;
                return (
                  <div key={i} className="relative md:grid md:grid-cols-[1fr_2.5rem_1fr] md:gap-6 items-start">
                    <div className="hidden md:flex md:col-start-2 justify-center">
                      <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 overflow-hidden p-1 ${exp.logo ? "bg-white" : "bg-black"}`} style={{ borderColor: exp.color }}>
                        <Logo exp={exp} round />
                      </div>
                    </div>
                    <div className={leftSide ? "md:col-start-1 md:row-start-1" : "md:col-start-3 md:row-start-1"}>
                      <ExperienceCard exp={exp} leftSide={leftSide} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Skills() {
  const [ref, v] = useVisible(); return (
    <section id="skills" className="py-16 sm:py-28 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div ref={ref} className={`transition-all duration-1000 ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-14"}`}>
          <div className="text-center mb-10 sm:mb-16">
            <div className="sl2 mb-3">// 03 — SKILLS</div>
            <h2 className="fd text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">My <span className="gt">Toolkit</span></h2>
            <p className="text-slate-500 text-base sm:text-lg">What I use to take an idea from a prompt to real users.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 items-start">
            {TOOLKIT.map(t => {
              const Icon = t.icon; return (
                <div key={t.name} className="gc rounded-2xl p-4 sm:p-5 border border-white/7 flex flex-col items-center text-center transition-all duration-300 cursor-default"
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = `${t.color}55`; el.style.boxShadow = `0 0 24px ${t.color}1a`;
                    const dot = el.querySelector<HTMLElement>("[data-dot]"); if (dot) dot.style.opacity = "1";
                    const desc = el.querySelector<HTMLElement>("[data-desc]"); if (desc) { desc.style.maxHeight = "60px"; desc.style.opacity = "1"; desc.style.marginTop = "6px"; }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = ""; el.style.boxShadow = "";
                    const dot = el.querySelector<HTMLElement>("[data-dot]"); if (dot) dot.style.opacity = "0";
                    const desc = el.querySelector<HTMLElement>("[data-desc]"); if (desc) { desc.style.maxHeight = "0px"; desc.style.opacity = "0"; desc.style.marginTop = "0px"; }
                  }}>
                  <div className="relative mb-3">
                    <Icon size={32} style={{ color: t.color }} />
                    <div data-dot className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full transition-opacity duration-300" style={{ background: t.color, boxShadow: `0 0 6px ${t.color}`, opacity: 0 }} />
                  </div>
                  <div className="fd font-bold text-white text-[13px] sm:text-sm">{t.name}</div>
                  <p data-desc className="fb text-slate-500 text-[10.5px] leading-snug overflow-hidden transition-all duration-300" style={{ maxHeight: 0, opacity: 0 }}>{t.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 sm:mt-10">
            <div className="sl2 mb-3 text-center">// core founder skills</div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              {CORE_SKILLS.map(s => (
                <span key={s} className="px-3.5 py-2 rounded-full gc-s border border-red-500/20 text-slate-300 fm text-[11px] sm:text-[12px]">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Projects() {
  const [ref, v] = useVisible(); const [tab, setTab] = useState<0 | 1>(0); const [open, setOpen] = useState<number | null>(null);
  const list = tab === 0 ? FOUNDED : CO_FOUNDED;
  return (
    <section id="projects" className="py-16 sm:py-28 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div ref={ref} className={`transition-all duration-1000 ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-14"}`}>
          <div className="text-center mb-8 sm:mb-10">
            <div className="sl2 mb-3">// 04 — PROJECTS</div>
            <h2 className="fd text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">Things I&apos;ve <span className="gt">Built</span></h2>
            <p className="text-slate-500 text-base sm:text-lg">Companies I&apos;ve founded and co-founded — live, shipping, and in front of real users.</p>
          </div>

          {/* Live links — full history lives in Experience */}
          <div className="mb-10 sm:mb-14">
            <div className="sl2 mb-3 text-center">// live now</div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              {VENTURE_CHIPS.map(p => (
                <a key={p.name} href={`https://${p.url}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full gc-s border border-white/10 text-slate-300 hover:text-white hover:border-red-500/30 transition-all fm text-[11px] sm:text-[12px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />{p.name}
                </a>
              ))}
              <button onClick={() => document.getElementById("experience")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full fm text-[11px] sm:text-[12px] text-red-300 hover:text-white transition-all"
                style={{ background: "rgba(255,43,43,.12)", border: "1px solid rgba(255,43,43,.3)" }}>
                Full experience <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Tab switcher — full width on mobile */}
          <div className="flex justify-center mb-7 sm:mb-10">
            <div className="gc-s rounded-xl p-1 flex gap-1 border border-white/7 w-full sm:w-auto">
              {[{ label: "Founded", Icon: Rocket }, { label: "Co-founded", Icon: Users }].map((t, i) => (
                <button key={i} onClick={() => { setTab(i as 0 | 1); setOpen(null); }}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-lg fm text-[11px] sm:text-[12px] font-medium transition-all duration-200 min-h-[44px] ${tab === i ? "text-white" : "text-slate-500"}`}
                  style={tab === i ? { background: "#ff2b2b" } : {}}>
                  <t.Icon size={13} />{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project cards — real screenshots + live links */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
            {list.map((p, i) => (
              <div key={p.title} className="gc rounded-2xl overflow-hidden border border-white/7 cursor-pointer active:opacity-90 transition-opacity"
                onClick={() => setOpen(open === i ? null : i)}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${p.color}70`; el.style.boxShadow = `0 0 0 1px ${p.color}22,0 24px 56px rgba(0,0,0,.5)`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = ""; el.style.boxShadow = ""; }}>
                {/* Screenshot header */}
                <div className="h-32 sm:h-36 relative overflow-hidden" style={{ background: `linear-gradient(135deg,${p.g1},${p.g2})` }}>
                  <ProjectPreview kind={p.preview} />
                  {/* A real screenshot at p.img replaces the designed preview automatically */}
                  <img src={p.img} alt={`${p.title} screenshot`} loading="lazy"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    className="absolute inset-0 w-full h-full object-cover object-top opacity-90" />
                  <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to top,${p.g2}cc,transparent 60%)` }} />
                  {p.url && <div className="absolute top-3 right-3">
                    <a href={`https://${p.url}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center text-white">
                      <ExternalLink size={14} />
                    </a>
                  </div>}
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="fd font-bold text-white text-lg sm:text-xl">{p.title}</h3>
                      <p className="fm text-[11px] sm:text-[12px]" style={{ color: p.color }}>{p.sub}</p>
                    </div>
                    <ChevronDown size={16} className={`text-slate-600 shrink-0 mt-1 transition-transform ${open === i ? "rotate-180" : ""}`} />
                  </div>
                  <p className="fb text-slate-400 text-[12px] sm:text-sm leading-relaxed mb-3 sm:mb-4">{p.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {p.tech.map(t => (<span key={t} className="fm text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded gc-s border border-white/7 text-slate-400">{t}</span>))}
                  </div>
                  {open === i && p.url && (
                    <div className="mt-4 pt-4 border-t border-white/7">
                      <a href={`https://${p.url}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-2 fm text-[11px] px-3 py-2.5 rounded-lg min-h-[44px] transition-all"
                        style={{ color: p.color, background: `${p.color}14`, border: `1px solid ${p.color}28` }}>
                        <Globe size={12} /> Visit {p.url}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-600 fm text-[11px] sm:text-[12px] mt-6 sm:mt-8">{tab === 0 ? "...plus a growing media presence documenting it all" : "...each one built with a team I trust"}</p>
        </div>
      </div>
    </section>
  );
}

function Awards() {
  const [ref, v] = useVisible();
  return (
    <section id="awards" className="py-16 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-1/3 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full pointer-events-none opacity-[.05]" style={{ background: "radial-gradient(circle,#ff2b2b,transparent)" }} />
      <div className="max-w-7xl mx-auto">
        <div ref={ref} className={`transition-all duration-1000 ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-14"}`}>
          <div className="text-center mb-10 sm:mb-16">
            <div className="sl2 mb-3">// 05 — AWARDS</div>
            <h2 className="fd text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">Wins &amp; <span className="gt">Recognition</span></h2>
            <p className="text-slate-500 text-base sm:text-lg">National app challenges, hackathons and pitch stages — from Chicago to Harvard.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {AWARDS.map((a, i) => (
              <div key={a.title} className={`gc rounded-2xl p-5 sm:p-6 border ${a.hot ? "gb" : "border-white/7"}`}
                style={a.hot ? { background: "linear-gradient(135deg,rgba(255,43,43,.08),rgba(255,43,43,.02))" } : {}}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl gc-s border border-red-500/30 flex items-center justify-center text-red-400">
                    <Trophy size={20} />
                  </div>
                  <span className="fm text-[10px] text-slate-600">#{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="fd font-black text-2xl gt mb-1">{a.result}</div>
                <h3 className="fd font-bold text-white text-base sm:text-lg leading-tight">{a.title}</h3>
                <p className="fm text-[11px] text-slate-500 mt-1.5">{a.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 sm:mt-14">
            <div className="sl2 mb-3 text-center">// pitched on stage at</div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              {PITCHES.map(p => (
                <span key={p} className="flex items-center gap-2 px-4 py-2.5 rounded-full gc-s border border-red-500/20 text-slate-200 fm text-[11px] sm:text-[12px]">
                  <Mic size={12} className="text-red-400" />{p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Showcase() {
  const [ref, v] = useVisible();
  const [d, setD] = useState(0);
  const demo = SHADER_DEMOS[d];
  const initP = (i: number) => Object.fromEntries(SHADER_DEMOS[i].controls.map(c => [c.key, c.def]));
  const [params, setParams] = useState(() => initP(0));
  const changeDemo = (i: number) => { setD(i); setParams(initP(i)); };
  const setParam = (k: string, val: number) => setParams(p => ({ ...p, [k]: val }));

  const Controls = ({ cls = "" }: { cls?: string }) => (
    <div className={cls}>
      <div className="sl2 mb-3">// uniform controls</div>
      {demo.controls.map(c => (
        <div key={c.key} className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="fm text-[11px] text-slate-400">{c.label}</span>
            {c.type !== "mode" && <span className="fm text-[11px] text-red-400 tabular-nums">{params[c.key].toFixed(c.step < 1 ? 2 : 0)}</span>}
          </div>
          {c.type === "mode" ? (
            <div className="flex flex-wrap gap-1.5">
              {(c.options ?? []).map((opt, idx) => (
                <button key={idx} onClick={() => setParam(c.key, idx)}
                  className={`px-2.5 py-1 rounded-lg fm text-[10px] font-medium transition-all ${Math.round(params[c.key]) === idx ? "text-white" : "gc-s border border-white/10 text-slate-400 hover:text-white"}`}
                  style={Math.round(params[c.key]) === idx ? { background: "#ff2b2b" } : {}}>
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <>
              <input type="range" className="su"
                min={c.min} max={c.max} step={c.step} value={params[c.key]}
                onChange={e => setParam(c.key, parseFloat(e.target.value))} />
              <div className="flex justify-between mt-0.5">
                <span className="fm text-[9px] text-slate-700 italic">{c.key}</span>
                <span className="fm text-[9px] text-slate-700">{c.min} – {c.max}</span>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <section id="showcase" className="py-16 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full pointer-events-none opacity-[.04]" style={{ background: "radial-gradient(circle,#ff2b2b,transparent)" }} />
      <div className="max-w-7xl mx-auto">
        <div ref={ref} className={`transition-all duration-1000 ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-14"}`}>
          <div className="text-center mb-8 sm:mb-14">
            <div className="sl2 mb-3">// 06 — 3D PLAYGROUND</div>
            <h2 className="fd text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">Play With <span className="gt">Real Shaders</span></h2>
            <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto">Live Three.js + GLSL demos. Drag the sliders to change shader uniforms in real time.</p>
          </div>

          {/* Mobile: horizontal scroll tabs */}
          <div className="demo-tabs lg:hidden mb-4 -mx-1 px-1">
            {SHADER_DEMOS.map((dm, i) => (
              <button key={i} onClick={() => changeDemo(i)}
                className={`demo-tab flex items-center gap-2 px-4 py-2.5 rounded-xl border fm text-[11px] font-medium whitespace-nowrap min-h-[44px] transition-all ${d === i ? "gb gc text-white" : "gc-s border-white/7 text-slate-400"}`}>
                {dm.name}
                {d === i && <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Desktop sidebar */}
            <div className="hidden lg:flex flex-col gap-3">
              {SHADER_DEMOS.map((dm, i) => (
                <button key={i} onClick={() => changeDemo(i)} className={`text-left p-4 rounded-2xl border transition-all duration-300 ${d === i ? "gb gc" : "gc border-white/7"}`}>
                  <div className="flex items-center gap-3 mb-1"><div className="fd font-semibold text-white text-sm">{dm.name}</div></div>
                  <div className="fm text-[11px] text-slate-500 leading-relaxed">{dm.desc}</div>
                  {d === i && (<div className="mt-2 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /><span className="fm text-[9px] text-red-400 tracking-widest">LIVE · GLSL</span></div>)}
                </button>
              ))}
              {/* Uniform controls — desktop */}
              <div className="gc rounded-2xl p-4 border border-red-500/20" style={{ background: "linear-gradient(135deg,rgba(255,43,43,.04),rgba(255,43,43,.02))" }}>
                <Controls />
              </div>
            </div>

            {/* Shader canvas */}
            <div className="lg:col-span-2 gc-s rounded-2xl overflow-hidden border border-white/7 sw flex flex-col">
              <div className="sl-anim" />
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/7 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/65" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/65" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/65" />
                  <span className="fm text-[10px] sm:text-[11px] text-slate-600 ml-2">{demo.name.toLowerCase().replace(/ /g, "_")}.glsl</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="fm text-[9px] sm:text-[10px] text-red-400/60">WebGL · Three.js · 60fps</span>
                </div>
              </div>
              <div className="flex-1" style={{ minHeight: "min(360px,52vw)" }}>
                {demo.canvasType === "particles"
                  ? <ParticleCanvas key={d} params={params} />
                  : <ShaderCanvas key={d} demo={demo} params={params} />}
              </div>
              {/* Mobile uniform sliders */}
              <div className="lg:hidden border-t border-white/7 px-4 py-4">
                <Controls />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [ref, v] = useVisible();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [globeMode, setGlobeMode] = useState<"day" | "night">(() => isLocalNight() ? "night" : "day");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${ME.email}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          _subject: `Portfolio Contact from ${form.name}`,
          _captcha: "false",
        }),
      });
      if (res.ok) { setStatus("sent"); setForm({ name: "", email: "", message: "" }); }
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  return (
    <section id="contact" className="py-16 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[700px] h-[250px] sm:h-[350px] pointer-events-none" style={{ background: "radial-gradient(ellipse,rgba(255,43,43,.06),transparent)" }} />
      <div className="max-w-5xl mx-auto">
        <div ref={ref} className={`transition-all duration-1000 ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-14"}`}>
          <div className="text-center mb-10 sm:mb-14">
            <div className="sl2 mb-3">// 07 — CONTACT</div>
            <h2 className="fd text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">Let&apos;s Build <span className="gt">Something Together</span></h2>
            <p className="text-slate-500 text-base sm:text-lg">I reply fast. Reach out about LevelUp, investing, mentorship, or building something together.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
            {/* Form */}
            <div className="gc rounded-2xl p-5 sm:p-7 border border-white/7">
              {status === "sent" ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <PartyPopper size={40} className="text-red-400 mb-4" />
                  <div className="fd font-bold text-white text-xl mb-2">Message sent!</div>
                  <p className="fb text-slate-400 text-sm">I&apos;ll reply to you within 24 hours.</p>
                  <button onClick={() => setStatus("idle")} className="mt-6 fm text-[11px] text-red-400 hover:text-red-300 underline underline-offset-2">Send another</button>
                </div>
              ) : status === "error" ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertTriangle size={40} className="text-red-400 mb-4" />
                  <div className="fd font-bold text-white text-xl mb-2">Something went wrong</div>
                  <p className="fb text-slate-400 text-sm mb-4">Try emailing directly at <a href={`mailto:${ME.email}`} className="text-red-300 underline">{ME.email}</a></p>
                  <button onClick={() => setStatus("idle")} className="fm text-[11px] text-red-400 hover:text-red-300 underline underline-offset-2">Try again</button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div className="sl2 mb-1">// drop me a message</div>
                  {[{ k: "name", ph: "Your name", t: "text" }, { k: "email", ph: "your@email.com", t: "email" }].map(({ k, ph, t }) => (
                    <div key={k}>
                      <label className="fm text-[11px] text-slate-600 block mb-1.5">{k}</label>
                      <input type={t} required value={form[k as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={ph}
                        className="w-full px-4 py-3.5 rounded-xl gc-s border border-white/10 text-white placeholder-slate-700 focus:outline-none focus:border-red-500/50 transition-all fm text-sm min-h-[48px]" />
                    </div>
                  ))}
                  <div>
                    <label className="fm text-[11px] text-slate-600 block mb-1.5">message</label>
                    <textarea required rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="What are you building?"
                      className="w-full px-4 py-3.5 rounded-xl gc-s border border-white/10 text-white placeholder-slate-700 focus:outline-none focus:border-red-500/50 transition-all fm text-sm resize-none" />
                  </div>
                  <button type="submit" disabled={status === "sending"}
                    className="w-full py-4 rounded-xl font-semibold text-white min-h-[52px] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: "#ff2b2b" }}>
                    {status === "sending" ? "Sending…" : "Send it"}
                  </button>
                </form>
              )}
            </div>
            {/* Info */}
            <div className="space-y-3 sm:space-y-4">
              {/* Earth globe */}
              <div className="gc-s rounded-2xl overflow-hidden border border-red-500/20 relative" style={{ height: "340px" }}>
                <EarthGlobeCanvas mode={globeMode} />
                <button onClick={() => setGlobeMode(m => m === "day" ? "night" : "day")}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full gc-s border border-white/10 fm text-[10px] text-slate-300 hover:text-white transition-all">
                  {globeMode === "day" ? <Sun size={12} /> : <Moon size={12} />}
                  {globeMode === "day" ? "Day" : "Night"}
                </button>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 pointer-events-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="fm text-[9px] text-red-300/70 tracking-wide">drag to orbit</span>
                </div>
              </div>
              <div className="gc rounded-2xl p-5 sm:p-6 border border-white/7">
                <div className="flex items-center gap-2 mb-3"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="fm text-[12px] text-green-400">Building in public</span></div>
                <h3 className="fd font-bold text-white text-lg mb-2">Open to Conversations</h3>
                <p className="fb text-slate-400 text-sm leading-relaxed">Investors, mentors, co-founders and early LevelUp users. Based in Aurora, IL — relocating to San Francisco.</p>
              </div>
              {[
                { Icon: Mail, label: "Email", val: ME.email, href: `mailto:${ME.email}`, target: "_self" },
                { Icon: Instagram, label: "Instagram", val: "@harishking8346", href: ME.instagram, target: "_blank" },
                { Icon: MapPin, label: "Location", val: ME.location, href: "#", target: "_self" },
                { Icon: Linkedin, label: "LinkedIn", val: "harish-ramasubramanian", href: ME.linkedin, target: "_blank" },
              ].map(({ Icon, label, val, href, target }, i) => (
                <a key={i} href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-3 gc rounded-xl p-3.5 sm:p-4 border border-white/7 group min-h-[56px]">
                  <div className="w-9 h-9 rounded-lg gc-s border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-red-400 group-hover:border-red-500/30 transition-all shrink-0">
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-sm font-semibold">{label}</div>
                    <div className="fm text-[10px] sm:text-[11px] text-slate-500 truncate">{val}</div>
                  </div>
                  <ArrowRight size={14} className="ml-auto text-slate-700 group-hover:text-red-400 shrink-0 transition-all" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 sm:py-10 px-4 sm:px-6 border-t border-white/5 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:pb-10">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-1 text-center">
        <div className="fd font-black text-xl mb-0.5"><span className="gt">harish</span><span className="text-white/30">·dev</span></div>
        <div className="fm text-[10px] text-slate-600">Harish Ramasubramanian · Founder · Aurora, IL</div>
      </div>
    </footer>
  );
}

export default function App() {
  const progress = useScrollPct(); return (
    <div className="min-h-screen bg-black text-[#f1f0ff] overflow-x-hidden">
      <style>{G}</style>
      <Cursor />
      <Nav progress={progress} />
      <main className="sm:pb-0">
        <Hero /><About /><Experience /><Skills /><Projects /><Awards /><Showcase /><Contact />
      </main>
      <Footer />
    </div>
  );
}
