import Link from "next/link";
import { publishedFindings } from "@/lib/public";
import { PageHead } from "@/components/PublicCards";
import { FindingCard, Kaynakca } from "@/components/FindingBlocks";

export const metadata = { title: "Araştırma Raporlarından Veriler", description: "MASKDER araştırma raporlarından seçilmiş veriler, grafikler ve kısa değerlendirmeler." };
export const dynamic = "force-dynamic";

export default async function Page() {
  const list = await publishedFindings();
  return (
    <div className="stack" style={{ gap: 28 }}>
      <PageHead
        eyebrow="Araştırma Raporları"
        title="Raporlarımızdan veriler"
        lead="MASKDER saha araştırmalarından seçilmiş bulgular: yerel yönetimler, gençlik ve afet yönetimi alanlarında grafikler ve kısa değerlendirmeler. Her verinin kaynağı rapor adıyla belirtilir."
      />
      {list.length ? (
        <div className="cards3">
          {list.map((f) => (
            <FindingCard key={f.id} f={f} />
          ))}
        </div>
      ) : (
        <div className="card empty">
          <h2>Henüz yayımlanmış veri yok</h2>
          <p>Araştırma raporlarından seçilen veriler yayımlandıkça burada yer alacak.</p>
          <Link className="btn primary" href="/yayinlar">
            Yayınlar ve raporlar
          </Link>
        </div>
      )}
      <Kaynakca items={list} />
    </div>
  );
}
