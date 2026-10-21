import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, fail, ok, readJson } from "@/lib/api";
import { findingData } from "../shared";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  const { id } = await params;
  const cur = await prisma.finding.findUnique({ where: { id } });
  if (!cur) return fail(404, "Kayıt bulunamadı.");
  const d = findingData(await readJson(req));
  if ("error" in d) return fail(400, String(d.error));
  await prisma.finding.update({ where: { id }, data: { ...d, publishedAt: d.published ? cur.publishedAt ?? new Date() : cur.publishedAt } });
  return ok({ slug: cur.slug });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  await prisma.finding.delete({ where: { id: (await params).id } }).catch(() => null);
  return ok();
}
