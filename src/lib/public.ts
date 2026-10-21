import "server-only";
import { prisma } from "./db";
import { isOpenNow, estMinutes, numericQ } from "./survey";
import type { Question } from "./types";
import type { ReportSnapshot } from "./report/types";
import type { Prisma } from "@prisma/client";
import { parseCharts, parseStats, type PublicFinding } from "./findings";

/** Herkese açık sayfalarda kullanılan sorgular. Yalnızca toplu (anonim) veri döner; tek tek yanıtlar asla dönmez. */

export async function activeCategories() {
  return prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
}

export type PublicSurveyCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: { name: string; slug: string } | null;
  minutes: number;
  questions: number;
  open: boolean;
  statusLabel: string;
  endsAt: number | null;
  responses: number;
  updatedAt: number;
};

const surveyStatusLabel = (s: { status: string; archived: boolean; startsAt: Date | null; endsAt: Date | null }) => {
  if (isOpenNow(s)) return "Katılıma açık";
  if (s.status === "open" && !s.archived && s.startsAt && s.startsAt.getTime() > Date.now()) return "Yakında";
  return "Tamamlandı";
};

/** Platform anketleri (taslaklar hariç) */
export async function publicSurveys(opts: { categorySlug?: string; take?: number } = {}): Promise<PublicSurveyCard[]> {
  const rows = await prisma.survey.findMany({
    where: { isPlatform: true, status: { not: "draft" }, ...(opts.categorySlug ? { category: { slug: opts.categorySlug } } : {}) },
    orderBy: { updatedAt: "desc" },
    take: opts.take,
    include: { category: { select: { name: true, slug: true } }, _count: { select: { responses: true } } },
  });
  return rows.map((s) => {
    const qs = (s.questions as unknown as Question[]) || [];
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: s.description,
      category: s.category,
      minutes: estMinutes(qs),
      questions: qs.length,
      open: isOpenNow(s),
      statusLabel: surveyStatusLabel(s),
      endsAt: s.endsAt ? s.endsAt.getTime() : null,
      responses: s._count.responses,
      updatedAt: s.updatedAt.getTime(),
    };
  });
}

export type PublicResultCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: { name: string; slug: string } | null;
  n: number;
  publishedAt: number;
  agenda: boolean;
};

/** Yayın onayı verilmiş araştırma sonuçları */
export async function publishedResults(opts: { categorySlug?: string; take?: number; agenda?: boolean } = {}): Promise<PublicResultCard[]> {
  const rows = await prisma.report.findMany({
    where: {
      published: true,
      slug: { not: null },
      ...(opts.agenda ? { agenda: true } : {}),
      ...(opts.categorySlug ? { survey: { category: { slug: opts.categorySlug } } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: opts.take,
    include: { survey: { select: { title: true, description: true, category: { select: { name: true, slug: true } } } } },
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug!,
    title: r.survey.title,
    summary: r.summary || (r.snapshot as unknown as ReportSnapshot)?.analysis?.ozet?.slice(0, 400) || r.survey.description,
    category: r.survey.category,
    n: r.n,
    publishedAt: (r.publishedAt || r.createdAt).getTime(),
    agenda: r.agenda,
  }));
}

export type ChartQ = {
  id: string;
  title: string;
  type: Question["type"];
  answered: number;
  counts: { label: string; count: number; pct: number }[];
  mean: number | null;
  max?: number;
  agree?: number;
};

/** Rapor anlık görüntüsünden grafik verisi (açık uçlu metinler dahil edilmez) */
export function chartQuestions(snap: ReportSnapshot, only?: string[]): ChartQ[] {
  return snap.survey.questions
    .filter((q) => q.type !== "open" && (!only || !only.length || only.includes(q.id)))
    .map((q) => {
      const x = snap.stats.q[q.id];
      const c: ChartQ | null = x ? { id: q.id, title: q.title, type: q.type, answered: x.answered, counts: x.counts, mean: x.mean, max: x.max, agree: x.agree } : null;
      return c;
    })
    .filter((x): x is ChartQ => !!x && x.answered > 0);
}

/** Öne çıkarılan sorular; seçilmemişse ilk iki grafiklenebilir soru */
export function highlightQuestions(snap: ReportSnapshot, highlights: string[]): ChartQ[] {
  const all = chartQuestions(snap);
  const chosen = highlights.length ? all.filter((q) => highlights.includes(q.id)) : all.slice(0, 2);
  return chosen.length ? chosen : all.slice(0, 2);
}

/** Günlük katılım (yalnızca sayılar) */
export async function dailyParticipation(surveyId: string): Promise<{ day: string; n: number }[]> {
  const rows = await prisma.$queryRaw<{ day: Date; n: bigint }[]>`
    SELECT date_trunc('day', "submittedAt" AT TIME ZONE 'Europe/Istanbul') AS day, COUNT(*)::bigint AS n
    FROM "Response" WHERE "surveyId" = ${surveyId} GROUP BY 1 ORDER BY 1`;
  return rows.map((r) => ({ day: new Date(r.day).toISOString().slice(0, 10), n: Number(r.n) }));
}

export const isLikertLike = (q: { type: Question["type"] }) => numericQ({ type: q.type } as Question);

export type PublicNews = { id: string; slug: string; title: string; summary: string; coverId: string | null; publishedAt: number; authorName: string };

/** Yayımlanmış (ve yayın tarihi gelmiş) haberler */
export async function publishedNews(opts: { take?: number; featured?: boolean; categoryId?: string } = {}): Promise<PublicNews[]> {
  const rows = await prisma.news.findMany({
    where: { published: true, publishedAt: { lte: new Date() }, ...(opts.featured ? { featured: true } : {}), ...(opts.categoryId ? { categoryId: opts.categoryId } : {}) },
    orderBy: { publishedAt: "desc" },
    take: opts.take,
    select: { id: true, slug: true, title: true, summary: true, coverId: true, publishedAt: true, authorName: true },
  });
  return rows.map((n) => ({ ...n, publishedAt: n.publishedAt!.getTime() }));
}

export async function footerPages() {
  return prisma.page.findMany({ where: { published: true, showInFooter: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, title: true } });
}

export async function publishedFindings(opts: { categorySlug?: string; featured?: boolean; take?: number } = {}): Promise<PublicFinding[]> {
  const rows = await prisma.finding.findMany({
    where: { published: true, ...(opts.featured ? { featured: true } : {}), ...(opts.categorySlug ? { category: { slug: opts.categorySlug } } : {}) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: opts.take,
    include: { category: { select: { name: true, slug: true, icon: true } } },
  });
  return rows.map(toPublicFinding);
}

export async function findingBySlug(slug: string): Promise<PublicFinding | null> {
  const f = await prisma.finding.findUnique({ where: { slug }, include: { category: { select: { name: true, slug: true, icon: true } } } });
  return f && f.published ? toPublicFinding(f) : null;
}

function toPublicFinding(f: Prisma.FindingGetPayload<{ include: { category: { select: { name: true; slug: true; icon: true } } } }>): PublicFinding {
  return {
    id: f.id,
    slug: f.slug,
    title: f.title,
    summary: f.summary,
    body: f.body,
    category: f.category,
    sourceTitle: f.sourceTitle,
    sourceUrl: f.sourceUrl,
    sourceSeries: f.sourceSeries,
    sourceYear: f.sourceYear,
    isbn: f.isbn,
    method: f.method,
    stats: parseStats(f.stats),
    charts: parseCharts(f.charts),
    featured: f.featured,
  };
}
