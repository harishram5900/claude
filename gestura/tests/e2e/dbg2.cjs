const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); 
  for (const ver of ['0.10.14']) for (const del of ['CPU']) {
    const p = await b.newPage(); await p.goto('http://localhost:8765/#/about');
    const r = await p.evaluate(async ({ ver, del }) => {
      const lib = await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${ver}/vision_bundle.mjs`);
      const fs = await lib.FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${ver}/wasm`);
      const det = await lib.HolisticLandmarker.createFromOptions(fs, { runningMode: 'VIDEO', baseOptions: { delegate: del, modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task' } });
      const v = document.createElement('video'); v.muted = true; document.body.append(v); v.src = URL.createObjectURL(await (await fetch('/_seed/hello.mp4')).blob()); await new Promise(r => v.onloadeddata = r);
      const seek = (t) => new Promise((r) => { v.onseeked = () => r(); v.currentTime = t; });
      let clock = 1, hands = 0, n = 0, face = 0; const t0 = performance.now();
      for (let t = 0; t < v.duration; t += 0.2) { await seek(t); clock += 200; const res = det.detectForVideo(v, clock); n++; if (res.leftHandLandmarks?.[0] || res.rightHandLandmarks?.[0]) hands++; if (res.faceLandmarks?.[0]) face++; }
      return { hands, face, n, msPerFrame: Math.round((performance.now() - t0) / n) };
    }, { ver, del }).catch(e => ({ err: e.message.slice(0, 200) }));
    console.log(ver, del, JSON.stringify(r)); await p.close();
  }
  await b.close();
})();
