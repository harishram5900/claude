const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); await p.goto('http://localhost:8765/#/about');
  const r = await p.evaluate(async () => {
    const lib = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
    const fs = await lib.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
    const out = {};
    const img = new Image(); img.src = '/_hello2.png'; await img.decode();
    const v = document.createElement('video'); v.muted = true; document.body.append(v); v.src = '/_seed/hello.mp4'; await new Promise(r => v.onloadeddata = r);
    await new Promise((r) => { v.onseeked = r; v.currentTime = 2.0; });
    const c = document.createElement('canvas'); c.width = 640; c.height = 480; c.getContext('2d').drawImage(v, 0, 0);
    for (const del of ['CPU', 'GPU']) {
      const mk = (mode) => lib.HandLandmarker.createFromOptions(fs, { runningMode: mode, numHands: 2, minHandDetectionConfidence: 0.3, baseOptions: { delegate: del, modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' } });
      const im = await mk('IMAGE'); out[del + ' image png'] = im.detect(img).landmarks.length; out[del + ' image canvas-from-video'] = im.detect(c).landmarks.length; out[del + ' image video-el'] = im.detect(v).landmarks.length;
      const vd = await mk('VIDEO'); out[del + ' video-el'] = vd.detectForVideo(v, 1000).landmarks.length; out[del + ' video canvas'] = vd.detectForVideo(c, 2000).landmarks.length;
    }
    return out;
  });
  console.log(JSON.stringify(r, null, 1)); await b.close();
})();
