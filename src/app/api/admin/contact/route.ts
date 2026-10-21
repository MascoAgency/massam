import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, ok, readJson } from "@/lib/api";
import type { ContactContent } from "@/lib/types";

export async function PUT(req: Request) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  const b = await readJson<Partial<ContactContent> & { social?: Record<string, string> }>(req);
  const s = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
  const url = (v: unknown) => (/^https?:\/\//.test(s(v, 300)) ? s(v, 300) : "");
  const value: ContactContent = {
    footerAbout: s(b.footerAbout, 600),
    email: s(b.email, 200),
    phone: s(b.phone, 60),
    address: s(b.address, 300),
    social: { x: url(b.social?.x), instagram: url(b.social?.instagram), linkedin: url(b.social?.linkedin), youtube: url(b.social?.youtube), facebook: url(b.social?.facebook) },
  };
  await prisma.siteSetting.upsert({ where: { key: "contact" }, update: { value: value as object }, create: { key: "contact", value: value as object } });
  return ok();
}
