// Archimedean spiral tracing: drawing accuracy plus tremor in the 3.5–8 Hz band.
import { mean, resample, spectrum, peakFreq } from '../dsp.js';

export function spiralTemplate(cx, cy, R, turns) {
  const points = [], thMax = 2 * Math.PI * turns;
  for (let th = 0; th <= thMax; th += 0.02) { const r = R * th / thMax; points.push({ x: cx + r * Math.cos(th), y: cy + r * Math.sin(th), th }); }
  return { cx, cy, R, turns, thMax, points };
}
const movingAvg = (y, w) => { const out = [], h = Math.floor(w / 2); let s = 0; const c = [0]; for (const v of y) c.push(s += v);
  for (let i = 0; i < y.length; i++) { const a = Math.max(0, i - h), b = Math.min(y.length, i + h + 1); out.push((c[b] - c[a]) / (b - a)); } return out; };

export function spiralMetrics(pts, sp) {
  if (pts.length < 20) return null;
  const t = [], e = []; let acc = null, prev = null, len = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], dx = p.x - sp.cx, dy = p.y - sp.cy, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    if (i) len += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
    if (acc === null) { if (r < 0.06 * sp.R) continue; acc = (a + 2 * Math.PI) % (2 * Math.PI); prev = a; }
    else { let d = a - prev; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; acc += d; prev = a; }
    t.push(p.t); e.push(r - sp.R * acc / sp.thMax);
  }
  if (e.length < 20) return null;
  const dur = (pts[pts.length - 1].t - pts[0].t) / 1000;
  const u = resample(t, e, 60), ma = movingAvg(u, 24), hp = u.map((v, i) => v - ma[i]);
  const tremorPx = Math.sqrt(mean(hp.map((v) => v * v)));
  const sp2 = spectrum(hp, 60);
  return {
    errorPct: 100 * mean(e.map(Math.abs)) / sp.R,           // mean distance from the guide, % of spiral radius
    tremorPx,                                              // RMS of the fast (>~2.5 Hz) wobble, in pixels
    tremorHz: tremorPx > 0.5 ? peakFreq(sp2, 3, 12) : NaN, // dominant wobble frequency
    speed: len / Math.max(dur, 0.1),                        // px per second
    seconds: dur,
    coverage: Math.min(1, acc / sp.thMax)                   // share of the spiral completed
  };
}

export function run(stage, { hand }) {
  return new Promise((resolve) => {
    stage.innerHTML = `<div class="spiral-stage"><p class="tap-hint">With your <b>${hand}</b> index finger, trace the spiral from the centre outward. Keep your finger on the screen and go at a comfortable speed.</p>
      <canvas class="spiral-canvas"></canvas><div class="row center"><button class="btn ghost" data-redo>Start over</button><button class="btn primary" data-done disabled>Done</button></div></div>`;
    const root = stage.firstElementChild, cv = root.querySelector('canvas'), g = cv.getContext('2d');
    const box = cv.getBoundingClientRect(), dpr = devicePixelRatio || 1; cv.width = box.width * dpr; cv.height = box.height * dpr; g.scale(dpr, dpr);
    const R = Math.min(box.width, box.height) / 2 - 18, sp = spiralTemplate(box.width / 2, box.height / 2, R, 3);
    let pts = [], drawing = false, t0 = 0;
    const css = getComputedStyle(document.documentElement);
    const drawGuide = () => {
      g.clearRect(0, 0, box.width, box.height);
      g.strokeStyle = css.getPropertyValue('--guide'); g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); sp.points.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke();
      g.fillStyle = css.getPropertyValue('--accent'); g.beginPath(); g.arc(sp.cx, sp.cy, 7, 0, 7); g.fill();
    };
    const drawInk = () => { g.strokeStyle = css.getPropertyValue('--ink'); g.lineWidth = 2.5; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke(); };
    drawGuide();
    const pos = (e) => ({ x: e.clientX - box.left, y: e.clientY - box.top });
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); drawing = true; pts = []; t0 = e.timeStamp || performance.now(); drawGuide(); pts.push({ t: 0, ...pos(e) }); });
    cv.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const ev = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const c of ev) pts.push({ t: (c.timeStamp || performance.now()) - t0, ...pos(c) });
      drawGuide(); drawInk();
    });
    const end = () => { if (!drawing) return; drawing = false; root.querySelector('[data-done]').disabled = pts.length < 30; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    root.querySelector('[data-redo]').addEventListener('click', () => { pts = []; drawGuide(); root.querySelector('[data-done]').disabled = true; });
    root.querySelector('[data-done]').addEventListener('click', () => resolve(spiralMetrics(pts, sp)));
  });
}
