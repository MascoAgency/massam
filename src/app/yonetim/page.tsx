import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { allPlans } from "@/lib/plans";
import { getHome, getPages, getContact, getLegal } from "@/lib/site";
import { responseCounts } from "@/lib/queries";
import { toSurveyLite } from "@/lib/mappers";
import { stripeEnabled } from "@/lib/billing/stripe";
import { fmtN, fmtDate, trDayStart } from "@/lib/format";
import { can, ROLE_LABEL, ROLE_DESC, type Perm, type RoleName } from "@/lib/roles";
import { DEFAULT_LIMITATIONS, PUBLICATION_TYPES } from "@/lib/defaults";
import { StatusPill } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";
import { SurveyRow } from "@/components/SurveyRow";
import { AdminCharts, AdminUsers, HomeForm, PagesForm, PlansForm } from "@/components/Admin";
import { CategoriesManager, ContactForm, LegalForm, PublicationEditor, ResultEditor } from "@/components/AdminContent";
import { NewsEditor, PageEditor } from "@/components/AdminCms";
import { FindingEditor } from "@/components/AdminFindings";
import { ResearchAssistant } from "@/components/ResearchAssistant";
import { parseCharts, parseStats } from "@/lib/findings";
import { MediaLibrary } from "@/components/Editor";
import type { ReportSnapshot } from "@/lib/report/types";

export const metadata = { title: "Yönetim" };
export const dynamic = "force-dynamic";

// Yönetim menüsü grupları (yukarıdan aşağıya)
const GROUPS = ["Yayında olan araştırmalar", "Geçmiş araştırmalar", "Yeni araştırma başlat", "Yönetim yetkilendirme", "Sistem yönetimi"] as const;

// [anahtar, başlık, ikon, açıklama, gereken yetki (yoksa tüm personel), grup]
const TABS: [string, string, IconName, string, Perm | null, number][] = [
  ["surveys", "Aktif anketler", "folder", "Şu anda katılıma açık platform anketleri. Katılımı izleyin, sonuçları analiz edin, gerektiğinde yayından kaldırın.", "raw", 0],
  ["findings", "Rapor verileri", "chart", "Yayımlanmış raporlardan seçilen verileri grafik, kısa metin ve kaynakça ile web sitesinde yayımlayın.", "content", 0],
  ["past", "Tamamlanan anketler", "clock", "Kapanmış veya arşivlenmiş anketler; sonuçları, raporları ve dışa aktarımları buradan inceleyin.", "raw", 1],
  ["results", "Araştırma sonuçları", "file", "Sonuç sayfalarının metinlerini hazırlayın ve yayın onayı verin. Sonuçlar onay verilene kadar kamuya açılmaz.", "publish", 1],
  ["publications", "Yayınlar ve raporlar", "book", "Yayınlar ve Raporlar arşivini yönetin: raporlar, politika notları, veri analizleri; kapak görseli ve PDF yükleme.", "content", 1],
  ["assistant", "Araştırma Merkezi Asistanı", "spark", "Araştırma fikrinizi yazın; asistan yöntem önerir, fikri örnek bir ankete dönüştürür. Taslağı düzenleyip onayladığınızda yayımlanır.", "surveys", 2],
  ["new", "Anket taslakları", "plus", "Yeni platform anketi oluşturun veya hazırlanan taslakları düzenleyip yayına alın. Yayına alınan anketler ana sayfada ve ilgili alan sayfasında görünür.", "surveys", 2],
  ["users", "Kullanıcılar ve roller", "users", "Kullanıcılara rol ve plan atayın, plan taleplerini onaylayın, hesapları yönetin.", "users", 3],
  ["volunteers", "Gönüllüler", "mail", "Araştırma topluluğuna kayıtlı gönüllü katılımcılar.", "volunteers", 3],
  ["stats", "Genel bakış", "chart", "Anketler, katılım, analiz ve rapor kullanımı bir bakışta.", null, 4],
  ["news", "Haberler", "mail", "Haber ve duyuruları kapak görseli ve biçimli metinle yazın, zamanlayın ve yayımlayın.", "content", 4],
  ["pages", "Sayfalar", "file", "Web sitesine yeni sayfalar ekleyin ve düzenleyin; dilediğiniz sayfayı alt bilgide gösterin.", "content", 4],
  ["media", "Medya kütüphanesi", "eye", "Görsel ve PDF dosyalarını yükleyin, açıklamalarını düzenleyin, içeriklerde kullanın.", "content", 4],
  ["categories", "Araştırma alanları", "globe", "Araştırma kategorilerini oluşturun, düzenleyin ve sıralayın.", "content", 4],
  ["site", "Site içeriği", "home", "Ana sayfa, Hakkımızda metinleri, iletişim bilgileri, sosyal medya ve yasal metinler.", "content", 4],
  ["plans", "Üyelik paketleri", "tag", "Fiyatlar, plan sınırları ve ödeme ayarları.", "plans", 4],
];

