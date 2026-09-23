# Harish Ramasubramanian — portfolio

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion · React Three Fiber (3D globe) · Lenis smooth scroll.
Dark/light themes, custom cursor, tilt cards, typed hero roles, scroll progress.

## Run locally

```bash
npm install && npm run dev   # http://localhost:3000
```

## Edit content

| Path | What |
| --- | --- |
| `lib/profile.ts` | **All content**: roles, stats, ventures, awards, pitches, experience, skills, portrait |
| `lib/links.ts` | Email, LinkedIn, Instagram, résumé, YouTube |
| `app/globals.css` | Theme colors (dark + light) |
| `components/sections/*` | One file per section |
| `components/three/Globe.tsx` | The 3D globe |

### Add your photo
Save a square photo as `public/harish.jpg`, then set `portrait: "/harish.jpg"` in `lib/profile.ts`.

### Still to fill in
`resume` and `youtube` in `lib/links.ts` — they stay hidden on the site until set.

## Deploy

```bash
npx vercel --prod
```
