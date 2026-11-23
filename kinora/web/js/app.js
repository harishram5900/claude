import * as Tap from './tests/tap.js';
import * as Spiral from './tests/spiral.js';
import * as Tremor from './tests/tremor.js';
import * as Voice from './tests/voice.js';
import { median, mean, cv } from './dsp.js';

const $ = (s, r = document) => r.querySelector(s);
const toast = (m) => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), 3400); };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------- storage (this device only) ----------------
const KEY = 'kinora.checks.v1';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const save = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); return true; } catch { return false; } };
const DOSE = [['lt1', 'Less than 1 hour ago', 0.5], ['1to2', '1–2 hours ago', 1.5], ['2to4', '2–4 hours ago', 3], ['gt4', 'More than 4 hours ago', 5], ['none', "I don't take Parkinson's medication", null]];
const doseHours = (k) => DOSE.find((d) => d[0] === k)?.[2] ?? null;

// ---------------- metrics shown everywhere ----------------
const fmt = { rate: (v) => v.toFixed(1), pct: (v) => (v * 100).toFixed(1) + '%', px: (v) => v.toFixed(1), ms2: (v) => v.toFixed(3), db: (v) => v.toFixed(1) };
const METRICS = [
  { key: 'tapR.rate', label: 'Tapping speed, right', unit: 'taps/s', f: fmt.rate, better: 'up' },
  { key: 'tapL.rate', label: 'Tapping speed, left', unit: 'taps/s', f: fmt.rate, better: 'up' },
  { key: 'tapR.rhythmCV', label: 'Tapping rhythm variability, right', unit: '', f: fmt.pct, better: 'down' },
  { key: 'tapL.rhythmCV', label: 'Tapping rhythm variability, left', unit: '', f: fmt.pct, better: 'down' },
  { key: 'spiral.tremorPx', label: 'Spiral tremor', unit: 'px', f: fmt.px, better: 'down' },
  { key: 'spiral.errorPct', label: 'Spiral accuracy (error)', unit: '% of radius', f: (v) => v.toFixed(1), better: 'down' },
  { key: 'tremor.tremorRms', label: 'Rest tremor', unit: 'm/s²', f: fmt.ms2, better: 'down' },
  { key: 'voice.pitchCV', label: 'Voice pitch variability', unit: '', f: fmt.pct, better: 'down' },
  { key: 'voice.hnr', label: 'Voice clarity (HNR)', unit: 'dB', f: fmt.db, better: 'up' }
];
const get = (c, k) => k.split('.').reduce((o, p) => (o == null ? o : o[p]), c);
const valid = (v) => typeof v === 'number' && isFinite(v);
function baseline(checks, key) { const v = checks.map((c) => get(c, key)).filter(valid).slice(0, 3); return v.length ? median(v) : null; }
function delta(m, now, base) {
  if (!valid(now) || !valid(base) || base === 0) return { cls: 'flat', text: 'first reading' };
  const ch = (now - base) / Math.abs(base);
  if (Math.abs(ch) < 0.05) return { cls: 'flat', text: 'about the same as your baseline' };
  const good = (ch > 0) === (m.better === 'up');
  return { cls: good ? 'up' : 'down', text: `${ch > 0 ? '+' : '−'}${Math.abs(ch * 100).toFixed(0)}% vs your baseline` };
}

// ---------------- router ----------------
function route() {
  const h = location.hash;
  const view = h.startsWith('#/check') ? 'check' : h.startsWith('#/history') ? 'history' : h.startsWith('#/report') ? 'report' : 'home';
  document.querySelectorAll('[data-view]').forEach((v) => (v.hidden = v.dataset.view !== view));
  if (view === 'check') startCheck();
  if (view === 'history') renderHistory();
  if (view === 'report') renderReport();
  if (view !== 'home') scrollTo(0, 0);
  document.title = { check: 'Check · Kinora', history: 'My checks · Kinora', report: 'Report · Kinora' }[view] || "Kinora · A 90-second Parkinson's check on any phone";
}

