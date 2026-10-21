import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { fail, ok, readJson } from "@/lib/api";

export async function POST(req: Request) {
  const b = await readJson<{ name?: string; email?: string; password?: string; institution?: string; website?: string }>(req);
  if (b.website) return ok(); // bot tuzağı
  const name = String(b.name || "").trim().slice(0, 120);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 200);
  const password = String(b.password || "");
  if (!name) return fail(400, "Ad soyad gerekli.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, "Geçerli bir e-posta adresi girin.");
  if (password.length < 8) return fail(400, "Şifre en az 8 karakter olmalı.");
  if (await prisma.user.findUnique({ where: { email } })) return fail(409, "Bu e-posta adresiyle kayıtlı bir hesap var. Giriş yapın veya şifrenizi sıfırlayın.");
  await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 11), institution: String(b.institution || "").trim().slice(0, 200), planId: "free" },
  });
  return ok({ ok: true }, { status: 201 });
}
