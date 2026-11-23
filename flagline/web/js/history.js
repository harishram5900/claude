// A school's own recent summers (Open-Meteo historical weather, ERA5-based), turned into hourly WBGT.
import * as W from './wbgt.js';
export async function summers(lat, lon, tz, years) {
  try { const r = await openMeteo(lat, lon, tz, years); r.source = 'Open-Meteo (ERA5 reanalysis)'; return r; }
  catch (e) { const r = await nasaPower(lat, lon, years); r.source = 'NASA POWER (MERRA-2; tends to run slightly drier, so counts may be low)'; return r; }   // backup source
}

async function openMeteo(lat, lon, tz, years) {
  const y0 = years[0], y1 = years[years.length - 1];
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${y0}-06-01&end_date=${y1}-08-31&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation,direct_radiation&wind_speed_unit=ms&timezone=${encodeURIComponent(tz)}`;
  const d = await (await fetch(url)).json();
  if (!d.hourly) throw new Error(d.reason || 'No historical data');
  const h = d.hourly, off = d.utc_offset_seconds * 1000, out = [];
  for (let i = 0; i < h.time.length; i++) {
    const [date, hm] = h.time[i].split('T'), mo = +date.slice(5, 7);
    if (mo < 6 || mo > 8) continue;
    const local = Date.parse(h.time[i] + ':00Z'), utc = new Date(local - off);
    const t = h.temperature_2m[i], rh = h.relative_humidity_2m[i], ws = h.wind_speed_10m[i], ghi = h.shortwave_radiation[i], dir = h.direct_radiation[i];
    if ([t, rh, ws, ghi].some((v) => v == null)) continue;
    const cz = Math.cos(W.solarZenith(utc, lat, lon));
    out.push({ date, year: +date.slice(0, 4), hour: +hm.slice(0, 2), f: W.cToF(W.wbgt({ tC: t, rh, windMs: ws * 0.75, solar: ghi, cosz: cz, fdir: ghi > 5 ? Math.min(1, (dir ?? 0) / ghi) : 0 })) });
  }
  return out;
}

// NASA POWER hourly (local solar time), used when Open-Meteo is unavailable.
async function nasaPower(lat, lon, years) {
  const y0 = years[0], y1 = years[years.length - 1];
  const url = `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,RH2M,WS2M,ALLSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI&community=RE&longitude=${lon}&latitude=${lat}&start=${y0}0601&end=${y1}0831&format=JSON&time-standard=LST`;
  const d = await (await fetch(url)).json(), p = d.properties?.parameter;
  if (!p) throw new Error('No historical data');
  const out = [];
  for (const key of Object.keys(p.T2M)) {
    const mo = +key.slice(4, 6); if (mo < 6 || mo > 8) continue;
    const t = p.T2M[key], rh = p.RH2M[key], ws = p.WS2M[key], ghi = p.ALLSKY_SFC_SW_DWN[key], dni = p.ALLSKY_SFC_SW_DNI[key];
    if ([t, rh, ws, ghi, dni].some((v) => v == null || v < -900)) continue;
    const yr = +key.slice(0, 4), dy = +key.slice(6, 8), hr = +key.slice(8, 10);
    const utc = new Date(Date.UTC(yr, mo - 1, dy, hr, 30) - lon / 15 * 36e5), cz = Math.cos(W.solarZenith(utc, lat, lon));
    // local solar time is about one hour behind summer clock time in most of the US
    out.push({ date: `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`, year: yr, hour: Math.min(23, hr + 1), f: W.cToF(W.wbgt({ tC: t, rh, windMs: ws, solar: ghi, cosz: cz, fdir: ghi > 5 ? Math.min(1, dni * Math.max(cz, 0) / ghi) : 0 })) });
  }
  return out;
}
