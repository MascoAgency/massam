import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, fail, ok, readJson } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  const b = await readJson<{ alt?: string; credit?: string }>(req);
  const data: { alt?: string; credit?: string } = {};
  if (b.alt !== undefined) data.alt = String(b.alt || "").trim().slice(0, 300);
  if (b.credit !== undefined) data.credit = String(b.credit || "").trim().slice(0, 300);
  await prisma.media.update({ where: { id: (await params).id }, data });
  return ok();
}

/** Silme: kullanımda olan dosya silinmez */
export async function DELETE(_req: Request, { params }: Ctx) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  const { id } = await params;
  const url = `/medya/${id}`;
  const [n1, n2, n3, settings] = await Promise.all([
    prisma.news.count({ where: { OR: [{ coverId: id }, { body: { contains: url } }] } }),
    prisma.page.count({ where: { OR: [{ coverId: id }, { body: { contains: url } }] } }),
    prisma.publication.count({ where: { OR: [{ coverId: id }, { pdfId: id }, { body: { contains: url } }] } }),
    prisma.siteSetting.findMany({ select: { value: true } }),
  ]);
  const inSettings = settings.some((s) => JSON.stringify(s.value).includes(id));
  if (n1 + n2 + n3 || inSettings) return fail(409, "Bu dosya bir haberde, sayfada, yayında veya ana sayfada kullanılıyor. Önce oradan kaldırın.");
  await prisma.media.delete({ where: { id } });
  return ok();
}
