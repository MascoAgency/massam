import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { plainText } from "@/lib/markdown";
import { RichText } from "@/components/RichText";
import { PageHead } from "@/components/PublicCards";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

const load = (slug: string) => prisma.page.findFirst({ where: { slug, published: true }, include: { cover: { select: { alt: true } } } });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load((await params).slug);
  return p ? { title: p.title, description: (p.summary || plainText(p.body)).slice(0, 160) } : { title: "Sayfa bulunamadı" };
}

export default async function Page({ params }: Props) {
  const p = await load((await params).slug);
  if (!p) notFound();
  return (
    <div className="stack" style={{ gap: 28 }}>
      <PageHead eyebrow="MASSAM Araştırma" title={p.title} lead={p.summary || undefined} />
      <article className="stack" style={{ gap: 20, maxWidth: 860 }}>
        {p.coverId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="cover-img" src={`/medya/${p.coverId}`} alt={p.cover?.alt || ""} />
        ) : null}
        <RichText text={p.body} />
      </article>
    </div>
  );
}
