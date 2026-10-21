import { parseCharts, parseStats } from "@/lib/findings";
import { idOrNull, str } from "../news/shared";

export function findingData(b: Record<string, unknown>) {
  const title = str(b.title, 300);
  if (!title) return { error: "Başlık gerekli." } as const;
  const charts = parseCharts(b.charts);
  const url = str(b.sourceUrl, 600);
  if (url && !/^https?:\/\//i.test(url)) return { error: "Rapor bağlantısı http(s):// ile başlamalı." } as const;
  const year = parseInt(String(b.sourceYear ?? ""), 10);
  return {
    title,
    summary: str(b.summary, 1200),
    body: str(b.body, 20000),
    categoryId: idOrNull(b.categoryId),
    coverId: idOrNull(b.coverId),
    sourceTitle: str(b.sourceTitle, 300),
    sourceUrl: url,
    sourceSeries: str(b.sourceSeries, 200),
    sourceYear: year >= 1990 && year <= 2100 ? year : null,
    isbn: str(b.isbn, 40),
    method: str(b.method, 2000),
    stats: parseStats(b.stats),
    charts,
    featured: !!b.featured,
    published: !!b.published,
    sortOrder: Math.max(0, Math.min(9999, parseInt(String(b.sortOrder ?? "0"), 10) || 0)),
  };
}
