import Link from "next/link";
import { prisma } from "@/lib/db";
import { getHome } from "@/lib/site";
import { activeCategories, publicSurveys, publishedResults, highlightQuestions, publishedNews, publishedFindings } from "@/lib/public";
import { PUBLICATION_TYPES } from "@/lib/defaults";
import { fmtDate, fmtN } from "@/lib/format";
import { Icon } from "@/components/icons";
import { NewsCard, ResultCard, catIcon } from "@/components/PublicCards";
import type { HomeSection } from "@/lib/types";
import { QuestionChart } from "@/components/PublicCharts";
import { VolunteerForm } from "@/components/VolunteerForm";
import type { ReportSnapshot } from "@/lib/report/types";
import { FindingCard, sourceLine } from "@/components/FindingBlocks";
import { FindingChartCard, FindingShowcase } from "@/components/FindingCharts";
import { FieldMap } from "@/components/FieldMap";
import { HeadlineSlider, type Headline } from "@/components/HeadlineSlider";

export const dynamic = "force-dynamic";

const pctNum = (v: string) => {
  const m = /^%\s?([\d.,]+)/.exec(v.trim());
  return m ? Math.min(100, parseFloat(m[1].replace(/\./g, "").replace(",", "."))) : null;
};

export default async function Home() {
  const [h, cats, surveys, results, agendaResults, agendaPubs, latestReport, featuredNews, latestNews, allFindings, pubs] = await Promise.all([
    getHome(),
    activeCategories(),
    publicSurveys(),
    publishedResults({ take: 3 }),
    publishedResults({ agenda: true, take: 4 }),
    prisma.publication.findMany({ where: { published: true, agenda: true }, orderBy: { publishedAt: "desc" }, take: 4 }),
    prisma.report.findFirst({ where: { published: true, slug: { not: null } }, orderBy: { publishedAt: "desc" }, include: { survey: { select: { title: true } } } }),
    publishedNews({ featured: true, take: 3 }),
    publishedNews({ take: 4 }),
    publishedFindings(),
    prisma.publication.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: 4, select: { title: true, slug: true, publishedAt: true, createdAt: true } }),
  ]);
  const findings = allFindings.some((f) => f.featured) ? allFindings.filter((f) => f.featured) : allFindings;
  const show = (k: HomeSection) => !(h.hidden || []).includes(k);
  const news = featuredNews.length ? featuredNews : latestNews.slice(0, 3);
  const heroImg = h.heroImageId ? await prisma.media.findUnique({ where: { id: h.heroImageId }, select: { id: true, alt: true } }) : null;
  const open = surveys.filter((s) => s.open);
  const soon = surveys.filter((s) => !s.open && s.statusLabel === "Yakında");
  const ops = [...(h.featured.length ? open.filter((s) => h.featured.includes(s.id)) : []), ...open.filter((s) => !h.featured.includes(s.id)), ...soon].slice(0, 8);
  const dataCharts = latestReport ? highlightQuestions(latestReport.snapshot as unknown as ReportSnapshot, latestReport.highlights).slice(0, 2) : [];
  const findingCharts = findings.flatMap((f) => (f.charts[1] ? [{ f, c: f.charts[1] }] : [])).slice(0, 2);
  const featuredResearch = findings.slice(0, Math.max(0, 3 - results.length));

  // Brifing akışı: her rapor verisinden öne çıkan oran
  const tone = (i: number) => (["", "e", "n"] as const)[i % 3];
  const feed = findings.slice(0, 4).map((f, i) => {
    const s = f.stats.find((x) => pctNum(x.value) != null) || f.stats[0];
    return { key: f.id, code: `BRF-${String(i + 1).padStart(2, "0")}`, cat: f.category?.name || "Rapor verisi", year: f.sourceYear, value: s?.value, label: s?.label || f.summary, href: `/bulgular/${f.slug}`, tone: tone(i) };
  });
  // Gösterge şeridi: raporlardaki yüzdeli rakamlar, raporlar arasında sırayla
  const pool = findings.map((f) => f.stats.filter((s) => pctNum(s.value) != null).map((s) => ({ ...s, src: f.category?.name || f.title })));
  const kpis: { value: string; label: string; src: string }[] = [];
  for (let k = 0; kpis.length < 4 && k < 6; k++) pool.forEach((p) => p[k] && kpis.length < 4 && kpis.push(p[k]));
  const gaugeSrc = findings.find((f) => f.charts.some((c) => c.kind === "pie"));
  const gaugeChart = gaugeSrc?.charts.find((c) => c.kind === "pie");

  // Yayın akışı: haber, sonuç ve yayınlar tarih sırasıyla
  const stream = [
    ...latestNews.map((n) => ({ key: "n" + n.id, t: n.publishedAt, title: n.title, href: `/haberler/${n.slug}`, tone: "" })),
    ...agendaResults.map((r) => ({ key: "r" + r.id, t: r.publishedAt, title: r.title, href: `/arastirma-sonuclari/${r.slug}`, tone: "e" })),
    ...pubs.map((p) => ({ key: "p" + p.slug, t: (p.publishedAt || p.createdAt).getTime(), title: p.title, href: `/yayinlar/${p.slug}`, tone: "k" })),
  ]
    .sort((a, b) => b.t - a.t)
    .slice(0, 5);
  const agenda = [
    ...agendaResults.map((r) => ({ key: "r" + r.id, kind: "Araştırma sonucu", title: r.title, text: r.summary, date: r.publishedAt, href: `/arastirma-sonuclari/${r.slug}` })),
    ...agendaPubs.map((p) => ({ key: "p" + p.id, kind: PUBLICATION_TYPES[p.type] || "Yayın", title: p.title, text: p.summary, date: (p.publishedAt || p.createdAt).getTime(), href: `/yayinlar/${p.slug}` })),
  ]
    .sort((a, b) => b.date - a.date)
    .slice(0, 4);
  const findingCount = new Map<string, number>();
  allFindings.forEach((f) => f.category && findingCount.set(f.category.slug, (findingCount.get(f.category.slug) || 0) + f.charts.length));
  const surveyCount = new Map<string, number>();
  open.forEach((s) => s.category && surveyCount.set(s.category.slug, (surveyCount.get(s.category.slug) || 0) + 1));
  // Manşet bandı: ilk haber platformun tanıtımı, ardından rapor verilerinden haberleştirilmiş bulgular (raporlar arasında sırayla)
  const headlines: Headline[] = [
    {
      key: "intro",
      intro: true,
      kicker: "MASSAM Araştırma Platformu",
      title: "MASSAM Araştırma Platformu yayında: anketlere anonim katılın, bulguları birlikte izleyin",
      text: "Saha araştırmalarımızın bulguları, katılıma açık anketler ve raporlar artık tek yerde. Kimlik bilgisi tutulmadan katılım; her veri yöntemi ve kaynağıyla birlikte.",
      value: null,
      href: "/hakkimizda",
      source: "Milli, Adalet, Siyaset ve Strateji Araştırmaları Merkezi",
      tone: "n",
    },
  ];
  const queues = findings.map((f, fi) => f.charts.filter((c) => c.insight).map((c) => ({ f, c, tone: (["t", "e", "n"] as const)[fi % 3] })));
  for (let k = 0; headlines.length < 8 && queues.some((q) => q[k]); k++)
    queues.forEach((q) => {
      const x = q[k];
      if (!x || headlines.length >= 8) return;
      const m = /^(.+?[.:])\s+(.+)$/.exec(x.c.insight);
      const title = m && m[1].length > 30 ? m[1].replace(/[:]$/, "") : x.c.insight;
      // Halka göstergesi yalnızca manşetteki oranı gösterir; manşette oran yoksa logo görünür
      const pm = /%\s?(\d+(?:,\d+)?)/.exec(title);
      headlines.push({
        key: x.f.id + k,
        kicker: `${x.f.category?.name || "Rapor verisi"} · ${x.c.title}`,
        title,
        text: m && m[1].length > 30 ? m[2] : x.c.question,
        value: pm ? parseFloat(pm[1].replace(",", ".")) : null,
        href: `/bulgular/${x.f.slug}`,
        source: `Kaynak: MASKDER, ${x.f.sourceTitle}${x.f.sourceYear ? ` (${x.f.sourceYear})` : ""}`,
        tone: x.tone,
      });
    });
  // Aktif araştırmalar bandı: yayındaki tüm platform anketleri (öne çıkarılanlar önce)
  const liveSlides: Headline[] = ops
    .filter((x) => x.open)
    .map((x, k) => ({
      key: "live-" + x.id,
      label: "AKTİF ARAŞTIRMA",
      kicker: x.category?.name || "MASSAM Araştırma",
      title: x.title,
      text: x.description.length > 240 ? x.description.slice(0, 237) + "…" : x.description,
      value: null,
      stat: { big: `~${x.minutes} dk`, small: `${x.questions} soru · anonim` },
      href: `/anketler/${x.slug}`,
      cta: "Ankete katıl",
      source: x.endsAt ? `Son katılım: ${fmtDate(x.endsAt)}` : "Katılıma açık · hesap gerekmez",
      tone: (["t", "e", "n"] as const)[k % 3],
    }));
  const ci = h.heroTitle.indexOf(",");
  const t1 = ci > 0 ? h.heroTitle.slice(0, ci + 1) : "";
  const t2 = ci > 0 ? h.heroTitle.slice(ci + 1).trim() : h.heroTitle;

  return (
    <div className="stack" style={{ gap: 40 }}>
      {/* Manşet bandı */}
      {headlines.length > 1 ? <HeadlineSlider items={headlines} /> : null}

      {/* 6.2 Açılış alanı: durum odası */}
      <section className="ops-hero">
        <div className="stack" style={{ gap: 0 }}>
          <span className="eyebrow">Durum raporu · {findings[0]?.category?.name || "MASSAM Araştırma"}</span>
          <h1>
            {t1} <span className="t">{t2}</span>
          </h1>
          <p className="lead">{h.heroText}</p>
          <div className="row" style={{ gap: 8, marginBottom: 16 }}>
            <Link className="btn signal" href="/anketler">
              Anketlere katıl <Icon name="arrow" />
            </Link>
            <Link className="btn primary" href="/arastirma-sonuclari">
              Araştırma sonuçları
            </Link>
            <Link className="btn" href="/veri-ve-istatistikler">
              Veri ve istatistikler
            </Link>
          </div>
          {heroImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="hero-img" src={`/medya/${heroImg.id}`} alt={heroImg.alt} />
          ) : (
            <FieldMap />
          )}
        </div>
        <div className="stack" style={{ gap: 12 }}>
          {feed.length ? (
            <div className="card">
              <div className="row between" style={{ marginBottom: 10 }}>
                <div>
                  <span className="eyebrow">Brifing akışı</span>
                  <h2 style={{ fontSize: "1.05rem", marginTop: 2 }}>Sahadan son bulgular</h2>
                </div>
                <Link className="btn sm" href="/bulgular">
                  Tümü
                </Link>
              </div>
              <div className="feed">
                {feed.map((x) => (
                  <Link className={"it " + x.tone} href={x.href} key={x.key}>
                    <div className="h">
                      <span>
                        {x.code} · {x.cat}
                      </span>
                      <span>{x.year || ""}</span>
                    </div>
                    <p>
                      {x.value ? <b>{x.value}</b> : null} {x.label}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="card">
              <span className="eyebrow">Platform</span>
              <p className="small muted" style={{ marginTop: 6 }}>
                Anketlerimize hesap açmadan, anonim olarak katılabilirsiniz. Sonuçlar yayın onayı verildikten sonra herkese açık olarak paylaşılır.
              </p>
            </div>
          )}
          {gaugeSrc && gaugeChart ? <FindingChartCard c={gaugeChart} source={sourceLine(gaugeSrc)} compact /> : null}
        </div>
      </section>

      {kpis.length ? (
        <div className="kpi-strip">
          {kpis.map((k, i) => (
            <div className={"kpi " + (["", "e", "n", ""][i] || "")} key={k.label}>
              <span>{k.label}</span>
              <b>{k.value}</b>
              <small>{k.src}</small>
              <div className="lv">
                <i style={{ width: `${pctNum(k.value) ?? 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {h.announcement ? (
        <div className="announce">
          <span className="pill accent">Duyuru</span>
          <span>{h.announcement}</span>
        </div>
      ) : null}

      {/* 6.3 Aktif araştırmalar bandı */}
      {show("surveys") && liveSlides.length ? (
        <section className="stack" style={{ gap: 12 }}>
          <div className="live-head">
            <div className="section-title" style={{ borderBottom: 0, paddingBottom: 0 }}>
              <h2>
                Aktif araştırmalar
                <small>
                  <span className="live-dot" aria-hidden="true" />
                  Şu anda sahada · {liveSlides.length} anket
                </small>
              </h2>
            </div>
            <Link className="btn" href="/anketler">
              Tüm anketler <Icon name="arrow" />
            </Link>
          </div>
          <HeadlineSlider items={liveSlides} label="Aktif araştırmalar" variant="live" />
        </section>
      ) : null}

      {/* Aktif anketler listesi ve yayın akışı */}
      {show("surveys") ? (
        <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", alignItems: "start" }}>
          <div className="card">
            <div className="row between" style={{ marginBottom: 6 }}>
              <div>
                <span className="eyebrow">Aktif operasyonlar</span>
                <h2 style={{ fontSize: "1.15rem", marginTop: 2 }}>Katılıma açık anketler</h2>
              </div>
              <Link className="btn sm" href="/anketler">
                Tüm anketler
              </Link>
            </div>
            {ops.length ? (
              <div className="ops-list">
                {ops.slice(0, 4).map((s, i) => (
                  <div className="op" key={s.id}>
                    <span className="id">
                      ANK
                      <br />
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <h3>{s.title}</h3>
                      <div className="meta">
                        {s.category ? s.category.name + " · " : ""}~{s.minutes} dk · anonim
                        {s.endsAt ? " · " + fmtDate(s.endsAt) + " kapanır" : ""}
                      </div>
                    </div>
                    {s.open ? (
                      <Link className="btn signal sm" href={`/anketler/${s.slug}`}>
                        Katıl
                      </Link>
                    ) : (
                      <span className="pill draft">Yakında</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="small muted" style={{ marginTop: 8 }}>
                Şu anda katılıma açık anket bulunmuyor. <Link href="/katil#topluluk">Araştırma topluluğumuza katılın</Link>; yeni anketler başladığında size haber verelim.
              </p>
            )}
          </div>
          <div className="card">
            <span className="eyebrow" style={{ color: "var(--efl-2)" }}>
              Yayın akışı
            </span>
            <h2 style={{ fontSize: "1.15rem", margin: "2px 0 12px" }}>Son yayımlananlar</h2>
            <div className="timeline">
              {stream.length
                ? stream.map((x) => (
                    <div className={"ev " + x.tone} key={x.key}>
                      <b>{fmtDate(x.t)}</b>
                      <Link href={x.href} style={{ color: "inherit", textDecoration: "none" }}>
                        <span>{x.title}</span>
                      </Link>
                    </div>
                  ))
                : findings.slice(0, 4).map((f, i) => (
                    <div className={"ev " + (i % 2 ? "e" : "")} key={f.id}>
                      <b>
                        {f.sourceYear || ""} · {f.sourceSeries}
                      </b>
                      <Link href={`/bulgular/${f.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                        <span>{f.sourceTitle}</span>
                      </Link>
                    </div>
                  ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Haberler ve duyurular */}
      {show("news") && news.length ? (
        <section className="stack" style={{ gap: 16 }}>
          <div className="row between" style={{ alignItems: "flex-end" }}>
            <div className="section-title">
              <h2>
                Haberler ve duyurular<small>Güncel</small>
              </h2>
            </div>
            <Link className="btn" href="/haberler">
              Tüm haberler <Icon name="arrow" />
            </Link>
          </div>
          <div className="cards3">
            {news.map((n) => (
              <NewsCard key={n.id} n={n} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Raporlarımızdan veriler */}
      {show("findings") && findings.length ? (
        <section className="navy-band stack" style={{ gap: 20 }}>
          <div className="row between" style={{ alignItems: "flex-end" }}>
            <div className="section-title">
              <h2>
                Raporlarımızdan veriler<small>Sahadan rakamlar</small>
              </h2>
              <p>Yerel yönetimlerden gençliğin siyasi bilincine, deprem bölgesindeki yardım çalışmalarına kadar MASKDER saha araştırmalarından öne çıkan bulgular.</p>
            </div>
            <Link className="btn" href="/bulgular">
              Tüm rapor verileri <Icon name="arrow" />
            </Link>
          </div>
          <FindingShowcase items={findings} />
        </section>
      ) : null}

      {/* 6.4 Öne çıkan araştırmalar */}
      {show("results") && (results.length || featuredResearch.length) ? (
        <section className="stack" style={{ gap: 16 }}>
          <div className="row between" style={{ alignItems: "flex-end" }}>
            <div className="section-title">
              <h2>
                Öne çıkan araştırmalar<small>Dosyalar</small>
              </h2>
            </div>
            <Link className="btn" href="/arastirma-sonuclari">
              Tüm sonuçlar <Icon name="arrow" />
            </Link>
          </div>
          <div className="cards3">
            {results.map((r) => (
              <ResultCard key={r.id} r={r} />
            ))}
            {featuredResearch.map((f) => (
              <FindingCard key={f.id} f={f} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 6.5 Türkiye Gündemi */}
      {show("agenda") && agenda.length ? (
        <section className="stack" style={{ gap: 16 }}>
          <div className="section-title">
            <h2>
              Türkiye gündemi<small>Güncel toplumsal konular</small>
            </h2>
          </div>
          <div className="cards3">
            {agenda.map((x) => (
              <div className="card stack" style={{ gap: 8 }} key={x.key}>
                <span className="eyebrow">
                  {x.kind} · {fmtDate(x.date)}
                </span>
                <h3>{x.title}</h3>
                <p className="small muted">{x.text.slice(0, 180)}</p>
                <div style={{ marginTop: "auto" }}>
                  <Link className="btn sm" href={x.href}>
                    İncele
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* 6.6 Veri ve istatistikler */}
      {show("data") && (dataCharts.length || findingCharts.length) ? (
        <section className="stack" style={{ gap: 16 }}>
          <div className="row between" style={{ alignItems: "flex-end" }}>
            <div className="section-title">
              <h2>
                Veri ve istatistikler<small>{latestReport && dataCharts.length ? latestReport.survey.title : "Araştırma raporlarından"}</small>
              </h2>
            </div>
            <Link className="btn" href="/veri-ve-istatistikler">
              Analiz panosu <Icon name="arrow" />
            </Link>
          </div>
          <div className="chart-grid">
            {latestReport && dataCharts.length
              ? dataCharts.map((q) => <QuestionChart key={q.id} q={q} compact />)
              : findingCharts.map(({ f, c }) => <FindingChartCard key={f.id} c={c} source={sourceLine(f)} compact />)}
          </div>
          {latestReport && dataCharts.length ? <p className="small muted">n = {fmtN(latestReport.n)} · Gönüllü çevrim içi anket sonuçlarıdır; Türkiye genelini temsil etmez.</p> : null}
        </section>
      ) : null}

      {/* 6.7 Araştırma alanları (masalar) */}
      {show("categories") ? (
        <section className="stack" style={{ gap: 16 }}>
          <div className="row between" style={{ alignItems: "flex-end" }}>
            <div className="section-title">
              <h2>
                Araştırma masaları<small>Neyi izliyoruz?</small>
              </h2>
            </div>
            <Link className="btn" href="/arastirma-alanlari">
              Tüm alanlar <Icon name="arrow" />
            </Link>
          </div>
          <div className="desk-grid">
            {cats.map((c) => {
              const fc = findingCount.get(c.slug) || 0;
              const sc = surveyCount.get(c.slug) || 0;
              return (
                <Link className={"desk " + (fc ? "t" : sc ? "e" : "")} href={`/arastirma-alanlari/${c.slug}`} key={c.id}>
                  <span className="ic">
                    <Icon name={catIcon(c.icon)} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h3>{c.name}</h3>
                    <p>{fc || sc ? [fc ? `${fc} grafik` : "", sc ? `${sc} açık anket` : ""].filter(Boolean).join(" · ") : c.description.slice(0, 70)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* 6.8 Araştırma topluluğuna katıl */}
      {show("community") ? (
        <section className="grid card" id="topluluk" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: 24, alignItems: "start", borderTop: "3px solid var(--navy)" }}>
          <div className="stack" style={{ gap: 10 }}>
            <span className="eyebrow">Topluluk</span>
            <h2 style={{ fontSize: "1.4rem" }}>Saha ağına katılın</h2>
            <p className="muted">Gelecekteki araştırmalarımıza davet almak için kaydolun. Yeni bir anket başladığında size e-posta ile haber verelim; kaydınızı dilediğiniz an iptal edebilirsiniz.</p>
            <Link className="btn" href="/katil" style={{ alignSelf: "flex-start" }}>
              İlgi alanlarımı seçerek kaydol
            </Link>
          </div>
          <VolunteerForm compact categories={cats.map((c) => ({ slug: c.slug, name: c.name }))} />
        </section>
      ) : null}
    </div>
  );
}
