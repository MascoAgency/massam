import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, fail, ok, readJson } from "@/lib/api";
import { slugify } from "@/lib/format";
import { pageData } from "../news/shared";

const RESERVED = new Set(["anketler", "haberler", "yayinlar", "katil", "kvkk", "panel", "yonetim", "giris", "kayit"]);

export async function POST(req: Request) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  const b = await readJson<Record<string, unknown>>(req);
  const d = pageData(b);
  if ("error" in d) return fail(400, String(d.error));
  let slug = slugify(String(b.slug || d.title));
  if (RESERVED.has(slug) || (await prisma.page.findUnique({ where: { slug } }))) slug += "-" + Date.now().toString(36).slice(-4);
  const max = await prisma.page.aggregate({ _max: { sortOrder: true } });
  const p = await prisma.page.create({ data: { ...d, slug, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
  return ok({ id: p.id, slug }, { status: 201 });
}
