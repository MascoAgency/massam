import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUser, fail, ok, readJson } from "@/lib/api";
import { canCreateSurvey } from "@/lib/plans";
import { surveyFields, checkCategory } from "@/lib/survey-fields";
import { uniqueSlug } from "@/lib/ids";
import { can } from "@/lib/roles";

export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const limitMsg = await canCreateSurvey(user);
  if (limitMsg) return fail(403, limitMsg);
  const b = await readJson(req);
  const f = surveyFields(b);
  if (f.error) return fail(400, f.error);
  if (can(user.role, "surveys") && b.isPlatform && f.data!.status === "open" && !f.data!.categoryId) return fail(400, "Platform anketini yayına almadan önce araştırma alanı seçin; anket ana sayfada ve seçilen alanın sayfasında yayımlanır.");
  const s = await prisma.survey.create({
    data: { ...(await checkCategory(f.data!, async (id) => !!(await prisma.category.findUnique({ where: { id } })))), slug: await uniqueSlug(), ownerId: user.id, isPlatform: can(user.role, "surveys") && !!b.isPlatform },
  });
  return ok({ id: s.id }, { status: 201 });
}
