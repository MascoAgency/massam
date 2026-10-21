import { publicSurveys, activeCategories } from "@/lib/public";
import { SurveyCard, PageHead } from "@/components/PublicCards";

export const metadata = { title: "Anketler" };
export const dynamic = "force-dynamic";

type SP = { q?: string; alan?: string; durum?: string; sira?: string };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [cats, all] = await Promise.all([activeCategories(), publicSurveys({ categorySlug: sp.alan || undefined })]);
  const durum = sp.durum === "tamamlanan" ? "tamamlanan" : sp.durum === "tum" ? "tum" : "aktif";
  const lc = (s: string) => s.toLocaleLowerCase("tr-TR");
  let list = all.filter((s) => (durum === "aktif" ? s.open : durum === "tamamlanan" ? !s.open : true));
  if (sp.q?.trim()) {
    const q = lc(sp.q.trim());
    list = list.filter((s) => lc(s.title + " " + s.description + " " + (s.category?.name || "")).includes(q));
  }
  const sira = sp.sira || "yeni";
  list.sort((a, b) =>
    sira === "eski" ? a.updatedAt - b.updatedAt : sira === "katilim" ? b.responses - a.responses : sira === "sure" ? a.minutes - b.minutes : sira === "durum" ? Number(b.open) - Number(a.open) || b.updatedAt - a.updatedAt : b.updatedAt - a.updatedAt,
  );
  const openCount = all.filter((s) => s.open).length;
  return (
    <div className="stack" style={{ gap: 28 }}>
      <PageHead
        eyebrow="Anketler"
        title="Anketler"
        lead="Araştırmalarımıza hesap açmadan, anonim olarak katılabilirsiniz. Katılıma açık anketleri inceleyin, size uygun olanı seçin."
      />
      <form className="card filters" method="get" role="search">
        <label className="f">
          Anahtar kelime
          <input type="search" name="q" defaultValue={sp.q || ""} placeholder="Örn. gençlik, eğitim, belediye" />
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
        <label className="f">
          Durum
          <select name="durum" defaultValue={durum}>
            <option value="aktif">Aktif anketler ({openCount})</option>
            <option value="tamamlanan">Tamamlanan anketler</option>
            <option value="tum">Tümü</option>
          </select>
        </label>
        <label className="f">
          Sıralama
          <select name="sira" defaultValue={sira}>
            <option value="yeni">En yeni</option>
            <option value="durum">Duruma göre</option>
            <option value="katilim">En çok katılım</option>
            <option value="sure">En kısa süre</option>
            <option value="eski">En eski</option>
          </select>
        </label>
        <button className="btn primary" type="submit">
          Filtrele
        </button>
      </form>
      {list.length ? (
        <div className="cards3">
          {list.map((s) => (
            <SurveyCard key={s.id} s={s} />
          ))}
        </div>
      ) : (
        <div className="card empty">
          <h2>Anket bulunamadı</h2>
          <p>{durum === "aktif" ? "Seçtiğiniz ölçütlere uygun, katılıma açık bir anket şu anda bulunmuyor." : "Seçtiğiniz ölçütlere uygun anket bulunamadı."} Filtreleri değiştirmeyi deneyebilirsiniz.</p>
          <a className="btn" href="/anketler?durum=tum">
            Tüm anketleri göster
          </a>
        </div>
      )}
    </div>
  );
}
