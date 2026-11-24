// Live fingerspelling test: the app's Translate page with a fake webcam showing 118 letter photos never used for
// training (Keithsel/asl_signs), each for 2 s with a 1.2 s gap. Reads what the app commits and aligns it to the truth.
const { chromium } = require('playwright'); const fs = require('fs');
const [base, cam, seqFile, out] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${cam}`] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 }, permissions: ['camera'] })).newPage();
  await p.goto(base + '/#/translate'); await p.click('#startCam');
  await p.waitForFunction(() => document.querySelector('#hud') && !document.querySelector('#hud').hidden, null, { timeout: 120000 });
  const t0 = Date.now(); await p.waitForTimeout(5664 / 15 * 1000 + 3000);
  const got = await p.evaluate(() => [...document.querySelectorAll('#gloss span')].map((s) => s.textContent.replace('fs-', '')).join(' ') + ' ' + (document.querySelector('#caption .cur')?.textContent || ''));
  fs.writeFileSync(out, JSON.stringify({ got, secs: (Date.now() - t0) / 1000 })); await b.close();
})();
