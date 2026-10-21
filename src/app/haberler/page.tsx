import Link from "next/link";
import { publishedNews } from "@/lib/public";
import { NewsCard, PageHead } from "@/components/PublicCards";

export const metadata = { title: "Haberler ve Duyurular" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const news = await publishedNews();
  return (
    <div className="stack" style={{ gap: 28 }}>
      <PageHead eyebrow="Yayınlar ve Raporlar" title="Haberler ve duyurular" lead="MASSAM Araştırma'dan haberler, etkinlikler ve duyurular.">
        <Link className="btn" href="/yayinlar">
          Yayınlar ve raporlar
        </Link>
      </PageHead>
      {news.length ? (
        <div className="cards3">
          {news.map((n) => (
            <NewsCard key={n.id} n={n} />
          ))}
        </div>
      ) : (
        <div className="card empty">
          <h2>Henüz haber yok</h2>
          <p>Haberler ve duyurular yayımlandıkça burada yer alacak.</p>
        </div>
      )}
    </div>
  );
}
