import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, fail, ok, readJson } from "@/lib/api";
import { assistantReply } from "@/lib/assistant";
import { aiErrorMessage, cleanMessages } from "./shared";

export const maxDuration = 60;

export async function POST(req: Request) {
  const u = await apiPerm("surveys");
  if (u instanceof NextResponse) return u;
  const messages = cleanMessages((await readJson(req)).messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") return fail(400, "Bir soru veya araştırma fikri yazın.");
  try {
    const reply = await assistantReply(messages);
    await prisma.usageEvent.create({ data: { userId: u.id, kind: "assistant" } }).catch(() => null);
    return ok({ reply });
  } catch (e) {
    const { status, message } = aiErrorMessage(e);
    return fail(status, message);
  }
}
