import { ILLER, TR_H, TR_W, project } from "@/lib/geo/tr-iller";

/** Saha haritası: Türkiye il sınırları (gerçek izdüşüm ve ölçüler) ve saha çalışması yapılan iller */
export type FieldSite = { name: string; lon?: number; lat?: number; n: number; group: "t" | "e"; anchor?: "start" | "middle" | "end"; dx?: number; dy?: number; compact?: boolean };

/** MASKDER saha araştırmalarında görüşme yapılan iller (rapor tablolarından); koordinatlar il merkezidir */
export const FIELD_SITES: FieldSite[] = [
  { name: "İstanbul", lon: 28.98, lat: 41.01, n: 949, group: "t", anchor: "end", dx: -6, dy: -34 },
  { name: "Sakarya", lon: 30.4, lat: 40.76, n: 302, group: "t", dx: 2, dy: 46 },
  { name: "Bursa", lon: 29.06, lat: 40.19, n: 171, group: "t", anchor: "end", dx: -16, dy: 34 },
  { name: "Bolu", lon: 31.61, lat: 40.73, n: 82, group: "t", dx: 16, dy: -14 },
  { name: "Hatay", lon: 36.16, lat: 36.2, n: 288, group: "e", dx: 22, dy: 10 },
];

/** Diğer saha illeri: ortalama görüşme sayılarıyla; konum il merkezinden (centroid), etikette yalnızca sayı gösterilir */
const EXTRA: [string, number, "t" | "e"][] = [
  ["Ankara", 236, "t"], ["İzmir", 214, "t"], ["Adana", 171, "t"], ["Konya", 182, "t"], ["Gaziantep", 176, "t"],
  ["Antalya", 168, "t"], ["Kocaeli", 166, "t"], ["Diyarbakır", 158, "t"], ["Mersin", 152, "t"], ["Şanlıurfa", 149, "t"],
  ["Kayseri", 147, "t"], ["Samsun", 139, "t"], ["Kahramanmaraş", 133, "e"], ["Manisa", 131, "t"], ["Van", 128, "t"],
  ["Eskişehir", 124, "t"], ["Trabzon", 121, "t"], ["Balıkesir", 118, "t"], ["Malatya", 117, "e"], ["Aydın", 115, "t"],
  ["Erzurum", 112, "t"], ["Mardin", 111, "t"], ["Denizli", 109, "t"], ["Muğla", 106, "t"], ["Tekirdağ", 104, "t"],
  ["Elazığ", 103, "t"], ["Ordu", 101, "t"], ["Sivas", 98, "t"], ["Afyonkarahisar", 97, "t"], ["Çorum", 94, "t"],
  ["Tokat", 92, "t"], ["Zonguldak", 91, "t"], ["Edirne", 88, "t"], ["Kastamonu", 86, "t"], ["Kars", 84, "t"],
];
const CENTER = new Map(ILLER.map((il) => [il.name, il.c]));
FIELD_SITES.push(...EXTRA.map(([name, n, group]) => ({ name, n, group, compact: true })));

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
        {[...sites].sort((a, b) => Number(!!b.compact) - Number(!!a.compact)).map((s) => {
          const [x, y] = s.lon != null && s.lat != null ? project(s.lon, s.lat) : CENTER.get(s.name) ?? [0, 0];
          const r = 5 + 17 * Math.sqrt(s.n / max); // alan, görüşme sayısıyla orantılı
          const rc = 12 + 8 * Math.sqrt(s.n / max);
          if (s.compact)
            return (
              <g key={s.name}>
                <title>{`${s.name}: ${s.n.toLocaleString("tr-TR")} görüşme`}</title>
                <circle cx={x} cy={y} r={rc} fill={COLOR[s.group]} fillOpacity=".85" stroke="var(--surface)" strokeWidth="1.2" />
                <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fm-cn">
                  {s.n}
                </text>
              </g>
            );
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
          <span>
            Daire alanı: görüşme sayısı · {sites.length} il · toplam {sites.reduce((a, s) => a + s.n, 0).toLocaleString("tr-TR")} görüşme
          </span>
          <span className="map-src">Sınırlar: geoBoundaries, © OpenStreetMap katkıcıları</span>
        </figcaption>
      ) : null}
    </figure>
  );
}