// ---------------- the check ----------------
const isPhone = () => matchMedia('(pointer: coarse)').matches;
let flow = null;
function startCheck() {
  flow = { i: 0, rec: { id: Date.now().toString(36), ts: Date.now() } };
  const steps = [{ id: 'setup' }, { id: 'tapR', hand: 'right' }, { id: 'tapL', hand: 'left' }, { id: 'spiral' }, { id: 'tremor' }, { id: 'voice' }, { id: 'done' }];
  flow.steps = steps; next(0);
}
function progress() {
  const n = flow.steps.length - 2, k = Math.min(n, Math.max(0, flow.i - 1));
  $('#steps').innerHTML = Array.from({ length: n }, (_, j) => `<i class="${j < k ? 'done' : j === k && flow.i > 0 && flow.i <= n ? 'now' : ''}"></i>`).join('');
  $('#stepN').textContent = flow.i === 0 ? 'Setup' : flow.i > n ? 'Done' : `${flow.i} of ${n}`;
}
function next(i) { flow.i = i; progress(); const s = flow.steps[i]; ({ setup, tapR: tapStep, tapL: tapStep, spiral: spiralStep, tremor: tremorStep, voice: voiceStep, done })[s.id](s); }
const F = () => $('#flow');
function setup() {
  F().innerHTML = `<p class="eyebrow">Before you start</p><h2>Two quick questions.</h2><p class="sub">They let Kinora line up today's results with your medication.</p>
    <p class="qlabel">When did you last take your Parkinson's medication?</p><div class="choice" data-q="dose">${DOSE.map(([k, l]) => `<label><input type="radio" name="dose" value="${k}"> ${l}</label>`).join('')}</div>
    <p class="qlabel">Which side do your symptoms affect most?</p><div class="choice" data-q="side">${[['right', 'Right'], ['left', 'Left'], ['both', 'Both sides'], ['unsure', 'Not sure']].map(([k, l]) => `<label><input type="radio" name="side" value="${k}"> ${l}</label>`).join('')}</div>
    <div class="flow-actions"><button class="btn primary" data-go disabled>Begin · about 90 seconds</button></div>`;
  const go = $('[data-go]', F());
  F().addEventListener('change', () => { go.disabled = !($('input[name=dose]:checked', F()) && $('input[name=side]:checked', F())); });
  go.addEventListener('click', () => { flow.rec.dose = $('input[name=dose]:checked', F()).value; flow.rec.side = $('input[name=side]:checked', F()).value; next(1); });
}
function intro(kicker, title, text, onStart, skipText) {
  F().innerHTML = `<div class="test-intro"><p class="kicker">${kicker}</p><h2>${title}</h2><p class="sub">${text}</p></div><div class="flow-actions"><button class="btn ghost" data-skip>${skipText || 'Skip'}</button><button class="btn primary" data-start>Start</button></div>`;
  $('[data-start]', F()).addEventListener('click', onStart);
  $('[data-skip]', F()).addEventListener('click', () => next(flow.i + 1));
}
function stage() { F().innerHTML = '<div class="test-stage"></div>'; return $('.test-stage', F()); }
function tapStep(s) {
  intro(`TEST ${flow.i} · FINGER TAPPING`, `Tap with your ${s.hand} hand.`, `Rest your phone on a table. Use your ${s.hand} index finger to tap the two circles one after the other, as fast as you can, for 10 seconds.`, async () => {
    flow.rec[s.id] = await Tap.run(stage(), { hand: s.hand, seconds: 10 }); next(flow.i + 1);
  });
}
function spiralStep() {
  const hand = flow.rec.side === 'left' ? 'left' : 'right'; flow.rec.spiralHand = hand;
  intro(`TEST ${flow.i} · SPIRAL`, `Trace the spiral.`, `Use your ${hand} index finger. Start at the dot in the middle and follow the grey line outward, all three turns, without lifting your finger.`, async () => {
    const m = await Spiral.run(stage(), { hand }); if (m) m.hand = hand; flow.rec.spiral = m; next(flow.i + 1);
  });
}
function tremorStep() {
  const hand = flow.rec.side === 'left' ? 'left' : 'right';
  if (!Tremor.supported()) {
    F().innerHTML = `<div class="test-intro"><p class="kicker">TEST ${flow.i} · REST TREMOR</p><h2>This one needs a phone.</h2><p class="sub">Rest tremor is measured with the phone's motion sensor. Open Kinora on your phone to include it; the other tests work here.</p></div><div class="flow-actions"><button class="btn primary" data-next>Continue</button></div>`;
    $('[data-next]', F()).addEventListener('click', () => next(flow.i + 1)); return;
  }
  intro(`TEST ${flow.i} · REST TREMOR`, 'Hold still for 10 seconds.', `Sit down. Hold the phone loosely in your ${hand} hand and rest that hand on your lap, screen up. Let your arm relax completely.`, async () => {
    const m = await Tremor.run(stage(), { hand, seconds: 10 }); if (m) m.hand = hand; else toast('Motion sensors were not available, so rest tremor was skipped.');
    flow.rec.tremor = m; next(flow.i + 1);
  });
}
function voiceStep() {
  intro(`TEST ${flow.i} · VOICE`, 'Say "aaah" for 5 seconds.', 'Find a quiet spot and hold the phone about a forearm\'s length from your mouth. Kinora analyses the sound on your device; no audio is saved or sent anywhere.', async () => {
    const m = await Voice.run(stage(), { seconds: 5 });
    if (!m) toast('We couldn\'t hear a steady voice (or the microphone was blocked), so this test was skipped.');
    flow.rec.voice = m; next(flow.i + 1);
  });
}
function done() {
  const all = load(); all.push(flow.rec); const ok = save(all);
  const prior = all.filter((c) => !c.sample);
  const rows = METRICS.map((m) => { const v = get(flow.rec, m.key); if (!valid(v)) return ''; const d = delta(m, v, baseline(prior.slice(0, -1), m.key));
    return `<div class="metric"><div class="k">${m.label}</div><div class="v">${m.f(v)} <small class="muted" style="font-size:12px">${m.unit}</small></div><div class="d ${d.cls}">${d.text}</div></div>`; }).join('');
  F().innerHTML = `<p class="eyebrow">Check complete</p><h2>Nice work.</h2><p class="sub">${ok ? 'Saved on this device.' : 'Your browser blocked saving, so this result will disappear when you close the page.'} Each result is compared with your first three checks, your personal baseline.</p>
    <div class="metric-grid">${rows || '<p class="skipped">No tests were completed.</p>'}</div>
    <div class="flow-actions"><a class="btn ghost" href="#/history">See trends</a><a class="btn primary" href="#/">Finish</a></div>`;
}

