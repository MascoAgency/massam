import { activeCategories } from "@/lib/public";
import { CategoryCard, PageHead } from "@/components/PublicCards";

export const metadata = { title: "Araştırma Alanları" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const cats = await activeCategories();
  return (
    <div className="stack" style={{ gap: 28 }}>
      <PageHead
        eyebrow="Araştırma Alanları"
        title="Araştırma alanlarımız"
        lead="Toplumsal, siyasal ve ekonomik gündemi sekiz ana alanda izliyoruz. Her alanın sayfasında ilgili anketlere, sonuçlara ve yayınlara ulaşabilirsiniz."
      />
      <div className="cat-grid">
        {cats.map((c) => (
          <CategoryCard key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}
