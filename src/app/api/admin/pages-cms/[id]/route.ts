import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, fail, ok, readJson } from "@/lib/api";
import { pageData } from "../../news/shared";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  const { id } = await params;
  const d = pageData(await readJson(req));
  if ("error" in d) return fail(400, String(d.error));
  const p = await prisma.page.update({ where: { id }, data: d });
  return ok({ slug: p.slug });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  await prisma.page.delete({ where: { id: (await params).id } });
  return ok();
}
