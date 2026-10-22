import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { fail, ok, readJson } from "@/lib/api";
import { safeNext, sendVerification } from "@/lib/verify";

export async function POST(req: Request) {
  const b = await readJson<{ name?: string; email?: string; password?: string; institution?: string; website?: string; kvkk?: boolean; privacy?: boolean; next?: string }>(req);
  if (b.website) return ok(); // bot tuzağı
  const name = String(b.name || "").trim().slice(0, 120);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 200);
  const password = String(b.password || "");
  if (name.length < 3 || !/\s/.test(name)) return fail(400, "Adınızı ve soyadınızı yazın.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, "Geçerli bir e-posta adresi girin.");
  if (password.length < 8) return fail(400, "Şifre en az 8 karakter olmalı.");
  if (!b.kvkk) return fail(400, "Devam etmek için KVKK Aydınlatma Metni'ni onaylamanız gerekir.");
  if (!b.privacy) return fail(400, "Devam etmek için Gizlilik Sözleşmesi'ni onaylamanız gerekir.");
  if (await prisma.user.findUnique({ where: { email } })) return fail(409, "Bu e-posta adresiyle kayıtlı bir hesap var. Giriş yapın veya şifrenizi sıfırlayın.");
  const now = new Date();
  const user = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 11), institution: String(b.institution || "").trim().slice(0, 200), planId: "free", kvkkAcceptedAt: now, privacyAcceptedAt: now },
  });
  await sendVerification(user, safeNext(b.next)).catch((e) => console.error("Doğrulama e-postası gönderilemedi:", e));
  return ok({ ok: true }, { status: 201 });
}
