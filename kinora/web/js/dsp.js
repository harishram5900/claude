// Signal processing used by every Kinora check. Pure functions, tested in tests/dsp.test.mjs.

export const mean = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
export const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))); };
export const cv = (a) => sd(a) / (mean(a) || 1);
export const median = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; };

// Resample irregular samples (t in ms, v) onto a uniform grid at `hz` by linear interpolation.
export function resample(t, v, hz) {
  if (t.length < 2) return [];
  const dt = 1000 / hz, out = []; let j = 0;
  for (let x = t[0]; x <= t[t.length - 1]; x += dt) {
    while (j < t.length - 2 && t[j + 1] < x) j++;
    const f = (x - t[j]) / ((t[j + 1] - t[j]) || 1); out.push(v[j] + (v[j + 1] - v[j]) * Math.max(0, Math.min(1, f)));
  }
  return out;
}
// Remove a straight-line trend (least squares).
export function detrend(y) {
  const n = y.length, xm = (n - 1) / 2, ym = mean(y); let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - xm) * (y[i] - ym); den += (i - xm) ** 2; }
  const b = den ? num / den : 0; return y.map((v, i) => v - ym - b * (i - xm));
}
// Power spectrum with a Hann window (radix-2 FFT after zero padding). Returns {freq, power}.
export function spectrum(y, hz) {
  let n = 1; while (n < y.length) n <<= 1;
  const re = new Float64Array(n), im = new Float64Array(n), N = y.length;
  for (let i = 0; i < N; i++) re[i] = y[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)));
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
  }
  const freq = [], power = [];
  for (let k = 0; k <= n / 2; k++) { freq.push(k * hz / n); power.push((re[k] ** 2 + im[k] ** 2) / n); }
  return { freq, power };
}
export function bandPower(sp, lo, hi) { let s = 0; sp.freq.forEach((f, i) => { if (f >= lo && f <= hi) s += sp.power[i]; }); return s; }
export function peakFreq(sp, lo, hi) { let best = -1, bf = NaN; sp.freq.forEach((f, i) => { if (f >= lo && f <= hi && sp.power[i] > best) { best = sp.power[i]; bf = f; } }); return bf; }

// Fundamental frequency of one audio frame by normalised autocorrelation. Returns {f0, r} or null.
export function pitch(frame, rate, fmin = 70, fmax = 400) {
  const n = frame.length, lo = Math.floor(rate / fmax), hi = Math.min(n - 1, Math.ceil(rate / fmin));
  let e0 = 0; for (let i = 0; i < n; i++) e0 += frame[i] * frame[i]; if (e0 < 1e-6) return null;
  const r = new Float64Array(hi + 2);
  for (let lag = lo; lag <= hi + 1; lag++) {
    let s = 0, e1 = 0, e2 = 0;
    for (let i = 0; i + lag < n; i++) { s += frame[i] * frame[i + lag]; e1 += frame[i] * frame[i]; e2 += frame[i + lag] * frame[i + lag]; }
    r[lag] = s / Math.sqrt(e1 * e2 || 1);
  }
  let best = lo; for (let lag = lo; lag <= hi; lag++) if (r[lag] > r[best]) best = lag;
  // first peak within 10% of the best avoids octave errors
  for (let lag = lo; lag < best; lag++) if (r[lag] > 0.9 * r[best] && r[lag] >= r[lag - 1] && r[lag] >= r[lag + 1]) { best = lag; break; }
  if (r[best] < 0.45) return null;
  const a = r[best - 1] ?? r[best], b = r[best], c = r[best + 1] ?? r[best], d = a - 2 * b + c, shift = d ? 0.5 * (a - c) / d : 0;
  return { f0: rate / (best + shift), r: Math.min(0.999, b) };
}
