import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser, type CurrentUser } from "./session";
import { prisma } from "./db";
import { can, surveyAccess, type Perm } from "./roles";

export const ok = (data: unknown = { ok: true }, init?: ResponseInit) => NextResponse.json(data, init);
export const fail = (status: number, error: string, extra?: Record<string, unknown>) => NextResponse.json({ error, ...extra }, { status });

export async function apiUser(): Promise<CurrentUser | NextResponse> {
  const u = await getCurrentUser();
  if (!u) return fail(401, "Oturumunuz sona erdi. Lütfen yeniden giriş yapın.");
  return u;
}

/** Belirli bir yönetim yetkisi gerektiren uç noktalar */
export async function apiPerm(perm: Perm): Promise<CurrentUser | NextResponse> {
  const u = await apiUser();
  if (u instanceof NextResponse) return u;
  if (!can(u.role, perm)) return fail(403, "Bu işlem için yetkiniz yok.");
  return u;
}

export const apiAdmin = () => apiPerm("users");

/** Anketi, kullanıcının istenen yetkisi varsa döndürür (sahip, yönetici veya platform anketinde ilgili rol). */
export async function ownSurvey(user: CurrentUser, id: string, need: "view" | "edit" | "raw" | "analyze" = "edit") {
  const s = await prisma.survey.findUnique({ where: { id } });
  if (!s) return null;
  if (!surveyAccess(user, s)[need]) return null;
  return s;
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
