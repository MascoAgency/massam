import { NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { fail } from "@/lib/api";
import { ReportDocument } from "@/lib/report/ReportDocument";
import type { ReportSnapshot } from "@/lib/report/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Herkese açık: yalnızca yönetimin yayımladığı raporlar */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rep = await prisma.report.findUnique({ where: { id: (await params).id } });
  // Yayın onayı: sonuç sayfası yayımlanmış ya da yayımlanmış bir yayına bağlı raporlar herkese açıktır
  const viaPublication = rep && !rep.published ? await prisma.publication.count({ where: { reportId: rep.id, published: true } }) : 0;
  if (!rep || (!rep.published && !viaPublication)) return fail(404, "Rapor bulunamadı.");
  const snap = rep.snapshot as unknown as ReportSnapshot;
  const buf = await renderToBuffer(React.createElement(ReportDocument, { snap }) as Parameters<typeof renderToBuffer>[0]);
  const download = new URL(req.url).searchParams.get("indir") === "1";
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${rep.filename}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
