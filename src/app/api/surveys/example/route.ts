import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUser, fail, ok } from "@/lib/api";
import { canCreateSurvey } from "@/lib/plans";
import { uniqueSlug } from "@/lib/ids";
import { exampleSurvey } from "@/lib/defaults";

export async function POST() {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const limitMsg = await canCreateSurvey(user);
  if (limitMsg) return fail(403, limitMsg);
  const ex = exampleSurvey(64);
  const s = await prisma.survey.create({
    data: {
      ...ex.survey,
      questions: ex.survey.questions as object[],
      slug: await uniqueSlug(),
      ownerId: user.id,
      status: "open",
      example: true,
      createdAt: new Date(Date.now() - 12 * 86400000),
      responses: { create: ex.responses },
    },
  });
  return ok({ id: s.id }, { status: 201 });
}
