import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isStaff } from "@/lib/roles";

export const runtime = "nodejs";

/**
 * Veri saklama temizliği (günlük çalıştırılır, ör. Vercel Cron).
 * Saklama süresi (sahibinin planına göre, anketin oluşturulma tarihinden itibaren) dolan anketlerin
 * yanıtları, analizleri ve raporları silinir; anket tanımı kopyalanabilsin diye arşivde kalır.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const surveys = await prisma.survey.findMany({
    where: { purgedAt: null },
    select: { id: true, createdAt: true, owner: { select: { role: true, plan: { select: { retentionMonths: true } } } } },
  });
  const corp = await prisma.plan.findUnique({ where: { id: "corp" } });
  const now = Date.now();
  let purged = 0;
  for (const s of surveys) {
    const months = isStaff(s.owner.role) ? corp?.retentionMonths ?? 60 : s.owner.plan.retentionMonths;
    const expires = new Date(s.createdAt);
    expires.setMonth(expires.getMonth() + months);
    if (expires.getTime() > now) continue;
    await prisma.$transaction([
      prisma.response.deleteMany({ where: { surveyId: s.id } }),
      prisma.analysis.deleteMany({ where: { surveyId: s.id } }),
      prisma.report.deleteMany({ where: { surveyId: s.id } }),
      prisma.survey.update({ where: { id: s.id }, data: { purgedAt: new Date(), archived: true, status: "closed" } }),
    ]);
    purged++;
  }
  // Süresi dolmuş şifre sıfırlama kayıtları
  await prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: new Date(now - 86400_000) } } });
  await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(now - 86400_000) } } });
  return NextResponse.json({ checked: surveys.length, purged });
}
