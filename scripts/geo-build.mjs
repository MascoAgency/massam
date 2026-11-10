// geoBoundaries TUR ADM1 (OSM) -> Mercator izdüşümlü, sadeleştirilmiş SVG yolları
// Kullanım: node scripts/geo-build.mjs geoBoundaries-TUR-ADM1_simplified.geojson src/lib/geo/tr-iller.ts
import fs from "fs";
const [src, out] = process.argv.slice(2);
const g = JSON.parse(fs.readFileSync(src, "utf8"));
const W = 1000, LON0 = 25.5, LON1 = 45.0, LAT0 = 35.7, LAT1 = 42.2;
const my = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const k = W / (LON1 - LON0);
const yTop = my(LAT1) * (180 / Math.PI);
const P = (lon, lat) => [(lon - LON0) * k, (yTop - my(lat) * (180 / Math.PI)) * k];
const H = P(LON0, LAT0)[1];
function dp(pts, eps) {
  if (pts.length < 3) return pts;
  let idx = 0, dmax = 0; const [a, b] = [pts[0], pts[pts.length - 1]];
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-9;
  for (let i = 1; i < pts.length - 1; i++) { const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / L; if (d > dmax) { dmax = d; idx = i; } }
  if (dmax <= eps) return [a, b];
  return [...dp(pts.slice(0, idx + 1), eps).slice(0, -1), ...dp(pts.slice(idx), eps)];
}
const r1 = (v) => Math.round(v * 10) / 10;
const iller = g.features.map((f) => {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  let d = "", A = 0, cx = 0, cy = 0;
  for (const poly of polys) {
    const ring = poly[0].map(([lo, la]) => P(lo, la));
    const h = Math.floor(ring.length / 2);
    const s = [...dp(ring.slice(0, h + 1), 1.0).slice(0, -1), ...dp(ring.slice(h), 1.0)];
    if (s.length < 4) continue;
    d += "M" + s.map((p) => r1(p[0]) + "," + r1(p[1])).join("L") + "Z";
    for (let i = 0; i < ring.length - 1; i++) { const c = ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]; A += c; cx += (ring[i][0] + ring[i + 1][0]) * c; cy += (ring[i][1] + ring[i + 1][1]) * c; }
  }
  return { iso: f.properties.shapeISO, name: f.properties.shapeName, d, c: [r1(cx / (3 * A)), r1(cy / (3 * A))] };
}).sort((a, b) => a.iso.localeCompare(b.iso));
const ts = `/**
 * Türkiye il sınırları — Mercator izdüşümü, ${W}×${Math.round(H)} birimlik çizim alanı.
 * Kaynak: geoBoundaries TUR ADM1 (2023), OpenStreetMap verisi; © OpenStreetMap katkıcıları (ODbL / CC BY-SA).
 * scripts/geo-build.mjs ile üretilmiştir; elle düzenlemeyin.
 */
export const TR_W = ${W};
export const TR_H = ${Math.round(H)};
const LON0 = ${LON0}, K = ${k}, Y_TOP = ${yTop};
/** Boylam/enlemi harita koordinatına çevirir */
export function project(lon: number, lat: number): [number, number] {
  const y = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * (180 / Math.PI);
  return [(lon - LON0) * K, (Y_TOP - y) * K];
}
export type Il = { iso: string; name: string; d: string; c: [number, number] };
export const ILLER: Il[] = ${JSON.stringify(iller)};
`;
fs.writeFileSync(out, ts);
console.log(iller.length, "il", Math.round(ts.length / 1024) + "KB", "H", Math.round(H), iller.slice(0,3).map(i=>i.name).join(","));
