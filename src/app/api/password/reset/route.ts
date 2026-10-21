import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { fail, ok, readJson } from "@/lib/api";
import { sha256 } from "@/lib/ids";

export async function POST(req: Request) {
  const { token, password } = await readJson<{ token?: string; password?: string }>(req);
  if (!token) return fail(400, "Sıfırlama bağlantısı geçersiz.");
  if (!password || password.length < 8) return fail(400, "Şifre en az 8 karakter olmalı.");
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) }, include: { user: { select: { email: true } } } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return fail(400, "Bağlantının süresi dolmuş ya da daha önce kullanılmış. Yeni bir sıfırlama bağlantısı isteyin.");
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash: await bcrypt.hash(password, 11) } }),
    prisma.passwordResetToken.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.loginAttempt.deleteMany({ where: { email: row.user.email } }),
  ]);
  return ok();
}
