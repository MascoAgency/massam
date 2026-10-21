import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** Medya dosyasını sunar (görseller sitede kullanıldığı için herkese açıktır) */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const m = await prisma.media.findUnique({ where: { id: (await params).id } });
  if (!m) return new Response("Bulunamadı", { status: 404 });
  const download = new URL(req.url).searchParams.get("indir") === "1";
  const name = encodeURIComponent(m.filename);
  return new Response(new Uint8Array(m.data), {
    headers: {
      "Content-Type": m.mime,
      "Content-Length": String(m.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${name}`,
      "X-Content-Type-Options": "nosniff",
      // Görseller betik çalıştıramaz; PDF görüntüleyici yalıtılmış ortamda açılmadığı için PDF'lere uygulanmaz
      ...(m.mime.startsWith("image/") ? { "Content-Security-Policy": "default-src 'none'; sandbox" } : {}),
    },
  });
}
