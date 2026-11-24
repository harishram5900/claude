const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); await p.goto('http://localhost:8765/#/about');
  const r = await p.evaluate(async () => {
    const v = document.createElement('video'); v.muted = true; document.body.append(v); v.src = '/_seed/hello.mp4'; await new Promise(r => v.onloadeddata = r);
    const shots = [];
    for (const t of [0.5, 2.0, 3.0]) { await new Promise((r) => { v.onseeked = r; v.currentTime = t; }); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const c = document.createElement('canvas'); c.width = 320; c.height = 240; c.getContext('2d').drawImage(v, 0, 0, 320, 240); shots.push(c.toDataURL('image/png')); }
    return { shots, codec: v.videoWidth + 'x' + v.videoHeight };
  });
  r.shots.forEach((s, i) => fs.writeFileSync(`/tmp/claude-0/-home-user/87d4f8ca-5579-5ea9-a33c-b97253f130a9/scratchpad/gt/vf${i}.png`, Buffer.from(s.split(',')[1], 'base64')));
  console.log(r.codec); await b.close();
})();
