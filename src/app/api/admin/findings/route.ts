import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, fail, ok, readJson } from "@/lib/api";
import { slugify } from "@/lib/format";
import { findingData } from "./shared";

export async function POST(req: Request) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  const d = findingData(await readJson(req));
  if ("error" in d) return fail(400, String(d.error));
  let slug = slugify(d.title);
  if (await prisma.finding.findUnique({ where: { slug } })) slug += "-" + Date.now().toString(36).slice(-4);
  const f = await prisma.finding.create({ data: { ...d, slug, publishedAt: d.published ? new Date() : null } });
  return ok({ id: f.id, slug }, { status: 201 });
}
