// Natural typing on a physical keyboard: how long each key is held down.
// Based on neuroQWERTY (Giancardo et al., Sci Rep 2016): hold times are longer and more variable in early Parkinson's.
import { mean } from '../dsp.js';

const pct = (s, q) => { const i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
export function typingMetrics(holdsMs) {
  const h = holdsMs.filter((v) => v > 10 && v < 1500).sort((a, b) => a - b);
  if (h.length < 60) return null;
  const m = mean(h), sd = Math.sqrt(mean(h.map((v) => (v - m) ** 2)));
  return {
    keys: h.length,
    median: pct(h, 0.5),                         // ms
    iqr: pct(h, 0.75) - pct(h, 0.25),            // ms, spread of hold times
    longShare: 100 * h.filter((v) => v > 200).length / h.length, // % of keys held over 200 ms
    cv: sd / m
  };
}
export const supported = () => matchMedia('(pointer: fine)').matches;

const PASSAGES = [
  'The morning train was late again, so I walked along the river and watched the boats drift past the old mill. A man was painting the railings green, and a dog waited patiently beside his bucket.',
  'My grandmother kept a garden full of tomatoes, beans and tall sunflowers. Every summer we picked them together, and she would tell stories about the farm where she grew up.',
  'On Saturdays the market opens early. People line up for fresh bread, honey and apples, and a small band plays near the fountain while children chase pigeons across the square.'
];
export function run(stage, { seconds = 60 }) {
  return new Promise((resolve) => {
    const text = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    stage.innerHTML = `<div class="type-stage"><p class="tap-hint">Type the passage below at your normal pace. Mistakes don't matter; don't stop to fix them.</p>
      <blockquote class="passage">${text}</blockquote>
      <textarea class="typebox" rows="5" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Type the passage here" placeholder="Start typing…"></textarea>
      <div class="row"><span class="mono muted" data-left>${seconds} s · 0 keys</span><button class="btn primary" data-done disabled>Done</button></div></div>`;
    const box = stage.querySelector('textarea'), down = new Map(), holds = []; let t0 = null, timer;
    box.focus();
    const label = stage.querySelector('[data-left]'), btn = stage.querySelector('[data-done]');
    const tick = () => { const left = Math.max(0, seconds - (performance.now() - t0) / 1000); label.textContent = `${Math.ceil(left)} s · ${holds.length} keys`; if (left <= 0) finish(); };
    box.addEventListener('keydown', (e) => {
      if (e.repeat || e.isComposing || e.key.length > 1 && e.key !== ' ') return;   // letters, digits, punctuation, space
      if (t0 === null) { t0 = performance.now(); timer = setInterval(tick, 250); }
      down.set(e.code, e.timeStamp);
    });
    box.addEventListener('keyup', (e) => { const s = down.get(e.code); if (s != null) { holds.push(e.timeStamp - s); down.delete(e.code); btn.disabled = holds.length < 60; } });
    btn.addEventListener('click', finish);
    function finish() { clearInterval(timer); resolve(typingMetrics(holds)); }
  });
}