// ---------------- charts ----------------
function lineChart(series, { w = 520, h = 150, yfmt = (v) => v.toFixed(1) } = {}) {
  const pts = series.flatMap((s) => s.pts); if (!pts.length) return '<p class="fine">No data yet.</p>';
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y), x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1;
  let y0 = Math.min(...ys), y1 = Math.max(...ys); const pad = (y1 - y0) * 0.15 || Math.abs(y0) * 0.1 || 1; y0 -= pad; y1 += pad;
  const L = 44, R = 8, T = 8, B = 20, X = (x) => L + (x - x0) / ((x1 - x0) || 1) * (w - L - R), Y = (y) => T + (y1 - y) / (y1 - y0) * (h - T - B);
  let g = '';
  for (let k = 0; k <= 3; k++) { const v = y0 + (y1 - y0) * k / 3, y = Y(v); g += `<line class="gridl" x1="${L}" x2="${w - R}" y1="${y}" y2="${y}"/><text class="axis" x="${L - 6}" y="${y + 3.5}" text-anchor="end">${yfmt(v)}</text>`; }
  const d0 = new Date(x0), d1 = new Date(x1), df = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  g += `<text class="axis" x="${L}" y="${h - 4}">${df(d0)}</text><text class="axis" x="${w - R}" y="${h - 4}" text-anchor="end">${df(d1)}</text>`;
  for (const s of series) {
    if (!s.pts.length) continue;
    const sorted = [...s.pts].sort((a, b) => a.x - b.x), days = new Map();
    for (const p of sorted) { const k = new Date(p.x).toDateString(); if (!days.has(k)) days.set(k, []); days.get(k).push(p); }
    const line = [...days.values()].map((d) => ({ x: mean(d.map((p) => p.x)), y: median(d.map((p) => p.y)) }));
    g += sorted.map((p) => `<circle class="raw ${s.cls || ''}" cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="1.8"/>`).join('');
    g += `<path class="ln ${s.cls || ''}" d="${line.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ')}"/>`;
    if (line.length < 12) g += line.map((p) => `<circle class="dot ${s.cls || ''}" cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="2.6"/>`).join('');
  }
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img">${g}</svg>`;
}
function doseChart(checks, { w = 420, h = 220 } = {}) {
  const buckets = DOSE.slice(0, 4).map(([k, l, hr]) => { const v = checks.filter((c) => c.dose === k).map((c) => mean([get(c, 'tapR.rate'), get(c, 'tapL.rate')].filter(valid))).filter(valid); return { k, l, hr, v }; });
  const all = buckets.flatMap((b) => b.v); if (all.length < 4) return null;
  const y0 = Math.min(...all) * 0.9, y1 = Math.max(...all) * 1.05, L = 40, B = 34, T = 14, bw = (w - L - 10) / 4, Y = (v) => T + (y1 - v) / (y1 - y0) * (h - T - B);
  let g = '';
  for (let k = 0; k <= 3; k++) { const v = y0 + (y1 - y0) * k / 3; g += `<line class="gridl" x1="${L}" x2="${w - 6}" y1="${Y(v)}" y2="${Y(v)}"/><text class="axis" x="${L - 6}" y="${Y(v) + 3.5}" text-anchor="end">${v.toFixed(1)}</text>`; }
  buckets.forEach((b, i) => {
    const cx = L + bw * (i + 0.5);
    b.v.forEach((v, j) => { g += `<circle cx="${(cx - bw * 0.25 + (j % 9) / 8 * bw * 0.5).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="2.2" fill="var(--line2)"/>`; });
    if (b.v.length) { const m = mean(b.v); g += `<line x1="${cx - bw * 0.32}" x2="${cx + bw * 0.32}" y1="${Y(m)}" y2="${Y(m)}" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/><text class="axis" x="${cx}" y="${Y(m) - 8}" text-anchor="middle" style="fill:var(--ink)">${m.toFixed(1)}</text>`; }
    g += `<text class="axis" x="${cx}" y="${h - 16}" text-anchor="middle">${['<1 h', '1–2 h', '2–4 h', '>4 h'][i]}</text>`;
  });
  g += `<text class="axis" x="${L + (w - L) / 2}" y="${h - 2}" text-anchor="middle">time since last dose · taps per second (both hands)</text>`;
  return `<svg class="dosesvg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Tapping speed by time since last dose">${g}</svg>`;
}
function chartCards(checks) {
  const by = (k) => checks.map((c) => ({ x: c.ts, y: get(c, k) })).filter((p) => valid(p.y));
  const last = (k) => { const v = by(k); return v.length ? v[v.length - 1].y : null; };
  const card = (title, series, now, unit, yfmt, legend) => `<div class="chart-card"><h3>${title}</h3><p class="now">${now ?? '—'} <small>${unit}</small></p>${legend || ''}${lineChart(series, { yfmt })}</div>`;
  const lr = '<div class="legend"><span><i></i>right</span><span><i class="l2"></i>left</span></div>';
  return `<div class="charts">
    ${card('Tapping speed', [{ pts: by('tapR.rate') }, { pts: by('tapL.rate'), cls: 'l2' }], last('tapR.rate') != null ? `${fmt.rate(last('tapR.rate'))} / ${valid(last('tapL.rate')) ? fmt.rate(last('tapL.rate')) : '—'}` : null, 'taps/s, right / left', (v) => v.toFixed(1), lr)}
    ${card('Tapping rhythm variability', [{ pts: by('tapR.rhythmCV') }, { pts: by('tapL.rhythmCV'), cls: 'l2' }], valid(last('tapR.rhythmCV')) ? fmt.pct(last('tapR.rhythmCV')) : null, 'right hand, lower is steadier', (v) => (v * 100).toFixed(0) + '%', lr)}
    ${card('Spiral tremor', [{ pts: by('spiral.tremorPx') }], valid(last('spiral.tremorPx')) ? fmt.px(last('spiral.tremorPx')) : null, 'px of 3.5–8 Hz wobble', (v) => v.toFixed(1))}
    ${card('Rest tremor', [{ pts: by('tremor.tremorRms') }], valid(last('tremor.tremorRms')) ? fmt.ms2(last('tremor.tremorRms')) : null, 'm/s²', (v) => v.toFixed(2))}
    ${card('Voice pitch variability', [{ pts: by('voice.pitchCV') }], valid(last('voice.pitchCV')) ? fmt.pct(last('voice.pitchCV')) : null, 'lower is steadier', (v) => (v * 100).toFixed(1) + '%')}
    ${(() => { const d = doseChart(checks); return d ? `<div class="chart-card"><h3>Tapping speed by dose timing</h3><p class="now">${checks.filter((c) => c.dose && c.dose !== 'none').length} <small>checks with a dose time</small></p>${d}</div>` : ''; })()}
  </div>`;
}

