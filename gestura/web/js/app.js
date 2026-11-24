import * as V from './vision.js';
import * as L from './letters.js';
import * as W from './words.js';

const $ = (s, r = document) => r.querySelector(s);
const toast = (m, ms = 3200) => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), ms); };
const store = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

const TIPS = {
  A: 'Fist, with your thumb resting against the side of your index finger.', B: 'Four fingers straight up and together; thumb folded across your palm.',
  C: 'Curve your fingers and thumb into the shape of a C.', D: 'Index finger up; the other fingertips touch your thumb to make a circle.',
  E: 'Bend your fingertips down to rest on your thumb, tucked under them.', F: 'Touch index finger and thumb in a circle; other three fingers up and apart.',
  G: 'Index finger and thumb point sideways, parallel, palm facing you.', H: 'Index and middle fingers point sideways, together.',
  I: 'Little finger up, the rest in a fist.', J: 'Little finger up, then trace a J in the air. Gestura reads the final shape.',
  K: 'Index up, middle finger angled forward, thumb touching the middle finger.', L: 'Thumb and index finger make an L.',
  M: 'Thumb tucked under your first three fingers.', N: 'Thumb tucked under your first two fingers.',
  O: 'All fingertips touch your thumb to make an O.', P: 'Like K, but pointing down.',
  Q: 'Like G, but pointing down.', R: 'Cross your middle finger over your index finger.',
  S: 'Fist, with your thumb across the front of your fingers.', T: 'Thumb tucked between your index and middle fingers.',
  U: 'Index and middle fingers straight up, together.', V: 'Index and middle fingers up and apart.',
  W: 'Index, middle and ring fingers up and apart.', X: 'Index finger hooked like a hook; other fingers in a fist.',
  Y: 'Thumb and little finger out, the rest folded.', Z: 'Index finger traces a Z in the air. Gestura reads the final shape.'
};

// ============================== shared drawing ==============================
function cover(canvas, video) {
  const r = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  if (canvas.width !== Math.round(r.width * dpr)) { canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); }
  const vw = video.videoWidth || 1, vh = video.videoHeight || 1, s = Math.max(canvas.width / vw, canvas.height / vh);
  return { s, dx: (canvas.width - vw * s) / 2, dy: (canvas.height - vh * s) / 2, vw, vh, W: canvas.width, H: canvas.height, dpr };
}
// Landmarks are normalised to the raw (unmirrored) frame; the preview is mirrored like a selfie.
function drawHand(g, lm, m, color, mirror = true) {
  const P = lm.map((p) => [mirror ? m.W - (p.x * m.vw * m.s + m.dx) : p.x * m.vw * m.s + m.dx, p.y * m.vh * m.s + m.dy]);
  g.lineWidth = 3 * m.dpr; g.strokeStyle = color; g.lineCap = 'round';
  for (const [a, b] of V.HAND_CONNECTIONS) { g.beginPath(); g.moveTo(...P[a]); g.lineTo(...P[b]); g.stroke(); }
  g.fillStyle = '#0e0f11'; for (const p of P) { g.beginPath(); g.arc(p[0], p[1], 3.6 * m.dpr, 0, 7); g.fill(); g.stroke(); }
}
function drawPose(g, pose, m) {
  if (!pose) return; const P = pose.map((p) => [m.W - (p.x * m.vw * m.s + m.dx), p.y * m.vh * m.s + m.dy]);
  g.lineWidth = 3 * m.dpr; g.strokeStyle = 'rgba(255,255,255,.45)';
  for (const [a, b] of V.POSE_UPPER) { if ((pose[a].visibility ?? 1) < 0.4 || (pose[b].visibility ?? 1) < 0.4) continue; g.beginPath(); g.moveTo(...P[a]); g.lineTo(...P[b]); g.stroke(); }
}
// Reference handshape from the average of real training photos of that letter.
function drawShape(cv, shape, { label } = {}) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height; g.clearRect(0, 0, W, H);
  const pts = []; for (let i = 0; i < 21; i++) pts.push([-shape[i * 3], shape[i * 3 + 1]]);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const s = Math.min(W * 0.78 / (x1 - x0 || 1), H * 0.78 / (y1 - y0 || 1)), cx = W / 2 - (x0 + x1) / 2 * s, cy = H / 2 - (y0 + y1) / 2 * s;
  const P = pts.map(([x, y]) => [cx + x * s, cy + y * s]);
  const fingers = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]], palm = [0, 1, 5, 9, 13, 17];
  g.fillStyle = 'rgba(255,216,77,.10)'; g.beginPath(); palm.forEach((i, k) => (k ? g.lineTo(...P[i]) : g.moveTo(...P[i]))); g.closePath(); g.fill();
  g.lineCap = 'round'; g.lineJoin = 'round';
  fingers.forEach((f, fi) => { g.strokeStyle = fi === 0 ? '#ffd84d' : '#f2efe8'; g.lineWidth = Math.max(6, W / 34); g.beginPath(); g.moveTo(...P[fi === 0 ? 0 : f[0]]); f.forEach((i) => g.lineTo(...P[i])); g.stroke(); });
  g.strokeStyle = 'rgba(242,239,232,.6)'; g.lineWidth = Math.max(4, W / 60); g.beginPath(); palm.forEach((i, k) => (k ? g.lineTo(...P[i]) : g.moveTo(...P[i]))); g.closePath(); g.stroke();
  if (label) { g.fillStyle = '#6f747b'; g.font = `${Math.max(11, W / 40)}px "Atkinson Hyperlegible Mono", monospace`; g.fillText(label, 12, H - 12); }
}
// Real signer animation (ASL Citizen) on a canvas: upper body + both hands.
const POSE_LINKS = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24]];
function drawSignFrame(cv, row) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height; g.clearRect(0, 0, W, H);
  const pt = (k) => (row[k * 2] < 0 ? null : [row[k * 2] / 1000 * W * 1.25 - W * 0.125, row[k * 2 + 1] / 1000 * H * 1.25 - H * 0.08]);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const nose = pt(0), ls = pt(11), rs = pt(12);
  if (nose && ls && rs) { const r = Math.hypot(ls[0] - rs[0], ls[1] - rs[1]) * 0.36; g.strokeStyle = 'rgba(242,239,232,.55)'; g.lineWidth = 3; g.beginPath(); g.ellipse(nose[0], nose[1] - r * 0.15, r * 0.8, r, 0, 0, 7); g.stroke(); }
  g.strokeStyle = 'rgba(242,239,232,.55)'; g.lineWidth = 7;
  for (const [a, b] of POSE_LINKS) { const A = pt(a), B = pt(b); if (A && B) { g.beginPath(); g.moveTo(...A); g.lineTo(...B); g.stroke(); } }
  for (const [off, col] of [[25, '#7cc4ff'], [46, '#ffd84d']]) {
    const P = Array.from({ length: 21 }, (_, i) => pt(off + i)); if (!P[0]) continue;
    g.strokeStyle = col; g.lineWidth = 4;
    for (const [a, b] of V.HAND_CONNECTIONS) { if (P[a] && P[b]) { g.beginPath(); g.moveTo(...P[a]); g.lineTo(...P[b]); g.stroke(); } }
  }
}

