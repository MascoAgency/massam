import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, fail, ok, readJson } from "@/lib/api";
import { slugify } from "@/lib/format";
import { newsData } from "./shared";

export async function POST(req: Request) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  const d = newsData(await readJson(req));
  if ("error" in d) return fail(400, String(d.error));
  let slug = slugify(d.title);
  if (await prisma.news.findUnique({ where: { slug } })) slug += "-" + Date.now().toString(36).slice(-4);
  const n = await prisma.news.create({ data: { ...d, slug } });
  return ok({ id: n.id, slug }, { status: 201 });
}
