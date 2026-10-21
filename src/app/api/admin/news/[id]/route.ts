import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, fail, ok, readJson } from "@/lib/api";
import { newsData } from "../shared";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  const { id } = await params;
  const cur = await prisma.news.findUnique({ where: { id } });
  if (!cur) return fail(404, "Haber bulunamadı.");
  const d = newsData(await readJson(req));
  if ("error" in d) return fail(400, String(d.error));
  // Yayın tarihi verilmezse ilk yayın tarihi korunur
  if (d.published && !d.publishedAt) d.publishedAt = cur.publishedAt ?? new Date();
  await prisma.news.update({ where: { id }, data: d });
  return ok({ slug: cur.slug });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  await prisma.news.delete({ where: { id: (await params).id } });
  return ok();
}
