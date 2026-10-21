import { sanitizeQuestions } from "./survey";
import type { SurveyStatus } from "./types";

/** Anket oluşturma/güncelleme gövdesini doğrular. */
export function surveyFields(b: Record<string, unknown>) {
  const title = String(b.title || "").trim().slice(0, 300);
  if (!title) return { error: "Anket başlığı gerekli." };
  const { questions, error } = sanitizeQuestions(b.questions);
  if (error) return { error };
  const status = (["draft", "open", "closed"].includes(String(b.status)) ? b.status : "draft") as SurveyStatus;
  const date = (v: unknown) => {
    if (!v) return null;
    const d = new Date(typeof v === "number" ? v : String(v));
    return isNaN(d.getTime()) ? null : d;
  };
  const startsAt = date(b.startsAt), endsAt = date(b.endsAt);
  if (startsAt && endsAt && endsAt <= startsAt) return { error: "Bitiş tarihi başlangıç tarihinden sonra olmalı." };
  return {
    data: {
      title,
      description: String(b.description || "").slice(0, 5000),
      thankYou: String(b.thankYou || "").slice(0, 500),
      status,
      questions: questions as object[],
      categoryId: typeof b.categoryId === "string" && b.categoryId ? b.categoryId : null,
      purpose: String(b.purpose || "").slice(0, 2000),
      targetGroup: String(b.targetGroup || "").slice(0, 500),
      consentText: String(b.consentText || "").slice(0, 5000),
      startsAt,
      endsAt,
    },
  };
}

/** Geçersiz kategori kimliğini temizler (sunucu tarafı) */
export async function checkCategory<T extends { categoryId: string | null }>(data: T, exists: (id: string) => Promise<boolean>): Promise<T> {
  if (data.categoryId && !(await exists(data.categoryId))) data.categoryId = null;
  return data;
}
