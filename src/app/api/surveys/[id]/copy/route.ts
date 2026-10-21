import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUser, fail, ok, ownSurvey } from "@/lib/api";
import { canCreateSurvey } from "@/lib/plans";
import { uniqueSlug } from "@/lib/ids";
import { can } from "@/lib/roles";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const s = await ownSurvey(user, (await params).id, "view");
  if (!s) return fail(404, "Anket bulunamadı.");
  const limitMsg = await canCreateSurvey(user);
  if (limitMsg) return fail(403, limitMsg);
  const c = await prisma.survey.create({
    data: {
      slug: await uniqueSlug(),
      ownerId: user.id,
      title: (s.title + " (kopya)").slice(0, 300),
      description: s.description,
      thankYou: s.thankYou,
      questions: s.questions as object[],
      status: "draft",
      isPlatform: can(user.role, "surveys") && s.isPlatform,
    },
  });
  return ok({ id: c.id }, { status: 201 });
}
