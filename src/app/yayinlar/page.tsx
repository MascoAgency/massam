import Link from "next/link";
import { prisma } from "@/lib/db";
import { activeCategories } from "@/lib/public";
import { PUBLICATION_TYPES } from "@/lib/defaults";
import { fmtDate } from "@/lib/format";
import { Icon } from "@/components/icons";
import { PageHead } from "@/components/PublicCards";

export const metadata = { title: "Yayınlar ve Raporlar" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ tur?: string; alan?: string; q?: string }> }) {
  const sp = await searchParams;
  const cats = await activeCategories();
  const pubs = await prisma.publication.findMany({
    where: {
      published: true,
      ...(sp.tur && PUBLICATION_TYPES[sp.tur] ? { type: sp.tur } : {}),
      ...(sp.alan ? { category: { slug: sp.alan } } : {}),
      ...(sp.q?.trim() ? { OR: [{ title: { contains: sp.q.trim(), mode: "insensitive" as const } }, { summary: { contains: sp.q.trim(), mode: "insensitive" as const } }] } : {}),
    },
    orderBy: { publishedAt: "desc" },
    include: { category: { select: { name: true, slug: true } } },
  });
  return (
    <div className="stack" style={{ gap: 28 }}>
      <PageHead
        eyebrow="Yayınlar ve Raporlar"
        title="Yayınlar ve raporlar"
        lead="MASKDER'in araştırma birikimini arşivlediği dijital yayın merkezi: araştırma raporları, kamuoyu araştırmaları, politika notları, veri analizleri ve akademik değerlendirmeler."
      >
        <Link className="btn" href="/haberler">
          Haberler ve duyurular
        </Link>
      </PageHead>
      <form className="card filters" method="get" role="search">
        <label className="f">
          Anahtar kelime
          <input type="search" name="q" defaultValue={sp.q || ""} placeholder="Başlık veya özet" />
        </label>
        <label className="f">
          Yayın türü
          <select name="tur" defaultValue={sp.tur || ""}>
            <option value="">Tüm türler</option>
            {Object.entries(PUBLICATION_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
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
        <span />
        <button className="btn primary" type="submit">
          Filtrele
        </button>
      </form>
      {pubs.length ? (
        <div className="card">
          {pubs.map((p) => (
            <div className="report-row" key={p.id}>
              {p.coverId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="pub-thumb" src={`/medya/${p.coverId}`} alt="" loading="lazy" />
              ) : (
                <span className="ic">
                  <Icon name="file" />
                </span>
              )}
              <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                <span className="pub-type">{PUBLICATION_TYPES[p.type] || "Yayın"}</span>
                <h3>
                  <Link href={`/yayinlar/${p.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {p.title}
                  </Link>
                </h3>
                {p.summary ? <p className="small muted">{p.summary.slice(0, 240)}</p> : null}
                <span className="small muted">
                  {fmtDate(p.publishedAt || p.createdAt)}
                  {p.authors ? " · " + p.authors : ""}
                  {p.category ? " · " + p.category.name : ""}
                </span>
              </div>
              <div className="acts">
                <Link className="btn sm" href={`/yayinlar/${p.slug}`}>
                  İncele
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty">
          <h2>Yayın bulunamadı</h2>
          <p>Seçtiğiniz ölçütlere uygun yayın yok ya da henüz yayın eklenmedi.</p>
          <Link className="btn" href="/arastirma-sonuclari">
            Araştırma sonuçları
          </Link>
        </div>
      )}
    </div>
  );
}
