// Live Signs test through the real camera path: Translate page, Signs mode, fake webcam = ASL Citizen seed signer
// (HELLO NICE MEET YOU, BATHROOM WHERE, THANK YOU) played at 1/3 speed because this machine has no GPU.
const { chromium } = require('playwright');
const [base, cam, secs] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${cam}`] });
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['camera'] })).newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await p.goto(base + '/#/translate'); await p.click('[data-mode=words]'); await p.click('#startCam');
  await p.waitForFunction(() => !document.querySelector('#hud').hidden, null, { timeout: 120000 }); const t0 = Date.now(); let last = '';
  while (Date.now() - t0 < +secs * 1000) {
    const g = (await p.textContent('#gloss')).trim(); if (g !== last) { console.log(((Date.now() - t0) / 1000).toFixed(0) + 's', g, '|', (await p.textContent('#caption')).trim(), '| fps', await p.textContent('#fps')); last = g; }
    await p.waitForTimeout(500);
  }
  await p.screenshot({ path: process.argv[5] || '/tmp/signs_live.png' });
  console.log('FINAL', (await p.textContent('#caption')).trim(), '| ERRS', errs.join(' ; ')); await b.close();
})();
