import Link from "next/link";
import { prisma } from "@/lib/db";
import { activeCategories, publicSurveys } from "@/lib/public";
import { PageHead, catIcon } from "@/components/PublicCards";
import { SurveyArt, artKeyFor } from "@/components/SurveyArt";
import { Icon } from "@/components/icons";

export const metadata = { title: "Araştırma Alanları" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const [cats, surveys, pubs] = await Promise.all([
    activeCategories(),
    publicSurveys(),
    prisma.publication.groupBy({ by: ["categoryId"], where: { published: true }, _count: { _all: true } }),
  ]);
  const pubCount = new Map(pubs.map((p) => [p.categoryId, p._count._all]));
  return (
    <div className="stack" style={{ gap: 28 }}>
      <PageHead
        eyebrow="Araştırma Alanları"
        title="Araştırma alanlarımız"
        lead={`Toplumsal, siyasal ve ekonomik gündemi ${cats.length} ana alanda izliyoruz. Her alanın sayfasında ilgili anketlere, sonuçlara ve yayınlara ulaşabilirsiniz.`}
      />
      <div className="area-grid">
        {cats.map((c, i) => {
          const own = surveys.filter((s) => s.category?.slug === c.slug);
          const open = own.filter((s) => s.open).length;
          const npub = pubCount.get(c.id) ?? 0;
          const meta = [own.length ? `${own.length} anket` : "", open ? `${open} katılıma açık` : "", npub ? `${npub} yayın` : ""].filter(Boolean);
          return (
            <Link key={c.id} className="area-card" href={`/arastirma-alanlari/${c.slug}`}>
              <span className="area-photo">
                <SurveyArt art={artKeyFor(c.name, c.slug)} label={c.name} eager={i < 3} />
              </span>
              <span className="area-body">
                <span className="area-head">
                  <span className="area-no">{String(i + 1).padStart(2, "0")}</span>
                  <span className="area-ic" aria-hidden="true">
                    <Icon name={catIcon(c.icon)} />
                  </span>
                </span>
                <h2>{c.name}</h2>
                <p>{c.description}</p>
                {c.topics.length ? (
                  <ul className="area-topics">
                    {c.topics.slice(0, 4).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                ) : null}
                <span className="area-foot">
                  <span>{meta.join(" · ") || "Yeni araştırmalar hazırlanıyor"}</span>
                  <span className="area-more">
                    Alanı incele <Icon name="arrow" />
                  </span>
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
