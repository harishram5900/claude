// National Weather Service gridpoint forecast for a location: official hourly WBGT (when issued),
// HeatRisk, and the inputs we need to compute WBGT ourselves when the official grid is missing.
import * as W from './wbgt.js';

function expand(p) {
  const m = new Map(); if (!p || !p.values) return m;
  for (const v of p.values) {
    const [t, dur] = v.validTime.split('/');
    const h = +(dur.match(/(\d+)H/)?.[1] || 0) + 24 * +(dur.match(/P(\d+)D/)?.[1] || 0);
    const t0 = Date.parse(t); for (let k = 0; k < Math.max(1, h); k++) m.set(t0 + k * 36e5, v.value);
  }
  return m;
}
const cache = new Map();
export async function forecast(lat, lon) {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`; if (cache.has(key)) return cache.get(key);
  const job = (async () => {
    const pt = await (await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`, { headers: { Accept: 'application/geo+json' } })).json();
    if (!pt.properties) throw new Error(pt.detail || 'NWS has no forecast for this point');
    const g = (await (await fetch(pt.properties.forecastGridData, { headers: { Accept: 'application/geo+json' } })).json()).properties;
    const T = expand(g.temperature), TD = expand(g.dewpoint), WS = expand(g.windSpeed), SC = expand(g.skyCover), WB = expand(g.wetBulbGlobeTemperature), HR = expand(g.heatRisk), RH = expand(g.relativeHumidity);
    const now = Date.now() - 36e5, hours = [];
    for (const [t, tc] of T) {
      if (t < now || tc == null) continue;
      let wb = WB.get(t), src = 'nws';
      if (wb == null && TD.has(t) && WS.has(t)) {
        const cz = Math.cos(W.solarZenith(new Date(t), lat, lon)), cc = (SC.get(t) ?? 50) / 100;
        wb = W.wbgt({ tC: tc, rh: RH.get(t) ?? W.rhFromDew(tc, TD.get(t)), windMs: WS.get(t) / 3.6 * 0.75, solar: W.solarFromClouds(cz, cc), cosz: cz, fdir: 0.85 * (1 - cc) + 0.1 });
        src = 'calc';
      }
      if (wb == null) continue;
      hours.push({ t, wbgtF: W.cToF(wb), tempF: W.cToF(tc), rh: RH.get(t), heatRisk: HR.get(t), src });
    }
    hours.sort((a, b) => a.t - b.t);
    return { tz: pt.properties.timeZone, office: pt.properties.gridId, city: pt.properties.relativeLocation?.properties?.city, hours };
  })();
  cache.set(key, job); job.catch(() => cache.delete(key)); return job;
}
