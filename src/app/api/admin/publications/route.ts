import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, fail, ok, readJson } from "@/lib/api";
import { slugify } from "@/lib/format";
import { publicationData } from "./shared";

export async function POST(req: Request) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  const b = await readJson<Record<string, unknown>>(req);
  const d = publicationData(b);
  if ("error" in d) return fail(400, String(d.error));
  let slug = slugify(d.title);
  if (await prisma.publication.findUnique({ where: { slug } })) slug += "-" + Date.now().toString(36).slice(-4);
  const p = await prisma.publication.create({ data: { ...d, slug, published: !!b.published, publishedAt: b.published ? new Date() : null } });
  return ok({ id: p.id }, { status: 201 });
}
