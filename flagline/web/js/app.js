import * as W from './wbgt.js';
import { defaultCategory } from './regions.js';
import { forecast } from './nws.js';
import { summers } from './history.js';
import { FLAG_INFO, acclimDay } from './policy.js';

const $ = (id) => document.getElementById(id);
const S = { schools: [], school: null, fc: null, cat: 2, start: 15.5, len: 120, sport: 'pads', day: 0, sel: null, hist: null };
const toast = (m) => { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), 3200); };

// ---------- time helpers in the school's own time zone ----------
const fmtCache = new Map();
function parts(t, tz) {
  if (!fmtCache.has(tz)) fmtCache.set(tz, new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' }));
  const o = {}; for (const p of fmtCache.get(tz).formatToParts(new Date(t))) o[p.type] = p.value;
  return { key: `${o.year}-${o.month}-${o.day}`, hour: +o.hour, wd: o.weekday, md: `${+o.month}/${+o.day}` };
}
const hLabel = (h) => (h % 12 || 12) + (h < 12 ? ' am' : ' pm');
const tLabel = (x) => { const h = Math.floor(x), m = Math.round((x - h) * 60); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; };

// ---------- school search ----------
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ');
async function loadSchools() {
  const rows = await (await fetch('data/schools.json')).json();
  S.schools = rows.map(([id, name, city, st, lat, lon]) => ({ id, name, city, st, lat, lon, k: norm(`${name} ${city} ${st}`) }));
}
function search(q) {
  const toks = norm(q).split(/\s+/).filter(Boolean); if (!toks.length) return [];
  const out = [];
  for (const s of S.schools) { if (toks.every((t) => s.k.includes(t))) { out.push(s); if (out.length > 400) break; } }
  const n0 = norm(q).trim();
  return out.sort((a, b) => (norm(b.name).startsWith(n0) - norm(a.name).startsWith(n0)) || a.name.length - b.name.length).slice(0, 12);
}
function setupSearch() {
  const q = $('q'), ul = $('results'); let items = [], idx = -1;
  const render = () => {
    ul.innerHTML = items.map((s, i) => `<li role="option" data-i="${i}" aria-selected="${i === idx}"><b>${s.name}</b><span>${s.city}, ${s.st}</span></li>`).join('');
    ul.hidden = !items.length;
  };
  q.addEventListener('input', () => { items = search(q.value); idx = items.length ? 0 : -1; render(); });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { idx = Math.min(items.length - 1, idx + 1); render(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { idx = Math.max(0, idx - 1); render(); e.preventDefault(); }
    else if (e.key === 'Enter' && items[idx]) { pick(items[idx]); }
    else if (e.key === 'Escape') { ul.hidden = true; }
  });
  ul.addEventListener('mousedown', (e) => { const li = e.target.closest('li'); if (li) pick(items[+li.dataset.i]); });
  q.addEventListener('blur', () => setTimeout(() => (ul.hidden = true), 150));
  const pick = (s) => { ul.hidden = true; q.value = `${s.name}, ${s.city}`; selectSchool(s, true); };
  document.querySelectorAll('[data-try]').forEach((b) => b.addEventListener('click', () => { const r = search(b.dataset.try); if (r[0]) pick(r[0]); }));
}

// ---------- hero board ----------
async function board() {
  const pickBoard = S.schools.find((s) => /^Miami Senior High/i.test(s.name) && s.st === 'FL') || S.schools.find((s) => s.st === 'FL');
  try {
    const fc = await forecast(pickBoard.lat, pickBoard.lon), cat = defaultCategory(pickBoard.st);
    const next = fc.hours.slice(0, 24);
    $('boardName').textContent = `${pickBoard.name}, ${pickBoard.city} ${pickBoard.st}`;
    $('boardStrip').innerHTML = next.map((h, i) => `<div class="cell-f${W.flagOf(h.wbgtF, cat)} ${i === 0 ? 'now' : ''}" title="${hLabel(parts(h.t, fc.tz).hour)} · WBGT ${h.wbgtF.toFixed(0)}°F"></div>`).join('');
    $('boardAxis').innerHTML = [0, 6, 12, 18, 23].map((i) => `<span>${i === 0 ? 'now' : hLabel(parts(next[i].t, fc.tz).hour)}</span>`).join('');
    const cur = next[0], fl = W.flagOf(cur.wbgtF, cat), peak = next.reduce((a, h) => (h.wbgtF > a.wbgtF ? h : a), next[0]);
    $('boardNow').innerHTML = `Now: <b>${FLAG_INFO[fl].name}</b> · WBGT ${cur.wbgtF.toFixed(0)}°F · next-24 h peak ${peak.wbgtF.toFixed(0)}°F at ${hLabel(parts(peak.t, fc.tz).hour)}`;
    $('boardSrc').textContent = cur.src === 'nws' ? 'NWS OFFICIAL WBGT' : 'FROM NWS FORECAST';
    document.querySelector('.board-h span').textContent = 'NEXT 24 HOURS · HEAT FLAGS';
  } catch (e) { $('boardName').textContent = 'The National Weather Service forecast is unavailable right now.'; }
}

// ---------- planner ----------
async function selectSchool(s, scroll) {
  S.school = s; S.cat = defaultCategory(s.st); $('pCat').value = S.cat; S.sel = null; S.day = 0; S.hist = null;
  ['plan', 'log', 'preseason', 'history'].forEach((id) => ($(id).hidden = false));
  $('schoolName').textContent = s.name;
  $('schoolMeta').textContent = `${s.city}, ${s.st} · ${s.lat.toFixed(3)}, ${s.lon.toFixed(3)} · NCES ${s.id} · loading NWS forecast…`;
  $('catNote').textContent = `Default heat category for ${s.st}: ${S.cat}. Confirm the category your state association uses; thresholds change with it.`;
  history.replaceState(null, '', `?school=${s.id}`);
  if (scroll) $('plan').scrollIntoView({ behavior: 'smooth' });
  $('hgrid').innerHTML = '<p class="fine" style="padding:16px">Loading the National Weather Service forecast…</p>';
  try { S.fc = await forecast(s.lat, s.lon); }
  catch (e) { $('hgrid').innerHTML = `<p class="fine" style="padding:16px">Could not load the NWS forecast (${e.message}). Try again in a minute.</p>`; return; }
  if (S.school !== s) return;
  $('schoolMeta').textContent = `${s.city}, ${s.st} · NWS office ${S.fc.office} · times in ${S.fc.tz.replace('_', ' ')} · NCES ${s.id}`;
  renderPlan(); renderLog(); renderAcc(); loadHistory();
}
function practiceFlag(row, start, len) {
  let worst = -1; const end = start + len / 60;
  for (let h = Math.floor(start); h < Math.ceil(end); h++) { const c = row[h]; if (c) worst = Math.max(worst, W.flagOf(c.wbgtF, S.cat)); }
  return worst;
}
function grid() {
  const days = new Map();
  for (const h of S.fc.hours) { const p = parts(h.t, S.fc.tz); if (!days.has(p.key)) days.set(p.key, { key: p.key, wd: p.wd, md: p.md, row: new Array(24).fill(null) }); days.get(p.key).row[p.hour] = h; }
  return [...days.values()].slice(0, 7);
}
function bestWindow(row) {
  let best = null;
  for (let st = 5; st + S.len / 60 <= 22; st += 0.5) {
    const f = practiceFlag(row, st, S.len); if (f < 0) continue;
    const score = f * 100 + Math.abs(st - S.start);
    if (!best || score < best.score) best = { st, f, score };
  }
  return best;
}
function renderPlan() {
  const D = grid(); S.days = D;
  const hrs = [...Array(24).keys()];
  let html = '<div class="hh"></div>' + hrs.map((h) => `<div class="hh">${h % 3 === 0 ? (h % 12 || 12) + (h < 12 ? 'a' : 'p') : ''}</div>`).join('');
  const st = S.start, en = S.start + S.len / 60;
  D.forEach((d, di) => {
    html += `<div class="dl">${d.wd}<small>${d.md}</small></div>`;
    html += hrs.map((h) => {
      const c = d.row[h]; if (!c) return '<div class="c none"></div>';
      const f = W.flagOf(c.wbgtF, S.cat), prac = h + 1 > st && h < en;
      const sel = S.sel && S.sel[0] === di && S.sel[1] === h;
      return `<div class="c cell-f${f}${prac ? ' prac' : ''}${sel ? ' sel' : ''}" data-d="${di}" data-h="${h}" title="${d.wd} ${hLabel(h)} · WBGT ${c.wbgtF.toFixed(1)}°F · ${FLAG_INFO[f].name}">${Math.round(c.wbgtF)}</div>`;
    }).join('');
  });
  $('hgrid').innerHTML = html;
  $('days').innerHTML = D.map((d, i) => {
    const f = practiceFlag(d.row, S.start, S.len), b = bestWindow(d.row);
    const fi = f >= 0 ? FLAG_INFO[f] : null;
    return `<div class="day ${i === S.day ? 'on' : ''}" data-d="${i}"><div class="d">${d.wd} ${d.md}</div>
      <div class="f f${Math.max(f, 0)}">${fi ? `<i></i>${fi.name}` : '<span class="fine" style="margin:0">no forecast</span>'}</div>
      <div class="s">${fi ? fi.short : ''}${b && f >= 0 && b.f < f ? `<br>Safer: ${tLabel(b.st)} (${FLAG_INFO[b.f].name.toLowerCase()})` : ''}</div></div>`;
  }).join('');
  const nws = S.fc.hours.filter((h) => h.src === 'nws').length;
  $('srcNote').textContent = nws ? `Hourly WBGT: National Weather Service official forecast (${nws} of ${S.fc.hours.length} hours); the rest computed from the NWS temperature, humidity, wind and cloud forecast with Flagline's engine. Numbers in cells are WBGT in °F. Thick borders mark your practice time.`
    : `The NWS has not issued an official WBGT grid here, so WBGT is computed from the NWS temperature, humidity, wind and cloud forecast with Flagline's engine (within 0.7°F of official WBGT on average). Thick borders mark your practice time.`;
  renderDetail();
}
function renderDetail() {
  const d = S.days[S.day]; if (!d) return;
  let f, label, val;
  if (S.sel && S.sel[0] === S.day) { const c = d.row[S.sel[1]]; f = W.flagOf(c.wbgtF, S.cat); label = `${d.wd} ${d.md} · ${hLabel(S.sel[1])}`; val = `WBGT ${c.wbgtF.toFixed(1)}°F · air ${c.tempF.toFixed(0)}°F${c.rh != null ? ` · RH ${c.rh}%` : ''}`; }
  else { f = practiceFlag(d.row, S.start, S.len); label = `${d.wd} ${d.md} · practice ${tLabel(S.start)}–${tLabel(S.start + S.len / 60)}`; const ws = []; for (let h = Math.floor(S.start); h < Math.ceil(S.start + S.len / 60); h++) if (d.row[h]) ws.push(d.row[h].wbgtF); val = ws.length ? `Peak WBGT ${Math.max(...ws).toFixed(1)}°F` : 'No forecast for this window'; }
  if (f < 0) { $('detail').innerHTML = '<div class="rules"><p class="fine">No forecast for this time yet.</p></div>'; return; }
  const info = FLAG_INFO[f];
  const rules = info.rules.filter((r) => S.sport === 'pads' || !/^Football/.test(r));
  if (S.sport === 'band' && f >= 2) rules.push('Marching band: shorten rehearsal blocks, rehearse in shade where possible, uniforms off');
  const b = bestWindow(d.row);
  $('detail').innerHTML = `<div class="flagcard f${f}" style="--c:var(--f${f})"><div class="t">${label}</div><div class="big">${info.name} flag</div><div class="v">${val}</div><div class="v" style="margin-top:6px">Risk: ${info.risk}</div></div>
    <div class="rules"><h3>What this flag requires</h3><ul>${rules.map((r) => `<li>${r}</li>`).join('')}</ul>
    ${b ? `<div class="best">Best ${S.len / 60} h window this day: <b>${tLabel(b.st)}–${tLabel(b.st + S.len / 60)}</b> · ${FLAG_INFO[b.f].name}</div>` : ''}</div>`;
}
function setupPlanner() {
  $('pStart').addEventListener('change', () => { const [h, m] = $('pStart').value.split(':').map(Number); S.start = h + m / 60; if (S.fc) renderPlan(); if (S.hist) renderHistory(); });
  $('pLen').addEventListener('change', () => { S.len = +$('pLen').value; if (S.fc) renderPlan(); if (S.hist) renderHistory(); });
  $('pSport').addEventListener('change', () => { S.sport = $('pSport').value; if (S.fc) renderDetail(); });
  $('pCat').addEventListener('change', () => { S.cat = +$('pCat').value; if (S.fc) { renderPlan(); renderAcc(); renderLog(); } if (S.hist) renderHistory(); });
  $('hgrid').addEventListener('click', (e) => { const c = e.target.closest('.c[data-d]'); if (!c) return; S.day = +c.dataset.d; S.sel = [S.day, +c.dataset.h]; renderPlan(); });
  $('days').addEventListener('click', (e) => { const c = e.target.closest('.day'); if (!c) return; S.day = +c.dataset.d; S.sel = null; renderPlan(); });
  $('icsBtn').addEventListener('click', exportIcs);
}
function exportIcs() {
  if (!S.days) return;
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const ev = S.days.map((d, i) => {
    const f = practiceFlag(d.row, S.start, S.len); if (f < 0) return '';
    const sh = Math.floor(S.start), sm = Math.round((S.start - sh) * 60), e = S.start + S.len / 60, eh = Math.floor(e), em = Math.round((e - eh) * 60);
    const date = d.key.replace(/-/g, ''), info = FLAG_INFO[f];
    return ['BEGIN:VEVENT', `UID:flagline-${S.school.id}-${date}@flagline`, `DTSTAMP:${stamp}`, `DTSTART:${date}T${pad(sh)}${pad(sm)}00`, `DTEND:${date}T${pad(eh)}${pad(em)}00`,
      `SUMMARY:Practice · ${info.name.toUpperCase()} heat flag`, `DESCRIPTION:${info.rules.join('\\n')}\\nForecast from the National Weather Service via Flagline. Take the required on-field WBGT reading.`, 'END:VEVENT'].join('\r\n');
  }).filter(Boolean);
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Flagline//Heat flags//EN', ...ev, 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = `flagline-${S.school.name.replace(/\W+/g, '-')}.ics`; a.click();
  toast('Calendar file downloaded. Open it to add this week\'s practice flags.');
}

// ---------- heat log ----------
const logKey = () => `flagline-log-${S.school?.id}`;
const readLog = () => { try { return JSON.parse(localStorage.getItem(logKey()) || '[]'); } catch { return []; } };
const writeLog = (l) => { try { localStorage.setItem(logKey(), JSON.stringify(l)); } catch {} };
function renderLog() {
  const L = readLog(), tb = $('logTable').querySelector('tbody');
  if (!L.length) { tb.innerHTML = '<tr class="empty"><td colspan="7">No readings yet. Take a WBGT reading on the field 30 minutes before practice and enter it here.</td></tr>'; return; }
  tb.innerHTML = L.map((r, i) => { const f = W.flagOf(r.v, S.cat), info = FLAG_INFO[f];
    return `<tr><td class="m">${r.t.replace('T', ' ')}</td><td>${esc(r.venue || '')}</td><td class="m">${r.v.toFixed(1)}°F</td><td><span class="chip f${f}" style="--c:var(--f${f})">${info.name}</span></td><td>${info.short}</td><td class="m">${esc(r.by || '')}</td><td><button data-rm="${i}" aria-label="Delete reading">×</button></td></tr>`; }).join('');
}
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function setupLog() {
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4); $('lTime').value = now.toISOString().slice(0, 16);
  $('logForm').addEventListener('submit', (e) => {
    e.preventDefault(); const v = parseFloat($('lVal').value); if (!(v > 40 && v < 110)) return toast('Enter a WBGT reading in °F.');
    const L = readLog(); L.unshift({ t: $('lTime').value, v, venue: $('lVenue').value.trim(), by: $('lBy').value.trim().toUpperCase() }); writeLog(L); renderLog();
    const f = W.flagOf(v, S.cat); toast(`${FLAG_INFO[f].name} flag recorded: ${FLAG_INFO[f].short}.`); $('lVal').value = '';
  });
  $('logTable').addEventListener('click', (e) => { const i = e.target.dataset.rm; if (i == null) return; const L = readLog(); L.splice(+i, 1); writeLog(L); renderLog(); });
  $('csvBtn').addEventListener('click', () => {
    const L = readLog(); if (!L.length) return toast('No readings to export yet.');
    const rows = [['time', 'venue', 'wbgt_f', 'flag', 'required', 'initials', 'school', 'heat_category'], ...L.map((r) => { const f = W.flagOf(r.v, S.cat); return [r.t, r.venue, r.v, FLAG_INFO[f].name, FLAG_INFO[f].short, r.by, S.school.name, S.cat]; })];
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'flagline-heat-log.csv'; a.click();
  });
  $('printBtn').addEventListener('click', () => print());
}

