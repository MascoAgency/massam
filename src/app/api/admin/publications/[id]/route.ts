import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, fail, ok, readJson } from "@/lib/api";
import { publicationData } from "../shared";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  const { id } = await params;
  const cur = await prisma.publication.findUnique({ where: { id } });
  if (!cur) return fail(404, "Yayın bulunamadı.");
  const b = await readJson<Record<string, unknown>>(req);
  if (Object.keys(b).length === 1 && typeof b.published === "boolean") {
    await prisma.publication.update({ where: { id }, data: { published: b.published, publishedAt: b.published ? cur.publishedAt ?? new Date() : cur.publishedAt } });
    return ok();
  }
  const d = publicationData(b);
  if ("error" in d) return fail(400, String(d.error));
  const published = typeof b.published === "boolean" ? b.published : cur.published;
  await prisma.publication.update({ where: { id }, data: { ...d, published, publishedAt: published ? cur.publishedAt ?? new Date() : cur.publishedAt } });
  return ok();
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  await prisma.publication.delete({ where: { id: (await params).id } });
  return ok();
}