export default async function Page({ searchParams }: { searchParams: Promise<{ sekme?: string; rapor?: string; yayin?: string; haber?: string; sayfa?: string; veri?: string }> }) {
  const me = await requireStaff();
  const sp = await searchParams;
  const allowed = TABS.filter(([, , , , p]) => !p || can(me.role, p) || (p === "raw" && (can(me.role, "surveys") || can(me.role, "analyze"))));
  const current = allowed.find(([k]) => k === sp.sekme) || allowed[0];
  const tab = current[0];
  let body: React.ReactNode = null;

  if (tab === "stats") {
    const since = new Date(Date.now() - 30 * 86400000);
    const [users, platformSurveys, openSurveys, platformResponses, published, pubs, volunteers, plans, byPlan, recent, ai, pdf] = await Promise.all([
      prisma.user.count(),
      prisma.survey.count({ where: { isPlatform: true } }),
      prisma.survey.count({ where: { isPlatform: true, status: "open", archived: false } }),
      prisma.response.count({ where: { survey: { isPlatform: true } } }),
      prisma.report.count({ where: { published: true } }),
      prisma.publication.count({ where: { published: true } }),
      prisma.volunteer.count({ where: { unsubscribedAt: null } }),
      allPlans(),
      prisma.user.groupBy({ by: ["planId"], _count: { _all: true } }),
      prisma.survey.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.usageEvent.count({ where: { kind: "ai" } }),
      prisma.usageEvent.count({ where: { kind: "pdf" } }),
    ]);
    const platform = await prisma.survey.findMany({ where: { isPlatform: true }, select: { id: true } });
    const counts = await responseCounts(platform.map((s) => s.id));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const topSurveys = await prisma.survey.findMany({ where: { id: { in: top.map((t) => t[0]) } } });
    const todayTr = trDayStart(new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10));
    const created = Array.from({ length: 30 }, (_, i) => {
      const t = todayTr - (29 - i) * 86400000;
      return recent.filter((s) => s.createdAt.getTime() >= t && s.createdAt.getTime() < t + 86400000).length;
    });
    body = (
      <div className="stack">
        <div className="grid g4">
          <div className="card stat"><b>{fmtN(platformSurveys)}</b><span>Platform anketi ({openSurveys} yayında)</span></div>
          <div className="card stat"><b>{fmtN(platformResponses)}</b><span>Platform anketlerine katılım</span></div>
          <div className="card stat"><b>{fmtN(published)}</b><span>Yayımlanan araştırma sonucu</span></div>
          <div className="card stat"><b>{fmtN(pubs)}</b><span>Yayın</span></div>
          <div className="card stat"><b>{fmtN(volunteers)}</b><span>Gönüllü katılımcı</span></div>
          <div className="card stat"><b>{fmtN(users)}</b><span>Kayıtlı kullanıcı</span></div>
          <div className="card stat"><b>{fmtN(ai)}</b><span>Toplam analiz</span></div>
          <div className="card stat"><b>{fmtN(pdf)}</b><span>Toplam PDF rapor</span></div>
        </div>
        {can(me.role, "users") ? <AdminCharts planDist={plans.map((p) => ({ name: p.name, n: byPlan.find((b) => b.planId === p.id)?._count._all || 0 }))} created={created} /> : null}
        <div className="card stack" style={{ gap: 8 }}>
          <h3>En çok katılım alan platform anketleri</h3>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Anket</th><th>Durum</th><th className="num">Yanıt</th></tr></thead>
              <tbody>
                {top.length ? top.map(([id, n]) => {
                  const s = topSurveys.find((x) => x.id === id);
                  return s ? (
                    <tr key={id}><td>{can(me.role, "raw") || can(me.role, "surveys") ? <Link href={`/panel/anket/${id}`}>{s.title}</Link> : s.title}</td><td><StatusPill s={s} /></td><td className="num">{fmtN(n)}</td></tr>
                  ) : null;
                }) : <tr><td colSpan={3} className="muted">Henüz yanıt yok.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card stack" style={{ gap: 6 }}>
          <h3>Rolünüz: {ROLE_LABEL[me.role as RoleName]}</h3>
          <p className="small muted">{ROLE_DESC[me.role as RoleName]}</p>
        </div>
      </div>
    );
  } else if (tab === "surveys" || tab === "past" || tab === "new") {
    const editAll = can(me.role, "surveys");
    const scope = tab === "surveys" ? { status: "open" as const, archived: false } : tab === "past" ? { OR: [{ status: "closed" as const }, { archived: true }] } : { status: "draft" as const, archived: false };
    const list = await prisma.survey.findMany({ where: { ...(me.role === "ADMIN" ? {} : { isPlatform: true }), ...scope }, orderBy: { updatedAt: "desc" }, include: { owner: { select: { name: true } } } });
    const empty = tab === "surveys" ? "Şu anda yayında olan anket yok." : tab === "past" ? "Henüz tamamlanan anket yok." : "Taslak anket yok.";
    const counts = await responseCounts(list.map((s) => s.id));
    body = (
      <div className="stack">
        {editAll && tab !== "past" ? (
          <div className="card row between">
            <div className="stack" style={{ gap: 4 }}>
              <b>Yeni araştırma başlat</b>
              <span className="small muted">Fikrinizi asistana yazıp örnek anket hazırlatın ya da boş bir anketle başlayın. Yayına aldığınız anket ana sayfada, Anketler sayfasında ve seçtiğiniz araştırma alanının sayfasında yayımlanır.</span>
            </div>
            <div className="row">
              <Link className="btn signal" href="/yonetim?sekme=assistant"><Icon name="spark" /> Asistanla başla</Link>
              <Link className="btn primary" href="/panel/anket/yeni?platform=1"><Icon name="plus" /> Boş anket</Link>
            </div>
          </div>
        ) : null}
        <div className="card">
          {list.length ? (
            <div className="slist">
              {list.map((s) => <SurveyRow key={s.id} s={toSurveyLite(s)} count={counts[s.id] || 0} showOwner adminToggle canEdit={me.role === "ADMIN" || (s.isPlatform && editAll)} />)}
            </div>
          ) : <div className="empty"><p>{empty}</p></div>}
        </div>
      </div>
    );
  } else if (tab === "results") {
    if (sp.rapor) {
      const r = await prisma.report.findUnique({ where: { id: sp.rapor }, include: { survey: { select: { id: true, title: true, isPlatform: true } } } });
      if (r && r.survey.isPlatform) {
        const snap = r.snapshot as unknown as ReportSnapshot;
        body = (
          <div className="stack">
            <Link className="small" href="/yonetim?sekme=results">← Tüm sonuçlar</Link>
            <ResultEditor
              defaultLimitations={DEFAULT_LIMITATIONS}
              r={{
                id: r.id, title: r.survey.title, n: r.n, createdAt: r.createdAt.getTime(), published: r.published, slug: r.slug,
                summary: r.summary, scope: r.scope, method: r.method, limitations: r.limitations, evaluation: r.evaluation,
                highlights: r.highlights, agenda: r.agenda, surveyId: r.survey.id,
                questions: snap.survey.questions.filter((q) => q.type !== "open").map((q) => ({ id: q.id, title: q.title })),
              }}
            />
          </div>
        );
      }
    }
    if (!body) {
      const reports = await prisma.report.findMany({ where: { survey: { isPlatform: true } }, orderBy: { createdAt: "desc" }, include: { survey: { select: { title: true } } } });
      body = (
        <div className="stack">
          <div className="callout">
            <Icon name="info" />
            <span className="small">Bir anketin sonuç sayfası, o anket için oluşturulan PDF raporuna dayanır. Rapor oluşturmak için anketin <b>PDF rapor</b> sekmesini kullanın; ardından burada metinleri hazırlayıp yayın onayı verin.</span>
          </div>
          <div className="card">
            {reports.length ? (
              <div className="slist">
                {reports.map((r) => (
                  <div className="sitem" key={r.id}>
                    <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                      <div className="row" style={{ gap: 8 }}>
                        {r.published ? <span className="pill open">Yayında</span> : <span className="pill draft">Onay bekliyor</span>}
                        {r.agenda ? <span className="pill plain accent">Türkiye gündemi</span> : null}
                      </div>
                      <h3>{r.survey.title}</h3>
                      <div className="meta"><span>Rapor: {fmtDate(r.createdAt)}</span><span>n = {r.n}</span>{r.filter ? <span>Filtre: {r.filter}</span> : null}</div>
                    </div>
                    <div className="acts">
                      {r.published && r.slug ? <Link className="btn sm" href={`/arastirma-sonuclari/${r.slug}`} target="_blank">Görüntüle</Link> : null}
                      <Link className="btn sm primary" href={`/yonetim?sekme=results&rapor=${r.id}`}>Düzenle</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="empty"><p>Henüz platform anketi raporu yok.</p></div>}
          </div>
        </div>
      );
    }
  } else if (tab === "publications") {
    const [cats, reports] = await Promise.all([
      prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
      prisma.report.findMany({ where: { survey: { isPlatform: true } }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true, survey: { select: { title: true } } } }),
    ]);
    const reportOpts = reports.map((r) => ({ id: r.id, title: `${r.survey.title} (${fmtDate(r.createdAt)})` }));
    if (sp.yayin) {
      const p = sp.yayin === "yeni" ? null : await prisma.publication.findUnique({ where: { id: sp.yayin }, include: { pdf: { select: { filename: true } } } });
      body = (
        <div className="stack">
          <Link className="small" href="/yonetim?sekme=publications">← Tüm yayınlar</Link>
          <PublicationEditor
            key={p?.id || "yeni"}
            types={PUBLICATION_TYPES}
            categories={cats}
            reports={reportOpts}
            p={p ? { id: p.id, title: p.title, type: p.type, summary: p.summary, body: p.body, authors: p.authors, categoryId: p.categoryId, reportId: p.reportId, pdfUrl: p.pdfUrl, published: p.published, agenda: p.agenda, coverId: p.coverId, pdfId: p.pdfId, pdfName: p.pdf?.filename ?? null } : { title: "", type: "rapor", summary: "", body: "", authors: "", categoryId: null, reportId: null, pdfUrl: "", published: false, agenda: false, coverId: null, pdfId: null, pdfName: null }}
          />
        </div>
      );
    } else {
      const pubs = await prisma.publication.findMany({ orderBy: { updatedAt: "desc" } });
      body = (
        <div className="stack">
          <div className="card row between">
            <div className="stack" style={{ gap: 4 }}>
              <b>Yayın arşivi</b>
              <span className="small muted">Başlık, özet, yazar veya araştırma ekibi, yayın tarihi, kategori ve PDF bağlantısı.</span>
            </div>
            <Link className="btn primary" href="/yonetim?sekme=publications&yayin=yeni"><Icon name="plus" /> Yeni yayın</Link>
          </div>
          <div className="card">
            {pubs.length ? (
              <div className="slist">
                {pubs.map((p) => (
                  <div className="sitem" key={p.id}>
                    <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                      <div className="row" style={{ gap: 8 }}>
                        {p.published ? <span className="pill open">Yayında</span> : <span className="pill draft">Taslak</span>}
                        <span className="pub-type">{PUBLICATION_TYPES[p.type]}</span>
                      </div>
                      <h3>{p.title}</h3>
                      <div className="meta"><span>{fmtDate(p.publishedAt || p.createdAt)}</span>{p.authors ? <span>{p.authors}</span> : null}</div>
                    </div>
                    <div className="acts">
                      {p.published ? <Link className="btn sm" href={`/yayinlar/${p.slug}`} target="_blank">Görüntüle</Link> : null}
                      <Link className="btn sm primary" href={`/yonetim?sekme=publications&yayin=${p.id}`}>Düzenle</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="empty"><p>Henüz yayın eklenmedi.</p></div>}
          </div>
        </div>
      );
    }
  } else if (tab === "assistant") {
    const cats = await prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
    body = <ResearchAssistant categories={cats} ready={!!process.env.ANTHROPIC_API_KEY} />;
  } else if (tab === "findings") {
    const cats = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
    if (sp.veri) {
      const f = sp.veri === "yeni" ? null : await prisma.finding.findUnique({ where: { id: sp.veri } });
      body = (
        <div className="stack">
          <Link className="small" href="/yonetim?sekme=findings">← Tüm rapor verileri</Link>
          <FindingEditor
            key={f?.id || "yeni"}
            categories={cats}
            f={
              f
                ? { id: f.id, slug: f.slug, title: f.title, summary: f.summary, body: f.body, categoryId: f.categoryId, sourceTitle: f.sourceTitle, sourceUrl: f.sourceUrl, sourceSeries: f.sourceSeries, sourceYear: f.sourceYear, isbn: f.isbn, method: f.method, stats: parseStats(f.stats), charts: parseCharts(f.charts), featured: f.featured, published: f.published, sortOrder: f.sortOrder }
                : { title: "", summary: "", body: "", categoryId: null, sourceTitle: "", sourceUrl: "", sourceSeries: "", sourceYear: new Date().getFullYear(), isbn: "", method: "", stats: [], charts: [], featured: false, published: false, sortOrder: 0 }
            }
          />
        </div>
      );
    } else {
      const list = await prisma.finding.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { category: { select: { name: true } } } });
      body = (
        <div className="stack">
          <div className="card row between">
            <div className="stack" style={{ gap: 4 }}>
              <b>Rapor verileri</b>
              <span className="small muted">Yayımlananlar ana sayfa, Araştırma Sonuçları, Veri ve İstatistikler ve ilgili araştırma alanı sayfalarında grafiklerle ve kaynakçayla görünür.</span>
            </div>
            <Link className="btn primary" href="/yonetim?sekme=findings&veri=yeni"><Icon name="plus" /> Yeni rapor verisi</Link>
          </div>
          <div className="card">
            {list.length ? (
              <div className="slist">
                {list.map((f) => (
                  <div className="sitem" key={f.id}>
                    <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                      <div className="row" style={{ gap: 8 }}>
                        {f.published ? <span className="pill open">Yayında</span> : <span className="pill plain">Taslak</span>}
                        {f.featured ? <span className="pill plain accent">Ana sayfada</span> : null}
                      </div>
                      <h3>{f.title}</h3>
                      <div className="meta">
                        <span>{f.category?.name || "Alan seçilmedi"}</span>
                        <span>{parseCharts(f.charts).length} grafik</span>
                        <span>Kaynak: {f.sourceTitle || "—"}</span>
                      </div>
                    </div>
                    <div className="acts">
                      {f.published ? <Link className="btn sm" href={`/bulgular/${f.slug}`} target="_blank">Görüntüle</Link> : null}
                      <Link className="btn sm primary" href={`/yonetim?sekme=findings&veri=${f.id}`}>Düzenle</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="empty"><p>Henüz rapor verisi eklenmedi.</p></div>}
          </div>
        </div>
      );
    }
  } else if (tab === "news") {
    const cats = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
    if (sp.haber) {
      const n = sp.haber === "yeni" ? null : await prisma.news.findUnique({ where: { id: sp.haber } });
      body = (
        <div className="stack">
          <Link className="small" href="/yonetim?sekme=news">← Tüm haberler</Link>
          <NewsEditor
            key={n?.id || "yeni"}
            categories={cats}
            n={n ? { id: n.id, slug: n.slug, title: n.title, summary: n.summary, body: n.body, authorName: n.authorName, coverId: n.coverId, categoryId: n.categoryId, featured: n.featured, published: n.published, publishedAt: n.publishedAt ? n.publishedAt.getTime() : null } : { title: "", summary: "", body: "", authorName: "", coverId: null, categoryId: null, featured: false, published: false, publishedAt: null }}
          />
        </div>
      );
    } else {
      const list = await prisma.news.findMany({ orderBy: { updatedAt: "desc" } });
      const now = Date.now();
      body = (
        <div className="stack">
          <div className="card row between">
            <div className="stack" style={{ gap: 4 }}>
              <b>Haberler ve duyurular</b>
              <span className="small muted">Yayımlanan haberler /haberler sayfasında ve ana sayfadaki “Haberler ve duyurular” bölümünde görünür.</span>
            </div>
            <Link className="btn primary" href="/yonetim?sekme=news&haber=yeni"><Icon name="plus" /> Yeni haber</Link>
          </div>
          <div className="card">
            {list.length ? (
              <div className="slist">
                {list.map((n) => (
                  <div className="sitem" key={n.id}>
                    <div className="row" style={{ gap: 14, flexWrap: "nowrap", minWidth: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {n.coverId ? <img className="pub-thumb" src={`/medya/${n.coverId}`} alt="" /> : null}
                      <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                        <div className="row" style={{ gap: 8 }}>
                          {n.published ? (n.publishedAt && n.publishedAt.getTime() > now ? <span className="pill draft">Zamanlandı</span> : <span className="pill open">Yayında</span>) : <span className="pill plain">Taslak</span>}
                          {n.featured ? <span className="pill plain accent">Ana sayfada</span> : null}
                        </div>
                        <h3>{n.title}</h3>
                        <div className="meta"><span>{fmtDate(n.publishedAt || n.updatedAt)}</span></div>
                      </div>
                    </div>
                    <div className="acts">
                      {n.published ? <Link className="btn sm" href={`/haberler/${n.slug}`} target="_blank">Görüntüle</Link> : null}
                      <Link className="btn sm primary" href={`/yonetim?sekme=news&haber=${n.id}`}>Düzenle</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="empty"><p>Henüz haber yok.</p></div>}
          </div>
        </div>
      );
    }
  } else if (tab === "pages") {
    if (sp.sayfa) {
      const p = sp.sayfa === "yeni" ? null : await prisma.page.findUnique({ where: { id: sp.sayfa } });
      body = (
        <div className="stack">
          <Link className="small" href="/yonetim?sekme=pages">← Tüm sayfalar</Link>
          <PageEditor key={p?.id || "yeni"} p={p ? { id: p.id, slug: p.slug, title: p.title, summary: p.summary, body: p.body, coverId: p.coverId, published: p.published, showInFooter: p.showInFooter } : { title: "", summary: "", body: "", coverId: null, published: false, showInFooter: false }} />
        </div>
      );
    } else {
      const list = await prisma.page.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
      body = (
        <div className="stack">
          <div className="card row between">
            <div className="stack" style={{ gap: 4 }}>
              <b>Sayfalar</b>
              <span className="small muted">Basın odası, iletişim, etkinlikler gibi ek sayfalar. Ana menüdeki sayfaların metinleri “Site içeriği” bölümünden düzenlenir.</span>
            </div>
            <Link className="btn primary" href="/yonetim?sekme=pages&sayfa=yeni"><Icon name="plus" /> Yeni sayfa</Link>
          </div>
          <div className="card">
            {list.length ? (
              <div className="slist">
                {list.map((p) => (
                  <div className="sitem" key={p.id}>
                    <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                      <div className="row" style={{ gap: 8 }}>
                        {p.published ? <span className="pill open">Yayında</span> : <span className="pill plain">Taslak</span>}
                        {p.showInFooter ? <span className="pill plain accent">Alt bilgide</span> : null}
                      </div>
                      <h3>{p.title}</h3>
                      <div className="meta"><span className="mono">/sayfa/{p.slug}</span><span>Güncelleme: {fmtDate(p.updatedAt)}</span></div>
                    </div>
                    <div className="acts">
                      {p.published ? <Link className="btn sm" href={`/sayfa/${p.slug}`} target="_blank">Görüntüle</Link> : null}
                      <Link className="btn sm primary" href={`/yonetim?sekme=pages&sayfa=${p.id}`}>Düzenle</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="empty"><p>Henüz sayfa eklenmedi.</p></div>}
          </div>
        </div>
      );
    }
  } else if (tab === "media") {
    const items = await prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 300, select: { id: true, filename: true, mime: true, size: true, width: true, height: true, alt: true, createdAt: true } });
    body = <MediaLibrary initial={items.map((m) => ({ ...m, url: `/medya/${m.id}`, createdAt: m.createdAt.getTime() }))} />;
  } else if (tab === "categories") {
    const cats = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { surveys: true } } } });
    body = <CategoriesManager categories={cats.map((c) => ({ id: c.id, name: c.name, description: c.description, icon: c.icon, topics: c.topics, active: c.active, surveys: c._count.surveys }))} />;
  } else if (tab === "site") {
    const [home, pages, contact, legal, ps] = await Promise.all([
      getHome(), getPages(), getContact(), getLegal(),
      prisma.survey.findMany({ where: { isPlatform: true }, select: { id: true, title: true, status: true } }),
    ]);
    body = (
      <>
        <HomeForm home={home} platformSurveys={ps} />
        <PagesForm pages={pages} />
        <ContactForm c={contact} />
        <LegalForm l={legal} />
      </>
    );
  } else if (tab === "volunteers") {
    const [list, total, cats] = await Promise.all([
      prisma.volunteer.findMany({ where: { unsubscribedAt: null }, orderBy: { createdAt: "desc" }, take: 300 }),
      prisma.volunteer.count({ where: { unsubscribedAt: null } }),
      prisma.category.findMany({ select: { slug: true, name: true } }),
    ]);
    const catName = (s: string) => cats.find((c) => c.slug === s)?.name || s;
    body = (
      <div className="stack">
        <div className="card row between">
          <div className="stack" style={{ gap: 4 }}>
            <b>{fmtN(total)} gönüllü katılımcı</b>
            <span className="small muted">Kişisel veridir: yalnızca araştırma davetleri için, açık rıza kapsamında kullanılabilir. Kaydını iptal edenler listede yer almaz.</span>
          </div>
          <a className="btn" href="/api/admin/volunteers"><Icon name="dl" /> CSV indir</a>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>E-posta</th><th>Ad</th><th>İl</th><th>Yaş</th><th>İlgi alanları</th><th>Kayıt</th></tr></thead>
            <tbody>
              {list.length ? list.map((v) => (
                <tr key={v.id}><td>{v.email}</td><td>{v.name || "—"}</td><td>{v.city || "—"}</td><td>{v.ageGroup || "—"}</td><td className="small">{v.interests.map(catName).join(", ") || "—"}</td><td style={{ whiteSpace: "nowrap" }}>{fmtDate(v.createdAt)}</td></tr>
              )) : <tr><td colSpan={6} className="muted">Henüz kayıt yok.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  } else if (tab === "users") {
    const [users, plans] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { surveys: true } } } }),
      allPlans(),
    ]);
    body = (
      <div className="stack">
        <div className="card stack" style={{ gap: 8 }}>
          <h3>Roller ve yetkiler</h3>
          <div className="grid g2" style={{ gap: 10 }}>
            {(Object.keys(ROLE_LABEL) as RoleName[]).map((r) => (
              <p className="small" key={r}><b>{ROLE_LABEL[r]}:</b> <span className="muted">{ROLE_DESC[r]}</span></p>
            ))}
          </div>
        </div>
        <AdminUsers
          me={me.id}
          plans={plans}
          users={users.map((u) => ({
            id: u.id, name: u.name, email: u.email, institution: u.institution, field: u.field, role: u.role, disabled: u.disabled,
            planId: u.planId, requestedPlanId: u.requestedPlanId, subscriptionStatus: u.subscriptionStatus, createdAt: u.createdAt.getTime(), surveys: u._count.surveys,
          }))}
        />
      </div>
    );
  } else if (tab === "plans") {
    body = <PlansForm plans={await allPlans()} stripe={stripeEnabled()} />;
  }

  const pendingCount = can(me.role, "users") ? await prisma.user.count({ where: { requestedPlanId: { not: null } } }) : 0;
  const awaiting = can(me.role, "publish") ? await prisma.report.count({ where: { published: false, survey: { isPlatform: true } } }) : 0;
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <p className="eyebrow">Yönetim paneli · {ROLE_LABEL[me.role as RoleName]}</p>
          <h1>{current[1]}</h1>
          <p className="muted" style={{ marginTop: 6 }}>{current[3]}</p>
        </div>
        <div className="row">
          <Link className="btn" href="/" target="_blank">Siteyi görüntüle</Link>
          {can(me.role, "surveys") ? <Link className="btn primary" href="/panel/anket/yeni?platform=1"><Icon name="plus" /> Platform anketi</Link> : null}
        </div>
      </div>
      <div className="staff-band">YETKİLİ PERSONEL EKRANI · HAM YANIT VERİSİNE ERİŞİM YETKİYE BAĞLIDIR</div>
      <div className="admin-shell">
        <nav className="admin-side" aria-label="Yönetim menüsü">
          {GROUPS.map((g, gi) => {
            const items = allowed.filter((t) => t[5] === gi);
            return items.length ? (
              <div className="side-group" key={g}>
                <span className="side-label">
                  <i>{String(gi + 1).padStart(2, "0")}</i> {g}
                </span>
                {items.map(([k, l, icon]) => (
                  <Link key={k} href={`/yonetim?sekme=${k}`} aria-current={tab === k ? "page" : undefined}>
                    <Icon name={icon} /> {l}
                    {k === "users" && pendingCount ? <span className="badge" title="Bekleyen plan talebi">{pendingCount}</span> : null}
                    {k === "results" && awaiting ? <span className="badge" title="Yayın onayı bekleyen">{awaiting}</span> : null}
                  </Link>
                ))}
              </div>
            ) : null;
          })}
          <div className="side-foot">Oturum: {me.name}</div>
        </nav>
        <div className="admin-main">{body}</div>
      </div>
    </div>
  );
}
