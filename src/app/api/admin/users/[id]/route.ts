import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiAdmin, fail, ok, readJson } from "@/lib/api";
import { ROLE_LABEL } from "@/lib/roles";

/** Yönetici: plan atama/talep onayı, rol ve hesap durumu */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await apiAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return fail(404, "Kullanıcı bulunamadı.");
  const b = await readJson<{ planId?: string; role?: string; disabled?: boolean; rejectRequest?: boolean }>(req);
  const data: Record<string, unknown> = {};
  if (b.planId) {
    if (!(await prisma.plan.findUnique({ where: { id: b.planId } }))) return fail(400, "Plan bulunamadı.");
    data.planId = b.planId;
    data.requestedPlanId = null;
    data.requestedAt = null;
  }
  if (b.rejectRequest) Object.assign(data, { requestedPlanId: null, requestedAt: null });
  if (b.role !== undefined) {
    if (!(b.role in ROLE_LABEL)) return fail(400, "Geçersiz rol.");
    if (u.id === admin.id && b.role !== "ADMIN") return fail(400, "Kendi yönetici yetkinizi kaldıramazsınız.");
    data.role = b.role;
  }
  if (typeof b.disabled === "boolean") {
    if (u.id === admin.id) return fail(400, "Kendi hesabınızı devre dışı bırakamazsınız.");
    data.disabled = b.disabled;
  }
  await prisma.user.update({ where: { id }, data });
  return ok();
}
