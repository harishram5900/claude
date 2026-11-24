const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); p.on('console', m => console.log('C', m.text().slice(0,200)));
  await p.goto('http://localhost:8765/#/about');
  const r = await p.evaluate(async () => {
    const V = await import('/js/vision.js'), W = await import('/js/words.js');
    const det = await V.detector('holistic', 'VIDEO', 'dbg');
    const v = document.createElement('video'); v.muted = true; document.body.append(v); v.src = URL.createObjectURL(await (await fetch('/_seed/hello.mp4')).blob()); await new Promise(r => v.onloadeddata = r);
    const seek = (t) => new Promise((r) => { v.onseeked = () => r(); v.currentTime = t; });
    const rows = []; let clock = 1; const mem = {};
    for (let t = 0; t < v.duration; t += 0.25) { await seek(t); clock += 250; const res = det.detectForVideo(v, clock); const f = W.frameFromHolistic(res);
      rows.push([t.toFixed(2), !!res.poseLandmarks?.[0], !!res.leftHandLandmarks?.[0], !!res.rightHandLandmarks?.[0], f[489*3+11*3+1]?.toFixed(2), f[468*3+1]?.toFixed(2), f[522*3+1]?.toFixed(2), W.signing(f, mem)]); }
    return rows;
  });
  console.log(r.map(x => x.join(' ')).join('\n')); await b.close();
})();
