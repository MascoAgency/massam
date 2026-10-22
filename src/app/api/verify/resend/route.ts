import { NextResponse } from "next/server";
import { apiUser, fail, ok, readJson } from "@/lib/api";
import { sendVerification } from "@/lib/verify";

/** Doğrulama e-postasını yeniden gönderir */
export async function POST(req: Request) {
  const u = await apiUser();
  if (u instanceof NextResponse) return u;
  if (u.emailVerifiedAt) return ok({ verified: true });
  const { next } = await readJson<{ next?: string }>(req);
  const r = await sendVerification(u, next).catch(() => ({ sent: false as const, reason: "failed" as const }));
  if (!r.sent) return fail(429, r.reason === "too_many" ? "Kısa süre içinde çok sayıda doğrulama e-postası istendi. Lütfen 15 dakika sonra yeniden deneyin." : "E-posta gönderilemedi. Lütfen daha sonra yeniden deneyin.");
  return ok({ sent: true });
}
