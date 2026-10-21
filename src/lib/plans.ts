import "server-only";
import type { Plan } from "@prisma/client";
import { prisma } from "./db";
import type { PlanLite } from "./types";
import type { CurrentUser } from "./session";
import { lim } from "./format";
import { isStaff } from "./roles";


export const toPlanLite = (p: Plan): PlanLite => ({
  id: p.id,
  name: p.name,
  note: p.note,
  price: p.priceTry,
  stripePriceId: p.stripePriceId,
  limits: { surveys: p.limitSurveys, responses: p.limitResponses, ai: p.limitAi, pdf: p.limitPdf, retention: p.retentionMonths },
});

export async function allPlans(): Promise<PlanLite[]> {
  const ps = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  return ps.map(toPlanLite);
}

/** Yönetim personeli Kurumsal plan haklarıyla ve analiz/PDF/anket sınırı olmadan çalışır. */
export async function effectivePlan(user: { role: string; plan: Plan }): Promise<PlanLite> {
  if (isStaff(user.role)) {
    const corp = await prisma.plan.findUnique({ where: { id: "corp" } });
    if (corp) return toPlanLite(corp);
  }
  return toPlanLite(user.plan);
}

export async function planForOwner(ownerId: string): Promise<PlanLite> {
  const u = await prisma.user.findUnique({ where: { id: ownerId }, include: { plan: true } });
  if (!u) return toPlanLite((await prisma.plan.findUnique({ where: { id: "free" } }))!);
  return effectivePlan(u);
}

/** İstanbul saatine göre içinde bulunulan ayın başlangıcı (UTC+3, yaz saati yok). */
export function monthStart(now = new Date()) {
  const tr = new Date(now.getTime() + 3 * 3600_000);
  return new Date(Date.UTC(tr.getUTCFullYear(), tr.getUTCMonth(), 1) - 3 * 3600_000);
}

export async function usageThisMonth(userId: string) {
  const since = monthStart();
  const [ai, pdf] = await Promise.all([
    prisma.usageEvent.count({ where: { userId, kind: "ai", createdAt: { gte: since } } }),
    prisma.usageEvent.count({ where: { userId, kind: "pdf", createdAt: { gte: since } } }),
  ]);
  return { ai, pdf };
}

export async function canCreateSurvey(user: CurrentUser): Promise<string | null> {
  if (isStaff(user.role)) return null;
  const p = toPlanLite(user.plan);
  const n = await prisma.survey.count({ where: { ownerId: user.id } });
  if (n >= lim(p.limits.surveys))
    return `${p.name} planında en fazla ${p.limits.surveys} anket oluşturabilirsiniz. Planınızı yükseltin veya eski anketleri silin.`;
  return null;
}

export async function checkMonthly(user: CurrentUser, kind: "ai" | "pdf"): Promise<string | null> {
  if (isStaff(user.role)) return null;
  const p = toPlanLite(user.plan);
  const used = (await usageThisMonth(user.id))[kind];
  const max = kind === "ai" ? p.limits.ai : p.limits.pdf;
  if (used >= lim(max))
    return kind === "ai"
      ? `Bu ayki analiz hakkınız (${max}) doldu. Planınızı yükseltebilirsiniz.`
      : `Bu ayki PDF rapor hakkınız (${max}) doldu.`;
  return null;
}
