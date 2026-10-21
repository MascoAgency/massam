import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { publicSurveys, publishedResults, publishedFindings } from "@/lib/public";
import { FindingStats, Kaynakca, sourceLine } from "@/components/FindingBlocks";
import { FindingChartCard } from "@/components/FindingCharts";
import { PageHead, ResultCard, SurveyCard, catIcon } from "@/components/PublicCards";
import { Icon } from "@/components/icons";
import { PUBLICATION_TYPES } from "@/lib/defaults";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await prisma.category.findUnique({ where: { slug: (await params).slug } });
  return c ? { title: c.name, description: c.description } : { title: "Araştırma alanı" };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const c = await prisma.category.findUnique({ where: { slug } });
  if (!c || !c.active) notFound();
  const [surveys, results, pubs, findings] = await Promise.all([
    publicSurveys({ categorySlug: slug }),
    publishedResults({ categorySlug: slug }),
    prisma.publication.findMany({ where: { published: true, categoryId: c.id }, orderBy: { publishedAt: "desc" }, take: 6 }),
    publishedFindings({ categorySlug: slug }),
  ]);
  const open = surveys.filter((s) => s.open);
  return (
    <div className="stack" style={{ gap: 36 }}>
      <PageHead eyebrow="Araştırma alanı" title={c.name} lead={c.description}>
        <span className="head-ic">
          <span style={{ width: 26, height: 26, display: "grid" }}>
            <Icon name={catIcon(c.icon)} />
          </span>
        </span>
      </PageHead>
      {c.topics.length ? (
        <section className="stack" style={{ gap: 14 }}>
          <div className="section-title">
            <h2>
              Başlıca konular<small>Bu alanda neleri araştırıyoruz?</small>
            </h2>
          </div>
          <ul className="topic-list">
            {c.topics.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {findings.map((f) => (
        <section className="stack data-story" style={{ gap: 16 }} key={f.id}>
          <div className="row between" style={{ alignItems: "flex-end" }}>
            <div className="section-title">
              <h2>
                {f.title}
                <small>Araştırma raporundan veriler</small>
              </h2>
              <p>{f.summary}</p>
            </div>
            <Link className="btn" href={`/bulgular/${f.slug}`}>
              Tüm veriler <Icon name="arrow" />
            </Link>
          </div>
          <FindingStats f={f} />
          <div className="chart-grid">
            {f.charts.slice(0, 4).map((ch) => (
              <FindingChartCard key={ch.title} c={ch} source={sourceLine(f)} compact />
            ))}
          </div>
        </section>
      ))}
      <section className="stack" style={{ gap: 14 }}>
        <div className="section-title">
          <h2>
            Katılıma açık anketler<small>Bu alanda</small>
          </h2>
        </div>
        {open.length ? (
          <div className="cards3">
            {open.map((s) => (
              <SurveyCard key={s.id} s={s} />
            ))}
          </div>
        ) : (
          <div className="card">
            <p className="muted">Bu alanda şu anda katılıma açık bir anket bulunmuyor. <Link href="/anketler">Tüm anketleri inceleyin</Link>.</p>
          </div>
        )}
      </section>
      <section className="stack" style={{ gap: 14 }}>
        <div className="section-title">
          <h2>
            Araştırma sonuçları<small>Bu alanda yayımlanan</small>
          </h2>
        </div>
        {results.length ? (
          <div className="cards3">
            {results.map((r) => (
              <ResultCard key={r.id} r={r} />
            ))}
          </div>
        ) : (
          <div className="card">
            <p className="muted">Bu alanda henüz yayımlanmış bir araştırma sonucu yok.</p>
          </div>
        )}
      </section>
      {pubs.length ? (
        <section className="stack" style={{ gap: 14 }}>
          <div className="section-title">
            <h2>
              Yayınlar<small>Bu alanda</small>
            </h2>
          </div>
          <div className="card">
            {pubs.map((p) => (
              <div className="report-row" key={p.id}>
                <span className="ic">
                  <Icon name="file" />
                </span>
                <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                  <span className="pub-type">{PUBLICATION_TYPES[p.type] || "Yayın"}</span>
                  <h3>{p.title}</h3>
                  <span className="small muted">{fmtDate(p.publishedAt || p.createdAt)}</span>
                </div>
                <div className="acts">
                  <Link className="btn sm" href={`/yayinlar/${p.slug}`}>
                    İncele
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <Kaynakca items={findings} />
    </div>
  );
}