// ============================== speech output ==============================
const synth = window.speechSynthesis;
function loadVoices() {
  const sel = $('#voiceSel'), vs = synth ? synth.getVoices().filter((v) => v.lang.startsWith('en')) : [];
  if (!vs.length) return; const saved = store.get('gestura.voice', null);
  sel.innerHTML = vs.map((v) => `<option value="${v.name}" ${v.name === saved ? 'selected' : ''}>${v.name.replace(/Microsoft |Google /, '')} (${v.lang})</option>`).join('');
}
if (synth) { loadVoices(); synth.addEventListener?.('voiceschanged', loadVoices); }
function speak(text) {
  if (!synth) return toast('This browser cannot speak text aloud.');
  if (!text.trim()) return toast('Nothing to speak yet.');
  synth.cancel(); const u = new SpeechSynthesisUtterance(text);
  const v = synth.getVoices().find((x) => x.name === $('#voiceSel').value); if (v) u.voice = v;
  u.rate = +$('#rate').value; synth.speak(u);
}

// ============================== dictionary ==============================
let DICT = null, DICTSET = null;
async function dict() { if (!DICT) { DICT = (await (await fetch('models/words10k.txt')).text()).split('\n').map((w) => w.trim()).filter((w) => /^[a-z]+$/.test(w)); DICTSET = new Set(DICT); } return DICT; }
function edit(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function suggest(word) {
  const w = word.toLowerCase(); if (!DICT || w.length < 2 || DICTSET.has(w)) return [];
  const c = []; for (let i = 0; i < DICT.length; i++) { const x = DICT[i]; if (Math.abs(x.length - w.length) > 1) continue; const e = edit(w, x); if (e <= (w.length > 4 ? 2 : 1)) c.push([e, i, x]); }
  return c.sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, 3).map((x) => x[2]);
}

