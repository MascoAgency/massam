import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, ok, readJson } from "@/lib/api";
import type { LegalContent } from "@/lib/types";

export async function PUT(req: Request) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  const b = await readJson<Partial<LegalContent>>(req);
  const s = (v: unknown) => String(v ?? "").trim().slice(0, 60000);
  const value: LegalContent = { kvkk: s(b.kvkk), cookies: s(b.cookies), terms: s(b.terms), privacy: s(b.privacy), updatedAt: new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10) };
  await prisma.siteSetting.upsert({ where: { key: "legal" }, update: { value: value as object }, create: { key: "legal", value: value as object } });
  return ok();
}
