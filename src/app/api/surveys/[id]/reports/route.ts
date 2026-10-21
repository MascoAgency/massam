import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUser, fail, ok, ownSurvey, readJson } from "@/lib/api";
import { checkMonthly } from "@/lib/plans";
import { cleanFilter } from "@/lib/survey";
import { filteredFor, runAnalysis } from "@/lib/analysis";
import { computeStats } from "@/lib/stats";
import { toAnalysisLite, toReportLite } from "@/lib/mappers";
import { slugify } from "@/lib/format";
import type { ReportSnapshot } from "@/lib/report/types";

export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const s = await ownSurvey(user, (await params).id, "analyze");
  if (!s) return fail(404, "Anket bulunamadı.");
  const pdfLimit = await checkMonthly(user, "pdf");
  if (pdfLimit) return fail(403, pdfLimit);

  const b = await readJson<{ filter?: unknown; analysisId?: string }>(req);
  const f = cleanFilter(b.filter);
  const { questions, rs, label } = await filteredFor(s, f);
  if (!rs.length) return fail(400, "Rapor için en az bir yanıt gerekli.");

  // Rapor, mevcut filtre ve yanıt sayısıyla birebir eşleşen bir analize dayanmalı; yoksa önce analiz yapılır
  let analysis = b.analysisId ? await prisma.analysis.findFirst({ where: { id: b.analysisId, surveyId: s.id } }).then((a) => (a ? toAnalysisLite(a) : null)) : null;
  let notice: string | null = null;
  if (!analysis || analysis.filter !== label || analysis.n !== rs.length) {
    const aiLimit = await checkMonthly(user, "ai");
    if (aiLimit) return fail(403, "Rapor için güncel veriyle analiz gerekiyor ancak " + aiLimit.charAt(0).toLocaleLowerCase("tr-TR") + aiLimit.slice(1));
    const r = await runAnalysis(user, s, f);
    if ("error" in r) return fail(400, r.error!);
    analysis = r.analysis;
    notice = r.notice;
  }

  const stats = computeStats(questions, rs);
  Object.values(stats.q).forEach((x) => (x.texts = x.texts.slice(0, 25).map((t) => t.slice(0, 400))));
  const createdAt = Date.now();
  const snapshot: ReportSnapshot = {
    survey: { title: s.title, description: s.description, questions },
    stats,
    analysis: analysis.result,
    model: analysis.model,
    filter: label,
    createdAt,
    author: user.name,
    institution: user.institution,
  };
  const filename = `${slugify(s.title)}-rapor-${new Date(createdAt).toISOString().slice(0, 10)}.pdf`;
  const rep = await prisma.report.create({
    data: { surveyId: s.id, userId: user.id, filename, n: stats.n, filter: label, model: analysis.model, snapshot: snapshot as object },
  });
  await prisma.usageEvent.create({ data: { userId: user.id, kind: "pdf", surveyId: s.id } });
  return ok({ report: toReportLite(rep), analysis, notice }, { status: 201 });
}
