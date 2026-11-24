// End-to-end word test in a real browser: each ASL Citizen seed-signer video (a person never in training) is played
// through the app's own code: MediaPipe Holistic (browser) -> Segmenter -> sign model. Usage:
//   node words_e2e.js <baseUrl> <fps> <shard> <nshards> <out.json>
const { chromium } = require('playwright');
const [base, fps, shard, nshards, outFile, kind] = [process.argv[2], +process.argv[3], +process.argv[4], +process.argv[5], process.argv[6], process.argv[7] || 'holistic'];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); p.on('console', (m) => { if (m.text().startsWith('E2E')) console.log(m.text()); });
  await p.goto(base + '/#/about'); await p.waitForTimeout(500);
  const words = (await (await fetch(base + '/_seed/_index.json')).json());
  const list = Object.keys(words).sort().filter((_, i) => i % nshards === shard);
  const res = await p.evaluate(async ({ list, fps, kind }) => {
    const V = await import('/js/vision.js'), W = await import('/js/words.js');
    await W.loadWords(); const det = await V.detector(kind, 'VIDEO', 'e2e');
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; document.body.append(v);
    const seek = (t) => new Promise((r) => { const to = setTimeout(r, 3000); v.onseeked = () => { clearTimeout(to); r(); }; v.currentTime = t; });
    let clock = 1; const out = [];
    for (const w of list) {
      const ready = new Promise((r) => (v.onloadeddata = r)); v.src = URL.createObjectURL(await (await fetch(`/_seed/${w.replace(/ /g, '_')}.mp4`)).blob()); await ready;
      const seg = new W.Segmenter(), segs = [];
      for (let t = 0; t < v.duration; t += 1 / fps) {
        await seek(t); clock += 1000 / fps;
        const s = seg.push(W.frameFromHolistic(det.detectForVideo(v, clock)), clock); if (s) segs.push(s);
      }
      const last = seg.flush(); if (last) segs.push(last);
      const preds = []; for (const s of segs) { const p = await W.classify(s); preds.push(p.slice(0, 5).map((x) => [x.word, +x.p.toFixed(3)])); }
      out.push({ w, preds, n: segs.length }); console.log('E2E', w, segs.length, preds[0]?.[0]?.join(':'), Math.round(performance.now() / 1000));
    }
    return out;
  }, { list, fps, kind });
  require('fs').writeFileSync(outFile, JSON.stringify(res));
  await b.close();
})();
