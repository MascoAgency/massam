import { ILLER, TR_H, TR_W, project } from "@/lib/geo/tr-iller";

/** Saha haritası: Türkiye il sınırları (gerçek izdüşüm ve ölçüler) ve saha çalışması yapılan iller */
export type FieldSite = { name: string; lon: number; lat: number; n: number; group: "t" | "e"; anchor?: "start" | "middle" | "end"; dx?: number; dy?: number };

/** MASKDER saha araştırmalarında görüşme yapılan iller (rapor tablolarından); koordinatlar il merkezidir */
export const FIELD_SITES: FieldSite[] = [
  { name: "İstanbul", lon: 28.98, lat: 41.01, n: 949, group: "t", anchor: "end", dx: -6, dy: -34 },
  { name: "Sakarya", lon: 30.4, lat: 40.76, n: 302, group: "t", dx: 2, dy: 46 },
  { name: "Bursa", lon: 29.06, lat: 40.19, n: 171, group: "t", anchor: "end", dx: -16, dy: 34 },
  { name: "Bolu", lon: 31.61, lat: 40.73, n: 82, group: "t", dx: 16, dy: -14 },
  { name: "Hatay", lon: 36.16, lat: 36.2, n: 288, group: "e", dx: 22, dy: 10 },
];

const COLOR = { t: "var(--tur-2)", e: "var(--efl-2)" } as const;
const FILL = { t: "var(--tur-soft)", e: "var(--efl-soft)" } as const;

export function FieldMap({ sites = FIELD_SITES, legend = true }: { sites?: FieldSite[]; legend?: boolean }) {
  const max = Math.max(...sites.map((s) => s.n));
  const byName = new Map(sites.map((s) => [s.name.toLocaleLowerCase("tr-TR"), s]));
  return (
    <figure className="field-map">
      <svg viewBox={`0 0 ${TR_W} ${TR_H}`} role="img" aria-label={"Saha çalışması yapılan iller: " + sites.map((s) => `${s.name} ${s.n}`).join(", ")}>
        <g strokeLinejoin="round">
          {/* Saha illeri en son çizilir ki renkli sınırları komşu illerin altında kalmasın */}
          {[...ILLER].sort((a, b) => Number(byName.has(a.name.toLocaleLowerCase("tr-TR"))) - Number(byName.has(b.name.toLocaleLowerCase("tr-TR")))).map((il) => {
            const s = byName.get(il.name.toLocaleLowerCase("tr-TR"));
            return (
              <path key={il.iso} d={il.d} fill={s ? FILL[s.group] : "var(--line)"} stroke={s ? COLOR[s.group] : "var(--surface)"} strokeWidth={s ? 1.6 : 1}>
                <title>{il.name}</title>
              </path>
            );
          })}
        </g>
        {sites.map((s) => {
          const [x, y] = project(s.lon, s.lat);
          const r = 5 + 17 * Math.sqrt(s.n / max); // alan, görüşme sayısıyla orantılı
          return (
            <g key={s.name}>
              <circle cx={x} cy={y} r={r} fill={COLOR[s.group]} fillOpacity=".85" stroke="var(--surface)" strokeWidth="1.5" />
              <text x={x + (s.dx ?? 14)} y={y + (s.dy ?? 0)} textAnchor={s.anchor ?? "start"} className="fm-label">
                <tspan className="fm-name">{s.name}</tspan>
                <tspan className="fm-n" dx="6">{s.n.toLocaleString("tr-TR")}</tspan>
              </text>
            </g>
          );
        })}
      </svg>
      {legend ? (
        <figcaption className="map-leg">
          <span>
            <i style={{ background: COLOR.t }} />
            Yerel yönetimler saha çalışması
          </span>
          <span>
            <i style={{ background: COLOR.e }} />
            Afet saha araştırması
          </span>
          <span>Daire alanı: görüşme sayısı</span>
          <span className="map-src">Sınırlar: geoBoundaries, © OpenStreetMap katkıcıları</span>
        </figcaption>
      ) : null}
    </figure>
  );
}