// ============================== translate ==============================
const T = { mode: 'letters', words: [], cur: '', stream: null, running: false, lastHand: 0, speller: null, seg: null, busy: false, feat: null, frames: 0, fpsT: performance.now(), rec: null, recStart: 0 };
function renderCaption() {
  const c = $('#caption');
  if (!T.words.length && !T.cur) { c.innerHTML = '<span class="ph">Sign something and it appears here.</span>'; return; }
  c.innerHTML = T.words.map((w) => `<span class="w">${w.text}</span> `).join('') + (T.cur ? `<span class="cur">${T.cur}</span>` : (T.mode === 'letters' ? '<span class="cur"></span>' : ''));
  c.scrollTop = c.scrollHeight;
}
const transcript = () => (T.words.map((w) => w.text).join(' ') + (T.cur ? ' ' + T.cur : '')).trim();
function addWord(text, kind) { T.words.push({ text, kind }); renderCaption(); if ($('#autoSpeak').checked) speak(text); }
function finishSpelledWord() {
  if (!T.cur) return; const w = T.cur; T.cur = ''; addWord(w, 'spelled');
  const s = suggest(w); const box = $('#sug');
  if (s.length) { box.hidden = false; box.innerHTML = `<span>Did you mean</span>${s.map((x) => `<button data-s="${x}">${x.toUpperCase()}</button>`).join('')}`; } else box.hidden = true;
}
$('#sug').addEventListener('click', (e) => { const s = e.target.dataset.s; if (!s) return; const last = T.words[T.words.length - 1]; if (last) { last.text = s.toUpperCase(); renderCaption(); } $('#sug').hidden = true; });
function meter(items) {
  $('#meter').innerHTML = items.length ? items.slice(0, 5).map(([k, p]) => `<div class="m"><b>${k}</b><div class="b"><i style="width:${(p * 100).toFixed(0)}%"></i></div><span>${Math.round(p * 100)}%</span></div>`).join('')
    : `<p class="empty">${T.mode === 'letters' ? 'Show one hand to the camera.' : 'Sign a word, then lower your hands.'}</p>`;
}
function bubble(text, progress, sub, wordy = false) {
  const b = $('#bubble'); if (!text) { b.hidden = true; return; } b.hidden = false;
  $('#bubbleText').textContent = text; $('#bubbleText').className = wordy ? 'wordy' : ''; $('#bubbleRing').style.setProperty('--p', progress); $('#bubbleSub').textContent = sub || '';
}
function setMode(m) {
  T.mode = m; document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-selected', b.dataset.mode === m));
  $('#modePill').textContent = m === 'letters' ? 'FINGERSPELLING' : 'SIGNS';
  $('#modeHint').textContent = m === 'letters' ? 'Hold each letter steady for half a second. Lower your hand to finish a word.' : 'Sign one word, then lower your hands. Gestura reads the whole movement.';
  finishSpelledWord(); T.speller = new L.Speller(); T.seg = new W.Segmenter(); meter([]); bubble(null);
  if (m === 'words') { toast('Loading the sign model (6 MB)…', 2000); Promise.all([W.loadWords(), V.detector('holistic')]).catch((e) => toast('Could not load the sign model: ' + e.message)); }
}
document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

async function startCamera(video, idle) {
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false });
    video.srcObject = s; await video.play(); idle.hidden = true; return s;
  } catch (e) { toast(e.name === 'NotAllowedError' ? 'Camera permission was blocked. Allow it in your browser settings.' : 'No camera found.'); return null; }
}
$('#startCam').addEventListener('click', async () => {
  $('#startCam').disabled = true; $('#startCam').textContent = 'Loading models…';
  await Promise.all([L.loadLetters(), V.detector('hand'), dict()]).catch((e) => toast('Could not load the hand model: ' + e.message));
  T.stream = await startCamera($('#video'), $('#camIdle')); $('#startCam').disabled = false; $('#startCam').textContent = 'Turn on camera';
  if (!T.stream) return; $('#hud').hidden = false; T.speller = new L.Speller(); T.seg = new W.Segmenter(); T.running = true; meter([]); loop();
});
async function loop() {
  if (!T.running || location.hash.replace('#/', '') !== 'translate' && location.hash !== '') { T.running = false; return; }
  const video = $('#video'), cv = $('#overlay'), g = cv.getContext('2d'), now = performance.now();
  if (video.readyState >= 2) {
    const m = cover(cv, video); g.clearRect(0, 0, m.W, m.H); const show = $('#showSkel').checked;
    try {
      if (T.mode === 'letters') {
        const r = (await V.detector('hand')).detectForVideo(video, now);
        if (r.landmarks?.length) {
          T.lastHand = now; const lm = r.landmarks[0], handed = r.handedness[0][0].categoryName;
          const f = L.features(L.normalise(lm, handed)); T.feat = f;
          const probs = L.blend(L.predict(f), f.slice(0, 63)), out = T.speller.push(probs, now);
          const M = L.lettersModel(); meter(probs.map((p, i) => [M.letters[i], p]).sort((a, b) => b[1] - a[1]));
          if (out.commit) { T.cur += out.commit; renderCaption(); bubble(out.commit, 1, 'added'); $('#sug').hidden = true; }
          else bubble(out.lead, out.progress, `${Math.round(out.p * 100)}%`);
          if (show) drawHand(g, lm, m, '#ffd84d');
        } else {
          T.feat = null; bubble(null);
          if (T.lastHand && now - T.lastHand > 1100) { finishSpelledWord(); T.speller.handLost(); T.lastHand = 0; meter([]); }
          else if (T.lastHand && now - T.lastHand > 300) T.speller.handLost();
        }
      } else {
        const det = await V.detector('holistic'); const r = det.detectForVideo(video, now);
        const lh = r.leftHandLandmarks?.[0], rh = r.rightHandLandmarks?.[0], visible = !!(lh || rh);
        if (show) { drawPose(g, r.poseLandmarks?.[0], m); if (lh) drawHand(g, lh, m, '#7cc4ff'); if (rh) drawHand(g, rh, m, '#ffd84d'); }
        const seg = T.seg.push(W.frameFromHolistic(r), visible, now);
        if (T.seg.active) bubble('…', Math.min(1, T.seg.buf.length / 40), 'reading', true);
        if (seg && !T.busy) {
          T.busy = true; bubble('…', 1, 'thinking', true);
          W.loadWords().then(() => W.classify(seg)).then((preds) => {
            meter(preds.map((p) => [p.word, p.p]));
            if (preds[0].p >= 0.3) { addWord(preds[0].word.toUpperCase(), 'sign'); bubble(preds[0].word, 1, `${Math.round(preds[0].p * 100)}%`, true); $('#sug').hidden = true; }
            else { bubble('?', 0, 'not sure', true); const box = $('#sug'); box.hidden = false; box.innerHTML = `<span>Not sure. Was it</span>${preds.slice(0, 3).map((p) => `<button data-w="${p.word}">${p.word.toUpperCase()}</button>`).join('')}`; }
          }).catch((e) => toast('Sign model error: ' + e.message)).finally(() => (T.busy = false));
        }
        if (!visible && !T.seg.active && !T.busy) setTimeout(() => !T.seg.active && !T.busy && bubble(null), 1500);
      }
    } catch (e) { /* a frame can fail while a model is still loading */ }
    if (T.rec) composeRecFrame(video, g, cv);
    T.frames++; if (now - T.fpsT > 1000) { $('#fps').textContent = `${Math.round(T.frames * 1000 / (now - T.fpsT))} fps`; T.frames = 0; T.fpsT = now; }
  }
  requestAnimationFrame(loop);
}
$('#sug').addEventListener('click', (e) => { const w = e.target.dataset.w; if (!w) return; addWord(w.toUpperCase(), 'sign'); $('#sug').hidden = true; });

