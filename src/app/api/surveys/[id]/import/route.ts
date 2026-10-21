import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUser, fail, ok, ownSurvey, readJson } from "@/lib/api";
import { planForOwner } from "@/lib/plans";
import { sanitizeAnswers } from "@/lib/survey";
import { lim } from "@/lib/format";
import type { Question } from "@/lib/types";

/** CSV içe aktarma: istemci CSV'yi soru kimliklerine eşleyip satırları gönderir. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const s = await ownSurvey(user, (await params).id, "raw");
  if (!s) return fail(404, "Anket bulunamadı.");
  const { rows } = await readJson<{ rows?: unknown[] }>(req);
  if (!Array.isArray(rows) || !rows.length) return fail(400, "İçe aktarılacak satır yok.");
  const questions = s.questions as unknown as Question[];
  const plan = await planForOwner(s.ownerId);
  const count = await prisma.response.count({ where: { surveyId: s.id } });
  const room = Math.max(0, Math.min(lim(plan.limits.responses) - count, 5000));
  if (!room) return fail(403, "Planınızın katılımcı sınırı dolu.");
  const data = rows
    .slice(0, room)
    .map((r) => sanitizeAnswers(questions, r).answers)
    .filter((a) => Object.keys(a).length)
    .map((answers) => ({ surveyId: s.id, answers, source: "csv" }));
  if (data.length) await prisma.response.createMany({ data });
  return ok({ imported: data.length, skipped: rows.length - data.length });
}
