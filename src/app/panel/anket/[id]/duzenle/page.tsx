import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { SurveyBuilder } from "@/components/SurveyBuilder";
import { surveyAccess } from "@/lib/roles";
import type { Question } from "@/lib/types";
import { AssistantDraftNote } from "@/components/AssistantDraftNote";

export const metadata = { title: "Anket düzenleme" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ asistan?: string }> }) {
  const { id } = await params;
  const fromAssistant = (await searchParams).asistan === "1";
  const user = await requireUser(`/panel/anket/${id}/duzenle`);
  const s = await prisma.survey.findUnique({ where: { id } });
  if (!s || !surveyAccess(user, s).edit) notFound();
  const categories = await prisma.category.findMany({ where: { OR: [{ active: true }, { id: s.categoryId ?? "" }] }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <>
    {fromAssistant && s.status === "draft" ? <AssistantDraftNote id={s.id} /> : null}
    <SurveyBuilder
      key={s.updatedAt.getTime()}
      categories={categories}
      initial={{
        id: s.id,
        title: s.title,
        description: s.description,
        thankYou: s.thankYou,
        status: s.status,
        isPlatform: s.isPlatform,
        questions: s.questions as unknown as Question[],
        categoryId: s.categoryId,
        purpose: s.purpose,
        targetGroup: s.targetGroup,
        consentText: s.consentText,
        startsAt: s.startsAt ? s.startsAt.getTime() : null,
        endsAt: s.endsAt ? s.endsAt.getTime() : null,
      }}
    />
    </>
  );
}
