import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUser, fail, ok, ownSurvey, readJson } from "@/lib/api";
import { surveyFields, checkCategory } from "@/lib/survey-fields";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const s = await ownSurvey(user, (await params).id);
  if (!s) return fail(404, "Anket bulunamadı.");
  const f = surveyFields(await readJson(req));
  if (f.error) return fail(400, f.error);
  if (s.purgedAt && f.data!.status === "open") return fail(400, "Saklama süresi dolan anket yeniden açılamaz. Kopyalayıp yeni anket olarak başlatabilirsiniz.");
  if (s.archived && f.data!.status === "open") return fail(400, "Arşivdeki anketi açmak için önce arşivden çıkarın.");
  if (s.isPlatform && f.data!.status === "open" && !f.data!.categoryId) return fail(400, "Platform anketini yayına almadan önce araştırma alanı seçin; anket ana sayfada ve seçilen alanın sayfasında yayımlanır.");
  await prisma.survey.update({ where: { id: s.id }, data: await checkCategory(f.data!, async (id) => !!(await prisma.category.findUnique({ where: { id } }))) });
  return ok();
}

/** Durum (aç/kapat) ve arşiv işlemleri */
export async function PATCH(req: Request, { params }: Ctx) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const s = await ownSurvey(user, (await params).id);
  if (!s) return fail(404, "Anket bulunamadı.");
  const b = await readJson<{ status?: string; archived?: boolean }>(req);
  const data: { status?: "draft" | "open" | "closed"; archived?: boolean } = {};
  if (b.status && ["draft", "open", "closed"].includes(b.status)) data.status = b.status as "open";
  if (typeof b.archived === "boolean") {
    data.archived = b.archived;
    if (b.archived) data.status = "closed"; // arşivlenen anket yanıt almaz
  }
  if (data.status === "open" && s.isPlatform && !s.categoryId) return fail(400, "Platform anketini yayına almadan önce araştırma alanı seçin; anket ana sayfada ve seçilen alanın sayfasında yayımlanır.");
  if (data.status === "open" && s.purgedAt) return fail(400, "Saklama süresi dolan anket yeniden açılamaz. Kopyalayıp yeni anket olarak başlatabilirsiniz.");
  await prisma.survey.update({ where: { id: s.id }, data });
  return ok();
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const s = await ownSurvey(user, (await params).id);
  if (!s) return fail(404, "Anket bulunamadı.");
  await prisma.survey.delete({ where: { id: s.id } });
  return ok();
}
