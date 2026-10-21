import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { effectivePlan, usageThisMonth } from "@/lib/plans";
import { toSurveyLite, toResp, toAnalysisLite, toReportLite } from "@/lib/mappers";
import { shareUrl } from "@/lib/site";
import { ResultsView } from "@/components/ResultsView";
import { surveyAccess } from "@/lib/roles";

export const metadata = { title: "Sonuçlar" };
export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sekme?: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/panel/anket/${id}`);
  const s = await prisma.survey.findUnique({ where: { id }, include: { owner: { select: { name: true } } } });
  const access = s ? surveyAccess(user, s) : null;
  if (!s || !access?.view) notFound();
  const [responses, analyses, reports, plan, usage] = await Promise.all([
    prisma.response.findMany({ where: { surveyId: id }, orderBy: { submittedAt: "asc" }, select: { id: true, answers: true, submittedAt: true, durationSec: true } }),
    prisma.analysis.findMany({ where: { surveyId: id }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.report.findMany({ where: { surveyId: id }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true, filename: true, n: true, filter: true, model: true, published: true } }),
    effectivePlan(user),
    usageThisMonth(user.id),
  ]);
  return (
    <ResultsView
      survey={toSurveyLite(s)}
      responses={responses.map(toResp)}
      analyses={analyses.map(toAnalysisLite)}
      reports={reports.map(toReportLite)}
      plan={plan}
      usage={usage}
      shareUrl={shareUrl(s.slug)}
      initialTab={(await searchParams).sekme}
      access={access!}
    />
  );
}
