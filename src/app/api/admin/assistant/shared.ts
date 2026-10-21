import { AIUnavailable } from "@/lib/ai";
import type { ChatMsg } from "@/lib/assistant";

/** Sohbet geçmişini doğrular: user ile başlar, roller sırayla değişir, uzunluk sınırlıdır */
export function cleanMessages(v: unknown): ChatMsg[] {
  const raw = (Array.isArray(v) ? v : [])
    .slice(-20)
    .map((m) => {
      const o = (m || {}) as Record<string, unknown>;
      return { role: o.role === "assistant" ? "assistant" : "user", content: String(o.content ?? "").trim().slice(0, 8000) } as ChatMsg;
    })
    .filter((m) => m.content);
  const out: ChatMsg[] = [];
  for (const m of raw) {
    if (!out.length && m.role !== "user") continue;
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.content += "\n\n" + m.content;
    else out.push({ ...m });
  }
  return out;
}

export function aiErrorMessage(e: unknown): { status: number; message: string } {
  if (e instanceof AIUnavailable) {
    if (e.reason === "no_key") return { status: 503, message: "Asistan henüz etkin değil: sunucuda ANTHROPIC_API_KEY tanımlanmalı." };
    if (e.reason === "rate_limited") return { status: 429, message: "Asistan şu anda yoğun. Lütfen birkaç saniye sonra yeniden deneyin." };
    if (e.reason === "refusal") return { status: 422, message: "Bu talep asistanın kapsamı dışında kaldı. Araştırma ile ilgili bir soru yazın." };
  }
  return { status: 502, message: "Asistan yanıt veremedi. Lütfen yeniden deneyin." };
}
