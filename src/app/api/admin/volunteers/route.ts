import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm } from "@/lib/api";
import { csvCell } from "@/lib/csv";

/** Gönüllü katılımcı listesi (CSV) — kişisel veri; yalnızca yetkili roller */
export async function GET() {
  const u = await apiPerm("volunteers");
  if (u instanceof NextResponse) return u;
  const rows = await prisma.volunteer.findMany({ where: { unsubscribedAt: null }, orderBy: { createdAt: "desc" } });
  const lines = [["E-posta", "Ad", "İl", "Yaş grubu", "İlgi alanları", "Onay tarihi"].map(csvCell).join(";")];
  for (const v of rows)
    lines.push([v.email, v.name, v.city, v.ageGroup, v.interests.join(" | "), v.consentAt.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })].map(csvCell).join(";"));
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="maskder-gonulluler.csv"', "Cache-Control": "private, no-store" },
  });
}
