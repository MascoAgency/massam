import { prisma } from "@/lib/db";
import { ok, readJson } from "@/lib/api";
import { randomToken, sha256 } from "@/lib/ids";
import { sendMail } from "@/lib/email";
import { appUrl } from "@/lib/site";

export async function POST(req: Request) {
  const { email } = await readJson<{ email?: string }>(req);
  const e = String(email || "").trim().toLowerCase();
  const user = e ? await prisma.user.findUnique({ where: { email: e } }) : null;
  // Hesabın var olup olmadığını açığa vurmamak için her durumda aynı yanıt döner
  if (user && !user.disabled) {
    const recent = await prisma.passwordResetToken.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 15 * 60_000) } } });
    if (recent < 3) {
      const token = randomToken();
      await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60 * 60_000) } });
      const link = `${appUrl()}/sifre-sifirla?token=${token}`;
      await sendMail(
        user.email,
        "MASSAM Araştırma — şifre sıfırlama",
        `Merhaba ${user.name},\n\nŞifrenizi sıfırlamak için aşağıdaki bağlantıyı açın (1 saat geçerlidir):\n${link}\n\nBu talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.\n\nMASSAM Araştırma`,
        `<p>Merhaba ${user.name.replace(/</g, "&lt;")},</p><p>Şifrenizi sıfırlamak için aşağıdaki bağlantıyı açın (1 saat geçerlidir):</p><p><a href="${link}">Şifremi sıfırla</a></p><p>Bu talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p><p>MASSAM Araştırma</p>`,
      ).catch((err) => console.error("Şifre sıfırlama e-postası gönderilemedi:", err));
    }
  }
  return ok({ ok: true });
}
