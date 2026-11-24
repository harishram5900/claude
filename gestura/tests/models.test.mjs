import fs from 'node:fs'; import assert from 'node:assert/strict';
globalThis.fetch = async (u) => ({ json: async () => JSON.parse(fs.readFileSync(new URL('../web/' + u, import.meta.url))) });
const L = await import('../web/js/letters.js'); await L.loadLetters();
let pass = 0, fail = 0; const test = (n, f) => { try { f(); pass++; console.log('ok  ', n); } catch (e) { fail++; console.log('FAIL', n, '\n     ', e.message); } };
const chk = JSON.parse(fs.readFileSync(new URL('./alpha_check.json', import.meta.url)));
test('letter classifier in JS matches the Python model to 4 decimals', () => {
  const p = []; for (let i = 0; i < 21; i++) p.push(chk.raw.slice(i * 3, i * 3 + 3));
  const out = L.predict(L.features(p)); out.forEach((v, i) => assert.ok(Math.abs(v - chk.p[i]) < 1e-4, `${i}: ${v} vs ${chk.p[i]}`));
});
test('normalise: wrist goes to origin, hand size is 1, left hands are mirrored', () => {
  const lm = Array.from({ length: 21 }, (_, i) => ({ x: 0.5 + 0.01 * i, y: 0.5 - 0.02 * i, z: 0 }));
  const r = L.normalise(lm, 'Right'), l = L.normalise(lm, 'Left');
  assert.deepEqual(r[0], [0, 0, 0]); assert.ok(Math.abs(Math.hypot(...r[9]) - 1) < 1e-9); assert.ok(Math.abs(r[5][0] + l[5][0]) < 1e-12);
});
test('speller commits a letter only after it leads for the hold time, and not twice in a row', () => {
  const sp = new L.Speller({ hold: 400, minP: 0.5 }); const p = new Array(26).fill(0.01); p[1] = 0.8;
  assert.equal(sp.push(p, 0).commit, undefined); assert.equal(sp.push(p, 200).commit, undefined); assert.equal(sp.push(p, 450).commit, 'B'); assert.equal(sp.push(p, 900).commit, undefined);
  sp.handLost(); sp.push(p, 1000); assert.equal(sp.push(p, 1450).commit, 'B');
});
test('speller commits a double letter after a bounce (confidence dip), but not from a steady hold', () => {
  const sp = new L.Speller({ hold: 400, minP: 0.5 }); const hi = new Array(26).fill(0.01), lo = new Array(26).fill(0.03); hi[14] = 0.9; lo[14] = 0.1;
  sp.push(hi, 0); assert.equal(sp.push(hi, 450).commit, 'O');
  for (let t = 500; t < 2000; t += 100) assert.equal(sp.push(hi, t).commit, undefined);   // holding still: one O
  sp.push(lo, 2000); sp.push(lo, 2100); sp.push(lo, 2200);                                   // bounce
  let got; for (let t = 2300; t < 3200 && !got; t += 100) got = sp.push(hi, t).commit; assert.equal(got, 'O');
});
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
