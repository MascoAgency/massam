import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUser, fail, ok, readJson } from "@/lib/api";

/** Ödeme sağlayıcısı yapılandırılmadığında: plan talebi yöneticinin onayına gider. */
export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const { planId } = await readJson<{ planId?: string }>(req);
  const plan = planId ? await prisma.plan.findUnique({ where: { id: planId } }) : null;
  if (!plan) return fail(400, "Plan bulunamadı.");
  if (plan.id === user.planId) return fail(400, "Bu plan zaten kullanılıyor.");
  // Ücretsiz plana geçiş onay gerektirmez
  if (plan.priceTry <= 0 && !user.subscriptionId) {
    await prisma.user.update({ where: { id: user.id }, data: { planId: plan.id, requestedPlanId: null, requestedAt: null } });
    return ok({ switched: true });
  }
  await prisma.user.update({ where: { id: user.id }, data: { requestedPlanId: plan.id, requestedAt: new Date() } });
  return ok({ requested: true });
}
