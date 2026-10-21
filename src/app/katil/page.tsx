import { publicSurveys, activeCategories } from "@/lib/public";
import { PageHead, SurveyCard } from "@/components/PublicCards";
import { VolunteerForm } from "@/components/VolunteerForm";
import { Icon } from "@/components/icons";

export const metadata = { title: "Araştırmaya Katıl" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const [surveys, cats] = await Promise.all([publicSurveys(), activeCategories()]);
  const open = surveys.filter((s) => s.open);
  return (
    <div className="stack" style={{ gap: 36 }}>
      <PageHead
        eyebrow="Araştırmaya Katıl"
        title="Araştırmaya katılın"
        lead="Görüşleriniz, toplumu anlamamıza ve doğru soruları sormamıza yardımcı olur. Aktif anketlere hemen katılabilir ya da araştırma topluluğumuza kaydolarak yeni araştırmalardan haberdar olabilirsiniz."
      />
      <div className="feature-grid">
        {(
          [
            ["shield", "Anonim katılım", "Anketlere hesap açmadan katılırsınız; yanıtlarınız kimliğinizle ilişkilendirilmez."],
            ["clock", "Birkaç dakika", "Anketlerimizin çoğu 3-10 dakika sürer; tahmini süre her ankette belirtilir."],
            ["chart", "Sonuçları görün", "Katkı verdiğiniz araştırmaların sonuçları yayımlandığında herkese açık olarak paylaşılır."],
          ] as const
        ).map(([ic, t, d]) => (
          <div className="feature" key={t}>
            <span className="ic">
              <Icon name={ic} />
            </span>
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </div>
      <section className="stack" style={{ gap: 14 }}>
        <div className="section-title">
          <h2>
            Aktif anketler<small>Hemen katılın</small>
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
            <p className="muted">Şu anda katılıma açık anket bulunmuyor. Aşağıdan araştırma topluluğumuza kaydolursanız yeni anketler başladığında size haber verelim.</p>
          </div>
        )}
      </section>
      <section className="stack" style={{ gap: 14 }} id="topluluk">
        <div className="section-title">
          <h2>
            Araştırma topluluğuna katılın<small>Gönüllü katılımcı kaydı</small>
          </h2>
          <p>İlgi alanlarınıza uygun yeni araştırmalar başladığında size e-posta ile davet gönderelim. Kaydınızı dilediğiniz an iptal edebilirsiniz.</p>
        </div>
        <VolunteerForm categories={cats.map((c) => ({ slug: c.slug, name: c.name }))} />
      </section>
    </div>
  );
}
