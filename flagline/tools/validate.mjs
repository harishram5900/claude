// Compare our WBGT engine with the official NWS WBGT forecast at warm US locations.
import * as W from '../web/js/wbgt.js';
const UA = { 'User-Agent': '(flagline-validation, student project)', Accept: 'application/geo+json' };
const sites = [['Miami FL', 25.76, -80.19], ['Brownsville TX', 25.90, -97.50], ['Tampa FL', 27.95, -82.46], ['Phoenix AZ', 33.45, -112.07], ['Key West FL', 24.56, -81.78], ['Honolulu HI', 21.31, -157.86], ['Houston TX', 29.76, -95.37], ['New Orleans LA', 29.95, -90.07]];
const expand = (p) => { const m = new Map(); for (const v of p.values) { const [t, dur] = v.validTime.split('/'); const h = +(dur.match(/(\d+)H/)?.[1] || 0) + 24 * +(dur.match(/P(\d+)D/)?.[1] || 0); const t0 = Date.parse(t); for (let k = 0; k < Math.max(1, h); k++) m.set(t0 + k * 36e5, v.value); } return m; };
let all = [];
for (const [name, lat, lon] of sites) {
  const pt = await (await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers: UA })).json();
  const g = (await (await fetch(pt.properties.forecastGridData, { headers: UA })).json()).properties;
  const T = expand(g.temperature), TD = expand(g.dewpoint), WS = expand(g.windSpeed), SC = expand(g.skyCover), WB = expand(g.wetBulbGlobeTemperature);
  const errs = [];
  for (const [t, wb] of WB) {
    if (wb == null || !T.has(t) || !TD.has(t) || !WS.has(t) || !SC.has(t)) continue;
    const d = new Date(t), cz = Math.cos(W.solarZenith(d, lat, lon)), cc = SC.get(t) / 100;
    // NWS wind is 10 m km/h; reduce to ~2 m with a log profile (x0.75)
    const ours = W.wbgt({ tC: T.get(t), rh: W.rhFromDew(T.get(t), TD.get(t)), windMs: WS.get(t) / 3.6 * 0.75, solar: W.solarFromClouds(cz, cc), cosz: cz, fdir: 0.85 * (1 - cc) + 0.1 });
    errs.push([W.cToF(ours) - W.cToF(wb), W.cToF(wb), cz > 0.05]);
  }
  const e = errs.map((x) => x[0]), mae = e.reduce((a, b) => a + Math.abs(b), 0) / e.length, bias = e.reduce((a, b) => a + b, 0) / e.length;
  const day = errs.filter((x) => x[2]).map((x) => x[0]), dmae = day.reduce((a, b) => a + Math.abs(b), 0) / day.length;
  console.log(`${name.padEnd(15)} n=${e.length} MAE ${mae.toFixed(2)}F bias ${bias.toFixed(2)}F daytime MAE ${dmae.toFixed(2)}F  NWS max ${Math.max(...errs.map((x) => x[1])).toFixed(1)}F`);
  all = all.concat(errs);
}
const e = all.map((x) => x[0]); console.log('ALL n=' + e.length, 'MAE', (e.reduce((a, b) => a + Math.abs(b), 0) / e.length).toFixed(2), 'bias', (e.reduce((a, b) => a + b, 0) / e.length).toFixed(2));
const hot = all.filter((x) => x[1] > 75).map((x) => x[0]); console.log('when NWS WBGT > 75F: n=' + hot.length, 'MAE', (hot.reduce((a, b) => a + Math.abs(b), 0) / hot.length).toFixed(2), 'bias', (hot.reduce((a, b) => a + b, 0) / hot.length).toFixed(2));
