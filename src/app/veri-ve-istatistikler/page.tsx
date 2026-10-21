import Link from "next/link";
import { prisma } from "@/lib/db";
import { highlightQuestions, dailyParticipation, publishedFindings } from "@/lib/public";
import { FindingStats, Kaynakca, sourceLine } from "@/components/FindingBlocks";
import { FindingChartCard } from "@/components/FindingCharts";
import { fmtN, fmtDate } from "@/lib/format";
import { PageHead } from "@/components/PublicCards";
import { QuestionChart, ParticipationChart, AgreeCompare } from "@/components/PublicCharts";
import { Icon } from "@/components/icons";
import type { ReportSnapshot } from "@/lib/report/types";

export const metadata = { title: "Veri ve İstatistikler" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const reports = await prisma.report.findMany({
    where: { published: true, slug: { not: null } },
    orderBy: { publishedAt: "desc" },
    take: 6,
    include: { survey: { select: { id: true, title: true, category: { select: { name: true } } } } },
  });
  const [resultCount, openSurveys, catCount, findings] = await Promise.all([
    prisma.report.count({ where: { published: true } }),
    prisma.survey.count({ where: { isPlatform: true, status: "open", archived: false } }),
    prisma.category.count({ where: { active: true } }),
    publishedFindings(),
  ]);
  const participants = reports.reduce((a, r) => a + r.n, 0);
  const blocks = reports.map((r) => ({ r, qs: highlightQuestions(r.snapshot as unknown as ReportSnapshot, r.highlights) }));
  const agree = blocks
    .flatMap((b) => b.qs.filter((q) => q.type === "likert" && q.agree != null).map((q) => ({ label: q.title, agree: q.agree! })))
    .slice(0, 8);
  const trend = reports[0] ? await dailyParticipation(reports[0].survey.id) : [];

  return (
    <div className="stack" style={{ gap: 32 }}>
      <PageHead
        eyebrow="Veri ve İstatistikler"
        title="Veri ve istatistikler"
        lead="Yayımlanan araştırmalarımızdan seçilmiş bulgular. Grafikler yalnızca toplu sonuçları gösterir; her bulgunun yöntemi ve sınırlılıkları ilgili sonuç sayfasında açıklanır."
      />
      <div className="kv-grid">
        <div className="kv-item">
          <span>Yayımlanan araştırma</span>
          <b style={{ fontSize: "1.6rem" }}>{fmtN(resultCount + new Set(findings.map((f) => f.sourceTitle)).size)}</b>
        </div>
        <div className="kv-item">
          <span>Katılımcı (son araştırmalar)</span>
          <b style={{ fontSize: "1.6rem" }}>{fmtN(participants)}</b>
        </div>
        <div className="kv-item">
          <span>Katılıma açık anket</span>
          <b style={{ fontSize: "1.6rem" }}>{fmtN(openSurveys)}</b>
        </div>
        <div className="kv-item">
          <span>Araştırma alanı</span>
          <b style={{ fontSize: "1.6rem" }}>{fmtN(catCount)}</b>
        </div>
      </div>

      {findings.length ? (
        <section className="stack" style={{ gap: 28 }}>
          <div className="section-title">
            <h2>
              Araştırma raporlarından veriler<small>MASKDER saha araştırmaları</small>
            </h2>
            <p>Yüz yüze anket ve saha çalışmalarıyla hazırlanan raporlarımızdan seçilmiş göstergeler. Ayrıntılı bulgular ve yöntem bilgisi için ilgili raporu inceleyebilirsiniz.</p>
          </div>
          {findings.map((f) => (
            <article className="data-story stack" style={{ gap: 16 }} key={f.id}>
              <div className="row between" style={{ alignItems: "flex-end" }}>
                <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                  <span className="small muted">{f.category ? f.category.name : "Rapor verisi"}</span>
                  <h3 style={{ fontSize: "1.25rem" }}>{f.title}</h3>
                </div>
                <Link className="btn sm" href={`/bulgular/${f.slug}`}>
                  Tüm veriler <Icon name="arrow" />
                </Link>
              </div>
              <FindingStats f={f} />
              <div className="chart-grid">
                {f.charts.slice(0, 2).map((c) => (
                  <FindingChartCard key={c.title} c={c} source={sourceLine(f)} compact />
                ))}
              </div>
            </article>
          ))}
          <Kaynakca items={findings} />
        </section>
      ) : null}
      {blocks.length ? (
        <>
          {agree.length >= 2 || trend.length > 1 ? (
            <div className="chart-grid">
              {agree.length >= 2 ? <AgreeCompare items={agree} /> : null}
              {trend.length > 1 ? <ParticipationChart data={trend} title={reports[0].survey.title} /> : null}
            </div>
          ) : null}
          {blocks.map(({ r, qs }) => (
            <section className="stack" style={{ gap: 14 }} key={r.id}>
              <div className="row between">
                <div className="stack" style={{ gap: 2 }}>
                  <span className="small muted">
                    {r.survey.category?.name ? r.survey.category.name + " · " : ""}
                    {fmtDate(r.publishedAt || r.createdAt)} · n = {fmtN(r.n)}
                  </span>
                  <h2 style={{ fontSize: "1.25rem" }}>{r.survey.title}</h2>
                </div>
                <Link className="btn sm" href={`/arastirma-sonuclari/${r.slug}`}>
                  Sonuç sayfası <Icon name="arrow" />
                </Link>
              </div>
              <div className="chart-grid">
                {qs.map((q) => (
                  <QuestionChart key={q.id} q={q} compact />
                ))}
              </div>
            </section>
          ))}
          <p className="small muted">
            Gönüllü katılıma dayalı çevrim içi anket sonuçları, temsil gücü kanıtlanmadıkça Türkiye genelini temsil etmez; yalnızca katılımcıların görüşlerini yansıtır.
          </p>
        </>
      ) : findings.length ? null : (
        <div className="card empty">
          <h2>Henüz yayımlanmış veri yok</h2>
          <p>Araştırma sonuçları yayımlandıkça seçilmiş bulgular grafiklerle bu sayfada yer alacak.</p>
          <Link className="btn primary" href="/anketler">
            Aktif anketlere katılın
          </Link>
        </div>
      )}
    </div>
  );
}
