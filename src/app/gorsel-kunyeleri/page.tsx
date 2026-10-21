import { prisma } from "@/lib/db";
import { PageHead } from "@/components/PublicCards";

export const metadata = { title: "Görsel künyeleri", description: "Sitede kullanılan fotoğrafların fotoğrafçı, lisans ve kaynak bilgileri." };
export const dynamic = "force-dynamic";

/** Lisanslı fotoğrafların künyesi (fotoğrafçı · lisans · kaynak bağlantısı) */
export default async function Page() {
  const items = await prisma.media.findMany({
    where: { credit: { not: "" }, mime: { startsWith: "image/" } },
    orderBy: { createdAt: "asc" },
    select: { id: true, alt: true, credit: true, sourceUrl: true },
  });
  return (
    <div className="stack" style={{ gap: 24 }}>
      <PageHead eyebrow="Kurumsal" title="Görsel künyeleri" lead="Sitede kullanılan fotoğrafların fotoğrafçı, lisans ve kaynak bilgileri. Fotoğraflar lisans koşullarına uygun olarak kullanılmaktadır." />
      {items.length ? (
        <div className="credit-grid">
          {items.map((m) => (
            <figure className="card credit-card" key={m.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/medya/${m.id}`} alt={m.alt} loading="lazy" />
              <figcaption className="stack" style={{ gap: 4 }}>
                <span className="small">{m.alt}</span>
                <span className="small muted">{m.credit}</span>
                {m.sourceUrl ? (
                  <a className="small" href={m.sourceUrl} target="_blank" rel="noopener noreferrer">
                    Kaynak sayfası →
                  </a>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="card empty">
          <p>Henüz künyeli görsel yok.</p>
        </div>
      )}
    </div>
  );
}
