import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUser, fail, ok, readJson } from "@/lib/api";
import { parseDemographics } from "@/lib/demographics";

/** Katılımcı bilgilerini (yaş, cinsiyet, eğitim) kaydeder veya günceller */
export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const demo = parseDemographics(await readJson<{ age?: string; gender?: string; education?: string }>(req));
  if ("error" in demo) return fail(400, demo.error!);
  await prisma.user.update({ where: { id: user.id }, data: demo.data });
  return ok({ ok: true });
}
