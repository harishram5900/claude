import assert from 'node:assert/strict';
import * as D from '../web/js/dsp.js';
import { tapMetrics } from '../web/js/tests/tap.js';
import { spiralMetrics, spiralTemplate } from '../web/js/tests/spiral.js';
import { tremorMetrics } from '../web/js/tests/tremor.js';
import { voiceMetrics } from '../web/js/tests/voice.js';
import { typingMetrics } from '../web/js/tests/typing.js';
let pass = 0, fail = 0;
const test = (name, fn) => { try { fn(); pass++; console.log('ok  ', name); } catch (e) { fail++; console.log('FAIL', name, '\n     ', e.message); } };
const rng = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);

test('spectrum finds a 5 Hz sine', () => { const y = Array.from({ length: 600 }, (_, i) => Math.sin(2 * Math.PI * 5 * i / 60)); assert.ok(Math.abs(D.peakFreq(D.spectrum(y, 60), 1, 20) - 5) < 0.2); });
test('resample keeps a linear ramp linear', () => { const r = D.resample([0, 100, 250, 1000], [0, 1, 2.5, 10], 10); assert.ok(Math.abs(r[5] - 5) < 1e-9); });
test('pitch finds 150 Hz in a harmonic tone', () => { const rate = 16000; const f = Float32Array.from({ length: 1024 }, (_, i) => Math.sin(2 * Math.PI * 150 * i / rate) + 0.5 * Math.sin(2 * Math.PI * 300 * i / rate)); assert.ok(Math.abs(D.pitch(f, rate).f0 - 150) < 1.5); });
test('pitch returns null on noise', () => { const f = Float32Array.from({ length: 1024 }, () => rng() - 0.5); assert.equal(D.pitch(f, 16000), null); });

// tapping: steady alternating taps at 5/s vs slowing, irregular taps
const taps = (n, iti, slow, jit) => { let t = 0; return Array.from({ length: n }, (_, i) => { t += iti * (1 + slow * i / n) * (1 + jit * (rng() - 0.5)); return { t, x: i % 2 ? 300 : 100, y: 200, target: i % 2 }; }); };
const targets = [{ x: 100, y: 200, r: 40 }, { x: 300, y: 200, r: 40 }];
test('tapping: steady 5 taps/s scores ~5 taps/s, low variability, no decrement', () => { const m = tapMetrics(taps(50, 200, 0, 0.02), targets, 10000); assert.ok(Math.abs(m.rate - 5) < 0.3, m.rate); assert.ok(m.rhythmCV < 0.03, m.rhythmCV); assert.ok(Math.abs(m.decrement) < 0.05, m.decrement); assert.equal(m.alternation, 1); });
test('tapping: slowing taps show a decrement, irregular taps show variability', () => { const m = tapMetrics(taps(35, 220, 0.6, 0.4), targets, 10000); assert.ok(m.decrement > 0.2, m.decrement); assert.ok(m.rhythmCV > 0.1, m.rhythmCV); });

// spiral: perfect trace vs trace with a 5 Hz, 4 px tremor
const sp = spiralTemplate(200, 200, 150, 3);
const trace = (amp) => sp.points.map((p, i) => { const t = i * 8, th = p.th, w = amp * Math.sin(2 * Math.PI * 5 * t / 1000); return { t, x: p.x + w * Math.cos(th), y: p.y + w * Math.sin(th) }; });
test('spiral: clean trace has tiny error and no tremor', () => { const m = spiralMetrics(trace(0), sp); assert.ok(m.errorPct < 1, m.errorPct); assert.ok(m.tremorPx < 0.3, m.tremorPx); });
test('spiral: 5 Hz wobble is detected at ~5 Hz', () => { const m = spiralMetrics(trace(4), sp); assert.ok(m.tremorPx > 1.5, m.tremorPx); assert.ok(Math.abs(m.tremorHz - 5) < 1, m.tremorHz); });