// ---------- preseason ----------
function renderAcc() {
  if (!$('aStart').value) { const d = new Date(); d.setDate(d.getDate() + 1); $('aStart').value = d.toISOString().slice(0, 10); }
  const start = new Date($('aStart').value + 'T12:00:00');
  const fcDays = new Map((S.days || []).map((d) => [d.key, d]));
  let html = '';
  for (let n = 1; n <= 14; n++) {
    const dt = new Date(start); dt.setDate(dt.getDate() + n - 1);
    const key = dt.toISOString().slice(0, 10), a = acclimDay(n), d = fcDays.get(key), f = d ? practiceFlag(d.row, S.start, S.len) : -1;
    html += `<div><div class="n">DAY ${n}</div><div class="dt">${dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
      <div class="g">${a.gear}</div><div class="s">${a.sessions}</div><div class="x">${n === 1 || n === 6 ? a.note : ''}</div>
      ${f >= 0 ? `<div class="fc" style="--c:var(--f${f})"><i></i>${FLAG_INFO[f].name} at ${tLabel(S.start)}</div>` : ''}</div>`;
  }
  $('acc').innerHTML = html;
}

// ---------- history ----------
async function loadHistory() {
  const s = S.school; $('histStats').innerHTML = '<p class="fine">Loading three summers of hourly weather…</p>';
  try { const y = new Date().getFullYear(); const h = await summers(s.lat, s.lon, S.fc.tz, [y - 3, y - 2, y - 1]); if (S.school !== s) return; S.hist = h; renderHistory(); }
  catch (e) { $('histStats').innerHTML = `<p class="fine">Historical weather is unavailable right now (${e.message}).</p>`; }
}
function renderHistory() {
  const H = S.hist, cat = S.cat, byDay = new Map();
  for (const r of H) { if (!byDay.has(r.date)) byDay.set(r.date, new Array(24).fill(null)); byDay.get(r.date)[r.hour] = { wbgtF: r.f }; }
  const days = [...byDay.entries()];
  const hit = (start, minFlag) => days.filter(([, row]) => practiceFlag(row, start, S.len) >= minFlag).length;
  const rb = H.filter((r) => W.flagOf(r.f, cat) >= 3).length;
  const yours = hit(S.start, 3), morning = hit(7, 3), yoursO = hit(S.start, 2), morningO = hit(7, 2);
  $('histStats').innerHTML = `<div><b>${rb}</b><span>red or black flag hours, June–August, last 3 summers</span></div>
    <div><b>${yoursO}</b><span>days your ${tLabel(S.start)} practice hit orange or worse</span></div>
    <div><b>${yours}</b><span>days it hit red or black (max 1 h or cancel)</span></div>
    <div><b>${morning} <small style="font-size:15px">/ ${morningO}</small></b><span>red-black / orange-or-worse days at 7 am instead</span></div><p class="fine">Historical weather: ${H.source}.</p>`;
  const cv = $('histCanvas'), r = cv.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const L = 44, T = 18, W0 = r.width - L - 6, H0 = r.height - T - 22, hours = [5, 22], nh = hours[1] - hours[0] + 1;
  const cw = W0 / days.length, ch = H0 / nh, css = getComputedStyle(document.documentElement);
  const col = [0, 1, 2, 3, 4].map((k) => css.getPropertyValue(`--f${k}`).trim());
  g.clearRect(0, 0, r.width, r.height);
  days.forEach(([date, row], x) => { for (let h = hours[0]; h <= hours[1]; h++) { const c = row[h]; if (!c) continue; g.fillStyle = col[W.flagOf(c.wbgtF, cat)]; g.fillRect(L + x * cw, T + (h - hours[0]) * ch, Math.ceil(cw), Math.ceil(ch) - 1); } });
  g.font = '11px "IBM Plex Mono", monospace'; g.fillStyle = css.getPropertyValue('--ink3');
  for (let h = 6; h <= 22; h += 3) g.fillText(hLabel(h), 2, T + (h - hours[0] + 0.7) * ch);
  let lastY = null; days.forEach(([date], x) => { const y = date.slice(0, 4); if (y !== lastY) { g.fillStyle = css.getPropertyValue('--ink'); g.fillText(y, L + x * cw + 3, 12); g.fillRect(L + x * cw, T, 1.5, H0 + 6); lastY = y; } });
  const ps = T + (S.start - hours[0]) * ch, pe = T + (S.start + S.len / 60 - hours[0]) * ch;
  g.strokeStyle = css.getPropertyValue('--ink'); g.lineWidth = 1.5; g.setLineDash([5, 4]); g.strokeRect(L, ps, W0, pe - ps); g.setLineDash([]);
  g.fillStyle = css.getPropertyValue('--ink'); g.fillText('your practice', L + 4, pe + 12);
}

