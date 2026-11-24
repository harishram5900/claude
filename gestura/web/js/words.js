// Word-level signs.
// 1. Google Isolated Sign Language Recognition 1st-place ensemble (Kaggle, MIT licence) turns a sign's landmarks into a
//    1,152-number description of the movement (models/signs.onnx, int8 matrix layers).
// 2. A classifier we trained on ASL Citizen (real Deaf and hearing signers) maps that description to one of our
//    everyday words (models/signs_head.json). See research/train_words.py for training and testing.
// Input frames: 543 landmarks × 3 in the order face (468), left hand (21), pose (33), right hand (21), unmirrored video.
let session = null, head = null, ortLib = null, loading = null;
export function loadWords() {
  if (!loading) loading = (async () => {
    ortLib = await import('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/ort.wasm.min.mjs');
    ortLib.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/';
    ortLib.env.wasm.numThreads = 1;
    const [meta, bin, sess] = await Promise.all([
      fetch('models/signs_head.json').then((r) => r.json()),
      fetch('models/signs_head.bin').then((r) => r.arrayBuffer()),
      ortLib.InferenceSession.create('models/signs.onnx', { executionProviders: ['wasm'] }),
    ]);
    // weights are float32, stored layer by layer: W (in x out, row-major) then b (out)
    let o = 0; const take = (n) => { const x = new Float32Array(bin, o, n); o += n * 4; return x; };
    meta.layers = meta.shapes.map(([[nin, nout]]) => ({ nin, nout, W: take(nin * nout), b: take(nout) }));
    head = meta; session = sess;
  })().catch((e) => { loading = null; throw e; });
  return loading;
}
export const wordLabels = () => head?.labels || [];
export const wordsModel = () => head;

const F = 543 * 3, LH = 468, POSE = 489, RH = 522;
const put = (buf, off, pts, n) => {
  for (let i = 0; i < n; i++) {
    const p = pts?.[i], j = (off + i) * 3;
    // depth is set to 0: the model was trained and tested that way (z from different trackers does not agree)
    buf[j] = p ? p.x : NaN; buf[j + 1] = p ? p.y : NaN; buf[j + 2] = p ? 0 : NaN;
  }
};
// One Holistic result -> one model frame (NaN where something is not visible).
export function frameFromHolistic(r) {
  const f = new Float32Array(F);
  put(f, 0, r.faceLandmarks?.[0], 468); put(f, LH, r.leftHandLandmarks?.[0], 21); put(f, POSE, r.poseLandmarks?.[0], 33); put(f, RH, r.rightHandLandmarks?.[0], 21);
  return f;
}

// A hand is "signing" when it is visible and its wrist is above chest level: the shoulder line plus 1.1 shoulder
// widths. The same rule trims every training clip (research/build_words.py), so live input matches training.
export function signing(f, mem = {}) {
  const ly = f[(POSE + 11) * 3 + 1], ry = f[(POSE + 12) * 3 + 1], lx = f[(POSE + 11) * 3], rx = f[(POSE + 12) * 3];
  if (Number.isFinite(ly) && Number.isFinite(ry)) { mem.sy = (ly + ry) / 2; mem.sw = Math.abs(lx - rx); }
  const line = (mem.sy ?? 0.6) + 1.1 * (mem.sw ?? 0.25);
  const wl = f[LH * 3 + 1], wr = f[RH * 3 + 1];
  return (Number.isFinite(wl) && wl < line) || (Number.isFinite(wr) && wr < line);
}