// phone tremor: 5 Hz, 0.3 m/s2 on gravity vs still hand
const acc = (amp) => Array.from({ length: 600 }, (_, i) => ({ t: i * 16.7, x: amp * Math.sin(2 * Math.PI * 5 * i * 0.0167) + 0.01 * (rng() - 0.5), y: 9.81, z: 0.02 * (rng() - 0.5) }));
test('tremor: 5 Hz shaking is found at 5 Hz with high band power', () => { const m = tremorMetrics(acc(0.3)); assert.ok(Math.abs(m.peakHz - 5) < 0.5, m.peakHz); assert.ok(m.tremorRms > 0.15, m.tremorRms); });
test('tremor: still phone has near-zero tremor', () => { const m = tremorMetrics(acc(0)); assert.ok(m.tremorRms < 0.02, m.tremorRms); });

// voice: steady 140 Hz vowel vs one with wobbling pitch and loudness
const vowel = (wob) => { const rate = 16000, n = rate * 3, a = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const f = 140 * (1 + wob * Math.sin(2 * Math.PI * 6 * i / rate) + wob * 0.5 * (rng() - 0.5)); ph += 2 * Math.PI * f / rate; a[i] = (0.3 + wob * Math.sin(2 * Math.PI * 4 * i / rate)) * (Math.sin(ph) + 0.4 * Math.sin(2 * ph) + 0.2 * Math.sin(3 * ph)); }
  return { data: a, rate }; };
test('voice: steady vowel has the right pitch and low instability', () => { const m = voiceMetrics(vowel(0)); assert.ok(Math.abs(m.f0 - 140) < 2, m.f0); assert.ok(m.pitchCV < 0.01, m.pitchCV); assert.ok(m.hnr > 15, m.hnr); });
test('voice: wobbling vowel scores more pitch and loudness instability', () => { const a = voiceMetrics(vowel(0)), b = voiceMetrics(vowel(0.04)); assert.ok(b.pitchCV > a.pitchCV * 3, `${b.pitchCV} vs ${a.pitchCV}`); assert.ok(b.loudCV > a.loudCV, `${b.loudCV} vs ${a.loudCV}`); });

test('voice: clean vowel has near-zero jitter and shimmer', () => { const m = voiceMetrics(vowel(0)); assert.ok(m.jitter < 0.2, m.jitter); assert.ok(m.shimmer < 0.5, m.shimmer); });
test('voice: perturbed vowel has measurable jitter and shimmer', () => {
  const rate = 16000, n = rate * 3, a = new Float32Array(n); let i = 0;
  while (i < n) { const T = Math.round(rate / 130 * (1 + 0.012 * (rng() - 0.5) * 2)), amp = 0.5 * (1 + 0.06 * (rng() - 0.5) * 2); for (let k = 0; k < T && i < n; k++, i++) a[i] = amp * (Math.sin(2 * Math.PI * k / T) + 0.3 * Math.sin(4 * Math.PI * k / T)); }
  const m = voiceMetrics({ data: a, rate }); assert.ok(m.jitter > 0.3 && m.jitter < 1.5, m.jitter); assert.ok(m.shimmer > 1.5 && m.shimmer < 5, m.shimmer); });
test('typing: brisk typist vs one with long, irregular holds', () => {
  const brisk = typingMetrics(Array.from({ length: 300 }, () => 85 + 20 * (rng() - 0.5)));
  const slow = typingMetrics(Array.from({ length: 300 }, () => (rng() < 0.12 ? 260 : 120) + 60 * (rng() - 0.5)));
  assert.ok(Math.abs(brisk.median - 85) < 3, brisk.median); assert.equal(brisk.longShare, 0);
  assert.ok(slow.longShare > 8 && slow.longShare < 16, slow.longShare); assert.ok(slow.iqr > brisk.iqr * 2, `${slow.iqr} vs ${brisk.iqr}`); });
test('typing: too few keys returns nothing', () => { assert.equal(typingMetrics([100, 110, 90]), null); });
test('spiral: tremor is also reported as % of radius', () => { const m = spiralMetrics(trace(4), sp); assert.ok(Math.abs(m.tremorPct - 100 * m.tremorPx / sp.R) < 1e-9); });
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
