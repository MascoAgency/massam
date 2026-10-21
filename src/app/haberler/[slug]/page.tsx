import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { publishedNews } from "@/lib/public";
import { fmtDate } from "@/lib/format";
import { plainText } from "@/lib/markdown";
import { RichText } from "@/components/RichText";
import { NewsCard, PageHead } from "@/components/PublicCards";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

const load = (slug: string) => prisma.news.findFirst({ where: { slug, published: true, publishedAt: { lte: new Date() } }, include: { cover: { select: { alt: true } } } });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = await load((await params).slug);
  if (!n) return { title: "Haber bulunamadı" };
  const description = (n.summary || plainText(n.body)).slice(0, 160);
  return { title: n.title, description, openGraph: { title: n.title, description, images: n.coverId ? [`/medya/${n.coverId}`] : undefined } };
}

export default async function Page({ params }: Props) {
  const n = await load((await params).slug);
  if (!n) notFound();
  const more = (await publishedNews({ take: 4 })).filter((x) => x.id !== n.id).slice(0, 3);
  return (
    <div className="stack" style={{ gap: 28 }}>
      <PageHead eyebrow={`Haber · ${fmtDate(n.publishedAt)}`} title={n.title} lead={n.summary || undefined} />
      <article className="stack" style={{ gap: 20, maxWidth: 820 }}>
        {n.coverId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="cover-img" src={`/medya/${n.coverId}`} alt={n.cover?.alt || ""} />
        ) : null}
        {n.authorName ? <p className="small muted">{n.authorName}</p> : null}
        <RichText text={n.body} />
      </article>
      {more.length ? (
        <section className="stack" style={{ gap: 14 }}>
          <div className="section-title">
            <h2>
              Diğer haberler<small>Haberler ve duyurular</small>
            </h2>
          </div>
          <div className="cards3">
            {more.map((x) => (
              <NewsCard key={x.id} n={x} />
            ))}
          </div>
        </section>
      ) : null}
      <div>
        <Link className="btn" href="/haberler">
          ← Tüm haberler
        </Link>
      </div>
    </div>
  );
}
