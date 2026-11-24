// Google MediaPipe Tasks (in the browser): Hand Landmarker for letters, Holistic Landmarker for words.
const VER = '0.10.14';
let lib = null, fileset = null; const cache = {};
async function base() {
  if (!lib) { lib = await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/vision_bundle.mjs`); fileset = await lib.FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`); }
  return lib;
}
async function make(kind, mode, gpu) {
  const L = await base();
  const opts = { runningMode: mode, baseOptions: { delegate: gpu ? 'GPU' : 'CPU' } };
  if (kind === 'hand') return L.HandLandmarker.createFromOptions(fileset, { ...opts, numHands: 1, minHandDetectionConfidence: 0.5, minTrackingConfidence: 0.5, baseOptions: { ...opts.baseOptions, modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' } });
  return L.HolisticLandmarker.createFromOptions(fileset, { ...opts, baseOptions: { ...opts.baseOptions, modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task' } });
}
// One detector per kind+mode; falls back to CPU if the GPU delegate is unavailable.
// `tag` gives a separate instance (each instance needs its own increasing timestamps, e.g. live camera vs a video file).
export async function detector(kind, mode = 'VIDEO', tag = '') {
  const k = kind + mode + tag; if (cache[k]) return cache[k];
  cache[k] = make(kind, mode, true).catch(() => make(kind, mode, false));
  return cache[k];
}
export const HAND_CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
export const POSE_UPPER = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24]];
