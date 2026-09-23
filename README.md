# harish·dev — Harish Ramasubramanian

Single-page portfolio: Vite + React 18 + Tailwind CSS v4 + Three.js (particle hero, wireframe shapes,
live GLSL shader playground, day/night Earth globe) + Motion.

Layout, motion and 3D effects are adapted from the adi·dev portfolio template by Adi Chandra Narayana Dasari.

## Run locally

```bash
npm install && npm run dev
```

## Edit content

Everything is in the data block at the top of `src/app/App.tsx`
(`ME`, `ROLES`, `EXPERIENCE`, `TOOLKIT`, `FOUNDED`, `CO_FOUNDED`, `AWARDS`, `PITCHES`).

- **Photo:** save a square photo as `public/harish.jpg` (initials show until then).
- **Project screenshots:** optional — see `public/projects/README.txt`.
- **Contact form:** sends via FormSubmit to the email in `ME.email`. The first submission triggers a
  one-time activation email from FormSubmit — click the link in it once.

## Deploy

```bash
npx vercel --prod
```
