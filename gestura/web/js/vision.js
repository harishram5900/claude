// Google MediaPipe Tasks in the browser: Hand Landmarker for letters; Pose + Hand + Face Landmarkers for signs.
//
// Signs use MediaPipe HolisticLandmarker ('holistic'): the same tracker family that produced the training data, and in
// tests/e2e it read real signer videos correctly and several times faster than 'combo' (separate Pose, Hand and Face
// Landmarkers with each hand attached to the nearest body wrist), which is kept as a fallback option.
const VER = '0.10.14';
const MODELS = {
  hand: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  pose: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
  face: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  holistic: 'https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task',
};
let lib = null, fileset = null; const cache = {};
async function base() {
  if (!lib) { lib = await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/vision_bundle.mjs`); fileset = await lib.FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`); }
  return lib;
}
async function make(kind, mode, gpu) {
  const L = await base(), b = (m) => ({ runningMode: mode, baseOptions: { delegate: gpu ? 'GPU' : 'CPU', modelAssetPath: MODELS[m] } });
  if (kind === 'hand') return L.HandLandmarker.createFromOptions(fileset, { ...b('hand'), numHands: 1, minHandDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
  if (kind === 'holistic') return L.HolisticLandmarker.createFromOptions(fileset, { ...b('holistic') });
  const [pose, hands, face] = await Promise.all([
    L.PoseLandmarker.createFromOptions(fileset, { ...b('pose'), numPoses: 1 }),
    L.HandLandmarker.createFromOptions(fileset, { ...b('hand'), numHands: 2, minHandDetectionConfidence: 0.4, minHandPresenceConfidence: 0.4, minTrackingConfidence: 0.4 }),
    L.FaceLandmarker.createFromOptions(fileset, { ...b('face'), numFaces: 1 }),
  ]);
  return new Holistic(pose, hands, face);
}
const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
class Holistic {
  constructor(pose, hands, face) { Object.assign(this, { pose, hands, face }); }
  // Same shape as MediaPipe HolisticLandmarker results: arrays holding one landmark list each.
  detectForVideo(video, ts) {
    const p = this.pose.detectForVideo(video, ts), h = this.hands.detectForVideo(video, ts), f = this.face.detectForVideo(video, ts);
    const pose = p.landmarks?.[0], out = { poseLandmarks: pose ? [pose] : [], faceLandmarks: f.faceLandmarks?.[0] ? [f.faceLandmarks[0].slice(0, 468)] : [], leftHandLandmarks: [], rightHandLandmarks: [] };
    const found = (h.landmarks || []).map((lm, i) => ({ lm, label: h.handedness?.[i]?.[0]?.categoryName }));
    if (!found.length) return out;
    if (pose) {
      const lw = pose[15], rw = pose[16];
      if (found.length === 1) { const [a] = found; (d2(a.lm[0], lw) <= d2(a.lm[0], rw) ? out.leftHandLandmarks : out.rightHandLandmarks).push(a.lm); }
      else {
        const [a, c] = found, keep = d2(a.lm[0], lw) + d2(c.lm[0], rw) <= d2(a.lm[0], rw) + d2(c.lm[0], lw);
        out.leftHandLandmarks.push(keep ? a.lm : c.lm); out.rightHandLandmarks.push(keep ? c.lm : a.lm);
      }
    } else {
      // no body: MediaPipe labels handedness as if the image were mirrored, and ours is not, so "Left" is the signer's right hand
      for (const a of found) (a.label === 'Left' ? out.rightHandLandmarks : out.leftHandLandmarks).push(a.lm);
    }
    return out;
  }
}
// One detector per kind+mode+tag. GPU first; if the GPU is unavailable, or turns out slower than the CPU on this
// machine (common with software or weak integrated graphics), it switches to the CPU by itself.
// `tag` gives a separate instance (each instance needs its own increasing timestamps, e.g. live camera vs a video file).
class Adaptive {
  constructor(kind, mode, gpu) { Object.assign(this, { kind, mode, gpu, inner: null, times: [], swapping: null }); }
  async init() {
    const cpu = new URLSearchParams(location.search).has('cpu');
    if (!cpu) { try { this.inner = await make(this.kind, this.mode, true); this.onGPU = true; return this; } catch { /* no GPU */ } }
    this.inner = await make(this.kind, this.mode, false); this.onGPU = false; return this;
  }
  detectForVideo(video, ts) {
    const t = performance.now(), r = this.inner.detectForVideo(video, ts), dt = performance.now() - t;
    if (this.onGPU && !this.swapping && this.times.push(dt) >= 12) {
      const med = this.times.slice(4).sort((a, b) => a - b)[4];
      if (med > 120) this.swapping = make(this.kind, this.mode, false).then((c) => { this.inner = c; this.onGPU = false; this.times = []; console.info(`[gestura] ${this.kind}: GPU ${Math.round(med)} ms/frame, switched to CPU`); }).catch(() => {});
      else this.times = [];
      if (med <= 120) this.onGPU = 'checked';
    }
    return r;
  }
  detect(img) { return this.inner.detect(img); }
}
export async function detector(kind, mode = 'VIDEO', tag = '') {
  const k = kind + mode + tag; if (cache[k]) return cache[k];
  cache[k] = mode === 'VIDEO' ? new Adaptive(kind, mode).init() : make(kind, mode, true).catch(() => make(kind, mode, false));
  return cache[k];
}
export const HAND_CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
export const POSE_UPPER = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24]];
