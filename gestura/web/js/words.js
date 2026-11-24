// Word-level signs: Google Isolated Sign Language Recognition, 1st-place model (Kaggle, MIT licence),
// converted to ONNX and int8-quantised (see research/). Input: frames × 543 landmarks × 3 in the order
// face (468), left hand (21), pose (33), right hand (21), exactly as MediaPipe Holistic produces them.
let session = null, labels = null, ortLib = null;
export async function loadWords() {
  if (session) return;
  ortLib = await import('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/ort.wasm.min.mjs');
  ortLib.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/';
  ortLib.env.wasm.numThreads = 1;
  const map = await (await fetch('models/signs_map.json')).json();
  labels = []; for (const [w, i] of Object.entries(map)) labels[i] = w;
  session = await ortLib.InferenceSession.create('models/signs.onnx', { executionProviders: ['wasm'] });
}
export const wordLabels = () => labels;
const put = (buf, off, pts, n) => { for (let i = 0; i < n; i++) { const p = pts?.[i]; buf[(off + i) * 3] = p ? p.x : NaN; buf[(off + i) * 3 + 1] = p ? p.y : NaN; buf[(off + i) * 3 + 2] = p ? p.z : NaN; } };
// One Holistic result -> one model frame (Float32Array of 543*3, NaN where something is not visible).
export function frameFromHolistic(r) {
  const f = new Float32Array(543 * 3);
  put(f, 0, r.faceLandmarks?.[0], 468); put(f, 468, r.leftHandLandmarks?.[0], 21); put(f, 489, r.poseLandmarks?.[0], 33); put(f, 522, r.rightHandLandmarks?.[0], 21);
  return f;
}
export async function classify(frames) {
  const T = frames.length, x = new Float32Array(T * 543 * 3); frames.forEach((f, i) => x.set(f, i * 1629));
  const out = await session.run({ [session.inputNames[0]]: new ortLib.Tensor('float32', x, [T, 543, 3]) });
  const z = out[session.outputNames[0]].data, mx = Math.max(...z), e = Array.from(z, (v) => Math.exp(v - mx)), s = e.reduce((a, b) => a + b, 0);
  return e.map((v, i) => ({ word: labels[i], p: v / s })).sort((a, b) => b.p - a.p);
}
// Splits a live stream into signs: a sign is the stretch while a hand is visible, closed by a short pause.
export class Segmenter {
  constructor({ pause = 380, min = 8, max = 96 } = {}) { this.pause = pause; this.min = min; this.max = max; this.buf = []; this.lastHand = 0; }
  push(frame, handVisible, t) {
    if (handVisible) { this.buf.push(frame); this.lastHand = t; if (this.buf.length > this.max) this.buf.shift(); return null; }
    if (this.buf.length && t - this.lastHand > this.pause) { const seg = this.buf; this.buf = []; return seg.length >= this.min ? seg : null; }
    if (this.buf.length) this.buf.push(frame);
    return null;
  }
  flush() { const s = this.buf; this.buf = []; return s.length >= this.min ? s : null; }
  get active() { return this.buf.length > 0; }
}
