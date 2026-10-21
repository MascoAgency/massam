import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiPerm, fail, ok } from "@/lib/api";

export const runtime = "nodejs";

const TYPES: Record<string, number> = {
  "image/jpeg": 4_000_000,
  "image/png": 4_000_000,
  "image/webp": 4_000_000,
  "image/gif": 4_000_000,
  "application/pdf": 4_200_000, // Vercel istek gövdesi sınırı ~4,5 MB
};

/** Medya kütüphanesi listesi (veri olmadan) */
export async function GET(req: Request) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  const kind = new URL(req.url).searchParams.get("tur");
  const rows = await prisma.media.findMany({
    where: kind === "gorsel" ? { mime: { startsWith: "image/" } } : kind === "pdf" ? { mime: "application/pdf" } : {},
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { id: true, filename: true, mime: true, size: true, width: true, height: true, alt: true, createdAt: true },
  });
  return ok({ items: rows.map((m) => ({ ...m, url: `/medya/${m.id}`, createdAt: m.createdAt.getTime() })) });
}

/** Dosya yükleme (multipart/form-data: file, alt, width, height) */
export async function POST(req: Request) {
  const u = await apiPerm("content");
  if (u instanceof NextResponse) return u;
  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return fail(400, "Dosya okunamadı. Dosya 4 MB'tan küçük olmalı.");
  }
  const file = fd.get("file");
  if (!(file instanceof File)) return fail(400, "Dosya seçilmedi.");
  const max = TYPES[file.type];
  if (!max) return fail(400, "Yalnızca JPG, PNG, WEBP, GIF görseller ve PDF dosyaları yüklenebilir.");
  if (file.size > max) return fail(400, `Dosya çok büyük (en fazla ${Math.round(max / 1_000_000)} MB).`);
  const buf = Buffer.from(await file.arrayBuffer());
  // Dosya imzası kontrolü: uzantı/tip sahteciliğine karşı
  const sig = buf.subarray(0, 12);
  const isPdf = sig.subarray(0, 4).toString() === "%PDF";
  const isJpg = sig[0] === 0xff && sig[1] === 0xd8;
  const isPng = sig[0] === 0x89 && sig.subarray(1, 4).toString() === "PNG";
  const isGif = sig.subarray(0, 3).toString() === "GIF";
  const isWebp = sig.subarray(0, 4).toString() === "RIFF" && sig.subarray(8, 12).toString() === "WEBP";
  const okSig = file.type === "application/pdf" ? isPdf : file.type === "image/jpeg" ? isJpg : file.type === "image/png" ? isPng : file.type === "image/gif" ? isGif : isWebp;
  if (!okSig) return fail(400, "Dosya içeriği türüyle uyuşmuyor.");
  const num = (k: string) => {
    const n = parseInt(String(fd.get(k) || ""), 10);
    return n > 0 && n < 20000 ? n : null;
  };
  const m = await prisma.media.create({
    data: {
      filename: (file.name || "dosya").replace(/[^\p{L}\p{N}._ -]/gu, "").slice(0, 150) || "dosya",
      mime: file.type,
      size: buf.length,
      width: num("width"),
      height: num("height"),
      alt: String(fd.get("alt") || "").trim().slice(0, 300),
      data: buf,
      uploadedById: u.id,
    },
    select: { id: true, filename: true, mime: true, size: true, width: true, height: true, alt: true },
  });
  return ok({ ...m, url: `/medya/${m.id}` }, { status: 201 });
}