function mlp(x) {
  let h = x.map((v, i) => (v - head.mean[i]) / head.scale[i]);
  head.layers.forEach((L, k) => {
    const out = new Float64Array(L.nout);
    for (let j = 0; j < L.nout; j++) out[j] = L.b[j];
    for (let i = 0; i < L.nin; i++) { const hi = h[i]; if (!hi) continue; const base = i * L.nout; for (let j = 0; j < L.nout; j++) out[j] += hi * L.W[base + j]; }
    h = k < head.layers.length - 1 ? Array.from(out, (v) => (v > 0 ? v : 0)) : Array.from(out);
  });
  const mx = Math.max(...h), e = h.map((v) => Math.exp(v - mx)), s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

// frames: array of Float32Array(1629). Returns [{word, p}] best first.
export async function classify(frames) {
  const T = frames.length, x = new Float32Array(T * F); frames.forEach((f, i) => x.set(f, i * F));
  const out = await session.run({ [session.inputNames[0]]: new ortLib.Tensor('float32', x, [T, 543, 3]) });
  const emb = Array.from(out.emb.data);
  return mlp(emb).map((p, i) => ({ word: head.labels[i], p })).sort((a, b) => b.p - a.p);
}

// Splits a live stream into signs: a sign starts when a hand comes up into signing space and ends once the hands
// have been down (or out of view) for `pause` ms. Hands resting in view below the chest do not keep a sign open.
export class Segmenter {
  constructor({ pause = 350, min = 6, maxMs = 4000 } = {}) { Object.assign(this, { pause, min, maxMs, buf: [], tail: [], last: 0, start: 0, mem: {} }); }
  push(frame, t) {
    const on = signing(frame, this.mem);
    if (on) {
      if (!this.buf.length) this.start = t;
      this.buf.push(...this.tail, frame); this.tail = []; this.last = t;
      if (t - this.start > this.maxMs) return this.flush();
      return null;
    }
    if (!this.buf.length) return null;
    if (t - this.last > this.pause) return this.flush();
    this.tail.push(frame); // brief dips inside one sign are kept if signing resumes
    return null;
  }
  flush() { const s = this.buf; this.buf = []; this.tail = []; return s.length >= this.min ? s : null; }
  get active() { return this.buf.length > 0; }
  get length() { return this.buf.length; }
}

// ASL word order differs from English. A few common sequences become natural English; everything else is shown as signed.
const PHRASES = [
  [['hello'], 'Hello.'], [['bye'], 'Bye.'], [['thank you'], 'Thank you.'], [['sorry'], 'Sorry.'], [['yes'], 'Yes.'], [['no'], 'No.'], [['ok'], 'OK.'], [['welcome'], 'Welcome.'], [['please'], 'Please.'],
  [['how', 'you'], 'How are you?'], [['you', 'how'], 'How are you?'],
  [['nice', 'meet', 'you'], 'Nice to meet you.'], [['nice', 'meet'], 'Nice to meet you.'],
  [['my', 'name'], 'My name is'], [['me', 'name'], 'My name is'],
  [['your', 'name', 'what'], 'What is your name?'], [['you', 'name', 'what'], 'What is your name?'], [['what', 'your', 'name'], 'What is your name?'], [['your', 'name'], 'Your name?'],
  [['bathroom', 'where'], 'Where is the bathroom?'], [['where', 'bathroom'], 'Where is the bathroom?'], [['clean', 'room'], 'Clean the room.'],
  [['hospital', 'where'], 'Where is the hospital?'], [['where', 'hospital'], 'Where is the hospital?'],
  [['need', 'help'], 'I need help.'], [['me', 'hurt'], 'I am hurt.'], [['hurt', 'where'], 'Where does it hurt?'], [['you', 'hurt'], 'Are you hurt?'], [['how', 'old', 'you'], 'How old are you?'], [['you', 'old', 'how'], 'How old are you?'], [['help', 'me'], 'Help me.'], [['me', 'need', 'help'], 'I need help.'],
  [['need', 'doctor'], 'I need a doctor.'], [['call', 'doctor'], 'Call a doctor.'], [['call', 'police'], 'Call the police.'],
  [['me', 'deaf'], 'I am Deaf.'], [['me', 'hearing'], 'I am hearing.'], [['me', 'learn', 'sign'], 'I am learning to sign.'], [['learn', 'sign'], 'Learning to sign.'],
  [['please', 'again'], 'Please repeat that.'], [['again', 'please'], 'Please repeat that.'], [['slow', 'please'], 'Please slow down.'], [['please', 'slow'], 'Please slow down.'],
  [['me', 'understand', 'not'], "I don't understand."], [['understand', 'not'], "I don't understand."], [['not', 'understand'], "I don't understand."],
  [['you', 'understand'], 'Do you understand?'], [['me', 'understand'], 'I understand.'],
  [['good', 'morning'], 'Good morning.'], [['good', 'night'], 'Good night.'], [['good', 'afternoon'], 'Good afternoon.'],
  [['see', 'you', 'later'], 'See you later.'], [['later', 'see', 'you'], 'See you later.'],
  [['thank you', 'very'], 'Thank you very much.'], [['me', 'love', 'you'], 'I love you.'], [['me', 'fine'], "I'm fine."], [['fine', 'thank you'], "I'm fine, thank you."],
  [['turn', 'left'], 'Turn left.'], [['turn', 'right'], 'Turn right.'], [['left', 'turn'], 'Turn left.'], [['right', 'turn'], 'Turn right.'], [['go', 'straight'], 'Go straight.'], [['straight', 'go'], 'Go straight.'],
  [['where', 'you', 'live'], 'Where do you live?'], [['you', 'live', 'where'], 'Where do you live?'], [['what', 'time'], 'What time is it?'], [['time', 'what'], 'What time is it?'],
  [['me', 'hungry'], "I'm hungry."], [['me', 'thirsty'], "I'm thirsty."], [['me', 'tired'], "I'm tired."], [['me', 'sick'], "I'm sick."], [['me', 'sorry'], "I'm sorry."],
  [['you', 'want', 'what'], 'What do you want?'], [['what', 'you', 'want'], 'What do you want?'], [['me', 'want', 'water'], 'I want water.'], [['want', 'water'], 'I want water.'],
];
// A label like "nice/clean" is one ASL sign with two English meanings; phrases may use either.
const is = (gloss, w) => gloss === w || gloss.split('/').includes(w);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// glosses: array of lowercase words as recognised. Returns [{text, from, to}] covering them in order.
export function compose(glosses) {
  const out = []; let i = 0;
  while (i < glosses.length) {
    let hit = null;
    for (const [seq, text] of PHRASES) {
      if (seq.length > glosses.length - i) continue;
      if (seq.every((w, k) => is(glosses[i + k], w)) && (!hit || seq.length > hit[0].length)) hit = [seq, text];
    }
    if (hit) { out.push({ text: hit[1], from: i, to: i + hit[0].length }); i += hit[0].length; }
    else { const w = glosses[i].split('/')[0]; out.push({ text: w === 'me' ? 'I' : w, from: i, to: i + 1 }); i++; }
    // capitalise after a finished sentence
    const n = out.length; if (n > 1 && /[.?!]$/.test(out[n - 2].text)) out[n - 1].text = cap(out[n - 1].text);
  }
  return out;
}
// Plain sentence for speech output.
export function sentence(glosses) {
  const s = compose(glosses).map((p) => p.text).join(' ').replace(/\s+([.?!,])/g, '$1').trim();
  return s ? cap(s) : '';
}
