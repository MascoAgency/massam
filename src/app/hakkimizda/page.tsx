import Link from "next/link";
import { getPages, getContact } from "@/lib/site";
import { RichText } from "@/components/RichText";
import { PageHead } from "@/components/PublicCards";
import { Icon } from "@/components/icons";

export const metadata = { title: "Hakkımızda" };
export const dynamic = "force-dynamic";

const PRINCIPLES: ["shield" | "chart" | "file" | "globe", string, string][] = [
  ["chart", "Bilimsel yöntem", "Sorular akademik ölçütlere göre hazırlanır; bulgular istatistiksel yöntemlerle değerlendirilir."],
  ["shield", "Gizlilik", "Anketlere hesap açmadan, anonim olarak katılınır. Veriler KVKK kapsamında korunur."],
  ["file", "Şeffaflık", "Her sonuç sayfasında örneklem, yöntem ve araştırmanın sınırlılıkları açıkça belirtilir."],
  ["globe", "Erişilebilirlik", "Araştırma sonuçları ve raporlar herkesin erişebileceği biçimde yayımlanır."],
];

export default async function Page() {
  const [p, c] = await Promise.all([getPages(), getContact()]);
  return (
    <div className="stack" style={{ gap: 40 }}>
      <PageHead eyebrow="Hakkımızda" title="MASSAM Araştırma" lead={p.aboutLead} />
      <div className="split" style={{ alignItems: "start" }}>
        <RichText text={p.aboutBody} />
        <div className="stack" style={{ gap: 14 }}>
          {PRINCIPLES.map(([ic, t, d]) => (
            <div className="feature" key={t} style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
              <span className="ic" style={{ flex: "none" }}>
                <Icon name={ic} />
              </span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="split" id="maskder" style={{ alignItems: "start", scrollMarginTop: 120 }}>
        <div className="stack" style={{ gap: 14 }}>
          <div className="section-title">
            <h2>
              MASKDER<small>Derneğimiz</small>
            </h2>
            <p>{p.maskderLead}</p>
          </div>
          <RichText text={p.maskderBody} />
        </div>
        <div className="quote-card">
          <div className="row" style={{ gap: 12 }}>
            <div>
              <b>MASKDER</b>
              <p style={{ fontSize: ".9rem" }}>MASK Akademi · Araştırma · Eğitim</p>
            </div>
          </div>
          {c.email || c.phone || c.address ? (
            <div className="stack" style={{ gap: 4 }}>
              {c.email ? <p>E-posta: <a style={{ color: "#fff" }} href={`mailto:${c.email}`}>{c.email}</a></p> : null}
              {c.phone ? <p>Telefon: {c.phone}</p> : null}
              {c.address ? <p>Adres: {c.address}</p> : null}
            </div>
          ) : null}
          <div className="row">
            {p.maskderUrl ? (
              <a className="btn onnavy" href={p.maskderUrl} target="_blank" rel="noopener">
                Derneğin web sitesi
              </a>
            ) : null}
            <Link className="btn onnavy" href="/katil">
              Araştırmaya katıl
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