$('#speakBtn').addEventListener('click', () => speak(transcript()));
$('#spaceBtn').addEventListener('click', () => { if (T.cur) finishSpelledWord(); });
$('#delBtn').addEventListener('click', () => { if (T.cur) T.cur = T.cur.slice(0, -1); else T.words.pop(); renderCaption(); });
$('#clearBtn').addEventListener('click', () => { T.words = []; T.cur = ''; $('#sug').hidden = true; renderCaption(); });
$('#copyBtn').addEventListener('click', async () => { try { await navigator.clipboard.writeText(transcript()); toast('Copied.'); } catch { toast('Copy is blocked in this browser.'); } });
$('#voiceSel').addEventListener('change', () => store.set('gestura.voice', $('#voiceSel').value));
addEventListener('keydown', (e) => {
  if (location.hash.replace('#/', '') !== 'translate' && location.hash) return; if (e.target.closest('input,select,textarea')) return;
  if (e.key === ' ' && $('#calib').hidden) { e.preventDefault(); if (T.cur) finishSpelledWord(); }
  if (e.key === 'Backspace') $('#delBtn').click(); if (e.key === 'Enter') speak(transcript());
});

// ---- recording: the mirrored camera, hand tracking and live captions, burned into one video ----
let recCanvas = null;
function composeRecFrame(video, g, overlay) {
  const c = recCanvas, x = c.getContext('2d'), W = c.width, H = c.height;
  x.save(); x.translate(W, 0); x.scale(-1, 1); const s = Math.max(W / video.videoWidth, H / video.videoHeight); x.drawImage(video, (W - video.videoWidth * s) / 2, (H - video.videoHeight * s) / 2, video.videoWidth * s, video.videoHeight * s); x.restore();
  x.drawImage(overlay, 0, 0, W, H);
  const text = transcript().slice(-48); if (text) { x.font = `700 ${Math.round(H / 16)}px "Atkinson Hyperlegible Next", sans-serif`; const tw = x.measureText(text).width; x.fillStyle = 'rgba(0,0,0,.75)'; x.fillRect((W - tw) / 2 - 18, H - H / 6.4, tw + 36, H / 11); x.fillStyle = '#ffd84d'; x.fillText(text, (W - tw) / 2, H - H / 12.5); }
  x.font = `600 ${Math.round(H / 40)}px "Atkinson Hyperlegible Mono", monospace`; x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText('GESTURA', 18, 34);
  $('#recTime').textContent = new Date(performance.now() - T.recStart).toISOString().slice(15, 19);
}
$('#recBtn').addEventListener('click', () => {
  if (T.rec) { T.rec.stop(); return; }
  if (!T.stream) return toast('Turn on the camera first.');
  const v = $('#video'); recCanvas = Object.assign(document.createElement('canvas'), { width: 1280, height: Math.round(1280 * v.videoHeight / v.videoWidth) || 720 });
  const type = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm'].find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
  const rec = new MediaRecorder(recCanvas.captureStream(30), type ? { mimeType: type } : undefined), chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.onstop = () => {
    const blob = new Blob(chunks, { type: rec.mimeType }), url = URL.createObjectURL(blob), secs = Math.round((performance.now() - T.recStart) / 1000);
    const a = document.createElement('a'); a.href = url; a.download = `gestura-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${rec.mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
    a.innerHTML = `Recording · ${transcript().slice(0, 28) || 'untitled'}<span>${secs}s ↓</span>`; $('#recs').prepend(a);
    T.rec = null; $('#recBadge').hidden = true; $('#recBtn').classList.remove('recording'); $('#recBtn span').textContent = 'Record';
  };
  T.recStart = performance.now(); rec.start(500); T.rec = rec; $('#recBadge').hidden = false; $('#recBtn').classList.add('recording'); $('#recBtn span').textContent = 'Stop';
});

// ---- calibration ----
let calIdx = 0;
function calibRender() { const M = L.lettersModel(), Lt = M.letters[calIdx]; $('#calibLetter').textContent = Lt; drawShape($('#calibRef'), M.shapes[Lt]); const n = Object.values(L.calibration()).reduce((a, b) => a + b.length, 0); $('#calibCount').textContent = `${(L.calibration()[Lt] || []).length} samples of ${Lt} · ${n} in total`; }
$('#calibBtn').addEventListener('click', () => { if (!T.stream) return toast('Turn on the camera first.'); setMode('letters'); $('#calib').hidden = false; calibRender(); });
$('#calibPrev').addEventListener('click', () => { calIdx = (calIdx + 25) % 26; calibRender(); });
$('#calibNext').addEventListener('click', () => { calIdx = (calIdx + 1) % 26; calibRender(); });
const capture = () => { if (!T.feat) return toast('Show your hand first.'); L.addCalib(L.lettersModel().letters[calIdx], T.feat); calibRender(); };
$('#calibCap').addEventListener('click', capture);
addEventListener('keydown', (e) => { if (!$('#calib').hidden && e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation(); capture(); } }, true);
$('#calibReset').addEventListener('click', () => { L.clearCalib(); calibRender(); });
$('#calibDone').addEventListener('click', () => ($('#calib').hidden = true));

// ============================== video ==============================
const VD = { file: null, chips: [], dur: 0 };
const fileIn = $('#file'), drop = $('#drop');
fileIn.addEventListener('change', () => fileIn.files[0] && openVideo(fileIn.files[0]));
['dragover', 'dragenter'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('over')));
drop.addEventListener('drop', (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) openVideo(f); });
function openVideo(f) {
  VD.file = f; VD.chips = []; const v = $('#vid'); v.src = URL.createObjectURL(f); $('#vwork').hidden = false; $('#vres').innerHTML = ''; $('#timeline').hidden = true; $('#vspeak').hidden = true;
  drop.querySelector('b').textContent = f.name; v.onloadedmetadata = () => (VD.dur = v.duration);
}
const vstat = (t, p) => { $('#vprog').hidden = false; $('#vstat').textContent = t; if (p != null) $('#vbar').style.width = `${Math.round(p * 100)}%`; };
const seek = (v, t) => new Promise((r) => { v.onseeked = () => r(); v.currentTime = t; });
$('#analyse').addEventListener('click', async () => {
  if (!VD.file) return; const v = $('#vid'), btn = $('#analyse'); btn.disabled = true; v.pause();
  const wantW = $('#optWords').checked, wantL = $('#optLetters').checked, wantS = $('#optSpeech').checked;
  const res = { signs: [], letters: [], speech: [], mouth: [] };
  try {
    const speechJob = wantS ? transcribe(VD.file).then((r) => (res.speech = r)).catch((e) => { toast('Speech: ' + e.message); }) : Promise.resolve();
    if (wantW || wantL) {
      vstat('Loading hand, body and face models…', 0);
      const [hol, hand] = await Promise.all([V.detector('holistic', 'VIDEO', 'file' + Date.now()), wantL ? V.detector('hand', 'VIDEO', 'file' + Date.now()) : null, wantW ? W.loadWords() : null, wantL ? L.loadLetters() : null]);
      const dur = v.duration, step = 1 / 12, seg = new W.Segmenter({ pause: 350, min: 8, max: 120 }), sp = wantL ? new L.Speller({ hold: 300 }) : null;
      let segStart = null, lastLetterT = 0, word = '', wordT0 = 0;
      for (let t = 0; t < dur; t += step) {
        await seek(v, t); const ms = Math.round(t * 1000) + 1;
        const r = hol.detectForVideo(v, ms), visible = !!(r.leftHandLandmarks?.[0] || r.rightHandLandmarks?.[0]);
        const face = r.faceLandmarks?.[0]; if (face) { const open = Math.hypot(face[13].x - face[14].x, face[13].y - face[14].y) / (Math.hypot(face[234].x - face[454].x, face[234].y - face[454].y) || 1); res.mouth.push([t, open]); }
        if (wantW) {
          if (visible && segStart == null) segStart = t;
          const s = seg.push(W.frameFromHolistic(r), visible, ms);
          if (s) { const p = await W.classify(s); res.signs.push({ t0: segStart, t1: t, word: p[0].word, p: p[0].p, alt: p.slice(1, 3).map((x) => x.word) }); segStart = null; }
        }
        if (wantL) {
          const h = hand.detectForVideo(v, ms);
          if (h.landmarks?.length) { const f = L.features(L.normalise(h.landmarks[0], h.handedness[0][0].categoryName)); const o = sp.push(L.predict(f), ms); if (o.commit) { if (!word) wordT0 = t; word += o.commit; lastLetterT = t; } }
          else { sp.handLost(); if (word && t - lastLetterT > 0.9) { res.letters.push({ t0: wordT0, t1: lastLetterT + 0.3, word }); word = ''; } }
        }
        vstat(`Reading hands · ${t.toFixed(1)} / ${dur.toFixed(1)} s`, t / dur);
      }
      if (wantW) { const s = seg.flush(); if (s) { const p = await W.classify(s); res.signs.push({ t0: segStart ?? dur - 1, t1: dur, word: p[0].word, p: p[0].p, alt: [] }); } }
      if (wantL && word) res.letters.push({ t0: wordT0, t1: dur, word });
    }
    if (wantS) vstat('Transcribing speech…', 0.98);
    await speechJob; await lipServer(res);
    showVideoResults(res); vstat('Done', 1);
  } catch (e) { console.error(e); toast('Analysis failed: ' + e.message); }
  btn.disabled = false; v.currentTime = 0;
});
let worker = null;
async function transcribe(file) {
  const buf = await file.arrayBuffer(); const ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 16000, 16000);
  let audio; try { audio = await ctx.decodeAudioData(buf); } catch { throw new Error('this video has no readable audio track'); }
  const n = Math.round(audio.duration * 16000), off = new OfflineAudioContext(1, n, 16000), src = off.createBufferSource(); src.buffer = audio; src.connect(off.destination); src.start(); const mono = (await off.startRendering()).getChannelData(0);
  worker ||= new Worker('js/whisper-worker.js', { type: 'module' });
  return new Promise((resolve, reject) => {
    worker.onmessage = ({ data }) => {
      if (data.type === 'load') vstat(`Downloading speech model (first time only) · ${data.file?.split('/').pop() || ''}`, (data.pct || 0) / 100);
      if (data.type === 'status') vstat(data.text);
      if (data.type === 'done') resolve(data.chunks.length ? data.chunks : [{ text: data.text, t0: 0, t1: audio.duration }]);
      if (data.type === 'error') reject(new Error(data.text));
    };
    worker.postMessage({ audio: mono }, [mono.buffer]);
  });
}
async function lipServer(res) {
  const url = store.get('gestura.lipUrl', ''); if (!url) return;
  try { const fd = new FormData(); fd.append('video', VD.file); const r = await fetch(url, { method: 'POST', body: fd }); const j = await r.json(); if (j.text) res.lip = [{ t0: 0, t1: VD.dur, text: j.text }]; $('#lipState').textContent = 'Connected'; }
  catch { $('#lipState').textContent = 'Server unreachable'; }
}
function showVideoResults(r) {
  const card = (k, text) => `<div class="card"><h3>${k}</h3><p>${text}</p></div>`;
  let html = '';
  if (r.signs.length) html += card('Signs', r.signs.map((s) => s.word.toUpperCase()).join(' '));
  if (r.letters.length) html += card('Fingerspelling', r.letters.map((s) => s.word).join(' '));
  if (r.speech.length) html += card('Speech', r.speech.map((s) => s.text).join(' '));
  if (r.lip) html += card('Lip reading (server)', r.lip[0].text);
  if (!html) html = card('Nothing found', 'No hands were visible and no speech was detected. Try a clip with the signer facing the camera.');
  $('#vres').innerHTML = html; $('#vspeak').hidden = !(r.signs.length || r.letters.length || r.speech.length);
  VD.chips = [...r.signs.map((s) => ({ ...s, lane: 'Signs', text: s.word.toUpperCase(), cls: '' })), ...r.letters.map((s) => ({ ...s, lane: 'Fingerspelling', text: s.word, cls: 'lt' })), ...r.speech.map((s) => ({ ...s, lane: 'Speech', text: s.text, cls: 'sp' }))];
  const dur = VD.dur || 1, pct = (t) => `${(t / dur * 100).toFixed(2)}%`;
  const lanes = ['Signs', 'Fingerspelling', 'Speech'].filter((l) => VD.chips.some((c) => c.lane === l));
  let tl = lanes.map((l) => `<div class="lane"><span>${l}</span><div class="track">${VD.chips.filter((c) => c.lane === l).map((c) => `<button class="chip ${c.cls}" style="left:${pct(c.t0)}" data-t="${c.t0}" title="${c.text}${c.p ? ` · ${Math.round(c.p * 100)}%` : ''}">${c.text.length > 22 ? c.text.slice(0, 21) + '…' : c.text}</button>`).join('')}<i class="playhead"></i></div></div>`).join('');
  if (r.mouth.length) { const mx = Math.max(...r.mouth.map((m) => m[1])) || 1; tl += `<div class="lane"><span>Mouth movement</span><div class="track">${r.mouth.map(([t, o]) => `<i class="mouth" style="left:${pct(t)};height:${Math.max(2, o / mx * 30)}px"></i>`).join('')}<i class="playhead"></i></div></div>`; }
  $('#tl').innerHTML = tl; $('#timeline').hidden = !tl;
}
$('#tl').addEventListener('click', (e) => { const t = e.target.dataset.t; if (t != null) { const v = $('#vid'); v.currentTime = +t; v.play(); } });
$('#vid').addEventListener('timeupdate', () => {
  const v = $('#vid'), t = v.currentTime; document.querySelectorAll('.playhead').forEach((p) => (p.style.left = `${(t / (VD.dur || 1) * 100).toFixed(2)}%`));
  const now = VD.chips.filter((c) => t >= c.t0 && t <= Math.max(c.t1, c.t0 + 1.2)).map((c) => c.text); $('#vcap').textContent = now.join('  ·  ');
});
$('#vspeak').addEventListener('click', () => speak([...$('#vres').querySelectorAll('.card p')].map((p) => p.textContent).join('. ')));
$('#lipUrl').value = store.get('gestura.lipUrl', '');
$('#lipUrl').addEventListener('change', () => { const u = $('#lipUrl').value.trim(); store.set('gestura.lipUrl', u); $('#lipState').textContent = u ? 'Will be used on the next analysis' : 'Not connected'; });

// ============================== learn ==============================
const LR = { tab: 'abc', idx: 0, words: [], anim: null, raf: 0, stream: null, running: false, ema: 0, okSince: 0, seg: null, busy: false };
const done = () => store.get('gestura.learned', {});
async function learnInit() {
  await L.loadLetters(); if (!LR.words.length) LR.words = await (await fetch('models/signs/_index.json')).json();
  renderGrid(); select(LR.idx);
}
function renderGrid() {
  const d = done(), g = $('#lgrid'); g.className = 'lgrid' + (LR.tab === 'words' ? ' words' : '');
  const items = LR.tab === 'abc' ? L.lettersModel().letters : LR.words;
  g.innerHTML = items.map((x, i) => `<button data-i="${i}" class="${d[(LR.tab === 'abc' ? 'L:' : 'W:') + x] ? 'done' : ''}" ${i === LR.idx ? 'aria-current="true"' : ''}>${LR.tab === 'abc' ? x : x}</button>`).join('');
}
$('#lgrid').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) select(+b.dataset.i); });
document.querySelectorAll('[data-ltab]').forEach((b) => b.addEventListener('click', () => {
  LR.tab = b.dataset.ltab; LR.idx = 0; document.querySelectorAll('[data-ltab]').forEach((x) => x.setAttribute('aria-selected', x === b));
  if (LR.tab === 'words') { W.loadWords().catch(() => {}); V.detector('holistic', 'VIDEO', 'learn').catch(() => {}); }
  renderGrid(); select(0);
}));
async function select(i) {
  const items = LR.tab === 'abc' ? L.lettersModel().letters : LR.words; LR.idx = (i + items.length) % items.length; const x = items[LR.idx];
  document.querySelectorAll('#lgrid button').forEach((b) => (+b.dataset.i === LR.idx ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
  $('#lgrid button[aria-current]')?.scrollIntoView({ block: 'nearest' });
  LR.ema = 0; LR.okSince = 0; $('#lVerdict').hidden = true; $('#lbar').style.width = '0'; $('#lscore').textContent = '—'; cancelAnimationFrame(LR.raf); LR.anim = null;
  if (LR.tab === 'abc') {
    $('#refKind').textContent = 'LETTER'; $('#refTitle').textContent = x; $('#refTip').textContent = TIPS[x];
    drawShape($('#refCanvas'), L.lettersModel().shapes[x]); $('#refSrc').textContent = `Average of ${x === 'J' || x === 'Z' ? 'final' : 'real'} handshapes in ~330 training photos · as you see it`;
    $('#lHint').textContent = 'Match the shape. Hold it steady until the bar fills.';
  } else {
    $('#refKind').textContent = 'SIGN'; $('#refTitle').textContent = x; $('#refTip').textContent = 'Watch the movement, then sign it once and lower your hands.';
    $('#refSrc').textContent = 'Real signer from ASL Citizen (Desai et al., 2023) · yellow = dominant hand';
    const a = await (await fetch(`models/signs/${encodeURIComponent(x)}.json`)).json(); LR.anim = a; let k = 0, last = 0;
    const tick = (ts) => { if (LR.anim !== a) return; if (ts - last > 1000 / a.fps) { if (k < a.f.length) drawSignFrame($('#refCanvas'), a.f[k]); k = (k + 1) % (a.f.length + 10); last = ts; } LR.raf = requestAnimationFrame(tick); };   // short pause on the last frame
    LR.raf = requestAnimationFrame(tick);
    $('#lHint').textContent = 'Sign the word once, then lower your hands. Gestura checks it with the sign model.';
  }
}
$('#lPrev').addEventListener('click', () => select(LR.idx - 1)); $('#lNext').addEventListener('click', () => select(LR.idx + 1));
$('#lStart').addEventListener('click', async () => { LR.stream = await startCamera($('#lvideo'), $('#lIdle')); if (LR.stream) { LR.running = true; LR.seg = new W.Segmenter(); learnLoop(); } });
function verdict(cls, text) { const v = $('#lVerdict'); v.hidden = false; v.className = 'verdict ' + cls; v.textContent = text; }
function markDone(key) { const d = done(); d[key] = true; store.set('gestura.learned', d); renderGrid(); }
async function learnLoop() {
  if (!LR.running || location.hash !== '#/learn') { LR.running = false; return; }
  const video = $('#lvideo'), cv = $('#loverlay'), g = cv.getContext('2d'), now = performance.now();
  if (video.readyState >= 2) {
    const m = cover(cv, video); g.clearRect(0, 0, m.W, m.H);
    try {
      if (LR.tab === 'abc') {
        const r = (await V.detector('hand', 'VIDEO', 'learn')).detectForVideo(video, now), M = L.lettersModel(), target = M.letters[LR.idx];
        if (r.landmarks?.length) {
          drawHand(g, r.landmarks[0], m, '#ffd84d');
          const f = L.features(L.normalise(r.landmarks[0], r.handedness[0][0].categoryName)), p = L.blend(L.predict(f), f.slice(0, 63));
          const tp = p[M.letters.indexOf(target)]; LR.ema = 0.7 * LR.ema + 0.3 * tp; const best = M.letters[p.indexOf(Math.max(...p))];
          $('#lbar').style.width = `${Math.round(LR.ema * 100)}%`; $('#lscore').textContent = `${Math.round(LR.ema * 100)}%`;
          if (LR.ema > 0.6) { LR.okSince ||= now; if (now - LR.okSince > 600 && $('#lVerdict').hidden) { verdict('ok', `That's ${target}!`); markDone('L:' + target); } }
          else { LR.okSince = 0; if (LR.ema < 0.3 && best !== target) $('#lHint').textContent = `Gestura sees ${best}. ${TIPS[target]}`; }
        }
      } else if (!LR.busy) {
        const r = (await V.detector('holistic', 'VIDEO', 'learn')).detectForVideo(video, now);
        const lh = r.leftHandLandmarks?.[0], rh = r.rightHandLandmarks?.[0]; drawPose(g, r.poseLandmarks?.[0], m); if (lh) drawHand(g, lh, m, '#7cc4ff'); if (rh) drawHand(g, rh, m, '#ffd84d');
        const seg = LR.seg.push(W.frameFromHolistic(r), !!(lh || rh), now); if (LR.seg.active) $('#lscore').textContent = 'reading';
        if (seg) {
          LR.busy = true; const target = LR.words[LR.idx];
          W.loadWords().then(() => W.classify(seg)).then((p) => {
            const rank = p.findIndex((x) => x.word === target), tp = p[rank]?.p ?? 0; $('#lbar').style.width = `${Math.round(tp * 100)}%`; $('#lscore').textContent = `#${rank + 1}`;
            if (rank === 0) { verdict('ok', `Yes, that's ${target.toUpperCase()}!`); markDone('W:' + target); }
            else if (rank > 0 && rank < 5) verdict('close', `Close. Gestura read ${p[0].word.toUpperCase()}; ${target.toUpperCase()} was #${rank + 1}.`);
            else verdict('no', `Gestura read ${p[0].word.toUpperCase()}. Watch it again and try once more.`);
          }).finally(() => (LR.busy = false));
        }
      }
    } catch (e) { /* model still loading */ }
  }
  requestAnimationFrame(learnLoop);
}

