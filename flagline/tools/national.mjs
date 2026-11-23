// When do dangerous heat hours happen? 30 US cities, Jul 15 - Aug 31, 2021-2025, NASA POWER hourly.
import fs from 'node:fs';
import * as W from '../web/js/wbgt.js';
import { defaultCategory } from '../web/js/regions.js';
const cities = [['Atlanta','GA',33.75,-84.39],['Houston','TX',29.76,-95.37],['Dallas','TX',32.78,-96.80],['Miami','FL',25.76,-80.19],['Tampa','FL',27.95,-82.46],['New Orleans','LA',29.95,-90.07],['Jackson','MS',32.30,-90.18],['Birmingham','AL',33.52,-86.80],['Columbia','SC',34.00,-81.03],['Little Rock','AR',34.75,-92.29],['Oklahoma City','OK',35.47,-97.52],['Phoenix','AZ',33.45,-112.07],
['Chicago','IL',41.88,-87.63],['Indianapolis','IN',39.77,-86.16],['St. Louis','MO',38.63,-90.20],['Kansas City','MO',39.10,-94.58],['Nashville','TN',36.16,-86.78],['Louisville','KY',38.25,-85.76],['Charlotte','NC',35.23,-80.84],['Richmond','VA',37.54,-77.44],['Philadelphia','PA',39.95,-75.17],['Columbus','OH',39.96,-83.00],['Omaha','NE',41.26,-95.93],['Los Angeles','CA',34.05,-118.24],
['Minneapolis','MN',44.98,-93.27],['Detroit','MI',42.33,-83.05],['Milwaukee','WI',43.04,-87.91],['Denver','CO',39.74,-104.99],['Portland','OR',45.52,-122.68],['Boston','MA',42.36,-71.06]];
const windows = { '6-8 am': [6, 7], '7-9 am': [7, 8], '3:30-5:30 pm': [15, 16, 17], '6-8 pm': [18, 19] };
const out = [];
for (const [name, st, lat, lon] of cities) {
  const url = `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,RH2M,WS2M,ALLSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI&community=RE&longitude=${lon}&latitude=${lat}&start=20210715&end=20250831&format=JSON&time-standard=LST`;
  let d; for (let k = 0; k < 3; k++) { try { d = await (await fetch(url)).json(); break; } catch { await new Promise((r) => setTimeout(r, 3000)); } }
  const p = d.properties.parameter, cat = defaultCategory(st);
  const days = {}; let hot = { red: 0, black: 0, total: 0 }; const byHour = new Array(24).fill(0);
  for (const key of Object.keys(p.T2M)) {
    const mo = +key.slice(4, 6), dy = +key.slice(6, 8), hr = +key.slice(8, 10);
    if (!((mo === 7 && dy >= 15) || mo === 8)) continue;
    const t = p.T2M[key], rh = p.RH2M[key], ws = p.WS2M[key], ghi = p.ALLSKY_SFC_SW_DWN[key], dni = p.ALLSKY_SFC_SW_DNI[key];
    if ([t, rh, ws, ghi, dni].some((v) => v == null || v < -900)) continue;
    const date = new Date(Date.UTC(+key.slice(0, 4), mo - 1, dy, hr + 0.5) - lon / 15 * 36e5);
    const cz = Math.cos(W.solarZenith(date, lat, lon)), fdir = ghi > 5 ? Math.min(1, dni * Math.max(cz, 0) / ghi) : 0;
    const f = W.cToF(W.wbgt({ tC: t, rh, windMs: ws, solar: ghi, cosz: cz, fdir })), fl = W.flagOf(f, cat);
    if (fl >= 3) { byHour[hr]++; hot[fl === 4 ? 'black' : 'red']++; }
    hot.total++;
    const day = key.slice(0, 8); (days[day] ||= {})[hr] = fl;
  }
  const res = { name, st, cat, redBlackHours: hot.red + hot.black, byHour, windows: {} };
  const nd = Object.keys(days).length;
  for (const [w, hrs] of Object.entries(windows)) res.windows[w] = Object.values(days).filter((h) => hrs.some((x) => (h[x] ?? 0) >= 3)).length / nd;
  res.days = nd; out.push(res);
  console.log(`${(name + ' ' + st).padEnd(18)} cat ${cat}  red/black h ${String(res.redBlackHours).padStart(4)}  practice days with red/black: ` + Object.entries(res.windows).map(([w, v]) => `${w} ${(v * 100).toFixed(0)}%`).join('  '));
}
fs.writeFileSync('web/data/national.json', JSON.stringify(out));
const tot = out.reduce((a, c) => a + c.redBlackHours, 0), byH = new Array(24).fill(0); out.forEach((c) => c.byHour.forEach((v, i) => (byH[i] += v)));
const share = (a, b) => byH.slice(a, b).reduce((x, y) => x + y, 0) / tot;
console.log('\nALL red/black hours', tot, '| share 12-6 pm', (share(12, 18) * 100).toFixed(0) + '%', '| 6-9 am', (share(6, 9) * 100).toFixed(1) + '%');
const avg = (w) => out.reduce((a, c) => a + c.windows[w], 0) / out.length; for (const w of Object.keys(windows)) console.log(w, 'avg share of practice days hitting red/black', (avg(w) * 100).toFixed(1) + '%');
