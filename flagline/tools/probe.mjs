import * as W from '../web/js/wbgt.js';
const UA = { 'User-Agent': '(flagline-validation, student project)', Accept: 'application/geo+json' };
const expand = (p) => { const m = new Map(); for (const v of p.values) { const [t, dur] = v.validTime.split('/'); const h = +(dur.match(/(\d+)H/)?.[1] || 0) + 24 * +(dur.match(/P(\d+)D/)?.[1] || 0); const t0 = Date.parse(t); for (let k = 0; k < Math.max(1, h); k++) m.set(t0 + k * 36e5, v.value); } return m; };
const rows = [];
for (const [lat, lon] of [[25.76, -80.19], [24.56, -81.78], [21.31, -157.86], [29.76, -95.37]]) {
  const pt = await (await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers: UA })).json();
  const g = (await (await fetch(pt.properties.forecastGridData, { headers: UA })).json()).properties;
  const T = expand(g.temperature), TD = expand(g.dewpoint), WS = expand(g.windSpeed), SC = expand(g.skyCover), WB = expand(g.wetBulbGlobeTemperature), RH = expand(g.relativeHumidity);
  for (const [t, wb] of WB) { if (wb == null || !T.has(t)) continue; const cz = Math.cos(W.solarZenith(new Date(t), lat, lon)); rows.push({ T: T.get(t), TD: TD.get(t), RH: RH.get(t), ws: WS.get(t), sc: SC.get(t) / 100, wb, cz }); }
}
const night = rows.filter((r) => r.cz < 0);
const tw = (r) => W.wetBulbStull(r.T, r.RH);
// at night, WBGT ≈ 0.7 Tnwb + 0.3 Ta  -> implied Tnwb
const implied = night.map((r) => (r.wb - 0.3 * r.T) / 0.7 - tw(r));
console.log('night n', night.length, 'implied Tnwb - Stull Tw (C): mean', (implied.reduce((a, b) => a + b, 0) / implied.length).toFixed(2));
// try: NWS may compute globe at night below air temp (sky radiation); check implied with Tg = Ta - x
for (const k of [0, 1, 2, 3]) { const e = night.map((r) => 0.7 * tw(r) + 0.2 * (r.T - k) + 0.1 * r.T - r.wb); console.log('Tg = Ta -', k, 'C -> night bias C', (e.reduce((a, b) => a + b, 0) / e.length).toFixed(2)); }
// does our Dimiceli globe at night with sky emissivity give Tg < Ta?
const r0 = night[0]; console.log('sample', r0, 'ours', W.wbgt({ tC: r0.T, rh: r0.RH, windMs: r0.ws / 3.6 * 0.75, solar: 0, cosz: 0 }).toFixed(2));
