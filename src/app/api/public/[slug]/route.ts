import { prisma } from "@/lib/db";
import { fail, ok, readJson } from "@/lib/api";
import { planForOwner } from "@/lib/plans";
import { sanitizeAnswers, isOpenNow } from "@/lib/survey";
import { sha256 } from "@/lib/ids";
import { lim } from "@/lib/format";
import type { Question } from "@/lib/types";
import { getCurrentUser } from "@/lib/session";
import { isStaff } from "@/lib/roles";
import { snapshot } from "@/lib/demographics";

const PER_IP_PER_HOUR = 200; // seminer/stant gibi tek cihazdan ardışık katılıma izin verecek kadar geniş

/** Üye katılımı: e-postası doğrulanmış üye her ankete bir kez yanıt gönderir. Yanıt, kimlikle eşleştirilmeden kaydedilir. */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await prisma.survey.findUnique({ where: { slug } });
  if (!s) return fail(404, "Anket bulunamadı.");
  if (!isOpenNow(s)) return fail(409, "Bu anket şu anda yanıt kabul etmiyor.");

  const b = await readJson<{ answers?: unknown; startedAt?: number; kiosk?: boolean; website?: string }>(req);
  if (b.website) return ok(); // bot tuzağı (gizli alan doldurulmuş)

  const u = await getCurrentUser();
  if (!u) return fail(401, "Ankete katılmak için üye girişi yapmanız gerekir.", { code: "auth" });
  const kiosk = !!b.kiosk && (u.id === s.ownerId || isStaff(u.role));
  if (!kiosk && !u.emailVerifiedAt) return fail(403, "Ankete katılmak için e-posta adresinizi doğrulamanız gerekir.", { code: "verify" });
  if (!kiosk && (await prisma.surveyParticipation.findUnique({ where: { surveyId_userId: { surveyId: s.id, userId: u.id } }, select: { id: true } })))
    return fail(409, "Bu ankete daha önce katıldınız.", { code: "already" });
  const demographics = kiosk ? null : snapshot(u);
  if (!kiosk && !demographics) return fail(403, "Ankete katılmadan önce yaş, cinsiyet ve eğitim bilgilerinizi tamamlayın.", { code: "profile" });

  const questions = s.questions as unknown as Question[];
  const { answers, missing } = sanitizeAnswers(questions, b.answers);
  if (missing.length) return fail(400, `${missing.length} zorunlu soru cevaplanmadı.`, { missing });
  if (!Object.keys(answers).length) return fail(400, "En az bir soruyu cevaplayın.");

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "yerel";
  const ipHash = sha256(ip + "|" + (process.env.AUTH_SECRET || "")).slice(0, 32);
  const recent = await prisma.response.count({ where: { surveyId: s.id, ipHash, submittedAt: { gte: new Date(Date.now() - 3600_000) } } });
  if (recent >= PER_IP_PER_HOUR) return fail(429, "Bu bağlantıdan çok sayıda yanıt gönderildi. Lütfen daha sonra yeniden deneyin.");

  const plan = await planForOwner(s.ownerId);
  if (lim(plan.limits.responses) !== Infinity) {
    const n = await prisma.response.count({ where: { surveyId: s.id } });
    if (n >= plan.limits.responses)
      return fail(403, "Bu anket, araştırmacının üyelik planındaki katılımcı sınırına ulaştı. Araştırmacı planını yükselttiğinde yeniden açılacaktır.", { code: "limit" });
  }

  const now = Date.now();
  const startedAt = typeof b.startedAt === "number" && b.startedAt > now - 86400_000 && b.startedAt <= now ? new Date(b.startedAt) : null;
  const response = prisma.response.create({
    data: {
      surveyId: s.id,
      answers,
      startedAt,
      submittedAt: new Date(now),
      durationSec: startedAt ? Math.round((now - startedAt.getTime()) / 1000) : null,
      source: kiosk ? "kiosk" : "web",
      ipHash,
      ...(demographics ? { demographics } : {}),
    },
  });
  // Katılım kaydı ile yanıt arasında bağlantı tutulmaz; benzersiz kısıt ikinci katılımı engeller.
  try {
    if (kiosk) await response;
    else await prisma.$transaction([response, prisma.surveyParticipation.create({ data: { surveyId: s.id, userId: u.id } })]);
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return fail(409, "Bu ankete daha önce katıldınız.", { code: "already" });
    throw e;
  }
  return ok({ ok: true }, { status: 201 });
}
