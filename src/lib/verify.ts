import "server-only";
import { prisma } from "./db";
import { randomToken, sha256 } from "./ids";
import { sendMail } from "./email";
import { appUrl } from "./site";

/** Yönlendirme yalnızca site içi yollara izin verir (açık yönlendirme engeli) */
export const safeNext = (v: unknown) => {
  const s = String(v ?? "");
  return /^\/(?!\/)[\w\-./?=&%]*$/.test(s) ? s.slice(0, 300) : "";
};

/** E-posta doğrulama bağlantısı oluşturur ve gönderir (15 dakikada en fazla 3) */
export async function sendVerification(user: { id: string; email: string; name: string }, next = "") {
  const recent = await prisma.emailVerificationToken.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 15 * 60_000) } } });
  if (recent >= 3) return { sent: false, reason: "too_many" as const };
  // Yeniden gönderimde hedef belirtilmemişse önceki bağlantının hedefi (ör. katılınacak anket) korunur
  if (!safeNext(next)) next = (await prisma.emailVerificationToken.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { next: true } }))?.next || "";
  const token = randomToken();
  await prisma.emailVerificationToken.create({ data: { userId: user.id, tokenHash: sha256(token), next: safeNext(next), expiresAt: new Date(Date.now() + 24 * 3600_000) } });
  const link = `${appUrl()}/eposta-dogrula?token=${token}`;
  const name = user.name.replace(/</g, "&lt;");
  await sendMail(
    user.email,
    "MASSAM Araştırma — e-posta adresinizi doğrulayın",
    `Merhaba ${user.name},\n\nMASSAM Araştırma üyeliğinizi tamamlamak ve anketlere katılabilmek için e-posta adresinizi doğrulayın (bağlantı 24 saat geçerlidir):\n${link}\n\nBu üyeliği siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz.\n\nMASSAM Araştırma`,
    `<p>Merhaba ${name},</p><p>MASSAM Araştırma üyeliğinizi tamamlamak ve anketlere katılabilmek için e-posta adresinizi doğrulayın. Bağlantı 24 saat geçerlidir.</p><p><a href="${link}" style="display:inline-block;background:#0B1F3A;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">E-postamı doğrula</a></p><p style="color:#5A6680;font-size:13px">Düğme çalışmazsa bu bağlantıyı tarayıcınıza yapıştırın:<br>${link}</p><p>Bu üyeliği siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz.</p><p>MASSAM Araştırma</p>`,
  );
  return { sent: true as const };
}

/** Bağlantıdaki belirteci doğrular; başarılıysa kullanıcıyı doğrulanmış işaretler */
export async function consumeVerification(token: string) {
  const t = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: sha256(token) }, include: { user: { select: { id: true, emailVerifiedAt: true } } } });
  if (!t || t.usedAt || t.expiresAt < new Date()) return null;
  await prisma.$transaction([
    prisma.emailVerificationToken.update({ where: { id: t.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: t.userId }, data: { emailVerifiedAt: t.user.emailVerifiedAt ?? new Date() } }),
  ]);
  return { userId: t.userId, next: t.next };
}
