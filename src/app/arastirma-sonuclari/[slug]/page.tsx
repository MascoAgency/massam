import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { chartQuestions, publishedResults } from "@/lib/public";
import { DEFAULT_LIMITATIONS } from "@/lib/defaults";
import { fmtDate, fmtN } from "@/lib/format";
import { paragraphs } from "@/lib/site";
import { Icon } from "@/components/icons";
import { PageHead, ResultCard } from "@/components/PublicCards";
import { QuestionChart } from "@/components/PublicCharts";
import type { ReportSnapshot } from "@/lib/report/types";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  return prisma.report.findFirst({
    where: { slug, published: true },
    include: { survey: { select: { title: true, description: true, purpose: true, targetGroup: true, category: { select: { name: true, slug: true } } } } },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await load((await params).slug);
  return r ? { title: r.survey.title + " · Sonuçlar", description: (r.summary || r.survey.description).slice(0, 160) } : { title: "Sonuç bulunamadı" };
}

export default async function Page({ params }: Props) {
  const r = await load((await params).slug);
  if (!r) notFound();
  const snap = r.snapshot as unknown as ReportSnapshot;
  const a = snap.analysis;
  const charts = chartQuestions(snap);
  const qTitle = (id: string) => snap.survey.questions.find((q) => q.id === id)?.title;
  const findings = (a.bulgular || []).filter((b) => qTitle(b.soruId));
  const related = (await publishedResults({ categorySlug: r.survey.category?.slug, take: 4 })).filter((x) => x.id !== r.id).slice(0, 3);
  const limitations = [r.limitations || DEFAULT_LIMITATIONS, ...(a.sinirliliklar || [])].filter(Boolean);
  const evaluation = r.evaluation || a.sonuc;
  const dateRange = `${fmtDate(snap.stats.first)} – ${fmtDate(snap.stats.last)}`;

  return (
    <div className="stack" style={{ gap: 32 }}>
      <PageHead eyebrow={r.survey.category?.name || "Araştırma sonucu"} title={r.survey.title} lead={r.summary || undefined}>
        <a className="btn primary" href={`/api/public/reports/${r.id}?indir=1`}>
          <Icon name="dl" /> Raporu indir (PDF)
        </a>
      </PageHead>

      <div className="kv-grid">
        <div className="kv-item">
          <span>Veri toplama tarihi</span>
          <b>{dateRange}</b>
        </div>
        <div className="kv-item">
          <span>Örneklem büyüklüğü</span>
          <b>{fmtN(snap.stats.n)} katılımcı</b>
        </div>
        <div className="kv-item">
          <span>Veri toplama yöntemi</span>
          <b>Çevrim içi anket</b>
        </div>
        <div className="kv-item">
          <span>Yayın tarihi</span>
          <b>{fmtDate(r.publishedAt || r.createdAt)}</b>
        </div>
      </div>

      <div className="split" style={{ alignItems: "start" }}>
        <div className="prose">
          <h2>Araştırmanın amacı</h2>
          {paragraphs(r.survey.purpose || r.survey.description || "").map((t, i) => (
            <p key={i}>{t}</p>
          ))}
          {r.scope || r.survey.targetGroup ? (
            <>
              <h2>Hedef kitle ve kapsam</h2>
              {paragraphs(r.scope || r.survey.targetGroup).map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </>
          ) : null}
          <h2>Araştırma özeti</h2>
          <p>{a.ozet}</p>
        </div>
        <div className="method-box">
          <h3>
            <span style={{ width: 20, height: 20, display: "inline-grid", color: "var(--warn)" }}>
              <Icon name="info" />
            </span>
            Yöntem ve sınırlılıklar
          </h3>
          {paragraphs(r.method || "Veriler, MASSAM Araştırma platformu üzerinden yürütülen çevrim içi anketle, gönüllü katılım esasına göre toplanmıştır. Katılımcılar anketin paylaşım bağlantısı veya QR kodu aracılığıyla, e-posta adresi doğrulanmış üyelikle ve her üye bir kez olmak üzere yanıt vermiştir; yanıtlar üyelik bilgileriyle eşleştirilmeden saklanmıştır.").map((t, i) => (
            <p className="small" key={i}>
              {t}
            </p>
          ))}
          {limitations.map((t, i) => (
            <p className="small" key={"l" + i}>
              {t}
            </p>
          ))}
        </div>
      </div>

      {findings.length || a.onemliNoktalar?.length ? (
        <section className="stack" style={{ gap: 14 }}>
          <div className="section-title">
            <h2>
              Temel bulgular<small>Öne çıkanlar</small>
            </h2>
          </div>
          <div className="card stack" style={{ gap: 12 }}>
            {a.onemliNoktalar?.length ? (
              <ul className="stack" style={{ gap: 8, margin: 0, paddingLeft: 20 }}>
                {a.onemliNoktalar.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            ) : null}
            {findings.length ? (
              <ul className="stack" style={{ gap: 8, margin: 0, paddingLeft: 20 }}>
                {findings.map((b, i) => (
                  <li key={i}>
                    <b>{qTitle(b.soruId)}</b> — {b.yorum}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      {charts.length ? (
        <section className="stack" style={{ gap: 14 }}>
          <div className="section-title">
            <h2>
              Grafikler<small>Soru bazlı dağılımlar</small>
            </h2>
            <p>Grafikler yalnızca toplu sonuçları gösterir; tek tek yanıtlar yayımlanmaz.</p>
          </div>
          {charts.map((q) => (
            <QuestionChart key={q.id} q={q} />
          ))}
        </section>
      ) : null}

      {a.acikUclu?.length ? (
        <section className="stack" style={{ gap: 14 }}>
          <div className="section-title">
            <h2>
              Açık uçlu görüşler<small>Öne çıkan temalar</small>
            </h2>
          </div>
          <div className="cards3">
            {a.acikUclu.map((o, i) => (
              <div className="card stack" style={{ gap: 8 }} key={i}>
                <h3>{qTitle(o.soruId) || "Açık uçlu soru"}</h3>
                {(o.temalar || []).map((t, j) => (
                  <div className="theme-row" key={j}>
                    <div>
                      <b>{t.tema}</b>
                      <div className="small muted">{t.aciklama}</div>
                    </div>
                    <span className="small">{t.oran}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {evaluation || a.oneriler?.length ? (
        <section className="stack" style={{ gap: 14 }}>
          <div className="section-title">
            <h2>
              Değerlendirme<small>Sonuç ve öneriler</small>
            </h2>
          </div>
          <div className="prose">
            {paragraphs(evaluation || "").map((t, i) => (
              <p key={i}>{t}</p>
            ))}
            {a.oneriler?.length ? (
              <ul>
                {a.oneriler.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="cta-band">
        <div className="stack" style={{ gap: 6 }}>
          <h2 style={{ fontSize: "1.3rem" }}>Raporun tamamı</h2>
          <p className="muted">Yöntem, soru bazlı bulgular, grafikler, sonuç ve öneriler içeren raporu indirebilirsiniz.</p>
        </div>
        <div className="row">
          <a className="btn" href={`/api/public/reports/${r.id}`} target="_blank" rel="noopener">
            <Icon name="eye" /> Çevrim içi oku
          </a>
          <a className="btn primary" href={`/api/public/reports/${r.id}?indir=1`}>
            <Icon name="dl" /> PDF indir
          </a>
        </div>
      </section>

      {related.length ? (
        <section className="stack" style={{ gap: 14 }}>
          <div className="section-title">
            <h2>
              İlgili araştırmalar<small>Aynı alanda</small>
            </h2>
          </div>
          <div className="cards3">
            {related.map((x) => (
              <ResultCard key={x.id} r={x} />
            ))}
          </div>
        </section>
      ) : (
        <p className="small muted">
          Diğer araştırmalar için <Link href="/arastirma-sonuclari">Araştırma Sonuçları</Link> sayfasına göz atın.
        </p>
      )}
    </div>
  );
}
