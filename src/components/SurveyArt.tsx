/**
 * Anketler için konuya özel kapak çizimleri (SVG, tema renkleri: lacivert, turkuaz, eflatun, beyaz).
 * Fotoğraf kullanılmaz; her konu kendi simgesel kompozisyonuyla çizilir. Sunucu ve istemcide aynı çıktıyı verir.
 */
import type { ReactNode } from "react";

export type ArtKey = "istihdam" | "neet" | "ogrenci" | "siyaset" | "yerel" | "sosyal" | "guvenlik" | "egitim" | "teknoloji" | "afet" | "genel";

const NAVY = "#0B1F3A", NAVY2 = "#13294B", NAVY3 = "#1E3A64", TUR = "#14B8C4", TURL = "#9FE3E8", EFL = "#9B7FD1", EFLL = "#CDBDEB", W = "#FFFFFF";

/** Anket başlığı ve araştırma alanından çizim türü */
export function artKeyFor(title: string, categorySlug?: string | null): ArtKey {
  const t = title.toLocaleLowerCase("tr-TR");
  if (/ev gençleri|ne eğitimde ne istihdamda/.test(t)) return "neet";
  if (/öğrenci|harcama/.test(t)) return "ogrenci";
  if (/istihdam|işsizlik/.test(t)) return "istihdam";
  if (/siyasi|siyaset|parti|lider|seçim/.test(t)) return "siyaset";
  if (/yerel|belediye/.test(t)) return "yerel";
  if (/hayat pahalılığı|toplumsal güven|yaşam memnuniyeti/.test(t)) return "sosyal";
  if (/güvenlik|dış politika|jeopolitik/.test(t)) return "guvenlik";
  if (/afet|deprem/.test(t)) return "afet";
  if (/dijital|yapay zek|medya|dezenformasyon/.test(t)) return "teknoloji";
  if (/eğitim/.test(t)) return "egitim";
  const bySlug: Record<string, ArtKey> = {
    "ekonomi-ve-istihdam": "istihdam",
    "genclik-ve-universite": "ogrenci",
    "siyaset-ve-kamuoyu": "siyaset",
    "yerel-yonetimler-ve-kalkinma": "yerel",
    "sosyal-sorunlar": "sosyal",
    "guvenlik-ve-jeopolitik": "guvenlik",
    "afet-ve-saha-arastirmalari": "afet",
    "teknoloji-ve-medya": "teknoloji",
    "egitim-ve-bilim": "egitim",
  };
  return (categorySlug && bySlug[categorySlug]) || "genel";
}

const ACCENT: Record<ArtKey, string> = { istihdam: TUR, neet: EFL, ogrenci: TUR, siyaset: EFL, yerel: TUR, sosyal: EFL, guvenlik: TUR, egitim: EFL, teknoloji: TUR, afet: EFL, genel: TUR };

