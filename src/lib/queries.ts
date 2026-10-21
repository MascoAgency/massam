import "server-only";
import { prisma } from "./db";

/** Anket kimliği → yanıt sayısı */
export async function responseCounts(surveyIds?: string[]) {
  const rows = await prisma.response.groupBy({
    by: ["surveyId"],
    _count: { _all: true },
    ...(surveyIds ? { where: { surveyId: { in: surveyIds } } } : {}),
  });
  return Object.fromEntries(rows.map((r) => [r.surveyId, r._count._all])) as Record<string, number>;
}
