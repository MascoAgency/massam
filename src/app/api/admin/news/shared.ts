/** Haber ve sayfa gövdelerinin ortak doğrulaması */
export const str = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
export const idOrNull = (v: unknown) => (typeof v === "string" && /^[a-z0-9]{10,40}$/.test(v) ? v : null);
/** "yyyy-aa-ggTss:dd" (Türkiye saati) veya zaman damgası → Date */
export function trDate(v: unknown): Date | null {
  if (!v) return null;
  if (typeof v === "number") return new Date(v);
  const s = String(v);
  const d = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) ? new Date(s + ":00+03:00") : new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function newsData(b: Record<string, unknown>) {
  const title = str(b.title, 300);
  if (!title) return { error: "Başlık gerekli." } as const;
  const published = !!b.published;
  return {
    title,
    summary: str(b.summary, 1000),
    body: str(b.body, 100000),
    authorName: str(b.authorName, 200),
    coverId: idOrNull(b.coverId),
    categoryId: idOrNull(b.categoryId),
    featured: !!b.featured,
    published,
    publishedAt: published ? trDate(b.publishedAt) ?? new Date() : trDate(b.publishedAt),
  };
}

export function pageData(b: Record<string, unknown>) {
  const title = str(b.title, 200);
  if (!title) return { error: "Sayfa başlığı gerekli." } as const;
  return {
    title,
    summary: str(b.summary, 600),
    body: str(b.body, 100000),
    coverId: idOrNull(b.coverId),
    published: !!b.published,
    showInFooter: !!b.showInFooter,
  };
}
