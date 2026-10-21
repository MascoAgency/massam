import { NextResponse } from "next/server";
import { apiUser, fail, ok, ownSurvey, readJson } from "@/lib/api";
import { checkMonthly } from "@/lib/plans";
import { cleanFilter } from "@/lib/survey";
import { runAnalysis } from "@/lib/analysis";

export const maxDuration = 300; // uzun AI analizleri için (Vercel)

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const s = await ownSurvey(user, (await params).id, "analyze");
  if (!s) return fail(404, "Anket bulunamadı.");
  const limitMsg = await checkMonthly(user, "ai");
  if (limitMsg) return fail(403, limitMsg);
  const { filter } = await readJson<{ filter?: unknown }>(req);
  const r = await runAnalysis(user, s, cleanFilter(filter));
  if ("error" in r) return fail(400, r.error!);
  return ok(r);
}
