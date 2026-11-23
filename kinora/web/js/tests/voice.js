// Sustained vowel: say "aaah" for 5 seconds. Pitch steadiness, loudness steadiness and voice clarity (HNR).
import { mean, cv, median, pitch } from '../dsp.js';

function toMono16k(data, rate) {
  const k = Math.max(1, Math.round(rate / 16000)), out = new Float32Array(Math.floor(data.length / k));
  for (let i = 0; i < out.length; i++) { let s = 0; for (let j = 0; j < k; j++) s += data[i * k + j]; out[i] = s / k; }
  return { data: out, rate: rate / k };
}

export function voiceMetrics({ data, rate }) {
  const a = toMono16k(data, rate), fl = Math.round(0.04 * a.rate), hop = Math.round(0.01 * a.rate), frames = [];
  for (let i = 0; i + fl <= a.data.length; i += hop) {
    const f = a.data.subarray(i, i + fl); let e = 0; for (const v of f) e += v * v;
    frames.push({ rms: Math.sqrt(e / fl), p: pitch(f, a.rate) });
  }
  const loud = Math.max(...frames.map((f) => f.rms)) || 1;
  const voiced = frames.filter((f) => f.p && f.rms > 0.1 * loud);
  if (voiced.length < 30) return null;
  const core = voiced.slice(Math.floor(voiced.length * 0.1), Math.ceil(voiced.length * 0.9));   // drop onset and offset
  const f0 = core.map((f) => f.p.f0), rms = core.map((f) => f.rms);
  return {
    f0: median(f0),                                                  // typical pitch, Hz
    pitchCV: cv(f0),                                                 // pitch steadiness (lower is steadier)
    loudCV: cv(rms),                                                 // loudness steadiness
    hnr: mean(core.map((f) => 10 * Math.log10(f.p.r / (1 - f.p.r)))),  // harmonics-to-noise ratio, dB (higher is clearer)
    levelDb: 20 * Math.log10(median(rms)),                           // level relative to the device's full scale
    seconds: voiced.length * 0.01
  };
}

export async function run(stage, { seconds = 5 }) {
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }
  catch { return null; }
  stage.innerHTML = `<div class="center-stage"><p class="big-instr">Take a breath, then say <b>“aaah”</b> at a comfortable pitch and loudness for as long as the ring runs.</p><canvas class="meter" data-meter></canvas><div class="ring mono" data-ring>Get ready</div></div>`;
  const ctx = new (window.AudioContext || window.webkitAudioContext)(), src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser(); an.fftSize = 2048; src.connect(an);
  const buf = new Float32Array(an.fftSize), chunks = [];
  const node = ctx.createScriptProcessor(4096, 1, 1); src.connect(node); node.connect(ctx.destination);
  let recording = false; node.onaudioprocess = (e) => { if (recording) chunks.push(new Float32Array(e.inputBuffer.getChannelData(0))); };
  const cvs = stage.querySelector('[data-meter]'), g = cvs.getContext('2d'), ring = stage.querySelector('[data-ring]');
  const css = getComputedStyle(document.documentElement);
  let raf; const draw = () => { an.getFloatTimeDomainData(buf); const r = cvs.getBoundingClientRect(); cvs.width = r.width * 2; cvs.height = r.height * 2; g.strokeStyle = css.getPropertyValue('--accent'); g.lineWidth = 3; g.beginPath(); for (let i = 0; i < buf.length; i += 4) { const x = i / buf.length * cvs.width, y = cvs.height / 2 + buf[i] * cvs.height * 1.6; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); raf = requestAnimationFrame(draw); }; draw();
  await new Promise((r) => setTimeout(r, 1200));
  recording = true; const t0 = performance.now();
  await new Promise((r) => { const tick = () => { const left = seconds - (performance.now() - t0) / 1000; ring.textContent = `${Math.max(0, left).toFixed(1)} s`; ring.style.setProperty('--p', `${(1 - left / seconds) * 360}deg`); left <= 0 ? r() : requestAnimationFrame(tick); }; tick(); });
  recording = false; cancelAnimationFrame(raf); node.disconnect(); src.disconnect(); stream.getTracks().forEach((t) => t.stop());
  const n = chunks.reduce((s, c) => s + c.length, 0), data = new Float32Array(n); let o = 0; for (const c of chunks) { data.set(c, o); o += c.length; }
  const rate = ctx.sampleRate; ctx.close();
  return voiceMetrics({ data, rate });
}
