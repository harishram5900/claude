// Fingerspelling: MediaPipe hand landmarks -> the classifier trained in research/train_alpha2.py.
let M = null;
export async function loadLetters() { if (!M) M = await (await fetch('models/alphabet.json')).json(); return M; }
export const lettersModel = () => M;
const BONES = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20]];
const TIPS = [4, 8, 12, 16, 20];
// Same normalisation as training: wrist at origin, left hands mirrored to right, scaled by wrist→middle-knuckle length.
export function normalise(lm, handedness) {
  const p = lm.map((l) => [l.x - lm[0].x, l.y - lm[0].y, l.z - lm[0].z]);
  if (handedness === 'Left') p.forEach((q) => (q[0] *= -1));
  const s = Math.hypot(...p[9]) || 1; return p.map((q) => q.map((v) => v / s));
}
export function features(p) {
  const out = p.flat();
  for (const [a, b] of BONES) { const d = [0, 1, 2].map((k) => p[b][k] - p[a][k]), n = Math.hypot(...d) + 1e-6; out.push(...d.map((v) => v / n)); }
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) out.push(Math.hypot(...[0, 1, 2].map((k) => p[TIPS[i]][k] - p[TIPS[j]][k])));
  for (const t of TIPS) out.push(Math.hypot(...p[t]));
  return out;
}
export function predict(x) {
  let h = x.map((v, i) => (v - M.mean[i]) / M.scale[i]);
  M.layers.forEach((L, li) => {
    const o = L.b.slice();
    for (let i = 0; i < h.length; i++) { const hi = h[i]; if (hi === 0) continue; const Wi = L.W[i]; for (let j = 0; j < o.length; j++) o[j] += hi * Wi[j]; }
    h = li < M.layers.length - 1 ? o.map((v) => (v > 0 ? v : 0)) : o;
  });
  const mx = Math.max(...h), e = h.map((v) => Math.exp(v - mx)), s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

// Personal calibration: a few samples of your own hand per letter, matched by nearest neighbours.
const KEY = 'gestura.calib.v1';
let calib = (() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } })();
export const calibration = () => calib;
export function addCalib(letter, feat) { (calib[letter] ||= []).push(feat.slice(0, 63)); if (calib[letter].length > 12) calib[letter].shift(); try { localStorage.setItem(KEY, JSON.stringify(calib)); } catch {} }
export function clearCalib() { calib = {}; try { localStorage.removeItem(KEY); } catch {} }
export function blend(probs, feat) {
  const letters = Object.keys(calib); if (!letters.length) return probs;
  const d = {}; for (const L of letters) d[L] = Math.min(...calib[L].map((s) => Math.hypot(...s.map((v, i) => v - feat[i]))));
  const out = probs.slice(); const best = Object.entries(d).sort((a, b) => a[1] - b[1])[0];
  if (best && best[1] < 0.9) { const i = M.letters.indexOf(best[0]), w = Math.max(0, 1 - best[1] / 0.9) * 0.6; for (let k = 0; k < out.length; k++) out[k] *= 1 - w; out[i] += w; }
  return out;
}

// Turns a stream of per-frame probabilities into committed letters: a letter must lead for ~0.45 s.
export class Speller {
  constructor({ hold = 450, minP = 0.55 } = {}) { this.hold = hold; this.minP = minP; this.ema = null; this.cand = null; this.since = 0; this.last = null; this.gap = 0; }
  push(probs, t) {
    this.ema = this.ema ? this.ema.map((v, i) => 0.6 * v + 0.4 * probs[i]) : probs.slice();
    let k = 0; for (let i = 1; i < this.ema.length; i++) if (this.ema[i] > this.ema[k]) k = i;
    const L = M.letters[k], p = this.ema[k];
    if (L !== this.cand) { this.cand = L; this.since = t; }
    const ready = p >= this.minP && t - this.since >= this.hold && L !== this.last;
    if (ready) { this.last = L; return { commit: L, p, top: k }; }
    return { lead: L, p, progress: Math.min(1, (t - this.since) / this.hold) };
  }
  handLost() { this.last = null; this.ema = null; this.cand = null; }
}
