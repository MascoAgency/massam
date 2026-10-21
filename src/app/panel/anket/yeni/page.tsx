import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { canCreateSurvey } from "@/lib/plans";
import { SurveyBuilder } from "@/components/SurveyBuilder";
import { blankQuestion } from "@/lib/survey";
import { can } from "@/lib/roles";

export const metadata = { title: "Yeni anket" };

export default async function Page({ searchParams }: { searchParams: Promise<{ platform?: string }> }) {
  const user = await requireUser("/panel/anket/yeni");
  const limitMsg = await canCreateSurvey(user);
  if (limitMsg) redirect("/uyelik?sinir=anket");
  const platform = can(user.role, "surveys") && (await searchParams).platform === "1";
  const categories = await prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <SurveyBuilder
      categories={categories}
      initial={{ title: "", description: "", thankYou: "", status: "draft", isPlatform: platform, questions: [blankQuestion("single")], categoryId: null, purpose: "", targetGroup: "", consentText: "", startsAt: null, endsAt: null }}
    />
  );
}