// ============================== about ==============================
async function aboutInit() {
  const [a, ev] = await Promise.all([L.loadLetters(), (await fetch('models/eval.json')).json()]); const e = a.eval;
  $('#models').innerHTML = `
  <article class="model"><span class="k">Fingerspelling</span><h3>A–Z from one hand</h3><div class="big">${(e.heldOut * 100).toFixed(1)}%<small>held-out photos</small></div>
    <p>Trained on ${e.n.toLocaleString()} real alphabet photos. On ${e.externalN} photos from a completely different collection it got ${(e.external * 100).toFixed(1)}% exactly right and ${(e.externalTop3 * 100).toFixed(1)}% in its top three. Calibrating to your hand closes most of that gap.</p>
    <dl><dt>Model</dt><dd>MediaPipe Hands + MLP</dd><dt>Size</dt><dd>1 MB</dd></dl></article>
  <article class="model"><span class="k">Signs</span><h3>250 everyday words</h3><div class="big">${(ev.words.top1 * 100).toFixed(1)}%<small>top-1</small></div>
    <p>Tested on ${ev.words.clips} clips of ${ev.words.vocabCovered} words signed by real people in ASL Citizen, none of whom the model had seen. The right word was in its top five ${(ev.words.top5 * 100).toFixed(1)}% of the time.</p>
    <dl><dt>Model</dt><dd>Kaggle ISLR 1st place</dd><dt>Size</dt><dd>6 MB (8-bit)</dd></dl></article>
  <article class="model"><span class="k">Speech in video</span><h3>Whisper, on device</h3><div class="big">~4%<small>word error</small></div>
    <p>${ev.speech.note}. Runs in a background thread; the model downloads once (about 80 MB).</p>
    <dl><dt>Model</dt><dd>${ev.speech.model}</dd><dt>Lip reading</dt><dd>GPU server</dd></dl></article>`;
}

// ============================== router ==============================
function route() {
  const tab = location.hash.replace('#/', '') || 'translate';
  document.querySelectorAll('[data-view]').forEach((v) => (v.hidden = v.dataset.view !== tab));
  document.querySelectorAll('[data-tab]').forEach((a) => (a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  if (tab === 'translate' && T.stream && !T.running) { T.running = true; loop(); }
  if (tab === 'learn') { learnInit(); if (LR.stream && !LR.running) { LR.running = true; learnLoop(); } }
  if (tab === 'about') aboutInit();
  document.title = { translate: 'Gestura · Sign language, understood', video: 'Video · Gestura', learn: 'Learn · Gestura', about: 'How it works · Gestura' }[tab] || 'Gestura';
}
addEventListener('hashchange', route); route(); renderCaption(); meter([]);
