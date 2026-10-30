import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUser, fail, ownSurvey } from "@/lib/api";
import { slugify } from "@/lib/format";
import { csvCell } from "@/lib/csv";
import type { Question, Answer } from "@/lib/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const s = await ownSurvey(user, (await params).id, "raw");
  if (!s) return fail(404, "Anket bulunamadı.");
  const qs = s.questions as unknown as Question[];
  const rs = await prisma.response.findMany({ where: { surveyId: s.id }, orderBy: { submittedAt: "asc" } });
  const lines = [["Yanıt No", "Tarih", "Yaş grubu", "Cinsiyet", "Eğitim durumu", ...qs.map((q) => q.title)].map(csvCell).join(";")];
  rs.forEach((r, i) => {
    const a = r.answers as Record<string, Answer>;
    const d = (r.demographics as { ageGroup?: string; gender?: string; education?: string } | null) ?? {};
    lines.push(
      [i + 1, r.submittedAt.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }), d.ageGroup ?? "", d.gender ?? "", d.education ?? "", ...qs.map((q) => (Array.isArray(a[q.id]) ? (a[q.id] as string[]).join(" | ") : a[q.id] ?? ""))]
        .map(csvCell)
        .join(";"),
    );
  });
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slugify(s.title)}-yanitlar.csv"`,
    },
  });
}