const S = { fill: "none", stroke: W, strokeWidth: 7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const thin = { ...S, strokeWidth: 4 };

/** Kişi simgesi (baş + omuz) */
const person = (x: number, y: number, s = 1, fill = W, k?: string) => (
  <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx="0" cy="-34" r="16" fill={fill} />
    <path d="M-28 22 v-14 a28 28 0 0 1 56 0 v14 z" fill={fill} />
  </g>
);

const MOTIF: Record<ArtKey, (a: string) => ReactNode> = {
  istihdam: (a) => (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={360 + i * 44} y={300 - (i + 1) * 34} width="30" height={(i + 1) * 34} rx="6" fill={i === 4 ? a : NAVY3} />
      ))}
      <polyline points="350,250 410,210 460,222 520,160 580,118" {...S} stroke={a} />
      <path d="M560 112 L584 116 L578 140" {...S} stroke={a} />
      <rect x="150" y="180" width="170" height="120" rx="16" {...S} />
      <path d="M205 180 v-18 a12 12 0 0 1 12 -12 h36 a12 12 0 0 1 12 12 v18" {...S} />
      <path d="M150 228 h170" {...thin} />
      <rect x="222" y="218" width="26" height="22" rx="5" fill={a} />
    </>
  ),
  neet: (a) => (
    <>
      <path d="M140 230 L250 140 L360 230" {...S} />
      <rect x="165" y="225" width="170" height="110" rx="8" {...S} />
      {person(250, 300, 1.15, a)}
      <circle cx="480" cy="170" r="70" {...S} />
      <path d="M480 125 v45 l32 22" {...S} stroke={a} />
      <rect x="430" y="270" width="96" height="60" rx="12" fill={NAVY3} />
      <path d="M452 300 h52 M452 314 h30" {...thin} stroke={EFLL} />
      <circle cx="548" cy="110" r="10" fill={EFLL} />
      <circle cx="580" cy="150" r="6" fill={TURL} />
    </>
  ),
  ogrenci: (a) => (
    <>
      <path d="M140 170 L270 115 L400 170 L270 225 Z" fill={W} />
      <path d="M200 196 v52 c0 18 140 18 140 0 v-52" {...S} />
      <path d="M400 170 v62" {...S} stroke={a} />
      <circle cx="400" cy="240" r="9" fill={a} />
      <circle cx="500" cy="235" r="48" fill={a} />
      <circle cx="500" cy="235" r="30" fill="none" stroke={NAVY} strokeWidth="6" />
      <path d="M490 225 h20 M490 245 h20 M500 220 v30" stroke={NAVY} strokeWidth="5" strokeLinecap="round" />
      <circle cx="560" cy="300" r="34" fill={TURL} />
      <circle cx="440" cy="310" r="26" fill={EFLL} />
    </>
  ),
  siyaset: (a) => (
    <>
      <path d="M200 175 a90 60 0 0 1 180 0" fill={NAVY3} stroke={W} strokeWidth="6" />
      <path d="M180 180 h220" {...S} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M${200 + i * 36} 185 v80`} {...thin} />
      ))}
      <path d="M170 275 h240" {...S} />
      <path d="M290 112 v-30" {...thin} />
      <path d="M290 82 h28 l-6 9 6 9 h-28" fill={a} />
      <rect x="440" y="200" width="130" height="100" rx="10" fill={W} />
      <path d="M470 200 v-8 h70 v8" {...S} stroke={NAVY} />
      <rect x="484" y="150" width="42" height="56" rx="4" fill={a} transform="rotate(-8 505 178)" />
      <path d="M440 236 h130" stroke={NAVY} strokeWidth="5" />
    </>
  ),
  yerel: (a) => (
    <>
      {[
        [130, 200, 60, 120],
        [195, 150, 55, 170],
        [255, 230, 50, 90],
        [310, 120, 70, 200],
        [385, 190, 50, 130],
        [440, 160, 60, 160],
      ].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} rx="4" fill={i % 2 ? NAVY3 : NAVY2} stroke={W} strokeWidth="3" />
          {Array.from({ length: Math.floor(h / 34) }, (_, r) => (
            <path key={r} d={`M${x + 12} ${y + 20 + r * 30} h${w - 24}`} stroke={i === 3 ? a : TURL} strokeWidth="5" strokeDasharray="8 8" opacity=".8" />
          ))}
        </g>
      ))}
      <path d="M110 320 h420" {...S} />
      <path d="M545 80 a42 42 0 0 1 42 42 c0 32 -42 76 -42 76 s-42 -44 -42 -76 a42 42 0 0 1 42 -42 z" fill={a} />
      <circle cx="545" cy="122" r="15" fill={NAVY} />
    </>
  ),
  sosyal: (a) => (
    <>
      <path d="M150 190 h170 l-22 100 h-126 z" fill={W} />
      <path d="M180 190 l30 -55 M290 190 l-30 -55" {...S} />
      <path d="M185 225 v40 M235 225 v40 M285 225 v40" stroke={NAVY} strokeWidth="6" strokeLinecap="round" />
      <path d="M400 130 l60 50 l50 -30 l80 80" {...S} stroke={a} />
      <path d="M570 220 l20 10 l-8 -22" {...S} stroke={a} />
      {person(420, 300, 0.9, TURL, "p1")}
      {person(480, 296, 1, W, "p2")}
      {person(540, 300, 0.9, EFLL, "p3")}
    </>
  ),
  guvenlik: (a) => (
    <>
      <circle cx="430" cy="200" r="120" fill="none" stroke={TURL} strokeWidth="3" opacity=".6" />
      <circle cx="430" cy="200" r="80" fill="none" stroke={TURL} strokeWidth="3" opacity=".6" />
      <ellipse cx="430" cy="200" rx="40" ry="120" fill="none" stroke={TURL} strokeWidth="3" opacity=".6" />
      <path d="M310 200 h240" stroke={TURL} strokeWidth="3" opacity=".6" />
      <path d="M430 200 L520 110" stroke={a} strokeWidth="6" strokeLinecap="round" />
      <circle cx="500" cy="150" r="9" fill={a} />
      <circle cx="380" cy="250" r="7" fill={EFLL} />
      <path d="M230 105 l80 30 v70 c0 55 -40 85 -80 100 c-40 -15 -80 -45 -80 -100 v-70 z" fill={W} />
      <path d="M195 210 l25 25 l50 -55" stroke={a} strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  egitim: (a) => (
    <>
      <path d="M160 140 c40 -15 85 -15 120 8 v170 c-35 -22 -80 -22 -120 -8 z" fill={W} />
      <path d="M400 140 c-40 -15 -85 -15 -120 8 v170 c35 -22 80 -22 120 -8 z" fill={EFLL} />
      <path d="M185 180 h70 M185 210 h70 M185 240 h50" stroke={NAVY} strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="510" cy="200" rx="70" ry="26" fill="none" stroke={a} strokeWidth="5" />
      <ellipse cx="510" cy="200" rx="70" ry="26" fill="none" stroke={TURL} strokeWidth="5" transform="rotate(60 510 200)" />
      <ellipse cx="510" cy="200" rx="70" ry="26" fill="none" stroke={W} strokeWidth="5" transform="rotate(-60 510 200)" />
      <circle cx="510" cy="200" r="13" fill={a} />
    </>
  ),
  teknoloji: (a) => (
    <>
      <rect x="170" y="100" width="130" height="220" rx="22" fill={W} />
      <rect x="185" y="125" width="100" height="160" rx="8" fill={NAVY3} />
      <path d="M200 150 h60 M200 175 h70 M200 200 h45" stroke={TURL} strokeWidth="6" strokeLinecap="round" />
      <rect x="200" y="225" width="60" height="38" rx="8" fill={a} />
      <circle cx="235" cy="302" r="7" fill={NAVY} />
      {[
        [420, 130],
        [520, 110],
        [570, 200],
        [480, 220],
        [400, 260],
        [530, 290],
      ].map(([x, y], i, arr) => (
        <g key={i}>
          {arr.slice(i + 1, i + 3).map(([x2, y2], j) => (
            <path key={j} d={`M${x} ${y} L${x2} ${y2}`} stroke={TURL} strokeWidth="3" opacity=".7" />
          ))}
        </g>
      ))}
      {[
        [420, 130, W],
        [520, 110, a],
        [570, 200, W],
        [480, 220, EFLL],
        [400, 260, a],
        [530, 290, W],
      ].map(([x, y, c], i) => (
        <circle key={i} cx={x as number} cy={y as number} r={i === 3 ? 22 : 13} fill={c as string} />
      ))}
    </>
  ),
  afet: (a) => (
    <>
      <path d="M130 250 h60 l20 -60 l25 120 l25 -150 l25 130 l20 -60 h60" {...S} stroke={a} />
      <path d="M390 190 L470 125 L550 190" {...S} />
      <rect x="410" y="185" width="120" height="110" rx="6" {...S} />
      <path d="M470 185 l-12 30 l18 18 l-14 30" stroke={a} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="150" y="285" width="110" height="70" rx="12" fill={W} />
      <path d="M185 285 v-14 h40 v14" {...S} />
      <path d="M205 300 v40 M185 320 h40" stroke={a} strokeWidth="8" strokeLinecap="round" />
    </>
  ),
  genel: (a) => (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={200 + i * 50} y={300 - [70, 120, 90, 160, 130, 200][i]} width="34" height={[70, 120, 90, 160, 130, 200][i]} rx="6" fill={i === 5 ? a : i % 2 ? NAVY3 : TURL} />
      ))}
      <path d="M180 300 h340" {...S} />
    </>
  ),
};

/** Konuya özel kapak çizimi. `className` ile boyutlandırılır (en–boy oranı 16:10). */
export function SurveyArt({ art, label, className }: { art: ArtKey; label?: string; className?: string }) {
  const a = ACCENT[art];
  return (
    <svg className={"survey-art " + (className || "")} viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label || "Anket görseli"}>
      <rect width="640" height="400" fill={NAVY} />
      <circle cx="520" cy="80" r="230" fill={NAVY2} />
      <circle cx="90" cy="400" r="190" fill={a} opacity=".16" />
      <circle cx="600" cy="380" r="120" fill={EFL} opacity=".14" />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={"v" + i} d={`M${i * 80} 0 v400`} stroke={W} strokeOpacity=".05" />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <path key={"h" + i} d={`M0 ${i * 80 + 40} h640`} stroke={W} strokeOpacity=".05" />
      ))}
      <g className="art-motif">{MOTIF[art](a)}</g>
      <circle cx="600" cy="40" r="6" fill={a} />
      <circle cx="620" cy="40" r="6" fill={W} opacity=".5" />
    </svg>
  );
}
