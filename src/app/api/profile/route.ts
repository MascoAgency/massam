import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { apiUser, fail, ok, readJson } from "@/lib/api";

const FIELDS = ["", "Uluslararası İlişkiler", "Siyaset Bilimi", "Kamu Yönetimi", "Sosyoloji", "Ekonomi", "Diğer"];

export async function PUT(req: Request) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const b = await readJson<Record<string, string>>(req);

  // Şifre değiştirme
  if (b.newPassword !== undefined) {
    if (!(await bcrypt.compare(String(b.currentPassword || ""), user.passwordHash))) return fail(400, "Mevcut şifre hatalı.");
    if (String(b.newPassword).length < 8) return fail(400, "Yeni şifre en az 8 karakter olmalı.");
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(String(b.newPassword), 11) } });
    return ok();
  }

  const name = String(b.name || "").trim().slice(0, 120);
  if (!name) return fail(400, "Ad soyad gerekli.");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      institution: String(b.institution || "").trim().slice(0, 200),
      title: String(b.title || "").trim().slice(0, 120),
      field: FIELDS.includes(b.field) ? b.field : "",
    },
  });
  return ok();
}
