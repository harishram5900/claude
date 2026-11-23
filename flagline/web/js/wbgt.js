// Wet-bulb globe temperature from ordinary weather data.
// Globe temperature: Dimiceli, Piltz & Amburn (2011), the method behind the NWS WBGT forecast.
// Wet bulb: Stull (2011). WBGT = 0.7 Tnwb + 0.2 Tg + 0.1 Ta (outdoor, in sun).
const SIGMA = 5.67e-8, D2R = Math.PI / 180;

export function solarZenith(date, lat, lon) {
  const d = (date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 1)) / 864e5;
  const g = 2 * Math.PI / 365 * (d - 1 + (date.getUTCHours() + date.getUTCMinutes() / 60 - 12) / 24);
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const tst = date.getUTCHours() * 60 + date.getUTCMinutes() + eqt + 4 * lon;
  const ha = (tst / 4 - 180) * D2R, la = lat * D2R;
  const cz = Math.sin(la) * Math.sin(decl) + Math.cos(la) * Math.cos(decl) * Math.cos(ha);
  return Math.acos(Math.max(-1, Math.min(1, cz)));
}
// Clear-sky irradiance (Haurwitz) reduced by cloud cover (Kasten & Czeplak), when no measured solar is available.
export function solarFromClouds(cosz, cloudFrac) {
  if (cosz <= 0.01) return 0;
  return 1098 * cosz * Math.exp(-0.057 / cosz) * (1 - 0.75 * Math.pow(cloudFrac, 3.4));
}
export function wetBulbStull(tC, rh) {
  return tC * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) + Math.atan(tC + rh) - Math.atan(rh - 1.676331)
    + 0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) - 4.686035;
}
export const rhFromDew = (tC, tdC) => 100 * Math.exp(17.625 * tdC / (243.04 + tdC)) / Math.exp(17.625 * tC / (243.04 + tC));

// Black globe temperature (deg C) from an energy balance on a 2-inch (0.0508 m) globe, solved by bisection:
// emitted + convected = absorbed sky/ground longwave + absorbed sunlight (Liljegren et al. 2008 radiation terms,
// ISO 7726 globe convection coefficient).
export function globeTemp({ tC, rh, windMs, solar, cosz, fdir = 0.75 }) {
  const Ta = tC + 273.15, ea = rh / 100 * 6.112 * Math.exp(17.67 * tC / (tC + 243.5));
  const epsA = Math.min(1, 0.575 * Math.pow(ea, 1 / 7)), epsG = 0.95, albG = 0.05, albS = 0.45, D = 0.0508;
  const v = Math.max(windMs, 0.3), h = 6.3 * Math.pow(v, 0.6) / Math.pow(D, 0.4);
  const S = Math.max(solar, 0), cz = Math.max(cosz, 0.087), fdb = S > 0 ? fdir : 0;
  const lwIn = 0.5 * (epsA + 1) * SIGMA * Ta ** 4;                            // half sky, half ground at air temperature
  const swIn = S > 0 ? 0.5 * S * (1 - albG) * (1 + (1 / (2 * cz) - 1) * fdb + albS) : 0;
  const f = (Tg) => epsG * SIGMA * Tg ** 4 + h * (Tg - Ta) - epsG * lwIn - swIn;
  let lo = Ta - 15, hi = Ta + 45;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
  return (lo + hi) / 2 - 273.15;
}

// tC air temperature, rh %, windMs at ~2 m, solar W/m2 (global horizontal), cosz cosine of solar zenith.
export function wbgt(p) {
  const Tg = globeTemp(p), Tw = wetBulbStull(p.tC, p.rh);
  return 0.7 * Tw + 0.2 * Tg + 0.1 * p.tC;
}
export const cToF = (c) => c * 9 / 5 + 32;

// Activity flags. Thresholds in deg F by Korey Stringer Institute regional category (Grundstein et al. 2015);
// Category 2 matches the Delaware DIAA 2025 policy table exactly.
export const CATEGORIES = {
  1: [76.1, 81.0, 84.0, 86.0],
  2: [79.7, 84.6, 87.6, 89.6],
  3: [82.1, 86.9, 90.0, 91.9]
};
export const FLAGS = ['green', 'yellow', 'orange', 'red', 'black'];
export function flagOf(f, cat) { const t = CATEGORIES[cat]; let k = 0; while (k < 4 && f > t[k]) k++; return k; }
