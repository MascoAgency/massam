import type { Survey, Response, Analysis, Report } from "@prisma/client";
import type { SurveyLite, Resp, Question, AnalysisLite, ReportLite, AIResult } from "./types";

export const toSurveyLite = (s: Survey & { owner?: { name: string } | null }): SurveyLite => ({
  id: s.id,
  slug: s.slug,
  title: s.title,
  description: s.description,
  thankYou: s.thankYou,
  status: s.status,
  archived: s.archived,
  isPlatform: s.isPlatform,
  questions: (s.questions as unknown as Question[]) || [],
  ownerId: s.ownerId,
  ownerName: s.owner?.name,
  categoryId: s.categoryId,
  purpose: s.purpose,
  targetGroup: s.targetGroup,
  consentText: s.consentText,
  startsAt: s.startsAt ? s.startsAt.getTime() : null,
  endsAt: s.endsAt ? s.endsAt.getTime() : null,
  createdAt: s.createdAt.getTime(),
  updatedAt: s.updatedAt.getTime(),
});

export const toResp = (r: Pick<Response, "id" | "answers" | "submittedAt" | "durationSec">): Resp => ({
  id: r.id,
  answers: (r.answers as Resp["answers"]) || {},
  submittedAt: r.submittedAt.getTime(),
  durationSec: r.durationSec,
});

export const toAnalysisLite = (a: Analysis): AnalysisLite => ({
  id: a.id,
  createdAt: a.createdAt.getTime(),
  model: a.model,
  filter: a.filter,
  n: a.n,
  result: a.result as unknown as AIResult,
});

export const toReportLite = (r: Pick<Report, "id" | "createdAt" | "filename" | "n" | "filter" | "model"> & { published?: boolean }): ReportLite => ({
  published: !!r.published,
  id: r.id,
  createdAt: r.createdAt.getTime(),
  filename: r.filename,
  n: r.n,
  filter: r.filter,
  model: r.model,
});
