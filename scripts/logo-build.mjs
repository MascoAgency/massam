// MASSAM amblemi: MASKDER'in ikiye bölünmüş dünya diski diliyle, Türkiye merkezli ortografik harita.
// Kara: Natural Earth ne_50m_land (kamu malı) · Türkiye: geoBoundaries TUR ADM1 (© OpenStreetMap) · Yazı: Inter ExtraBold (OFL)
// Kullanım: npx -p opentype.js@1.3.4 node scripts/logo-build.mjs ne_50m_land.geojson tur-adm1.geojson assets/fonts/Inter-ExtraBold.ttf public src/lib/report/massam-emblem.ts
import fs from "fs";
import opentype from "opentype.js";
const [landSrc, trSrc, fontSrc, outDir, outDir2] = process.argv.slice(2);
const C = { seaL: "#13295A", seaR: "#66C1EA", landL: "#2A5592", landR: "#3B8FC6", tr: "#FFFFFF", ink: "#13295A", rim: "#0E1F45" };
const R = 150, CX = 100, CY = 100, DISC = 96;
const LON0 = 18, LAT0 = 27, rad = Math.PI / 180;
function proj(lon, lat) {
  const l = (lon - LON0) * rad, p = lat * rad, p0 = LAT0 * rad;
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  let x = R * Math.cos(p) * Math.sin(l), y = R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l));
  if (cosc < 0) { const n = Math.hypot(x, y) || 1; x = (x / n) * R * 1.05; y = (y / n) * R * 1.05; }
  return [CX + x, CY - y];
}
function dp(pts, eps) {
  if (pts.length < 3) return pts;
  let idx = 0, dmax = 0; const a = pts[0], b = pts[pts.length - 1];
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  for (let i = 1; i < pts.length - 1; i++) {
    const d = L ? Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / L : Math.hypot(pts[i][0] - a[0], pts[i][1] - a[1]);
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax <= eps) return [a, b];
  return [...dp(pts.slice(0, idx + 1), eps).slice(0, -1), ...dp(pts.slice(idx), eps)];
}
const r2 = (v) => Math.round(v * 100) / 100;
function paths(fc, eps, minArea = 0) {
  let d = "";
  for (const f of fc.features) {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) for (const ring of poly) {
      const pts = ring.map(([lo, la]) => proj(lo, la));
      // diskin tamamen dışında kalan halkaları at
      if (pts.every(([x, y]) => Math.hypot(x - CX, y - CY) > DISC + 6)) continue;
      const h = Math.floor(pts.length / 2);
      const s = [...dp(pts.slice(0, h + 1), eps).slice(0, -1), ...dp(pts.slice(h), eps)];
      if (s.length < 4) continue;
      let A = 0; for (let i = 0; i < s.length - 1; i++) A += s[i][0] * s[i + 1][1] - s[i + 1][0] * s[i][1];
      if (Math.abs(A) / 2 < minArea) continue;
      d += "M" + s.map((p) => r2(p[0]) + " " + r2(p[1])).join("L") + "Z";
    }
  }
  return d;
}
const land = paths(JSON.parse(fs.readFileSync(landSrc, "utf8")), 0.35, 0.6);
const tr = paths(JSON.parse(fs.readFileSync(trSrc, "utf8")), 0.5);
const [sx, sy] = proj(35.2, 39.1);
const star = (x, y, r) => { const p = []; for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8 - Math.PI / 2, rr = i % 2 ? r * 0.42 : r; p.push(r2(x + rr * Math.cos(a)) + "," + r2(y + rr * Math.sin(a))); } return p.join(" "); };

// Yazı: Inter ExtraBold, yola çevrilmiş; "MAS" koyu yarıda beyaz, "SAM" açık yarıda lacivert
const font = opentype.parse(fs.readFileSync(fontSrc).buffer);
const word = "MASSAM", target = 176, base = 123;
const adv = font.getAdvanceWidth(word, 100, { letterSpacing: -0.01 });
const size = (100 * target) / adv;
const textPath = font.getPath(word, CX - target / 2, base, size, { letterSpacing: -0.01 }).toPathData(2);

const disc = (id) => `<clipPath id="${id}-d"><circle cx="100" cy="100" r="${DISC}"/></clipPath><clipPath id="${id}-l"><rect x="0" y="0" width="100" height="200"/></clipPath><clipPath id="${id}-r"><rect x="100" y="0" width="100" height="200"/></clipPath>`;
function svg(id, withText) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="MASSAM amblemi">
<defs>${disc(id)}<radialGradient id="${id}-g" cx="34%" cy="28%" r="80%"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".22"/><stop offset=".55" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#000814" stop-opacity=".22"/></radialGradient></defs>
<g clip-path="url(#${id}-d)">
<rect width="100" height="200" fill="${C.seaL}"/><rect x="100" width="100" height="200" fill="${C.seaR}"/>
<path d="${land}" fill="${C.landL}" clip-path="url(#${id}-l)"/>
<path d="${land}" fill="${C.landR}" clip-path="url(#${id}-r)"/>
<path d="${tr}" fill="${C.tr}" fill-opacity=".92" stroke="${C.tr}" stroke-opacity=".92" stroke-width=".35" stroke-linejoin="round"/>
<polygon points="${star(sx, sy - (withText ? 0 : 0), 6.5)}" fill="#C8102E"/>
${withText ? `<path d="${textPath}" fill="#FFFFFF" clip-path="url(#${id}-l)"/><path d="${textPath}" fill="${C.ink}" clip-path="url(#${id}-r)"/>` : ""}
<circle cx="100" cy="100" r="${DISC}" fill="url(#${id}-g)"/>
</g>
<path d="M138 188.2 A96 96 0 0 0 188.2 138 Q170 140 160 152 Q146 168 138 188.2 Z" fill="#FFFFFF"/>
<path d="M138 188.2 Q146 168 160 152 Q170 140 188.2 138 Q176 150 168 162 Q156 178 138 188.2 Z" fill="#DCEBF5" stroke="${C.rim}" stroke-width=".6" stroke-linejoin="round"/>
<circle cx="100" cy="100" r="${DISC}" fill="none" stroke="${C.rim}" stroke-width="1.5"/>
</svg>
`;
}
fs.writeFileSync(outDir + "/massam-logo.svg", svg("ml", true));
fs.writeFileSync(outDir + "/massam-amblem.svg", svg("ma", false));
console.log("land", Math.round(land.length / 1024) + "KB", "tr", Math.round(tr.length / 1024) + "KB", "font", size.toFixed(1), "star", r2(sx), r2(sy));
// PDF rapor amblemi (react-pdf) için aynı çizimin yol verileri
if (outDir2) fs.writeFileSync(outDir2, `/** MASSAM amblemi çizim verileri — scripts/logo-build.mjs üretir; elle düzenlemeyin */\nexport const EMBLEM = ${JSON.stringify({ C, land, tr, star: star(sx, sy, 6.5), text: textPath })};\n`);
