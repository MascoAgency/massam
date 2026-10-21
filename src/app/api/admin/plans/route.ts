import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, fail, ok, readJson } from "@/lib/api";
import type { PlanLite } from "@/lib/types";

export async function PUT(req: Request) {
  const admin = await apiPerm("plans");
  if (admin instanceof NextResponse) return admin;
  const { plans } = await readJson<{ plans?: PlanLite[] }>(req);
  if (!Array.isArray(plans)) return fail(400, "Geçersiz veri.");
  const int = (v: unknown, min = -1) => {
    const n = parseInt(String(v), 10);
    return isNaN(n) ? null : Math.max(min, n);
  };
  for (const p of plans) {
    const existing = await prisma.plan.findUnique({ where: { id: p.id } });
    if (!existing) continue;
    const L = p.limits || ({} as PlanLite["limits"]);
    await prisma.plan.update({
      where: { id: p.id },
      data: {
        name: String(p.name || existing.name).slice(0, 60),
        note: String(p.note ?? "").slice(0, 300),
        priceTry: int(p.price, 0) ?? existing.priceTry,
        limitSurveys: int(L.surveys) ?? existing.limitSurveys,
        limitResponses: int(L.responses) ?? existing.limitResponses,
        limitAi: int(L.ai) ?? existing.limitAi,
        limitPdf: int(L.pdf) ?? existing.limitPdf,
        retentionMonths: int(L.retention, 1) ?? existing.retentionMonths,
        stripePriceId: p.stripePriceId ? String(p.stripePriceId).trim().slice(0, 100) || null : null,
      },
    });
  }
  return ok();
}
