import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, fail, ok, readJson } from "@/lib/api";
import { slugify } from "@/lib/format";
import { randomSlug } from "@/lib/ids";

/**
 * Araştırma sonucu (platform anketi raporu) yayın ve içerik yönetimi.
 * Yayın onayı verilene kadar sonuçlar kamuya açılmaz.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiPerm("publish");
  if (user instanceof NextResponse) return user;
  const rep = await prisma.report.findUnique({ where: { id: (await params).id }, include: { survey: { select: { isPlatform: true, title: true } } } });
  if (!rep) return fail(404, "Rapor bulunamadı.");
  if (!rep.survey.isPlatform) return fail(400, "Yalnızca platform anketlerinin sonuçları yayımlanabilir.");
  const b = await readJson<Record<string, unknown>>(req);
  const s = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
  const data: Record<string, unknown> = {};
  for (const [k, n] of [["summary", 1200], ["scope", 2000], ["method", 3000], ["limitations", 3000], ["evaluation", 8000]] as const) if (k in b) data[k] = s(b[k], n);
  if (Array.isArray(b.highlights)) data.highlights = b.highlights.map(String).slice(0, 12);
  if (typeof b.agenda === "boolean") data.agenda = b.agenda;
  if (typeof b.published === "boolean") {
    data.published = b.published;
    data.publishedAt = b.published ? rep.publishedAt ?? new Date() : null;
    if (b.published && !rep.slug) {
      let slug = slugify(rep.survey.title);
      if (await prisma.report.findUnique({ where: { slug } })) slug = `${slug}-${randomSlug(4).toLowerCase()}`;
      data.slug = slug;
    }
  }
  const updated = await prisma.report.update({ where: { id: rep.id }, data });
  return ok({ ok: true, slug: updated.slug });
}