// ---------------- history & report ----------------
function renderHistory() {
  const all = load(), sample = all.some((c) => c.sample);
  const main = $('#historyMain');
  if (!all.length) {
    main.innerHTML = `<div class="empty"><h2>No checks yet.</h2><p>Your first three checks become your personal baseline. After that, every check is compared with it.</p><div class="cta" style="justify-content:center"><a class="btn primary" href="#/check">Start your first check</a><button class="btn ghost" data-sample>Load sample data</button></div></div>`;
    $('[data-sample]', main).addEventListener('click', loadSample); return;
  }
  main.innerHTML = `${sample ? '<div class="banner"><span><b>Sample data.</b> These checks are simulated to show how Kinora works. They are not from a real patient.</span><button class="btn ghost sm" data-clear-sample>Remove sample</button></div>' : ''}
    <h1>My checks</h1><p>${all.length} check${all.length > 1 ? 's' : ''} since ${new Date(all[0].ts).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Stored only on this device.</p>
    <div class="hist-actions"><a class="btn primary sm" href="#/check">New check</a><a class="btn ghost sm" href="#/report">Report for my neurologist</a><button class="btn ghost sm" data-export>Download data (CSV)</button></div>
    ${chartCards(all)}
    <div class="list"><table><thead><tr><th>Date</th><th>Tapping R / L</th><th>Spiral tremor</th><th>Last dose</th><th></th></tr></thead><tbody>
    ${[...all].reverse().slice(0, 40).map((c) => `<tr><td>${new Date(c.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td><td class="m">${valid(get(c, 'tapR.rate')) ? fmt.rate(c.tapR.rate) : '—'} / ${valid(get(c, 'tapL.rate')) ? fmt.rate(c.tapL.rate) : '—'}</td><td class="m">${valid(get(c, 'spiral.tremorPx')) ? fmt.px(c.spiral.tremorPx) + ' px' : '—'}</td><td>${DOSE.find((d) => d[0] === c.dose)?.[1] ?? '—'}</td><td><button data-del="${c.id}" aria-label="Delete check">✕</button></td></tr>`).join('')}
    </tbody></table></div>`;
  main.onclick = (e) => {
    if (e.target.dataset.del) { save(load().filter((c) => c.id !== e.target.dataset.del)); renderHistory(); }
    if ('clearSample' in e.target.dataset) { save(load().filter((c) => !c.sample)); renderHistory(); }
    if ('export' in e.target.dataset) exportCsv();
  };
}
function exportCsv() {
  const all = load(), cols = ['time', 'dose', 'side', ...METRICS.map((m) => m.key), 'sample'];
  const rows = all.map((c) => [new Date(c.ts).toISOString(), c.dose, c.side, ...METRICS.map((m) => get(c, m.key) ?? ''), c.sample ? 'yes' : 'no']);
  const csv = [cols, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'kinora-checks.csv'; a.click();
}
function renderReport() {
  const all = load(), main = $('#reportMain');
  if (!all.length) { main.innerHTML = '<h1>No checks yet</h1><p class="meta">Complete a few checks first.</p>'; return; }
  const sample = all.some((c) => c.sample), first = all[0].ts, lastTs = all[all.length - 1].ts, recentCut = lastTs - 7 * 864e5;
  const recent = all.filter((c) => c.ts >= recentCut);
  const row = (m) => { const b = baseline(all, m.key), r = recent.map((c) => get(c, m.key)).filter(valid); if (!valid(b) || !r.length) return '';
    const now = median(r), d = delta(m, now, b); return `<tr><td>${m.label}</td><td class="m">${m.f(b)}</td><td class="m">${m.f(now)}</td><td class="d ${d.cls}">${d.cls === 'flat' ? 'within 5%' : d.text.replace(' vs your baseline', '') + (d.cls === 'up' ? ' (better)' : ' (worse)')}</td></tr>`; };
  main.innerHTML = `${sample ? '<div class="banner"><span><b>SIMULATED SAMPLE DATA.</b> Not from a real patient. For demonstration only.</span></div>' : ''}
    <h1>Kinora motor check summary</h1>
    <p class="meta">Patient: <span contenteditable="true" class="noprint-edit" style="border-bottom:1px dashed var(--line2)">add name</span> · ${all.length} checks · ${new Date(first).toLocaleDateString()} – ${new Date(lastTs).toLocaleDateString()} · most affected side: ${all[all.length - 1].side ?? '—'}</p>
    <h2>Baseline vs last 7 days</h2>
    <table><thead><tr><th>Measure</th><th>Baseline (first 3)</th><th>Last 7 days (median)</th><th>Change</th></tr></thead><tbody>${METRICS.map(row).join('')}</tbody></table>
    <h2>Trends</h2>${chartCards(all)}
    <h2>Method</h2>
    <p style="font-size:14px;color:var(--ink2)">Finger tapping: alternating two-target tapping, 10 s per hand (adapted from MDS-UPDRS 3.4). Spiral: Archimedean spiral traced on the touchscreen; tremor is the RMS of radial deviation above ~2.5 Hz, frequency from its spectrum. Rest tremor: phone accelerometer, 10 s, hand on lap; RMS above ~2 Hz and share in 3.5–7.5 Hz. Voice: sustained /a/ for 5 s; pitch and loudness variability over the stable middle 80%, harmonics-to-noise ratio from autocorrelation. Values depend on the device; compare a patient with their own baseline on the same phone.</p>
    <p class="note">Kinora is a tracking tool, not a diagnostic device, and has not been reviewed by the FDA. Generated ${new Date().toLocaleString()}.</p>`;
}

// ---------------- simulated sample data (clearly labelled) ----------------
function sampleChecks() {
  let s = 42; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, n = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
  const out = [], day0 = Date.now() - 27 * 864e5;
  for (let d = 0; d < 28; d++) for (const [hour, dose] of [[7.5, 'gt4'], [8.6, 'lt1'], [10, '1to2'], [15, '2to4'], [19.5, 'gt4']]) {
    if (rnd() < 0.35) continue;
    const on = { lt1: 0.3, '1to2': 1, '2to4': 0.55, gt4: 0 }[dose], drift = -0.012 * d;
    const ts = day0 + d * 864e5 + hour * 36e5 - new Date(day0).getHours() * 36e5;
    out.push({ id: 's' + d + hour, ts, sample: true, dose, side: 'right',
      tapR: { rate: 3.9 + 1.0 * on + drift + 0.25 * n(), rhythmCV: 0.16 - 0.07 * on + 0.02 * n(), decrement: 0.18 - 0.1 * on },
      tapL: { rate: 4.8 + 0.6 * on + drift + 0.25 * n(), rhythmCV: 0.1 - 0.03 * on + 0.015 * n() },
      spiral: { tremorPx: 2.6 - 1.4 * on + 0.35 * n(), errorPct: 6 - 2 * on + 0.8 * n(), hand: 'right' },
      tremor: { tremorRms: 0.16 - 0.1 * on + 0.03 * n(), peakHz: 4.8 + 0.4 * n() },
      voice: { pitchCV: 0.028 - 0.008 * on + 0.004 * n(), hnr: 14 + 3 * on + n() } });
  }
  return out;
}
function loadSample() { save([...sampleChecks(), ...load().filter((c) => !c.sample)].sort((a, b) => a.ts - b.ts)); toast('Loaded simulated sample data. It is clearly marked and you can remove it anytime.'); location.hash = '#/history'; renderHistory(); }

// ---------------- landing: live tapping demo, dose figure, QR ----------------
function heroDemo() {
  const pads = [...document.querySelectorAll('.pad')], taps = []; let last = -1;
  const draw = () => {
    const now = performance.now(), win = taps.filter((t) => now - t.t < 3000), iti = [];
    for (let i = 1; i < taps.length; i++) iti.push(taps[i].t - taps[i - 1].t);
    const recent = iti.slice(-12);
    $('#demoRate').textContent = win.length > 1 ? `${(win.length / 3).toFixed(1)} taps/s` : '— taps/s';
    $('#demoTaps').textContent = `${taps.length} taps`;
    $('#demoRhythm').textContent = recent.length > 3 ? `rhythm ±${(cv(recent) * 100).toFixed(0)}%` : 'rhythm —';
    const pts = recent.map((v, i) => `${i ? 'L' : 'M'}${(i / Math.max(1, recent.length - 1) * 300).toFixed(1)} ${(66 - Math.min(62, (1000 / Math.max(v, 50)) / 10 * 62)).toFixed(1)}`).join(' ');
    $('#demoTrace').innerHTML = pts ? `<path d="${pts}"/>` : '';
  };
  pads.forEach((p, i) => p.addEventListener('pointerdown', (e) => {
    e.preventDefault(); const t = performance.now(); if (taps.length && t - taps[taps.length - 1].t > 2500) taps.length = 0;
    taps.push({ t, i }); last = i; p.classList.remove('hit'); void p.offsetWidth; p.classList.add('hit');
    $('#demoHint').textContent = taps.length < 6 ? 'Keep going, alternate left and right…' : 'This is the first of four tests. The full check takes about 90 seconds.';
    draw();
  }));
  setInterval(draw, 500);
}
function landingExtras() {
  const svg = doseChart(sampleChecks()); if (svg) $('#doseFig').outerHTML = svg.replace('<svg ', '<svg id="doseFig" ');
  $('#sampleBtn').addEventListener('click', () => {
    if (!load().length) { save(sampleChecks()); toast('Showing simulated sample data. It is clearly marked and you can remove it from My checks.'); }
    location.hash = '#/report';
  });
  const qr = () => { if (!window.qrcode || !matchMedia('(pointer: fine)').matches) return; const q = window.qrcode(0, 'M'); q.addData(location.origin + location.pathname + '#/check'); q.make(); $('#qr').innerHTML = q.createSvgTag({ cellSize: 3, margin: 0, scalable: true }); $('#qrBox').hidden = false; };
  if (window.qrcode) qr(); else addEventListener('load', qr);
}

addEventListener('hashchange', route);
heroDemo(); landingExtras(); route();
