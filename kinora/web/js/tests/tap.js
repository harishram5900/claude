// Finger tapping (adapted from MDS-UPDRS item 3.4): alternate between two targets as fast as possible.
import { mean, cv } from '../dsp.js';

export function tapMetrics(taps, targets, durationMs) {
  const n = taps.length, iti = [];
  for (let i = 1; i < n; i++) iti.push(taps[i].t - taps[i - 1].t);
  const third = Math.max(1, Math.floor(iti.length / 3));
  const first = mean(iti.slice(0, third)), last = mean(iti.slice(-third));
  let alt = 0; for (let i = 1; i < n; i++) if (taps[i].target >= 0 && taps[i].target !== taps[i - 1].target) alt++;
  const err = taps.filter((t) => t.target >= 0).map((t) => { const g = targets[t.target]; return Math.hypot(t.x - g.x, t.y - g.y) / g.r; });
  return {
    taps: n,
    rate: n / (durationMs / 1000),                       // taps per second
    rhythmCV: iti.length > 2 ? cv(iti) : NaN,            // variability of the interval between taps
    decrement: iti.length > 5 ? (last - first) / first : NaN, // >0 means slowing down over the 10 s
    alternation: n > 1 ? alt / (n - 1) : NaN,            // share of taps that switched target correctly
    accuracy: err.length ? mean(err) : NaN                // mean distance from target centre, in target radii
  };
}

export function run(stage, { hand, seconds = 10 }) {
  return new Promise((resolve) => {
    stage.innerHTML = `<div class="tap-stage"><p class="tap-hint" data-hint>Use your <b>${hand}</b> index finger. Tap the two circles one after the other, as fast as you can. The timer starts on your first tap.</p>
      <div class="tap-timer mono" data-timer>${seconds.toFixed(1)} s</div>
      <button class="tap-target" data-i="0" aria-label="Left target"></button><button class="tap-target" data-i="1" aria-label="Right target"></button>
      <div class="tap-count mono" data-count>0 taps</div></div>`;
    const root = stage.firstElementChild, btns = [...root.querySelectorAll('.tap-target')], taps = [];
    let t0 = null, raf;
    const targets = () => btns.map((b) => { const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 }; });
    const geo = targets();
    const tick = () => {
      const left = Math.max(0, seconds - (performance.now() - t0) / 1000);
      root.querySelector('[data-timer]').textContent = `${left.toFixed(1)} s`;
      if (left <= 0) return finish(); raf = requestAnimationFrame(tick);
    };
    const onDown = (e) => {
      e.preventDefault();
      if (t0 === null) { t0 = performance.now(); root.querySelector('[data-hint]').style.visibility = 'hidden'; raf = requestAnimationFrame(tick); }
      const t = performance.now() - t0; if (t > seconds * 1000) return;
      let best = -1, bd = Infinity; geo.forEach((g, i) => { const d = Math.hypot(e.clientX - g.x, e.clientY - g.y); if (d < bd) { bd = d; best = i; } });
      const target = bd <= geo[best].r * 1.6 ? best : -1;
      taps.push({ t, x: e.clientX, y: e.clientY, target });
      if (target >= 0) { btns[target].classList.remove('hit'); void btns[target].offsetWidth; btns[target].classList.add('hit'); }
      root.querySelector('[data-count]').textContent = `${taps.length} taps`;
      if (navigator.vibrate) navigator.vibrate(4);
    };
    root.addEventListener('pointerdown', onDown);
    function finish() { cancelAnimationFrame(raf); root.removeEventListener('pointerdown', onDown); resolve(tapMetrics(taps, geo, seconds * 1000)); }
  });
}