// ---------- national chart ----------
async function national() {
  const d = await (await fetch('data/national_hours.json')).json(), cv = $('natChart'), r = cv.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  cv.width = r.width * dpr; cv.height = r.height * dpr; const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement), L = 40, B = 24, T = 10, w = (r.width - L) / 24, max = Math.max(...d.byHour), tot = d.byHour.reduce((a, b) => a + b, 0);
  g.font = '11px "IBM Plex Mono", monospace';
  for (let k = 0; k <= 4; k++) { const y = T + (r.height - T - B) * (1 - k / 4); g.fillStyle = css.getPropertyValue('--rule'); g.fillRect(L, y, r.width - L, 1); g.fillStyle = css.getPropertyValue('--ink3'); g.fillText(`${Math.round(max * k / 4 / tot * 100)}%`, 2, y + 4); }
  d.byHour.forEach((v, h) => { const bh = (r.height - T - B) * v / max; g.fillStyle = css.getPropertyValue(v / max > 0.5 ? '--f3' : '--f2'); g.fillRect(L + h * w + 2, r.height - B - bh, w - 4, bh); if (h % 3 === 0) { g.fillStyle = css.getPropertyValue('--ink3'); g.fillText(hLabel(h), L + h * w, r.height - 6); } });
}

// ---------- start ----------
async function start() {
  setupSearch(); setupPlanner(); setupLog();
  $('aStart').addEventListener('change', renderAcc);
  await loadSchools();
  board(); national();
  const id = new URLSearchParams(location.search).get('school');
  const s = id && S.schools.find((x) => x.id === id);
  if (s) { $('q').value = `${s.name}, ${s.city}`; selectSchool(s, false); }
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { national(); if (S.hist) renderHistory(); }, 200); });
}
start();
