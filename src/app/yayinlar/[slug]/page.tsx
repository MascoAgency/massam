import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PUBLICATION_TYPES } from "@/lib/defaults";
import { fmtDate } from "@/lib/format";
import { RichText } from "@/components/RichText";
import { Icon } from "@/components/icons";
import { PageHead } from "@/components/PublicCards";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

const load = (slug: string) =>
  prisma.publication.findFirst({
    where: { slug, published: true },
    include: { category: true, report: { select: { id: true, slug: true, published: true } }, cover: { select: { alt: true } }, pdf: { select: { filename: true } } },
  });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load((await params).slug);
  return p ? { title: p.title, description: p.summary.slice(0, 160) } : { title: "Yayın bulunamadı" };
}

export default async function Page({ params }: Props) {
  const p = await load((await params).slug);
  if (!p) notFound();
  const pdf = p.pdfId ? `/medya/${p.pdfId}?indir=1` : p.pdfUrl || (p.report ? `/api/public/reports/${p.report.id}?indir=1` : "");
  return (
    <div className="stack" style={{ gap: 28 }}>
      <PageHead eyebrow={PUBLICATION_TYPES[p.type] || "Yayın"} title={p.title} lead={p.summary || undefined}>
        {pdf ? (
          <a className="btn primary" href={pdf} target={p.pdfUrl ? "_blank" : undefined} rel="noopener">
            <Icon name="dl" /> PDF indir
          </a>
        ) : null}
      </PageHead>
      <div className="kv-grid">
        <div className="kv-item">
          <span>Yayın tarihi</span>
          <b>{fmtDate(p.publishedAt || p.createdAt)}</b>
        </div>
        {p.authors ? (
          <div className="kv-item">
            <span>Yazar / araştırma ekibi</span>
            <b>{p.authors}</b>
          </div>
        ) : null}
        {p.category ? (
          <div className="kv-item">
            <span>Kategori</span>
            <b>
              <Link href={`/arastirma-alanlari/${p.category.slug}`}>{p.category.name}</Link>
            </b>
          </div>
        ) : null}
      </div>
      {p.coverId || p.body ? (
        <div className={p.coverId ? "pub-layout" : ""}>
          {p.coverId ? (
            <aside className="pub-cover-col">
              {pdf ? (
                <a href={pdf} target={p.pdfUrl ? "_blank" : undefined} rel="noopener" aria-label="Raporu aç (PDF)">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="pub-cover" src={`/medya/${p.coverId}`} alt={p.cover?.alt || ""} />
                </a>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="pub-cover" src={`/medya/${p.coverId}`} alt={p.cover?.alt || ""} />
              )}
              {pdf ? (
                <a className="btn primary" href={pdf} target={p.pdfUrl ? "_blank" : undefined} rel="noopener" style={{ justifyContent: "center" }}>
                  <Icon name="dl" /> Raporun tamamı (PDF)
                </a>
              ) : null}
            </aside>
          ) : null}
          {p.body ? (
            <article style={{ maxWidth: 860, minWidth: 0 }}>
              <RichText text={p.body} />
            </article>
          ) : null}
        </div>
      ) : null}
      {p.report?.published && p.report.slug ? (
        <div className="callout">
          <Icon name="chart" />
          <span>
            Bu yayının dayandığı araştırmanın grafikleri ve bulguları için <Link href={`/arastirma-sonuclari/${p.report.slug}`}>sonuç sayfasını</Link> inceleyin.
          </span>
        </div>
      ) : null}
      <div>
        <Link className="btn" href="/yayinlar">
          ← Tüm yayınlar
        </Link>
      </div>
    </div>
  );
}
