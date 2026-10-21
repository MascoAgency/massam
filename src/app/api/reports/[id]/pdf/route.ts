import { NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { apiUser, fail } from "@/lib/api";
import { surveyAccess } from "@/lib/roles";
import { ReportDocument } from "@/lib/report/ReportDocument";
import type { ReportSnapshot } from "@/lib/report/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  const rep = await prisma.report.findUnique({ where: { id: (await params).id }, include: { survey: { select: { ownerId: true, isPlatform: true } } } });
  if (!rep || (rep.userId !== user.id && !surveyAccess(user, rep.survey).view)) return fail(404, "Rapor bulunamadı.");
  const snap = rep.snapshot as unknown as ReportSnapshot;
  const buf = await renderToBuffer(React.createElement(ReportDocument, { snap }) as Parameters<typeof renderToBuffer>[0]);
  const inline = new URL(req.url).searchParams.get("inline") === "1";
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${rep.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
