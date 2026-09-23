// Generates lib/landDots.json — evenly spaced points on land, used by the 3D globe.
// Run: node scripts/generate-land-dots.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { feature } from "topojson-client";
import { geoContains } from "d3-geo";

const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve("world-atlas/land-110m.json"), "utf8"));
const land = feature(topo, topo.objects.land);

const N = 16000; // candidate points on a Fibonacci sphere
const golden = Math.PI * (3 - Math.sqrt(5));
const out = [];
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const theta = golden * i;
  const lat = (Math.asin(y) * 180) / Math.PI;
  const lng = ((((theta * 180) / Math.PI) % 360) + 540) % 360 - 180;
  if (lat < -60) continue; // skip Antarctica for a cleaner look
  if (geoContains(land, [lng, lat])) out.push(Math.round(lat * 10) / 10, Math.round(lng * 10) / 10);
}
writeFileSync(new URL("../lib/landDots.json", import.meta.url), JSON.stringify(out));
console.log(`wrote ${out.length / 2} land dots`);
