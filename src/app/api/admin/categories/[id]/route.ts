import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, fail, ok, readJson } from "@/lib/api";
import { categoryData } from "../shared";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  const { id } = await params;
  const b = await readJson<Record<string, unknown>>(req);
  if (typeof b.move === "number") {
    // Sıralama: komşu alanla yer değiştir
    const all = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
    const i = all.findIndex((c) => c.id === id), j = i + (b.move > 0 ? 1 : -1);
    if (i < 0 || j < 0 || j >= all.length) return ok();
    await prisma.$transaction([
      prisma.category.update({ where: { id: all[i].id }, data: { sortOrder: all[j].sortOrder } }),
      prisma.category.update({ where: { id: all[j].id }, data: { sortOrder: all[i].sortOrder } }),
    ]);
    return ok();
  }
  const d = categoryData(b);
  if ("error" in d) return fail(400, String(d.error));
  await prisma.category.update({ where: { id }, data: d });
  return ok();
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  await prisma.category.delete({ where: { id: (await params).id } });
  return ok();
}
