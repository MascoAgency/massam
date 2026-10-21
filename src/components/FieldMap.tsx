/** Saha haritası: Türkiye ana hatları (basitleştirilmiş) ve saha çalışması yapılan iller. Koordinatlar boylam / -enlem. */
const OUTLINE =
  "26,-40.1 26.6,-41 28,-41.6 29.1,-41.2 31.4,-41.2 33.3,-42 35.2,-42 36.9,-41.3 38.3,-40.9 40.1,-41 41.5,-41.5 43.4,-41.1 44.8,-39.7 44.3,-38.4 44.2,-37.2 42.3,-37.1 40.7,-37.1 38.8,-36.7 36.6,-36.9 36.2,-36 35.6,-36.6 34.6,-36.8 32.8,-36 30.6,-36.6 29.6,-36.2 28.3,-36.8 27.3,-37.4 26.3,-38.3 26.8,-39.2";

export type FieldSite = { name: string; lon: number; lat: number; n: number; group: "t" | "e"; dx?: number; dy?: number };

/** MASKDER saha araştırmalarında görüşme yapılan iller (rapor tablolarından) */
export const FIELD_SITES: FieldSite[] = [
  { name: "İstanbul", lon: 29.0, lat: 41.0, n: 949, group: "t", dx: -1.9, dy: -0.5 },
  { name: "Sakarya", lon: 30.4, lat: 40.75, n: 302, group: "t", dx: 0.1, dy: 0.62 },
  { name: "Bursa", lon: 29.06, lat: 40.18, n: 171, group: "t", dx: -1.6, dy: 0.55 },
  { name: "Bolu", lon: 31.6, lat: 40.73, n: 82, group: "t", dx: 0.3, dy: -0.25 },
  { name: "Hatay", lon: 36.2, lat: 36.25, n: 288, group: "e", dx: 0.35, dy: 0.1 },
];

export function FieldMap({ sites = FIELD_SITES, legend = true }: { sites?: FieldSite[]; legend?: boolean }) {
  const max = Math.max(...sites.map((s) => s.n));
  return (
    <div className="field-map">
      <svg viewBox="25.6 -42.4 19.6 6.9" role="img" aria-label={"Saha çalışması yapılan iller: " + sites.map((s) => `${s.name} ${s.n}`).join(", ")}>
        <polygon points={OUTLINE} fill="var(--surface-2)" stroke="var(--navy-3)" strokeWidth=".04" />
        {sites.map((s) => {
          const r = 0.08 + 0.12 * Math.sqrt(s.n / max);
          const c = s.group === "e" ? "var(--efl-2)" : "var(--tur-2)";
          return (
            <g key={s.name}>
              <circle cx={s.lon} cy={-s.lat} r={r * 2.8} fill={s.group === "e" ? "var(--efl)" : "var(--tur)"} opacity=".22" />
              <circle cx={s.lon} cy={-s.lat} r={r} fill={c} />
              <text x={s.lon + (s.dx ?? 0.2)} y={-s.lat + (s.dy ?? -0.3)} fontSize=".25" fontWeight="600" fill="var(--head)" style={{ fontFamily: "var(--f-mono)" }}>
                {s.name.toLocaleUpperCase("tr-TR")} {s.n.toLocaleString("tr-TR")}
              </text>
            </g>
          );
        })}
      </svg>
      {legend ? (
        <div className="map-leg">
          <span>
            <i style={{ background: "var(--tur-2)" }} />
            Yerel yönetimler saha çalışması
          </span>
          <span>
            <i style={{ background: "var(--efl-2)" }} />
            Afet saha araştırması
          </span>
          <span>Daire büyüklüğü: görüşme sayısı</span>
        </div>
      ) : null}
    </div>
  );
}
