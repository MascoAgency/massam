import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, fail, ok, readJson } from "@/lib/api";
import { slugify } from "@/lib/format";
import { categoryData } from "./shared";

/** Yeni araştırma alanı */
export async function POST(req: Request) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  const d = categoryData(await readJson(req));
  if ("error" in d) return fail(400, String(d.error));
  let slug = slugify(d.name);
  if (await prisma.category.findUnique({ where: { slug } })) slug += "-" + Date.now().toString(36).slice(-4);
  const max = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const c = await prisma.category.create({ data: { ...d, slug, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
  return ok({ id: c.id }, { status: 201 });
}
