import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "./db";
import { can, isStaff, type Perm } from "./roles";

/** Oturumdaki kullanıcıyı veritabanından taze okur (rol, plan, devre dışı durumu her istekte güncel). */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id }, include: { plan: true } });
  if (!user || user.disabled) return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(next?: string) {
  const u = await getCurrentUser();
  if (!u) redirect("/giris" + (next ? `?next=${encodeURIComponent(next)}` : ""));
  return u;
}

/** Yönetim paneline erişim: yönetici, araştırma sorumlusu, editör, analist */
export async function requireStaff() {
  const u = await requireUser("/yonetim");
  if (!isStaff(u.role)) redirect("/panel");
  return u;
}

export async function requirePerm(perm: Perm) {
  const u = await requireStaff();
  if (!can(u.role, perm)) redirect("/yonetim");
  return u;
}

export const requireAdmin = () => requirePerm("users");
