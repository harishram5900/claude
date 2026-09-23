# Harish Ramasubramanian — founder portfolio

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion. Single scrolling page, dark-first, brand tokens shared with the pitch deck.

## Run locally

```bash
npm install && npm run dev   # http://localhost:3000
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel          # first run: log in, accept the detected Next.js settings (preview deploy)
vercel --prod   # promote to production
```

Or import the GitHub repo at vercel.com/new — no extra config needed.

## Where things live

| Path | What |
| --- | --- |
| `lib/links.ts` | **Every external link / `[REPLACE ME]` placeholder** |
| `app/globals.css` | Color tokens (`--cream`, `--gold`, …), grain overlay, focus styles |
| `tailwind.config.ts` | Tailwind theme mapped to those tokens, fluid display type sizes |
| `lib/motion.ts` | Shared spring + reveal variants |
| `components/sections/*` | One file per page section (Hero, About, LevelUp, Ventures, …) |
| `components/ui/*` | Reveal, Counter, Cursor, Magnetic, SectionLabel |

## `[REPLACE ME]` placeholders

All in `lib/links.ts`: `email`, `linkedin`, `resume`, `instagram`, `youtube`.
Until they're filled in, those links point at `#contact` and show `[REPLACE ME]` in the Contact section.
For the resume, drop `resume.pdf` into `/public` and set `resume: "/resume.pdf"`.
