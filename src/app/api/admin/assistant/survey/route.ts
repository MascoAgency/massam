import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, fail, ok, readJson } from "@/lib/api";
import { draftSurvey } from "@/lib/assistant";
import { surveyFields } from "@/lib/survey-fields";
import { uniqueSlug } from "@/lib/ids";
import { DEFAULT_CONSENT } from "@/lib/defaults";
import { aiErrorMessage, cleanMessages } from "../shared";

export const maxDuration = 60;

/** Araştırma fikrinden taslak platform anketi oluşturur; anket düzenlenip onaylanınca yayına alınır */
export async function POST(req: Request) {
  const u = await apiPerm("surveys");
  if (u instanceof NextResponse) return u;
  const b = await readJson(req);
  const idea = String(b.idea ?? "").trim().slice(0, 6000);
  if (idea.length < 15) return fail(400, "Araştırma fikrinizi biraz daha ayrıntılı yazın (en az birkaç cümle).");
  const count = Math.max(5, Math.min(25, parseInt(String(b.questionCount ?? "12"), 10) || 12));
  const categories = await prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, name: true } });
  try {
    const d = await draftSurvey(idea, cleanMessages(b.messages), categories, count);
    if (!d.inScope || !d.questions?.length) return fail(422, "Bu fikir bir araştırma konusu olarak değerlendirilemedi. Araştırmak istediğiniz konuyu, hedef kitleyi ve amacı yazın.");
    const forced = typeof b.categoryId === "string" && categories.some((c) => c.id === b.categoryId) ? (b.categoryId as string) : null;
    const f = surveyFields({
      title: d.title,
      description: d.description,
      thankYou: d.thankYou,
      purpose: d.purpose,
      targetGroup: d.targetGroup,
      consentText: d.consentText || DEFAULT_CONSENT,
      status: "draft",
      categoryId: forced || categories.find((c) => c.slug === d.categorySlug)?.id || null,
      questions: d.questions.map((q) => ({
        ...q,
        options: q.type === "single" || q.type === "multi" ? q.options : undefined,
        scale: q.type === "likert" ? q.scale : undefined,
        max: q.type === "rating" ? q.max : undefined,
        minLabel: q.type === "rating" ? q.minLabel : undefined,
        maxLabel: q.type === "rating" ? q.maxLabel : undefined,
      })),
    });
    if (f.error) return fail(502, "Taslak oluşturulamadı: " + f.error);
    const s = await prisma.survey.create({ data: { ...f.data!, slug: await uniqueSlug(), ownerId: u.id, isPlatform: true } });
    await prisma.usageEvent.create({ data: { userId: u.id, kind: "assistant", surveyId: s.id } }).catch(() => null);
    return ok({ id: s.id, methodNote: d.methodNote, questions: f.data!.questions.length }, { status: 201 });
  } catch (e) {
    const { status, message } = aiErrorMessage(e);
    return fail(status, message);
  }
}
