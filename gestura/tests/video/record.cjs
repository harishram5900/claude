// Records the product video segments from the real app. Usage: node record.cjs <baseUrl> <camY4m> <signVideoMp4> <outDir>
// Segment A: Translate > Signs with a fake webcam playing ASL Citizen seed-signer footage at 1/3 speed
//            (this test machine runs the trackers at ~6 fps; the edit speeds it back up 3x to real time).
// Segment B: Video tab analysing the same signing (sped up 3x in the edit). Segment C: tour at real speed.
const { chromium } = require('playwright'); const fs = require('fs');
const [base, cam, signVid, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const VP = { width: 1440, height: 900 };
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${cam}`] });
  const log = { A: [], B: [], C: [] };
  // ---------- A ----------
  let ctx = await b.newContext({ viewport: VP, permissions: ['camera'], recordVideo: { dir: out + '/A', size: VP } }); let p = await ctx.newPage(); let t0 = Date.now();
  const mark = (k, what, extra = {}) => log[k].push({ t: (Date.now() - t0) / 1000, what, ...extra });
  await p.goto(base + '/#/translate'); await p.waitForTimeout(1500);
  await p.click('[data-mode=words]'); await p.waitForTimeout(800);
  await p.click('#startCam'); mark('A', 'camera-click');
  await p.waitForFunction(() => !document.querySelector('#hud').hidden, null, { timeout: 120000 }); mark('A', 'camera-on');
  const said = new Set(); const end = Date.now() + 27 * 3 * 1000 + 4000;
  while (Date.now() < end) {
    const cap = (await p.textContent('#caption')).trim();
    for (const [key, re] of [['meet', /meet you/i], ['bath', /bathroom/i], ['thanks', /thank you/i]]) {
      if (!said.has(key) && re.test(cap)) { said.add(key); await p.waitForTimeout(700); const text = await p.evaluate(() => document.querySelector('#caption .w').textContent); await p.click('#speakBtn'); mark('A', 'speak', { text }); }
    }
    await p.waitForTimeout(250);
  }
  mark('A', 'final', { caption: (await p.textContent('#caption')).trim(), gloss: (await p.textContent('#gloss')).trim() });
  await p.waitForTimeout(1500); await ctx.close();
  // ---------- B ----------
  ctx = await b.newContext({ viewport: VP, recordVideo: { dir: out + '/B', size: VP } }); p = await ctx.newPage(); t0 = Date.now();
  await p.goto(base + '/#/video'); await p.waitForTimeout(1200);
  await p.setInputFiles('#file', signVid); await p.waitForTimeout(1500);
  await p.uncheck('#optSpeech'); await p.waitForTimeout(400); await p.click('#analyse'); mark('B', 'analyse');
  await p.waitForFunction(() => document.querySelector('#vstat')?.textContent === 'Done', null, { timeout: 600000 }); mark('B', 'done', { result: (await p.textContent('#vres')).trim() });
  await p.waitForTimeout(1000); await p.evaluate(() => { const v = document.querySelector('#vid'); v.muted = true; v.currentTime = 0; v.play(); }); await p.waitForTimeout(9000);
  await p.evaluate(() => scrollTo({ top: 420, behavior: 'smooth' })); await p.waitForTimeout(3000); await ctx.close();
  // ---------- C ----------
  ctx = await b.newContext({ viewport: VP, recordVideo: { dir: out + '/C', size: VP } }); p = await ctx.newPage(); t0 = Date.now();
  await p.goto(base + '/#/learn'); await p.waitForTimeout(2500);
  for (const L of ['A', 'B', 'Y']) { await p.click(`#lgrid button:text-is("${L}")`); await p.waitForTimeout(1300); }
  await p.click('[data-ltab=words]'); await p.waitForTimeout(1200);
  await p.click('#lgrid button:text-is("hello")'); await p.waitForTimeout(3500);
  await p.click('#lgrid button:text-is("thank you")'); await p.waitForTimeout(3500);
  await p.goto(base + '/#/about'); await p.waitForTimeout(2500); mark('C', 'about');
  await p.evaluate(() => scrollTo({ top: 520, behavior: 'smooth' })); await p.waitForTimeout(4000);
  await ctx.close(); await b.close();
  fs.writeFileSync(out + '/log.json', JSON.stringify(log, null, 1)); console.log(JSON.stringify(log, null, 1));
})();
