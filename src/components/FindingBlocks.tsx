import Link from "next/link";
import { Icon } from "./icons";
import { catIcon } from "./PublicCards";
import { citation, type PublicFinding } from "@/lib/findings";

/** Büyük rakamlı özet kutucukları */
export function FindingStats({ f }: { f: PublicFinding }) {
  if (!f.stats.length) return null;
  return (
    <div className="stat-tiles">
      {f.stats.map((s) => (
        <div className="stat-tile" key={s.label}>
          <b>{s.value}</b>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Liste kartı */
export function FindingCard({ f }: { f: PublicFinding }) {
  return (
    <article className="card stack finding-card" style={{ gap: 12 }}>
      <div className="row between" style={{ gap: 8 }}>
        {f.category ? (
          <Link className="cat-link row" style={{ gap: 6 }} href={`/arastirma-alanlari/${f.category.slug}`}>
            <span style={{ width: 16, height: 16, display: "inline-grid" }}>
              <Icon name={catIcon(f.category.icon)} />
            </span>
            {f.category.name}
          </Link>
        ) : (
          <span />
        )}
        <span className="pill plain">Rapor verisi</span>
      </div>
      <h3>{f.title}</h3>
      <p className="small muted">{f.summary.slice(0, 220)}</p>
      {f.stats.length ? (
        <div className="mini-stats">
          {f.stats.slice(0, 2).map((s) => (
            <div key={s.label}>
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="stack" style={{ gap: 10, marginTop: "auto" }}>
        <span className="small muted">
          Kaynak: MASKDER, <i>{f.sourceTitle}</i>
          {f.sourceYear ? ` (${f.sourceYear})` : ""}
        </span>
        <Link className="btn sm" href={`/bulgular/${f.slug}`} style={{ alignSelf: "flex-start" }}>
          Verileri incele <Icon name="arrow" />
        </Link>
      </div>
    </article>
  );
}

/** Kaynakça: rapor adıyla MASKDER'e atıf (aynı rapor bir kez listelenir) */
export function Kaynakca({ items, title = "Kaynakça" }: { items: PublicFinding[]; title?: string }) {
  const seen = new Set<string>();
  const list = items.filter((f) => f.sourceTitle && !seen.has(f.sourceTitle) && seen.add(f.sourceTitle));
  if (!list.length) return null;
  return (
    <section className="card kaynakca" aria-labelledby="kaynakca-baslik">
      <h2 id="kaynakca-baslik">{title}</h2>
      <ol>
        {list.map((f) => {
          const c = citation(f);
          return (
            <li key={f.sourceTitle}>
              {c.lead} <i>{c.title}</i>. {c.tail}
              {f.sourceUrl ? (
                <>
                  {" "}
                  <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer">
                    Raporu görüntüle
                  </a>
                </>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="small muted">Bu sayfadaki veriler, MASKDER tarafından yayımlanan araştırma raporlarından derlenmiştir. Verilerin alıntılanmasında ilgili rapora kaynak gösterilmesi rica olunur.</p>
    </section>
  );
}

export const sourceLine = (f: PublicFinding) => `MASKDER, ${f.sourceTitle}${f.sourceYear ? ` (${f.sourceYear})` : ""}`;
