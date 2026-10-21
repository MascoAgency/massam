import { publishedResults, activeCategories, publishedFindings } from "@/lib/public";
import { PageHead, ResultCard } from "@/components/PublicCards";
import { FindingCard, Kaynakca } from "@/components/FindingBlocks";

export const metadata = { title: "Araştırma Sonuçları" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ alan?: string; q?: string }> }) {
  const sp = await searchParams;
  const [cats, all, allFindings] = await Promise.all([activeCategories(), publishedResults({ categorySlug: sp.alan || undefined }), publishedFindings({ categorySlug: sp.alan || undefined })]);
  const lc = (s: string) => s.toLocaleLowerCase("tr-TR");
  const list = sp.q?.trim() ? all.filter((r) => lc(r.title + " " + r.summary).includes(lc(sp.q!.trim()))) : all;
  const findings = sp.q?.trim() ? allFindings.filter((f) => lc(f.title + " " + f.summary + " " + f.sourceTitle).includes(lc(sp.q!.trim()))) : allFindings;
  return (
    <div className="stack" style={{ gap: 28 }}>
      <PageHead
        eyebrow="Araştırma Sonuçları"
        title="Araştırma sonuçları"
        lead="Veri toplama ve analiz süreci tamamlanan, yayın onayı verilen araştırmalarımızın bulguları. Her sonuç sayfasında araştırmanın yöntemi ve sınırlılıkları açıkça belirtilir."
      />
      <form className="card filters" method="get" role="search" style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr) auto" }}>
        <label className="f">
          Anahtar kelime
          <input type="search" name="q" defaultValue={sp.q || ""} placeholder="Araştırma başlığı veya konu" />
        </label>
        <label className="f">
          Araştırma alanı
          <select name="alan" defaultValue={sp.alan || ""}>
            <option value="">Tüm alanlar</option>
            {cats.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn primary" type="submit">
          Filtrele
        </button>
      </form>
      {findings.length ? (
        <section className="stack" style={{ gap: 16 }}>
          <div className="section-title">
            <h2>
              Saha araştırmalarımızdan<small>MASKDER araştırma raporları</small>
            </h2>
            <p>Yayımlanmış raporlarımızdan seçilmiş veriler; her kartta grafikler, kısa değerlendirmeler ve rapora bağlantı yer alır.</p>
          </div>
          <div className="cards3">
            {findings.map((f) => (
              <FindingCard key={f.id} f={f} />
            ))}
          </div>
        </section>
      ) : null}
      {list.length ? (
        <section className="stack" style={{ gap: 16 }}>
          {findings.length ? (
            <div className="section-title">
              <h2>
                Anket sonuçları<small>Platform anketleri</small>
              </h2>
            </div>
          ) : null}
        <div className="cards3">
          {list.map((r) => (
            <ResultCard key={r.id} r={r} />
          ))}
        </div>
        </section>
      ) : findings.length ? null : (
        <div className="card empty">
          <h2>Henüz yayımlanmış sonuç yok</h2>
          <p>Araştırmalarımızın sonuçları, veri toplama ve analiz süreci tamamlanıp yayın onayı verildikten sonra burada yayımlanacaktır.</p>
          <a className="btn primary" href="/anketler">
            Aktif anketlere katılın
          </a>
        </div>
      )}
      <Kaynakca items={findings} />
    </div>
  );
}
