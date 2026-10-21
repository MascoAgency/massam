import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findingBySlug, publishedFindings } from "@/lib/public";
import { RichText } from "@/components/RichText";
import { Icon } from "@/components/icons";
import { FindingCard, FindingStats, Kaynakca, sourceLine } from "@/components/FindingBlocks";
import { FindingChartCard } from "@/components/FindingCharts";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = await findingBySlug((await params).slug);
  return f ? { title: f.title, description: f.summary.slice(0, 200) } : { title: "Rapor verisi" };
}

export default async function Page({ params }: Props) {
  const f = await findingBySlug((await params).slug);
  if (!f) notFound();
  const all = await publishedFindings();
  const others = all.filter((x) => x.id !== f.id).slice(0, 3);
  const code = `BRF-${String(Math.max(1, all.findIndex((x) => x.id === f.id) + 1)).padStart(2, "0")}`;
  const src = sourceLine(f);
  const judgements = f.charts.filter((c) => c.insight).slice(0, 5);
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="mono small muted" style={{ fontSize: ".66rem", letterSpacing: ".1em" }}>
        <Link href="/bulgular" style={{ color: "inherit" }}>
          RAPOR VERİLERİ
        </Link>{" "}
        / {code}
      </div>
      <div className="brief">
        <aside>
          <nav className="brief-nav" aria-label="Sayfa içi">
            <a href="#ozet">Yönetici özeti</a>
            {judgements.length ? <a href="#degerlendirmeler">Temel değerlendirmeler</a> : null}
            {f.method ? <a href="#yontem">Yöntem</a> : null}
            <a href="#veriler">Öne çıkan veriler</a>
            {f.body ? <a href="#degerlendirme">Değerlendirme</a> : null}
            <a href="#kaynakca-baslik">Kaynakça</a>
          </nav>
          <div className="card brief-file">
            <span className="eyebrow">Dosya</span>
            <dl>
              <dt>KOD</dt>
              <dd className="mono">{code}</dd>
              {f.category ? (
                <>
                  <dt>MASA</dt>
                  <dd>{f.category.name}</dd>
                </>
              ) : null}
              <dt>GRAFİK</dt>
              <dd>{f.charts.length}</dd>
              {f.sourceYear ? (
                <>
                  <dt>YIL</dt>
                  <dd>{f.sourceYear}</dd>
                </>
              ) : null}
            </dl>
            {f.sourceUrl ? (
              <a className="btn sm" href={f.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop: 12 }}>
                <Icon name="file" /> Raporu aç
              </a>
            ) : null}
          </div>
        </aside>

        <div className="stack" style={{ gap: 20, minWidth: 0 }}>
          <header className="card bhead" style={{ borderTop: "3px solid var(--tur)" }}>
            <div className="stack" style={{ gap: 8 }}>
              <span className="eyebrow">
                {f.category ? f.category.name : "Rapor verisi"} · {code}
              </span>
              <h1 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)" }}>{f.title}</h1>
              <div className="meta-row">
                {f.sourceYear ? (
                  <span>
                    Yıl <b>{f.sourceYear}</b>
                  </span>
                ) : null}
                {f.sourceSeries ? (
                  <span>
                    Dizi <b>{f.sourceSeries}</b>
                  </span>
                ) : null}
                <span>
                  Grafik <b>{f.charts.length}</b>
                </span>
                <span>
                  Durum <b style={{ color: "var(--tur-3)" }}>Yayın onaylı</b>
                </span>
              </div>
            </div>
            <svg className="seal" width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
              <circle cx="44" cy="44" r="40" fill="none" stroke="var(--efl-2)" strokeWidth="2" />
              <circle cx="44" cy="44" r="33" fill="none" stroke="var(--efl-2)" strokeWidth="1" />
              <text x="44" y="39" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--efl-2)" style={{ fontFamily: "var(--f-mono)" }}>
                MASSAM
              </text>
              <text x="44" y="51" textAnchor="middle" fontSize="7.5" fill="var(--efl-2)" style={{ fontFamily: "var(--f-mono)" }}>
                YAYIN
              </text>
              <text x="44" y="61" textAnchor="middle" fontSize="7.5" fill="var(--efl-2)" style={{ fontFamily: "var(--f-mono)" }}>
                ONAYLI
              </text>
            </svg>
          </header>

          <section className="card exec" id="ozet">
            <span className="eyebrow">Yönetici özeti</span>
            <p>{f.summary}</p>
          </section>

          <FindingStats f={f} />

          {judgements.length ? (
            <section className="card" id="degerlendirmeler">
              <span className="eyebrow">Temel değerlendirmeler</span>
              <h2 style={{ fontSize: "1.1rem", margin: "2px 0 6px" }}>Verilerden çıkan sonuçlar</h2>
              <ol className="judg">
                {judgements.map((c) => (
                  <li key={c.title}>
                    <span>
                      {c.insight}
                      <small>{c.title}</small>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {f.method ? (
            <div className="method-note" id="yontem">
              <span className="ic">
                <Icon name="info" />
              </span>
              <div className="stack" style={{ gap: 4 }}>
                <b>Yöntem ve örneklem</b>
                <p className="small">{f.method}</p>
              </div>
            </div>
          ) : null}

          {f.charts.length ? (
            <section className="stack" style={{ gap: 14 }} id="veriler">
              <div className="section-title">
                <h2>
                  Öne çıkan veriler<small>{f.charts.length} grafik</small>
                </h2>
              </div>
              <div className="chart-grid">
                {f.charts.map((c) => (
                  <FindingChartCard key={c.title} c={c} source={src} />
                ))}
              </div>
            </section>
          ) : null}

          {f.body ? (
            <section className="card stack" style={{ gap: 10 }} id="degerlendirme">
              <span className="eyebrow">Değerlendirme</span>
              <RichText text={f.body} />
            </section>
          ) : null}

          <Kaynakca items={[f]} />
        </div>
      </div>

      {others.length ? (
        <section className="stack" style={{ gap: 16 }}>
          <div className="row between" style={{ alignItems: "flex-end" }}>
            <div className="section-title">
              <h2>
                Diğer brifingler<small>MASKDER araştırmaları</small>
              </h2>
            </div>
            <Link className="btn" href="/bulgular">
              Tümü <Icon name="arrow" />
            </Link>
          </div>
          <div className="cards3">
            {others.map((x) => (
              <FindingCard key={x.id} f={x} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
