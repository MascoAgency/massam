import "server-only";
import type { Survey } from "@prisma/client";
import { prisma } from "./db";
import { toResp, toAnalysisLite } from "./mappers";
import { filterResponses, filterLabel } from "./survey";
import { aiPayload, claudeAnalysis, localAnalysis, AIUnavailable } from "./ai";
import type { Filter, Question } from "./types";
import type { CurrentUser } from "./session";

export async function filteredFor(s: Survey, f: Filter) {
  const all = (await prisma.response.findMany({ where: { surveyId: s.id }, select: { id: true, answers: true, submittedAt: true, durationSec: true } })).map(toResp);
  const questions = s.questions as unknown as Question[];
  return { questions, rs: filterResponses(all, f), label: filterLabel(questions, f) };
}

const NOTICE: Record<AIUnavailable["reason"], string> = {
  no_key: "Gelişmiş analiz şu an etkin değil; temel istatistik özeti üretildi.",
  rate_limited: "Analiz servisi şu an yoğun; temel istatistik özeti üretildi. Birkaç dakika sonra yeniden deneyin.",
  refusal: "Bu veri için ayrıntılı analiz üretilemedi; temel istatistik özeti üretildi.",
  failed: "Ayrıntılı analiz tamamlanamadı; temel istatistik özeti üretildi.",
};

/** Analizi çalıştırır ve kaydeder. Yalnızca gelişmiş analizler aylık kotadan düşer; istatistik özeti düşmez. */
export async function runAnalysis(user: CurrentUser, s: Survey, f: Filter) {
  const { questions, rs, label } = await filteredFor(s, f);
  if (!rs.length) return { error: "Analiz için en az bir yanıt gerekli." } as const;
  const input = { title: s.title, description: s.description, questions };
  const { data, stats } = aiPayload(input, rs, label);
  let result, model = "Gelişmiş analiz", notice: string | null = null;
  try {
    result = await claudeAnalysis(data);
  } catch (e) {
    const reason = e instanceof AIUnavailable ? e.reason : "failed";
    notice = NOTICE[reason];
    result = localAnalysis(input, stats, data.korelasyonlar);
    model = "Temel istatistik özeti";
  }
  const a = await prisma.analysis.create({
    data: { surveyId: s.id, userId: user.id, model: model, filter: label, n: rs.length, isLocal: !!result._local, result: result as object },
  });
  if (!result._local) await prisma.usageEvent.create({ data: { userId: user.id, kind: "ai", surveyId: s.id } });
  return { analysis: toAnalysisLite(a), notice } as const;
}
