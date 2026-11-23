// Rest tremor with the phone's accelerometer: rest the hand holding the phone on your lap for 10 s.
import { mean, resample, spectrum, peakFreq, bandPower } from '../dsp.js';

const movingAvg = (y, w) => { const c = [0]; let s = 0; for (const v of y) c.push(s += v); const h = Math.floor(w / 2);
  return y.map((_, i) => { const a = Math.max(0, i - h), b = Math.min(y.length, i + h + 1); return (c[b] - c[a]) / (b - a); }); };

export function tremorMetrics(samples) {
  if (samples.length < 100) return null;
  const t = samples.map((s) => s.t), hz = 50;
  const axes = ['x', 'y', 'z'].map((k) => { const u = resample(t, samples.map((s) => s[k]), hz), ma = movingAvg(u, 25); return u.map((v, i) => v - ma[i]); });
  const n = Math.min(...axes.map((a) => a.length)), mag2 = [];
  for (let i = 0; i < n; i++) mag2.push(axes[0][i] ** 2 + axes[1][i] ** 2 + axes[2][i] ** 2);
  const specs = axes.map((a) => spectrum(a, hz)), sum = { freq: specs[0].freq, power: specs[0].power.map((_, i) => specs.reduce((s, sp) => s + sp.power[i], 0)) };
  const band = bandPower(sum, 3.5, 7.5), total = bandPower(sum, 1, 20);
  return {
    tremorRms: Math.sqrt(mean(mag2)),     // m/s² of hand movement faster than ~2 Hz
    peakHz: peakFreq(sum, 2, 12),          // dominant shaking frequency
    bandShare: total ? band / total : 0,   // share of that movement in the 3.5–7.5 Hz rest-tremor band
    seconds: (t[t.length - 1] - t[0]) / 1000
  };
}

export const supported = () => typeof DeviceMotionEvent !== 'undefined' && matchMedia('(pointer: coarse)').matches;

export async function run(stage, { hand, seconds = 10 }) {
  if (typeof DeviceMotionEvent?.requestPermission === 'function') {
    stage.innerHTML = `<div class="center-stage"><p>Kinora needs access to motion sensors to measure tremor.</p><button class="btn primary" data-ok>Allow motion access</button></div>`;
    await new Promise((r) => stage.querySelector('[data-ok]').addEventListener('click', r, { once: true }));
    const p = await DeviceMotionEvent.requestPermission().catch(() => 'denied'); if (p !== 'granted') return null;
  }
  stage.innerHTML = `<div class="center-stage"><p class="big-instr">Hold the phone in your <b>${hand}</b> hand and rest that hand on your lap.</p><p class="muted">Stay relaxed and still. Recording starts in <span class="mono" data-c>3</span>.</p><div class="ring mono" data-ring></div></div>`;
  for (let k = 3; k > 0; k--) { stage.querySelector('[data-c]').textContent = k; await new Promise((r) => setTimeout(r, 1000)); }
  const samples = [], t0 = performance.now();
  const on = (e) => { const a = e.accelerationIncludingGravity || e.acceleration; if (a && a.x != null) samples.push({ t: performance.now() - t0, x: a.x, y: a.y, z: a.z }); };
  addEventListener('devicemotion', on);
  const ring = stage.querySelector('[data-ring]');
  await new Promise((r) => { const tick = () => { const left = seconds - (performance.now() - t0) / 1000; ring.textContent = `${Math.max(0, left).toFixed(1)} s`; ring.style.setProperty('--p', `${(1 - left / seconds) * 360}deg`); left <= 0 ? r() : requestAnimationFrame(tick); }; tick(); });
  removeEventListener('devicemotion', on);
  return tremorMetrics(samples);
}
