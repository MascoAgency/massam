import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, ok, readJson } from "@/lib/api";
import type { PagesContent } from "@/lib/types";

export async function PUT(req: Request) {
  const admin = await apiPerm("content");
  if (admin instanceof NextResponse) return admin;
  const b = await readJson<Partial<PagesContent>>(req);
  const s = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
  const url = s(b.maskderUrl, 300);
  const value: PagesContent = {
    aboutLead: s(b.aboutLead, 400),
    aboutBody: s(b.aboutBody, 8000),
    maskderLead: s(b.maskderLead, 400),
    maskderBody: s(b.maskderBody, 8000),
    maskderUrl: /^https?:\/\//.test(url) ? url : "",
  };
  await prisma.siteSetting.upsert({ where: { key: "pages" }, update: { value: value as object }, create: { key: "pages", value: value as object } });
  return ok();
}
