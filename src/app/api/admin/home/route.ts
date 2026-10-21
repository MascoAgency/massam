import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, ok, readJson } from "@/lib/api";
import { HOME_SECTIONS, type HomeContent, type HomeSection } from "@/lib/types";

export async function PUT(req: Request) {
  const admin = await apiPerm("content");
  if (admin instanceof NextResponse) return admin;
  const b = await readJson<Partial<HomeContent>>(req);
  const value: HomeContent = {
    heroTitle: String(b.heroTitle || "").trim().slice(0, 200),
    heroText: String(b.heroText || "").trim().slice(0, 1000),
    announcement: String(b.announcement || "").trim().slice(0, 300),
    featured: Array.isArray(b.featured) ? b.featured.map(String).slice(0, 30) : [],
    heroImageId: typeof b.heroImageId === "string" && /^[a-z0-9]{10,40}$/.test(b.heroImageId) ? b.heroImageId : null,
    slideImageId: typeof b.slideImageId === "string" && /^[a-z0-9]{10,40}$/.test(b.slideImageId) ? b.slideImageId : null,
    hidden: Array.isArray(b.hidden) ? (b.hidden.filter((x) => x in HOME_SECTIONS) as HomeSection[]) : [],
  };
  await prisma.siteSetting.upsert({ where: { key: "home" }, update: { value: value as object }, create: { key: "home", value: value as object } });
  return ok();
}
