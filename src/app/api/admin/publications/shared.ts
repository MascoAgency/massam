import { PUBLICATION_TYPES } from "@/lib/defaults";

export function publicationData(b: Record<string, unknown>) {
  const title = String(b.title || "").trim().slice(0, 300);
  if (!title) return { error: "Yayın başlığı gerekli." } as const;
  const pdfUrl = String(b.pdfUrl || "").trim().slice(0, 500);
  if (pdfUrl && !/^https?:\/\//.test(pdfUrl)) return { error: "PDF bağlantısı http:// veya https:// ile başlamalı." } as const;
  return {
    title,
    type: PUBLICATION_TYPES[String(b.type)] ? String(b.type) : "rapor",
    summary: String(b.summary || "").trim().slice(0, 1500),
    body: String(b.body || "").trim().slice(0, 50000),
    authors: String(b.authors || "").trim().slice(0, 300),
    categoryId: typeof b.categoryId === "string" && b.categoryId ? b.categoryId : null,
    reportId: typeof b.reportId === "string" && b.reportId ? b.reportId : null,
    pdfUrl,
    agenda: !!b.agenda,
    coverId: typeof b.coverId === "string" && /^[a-z0-9]{10,40}$/.test(b.coverId) ? b.coverId : null,
    pdfId: typeof b.pdfId === "string" && /^[a-z0-9]{10,40}$/.test(b.pdfId) ? b.pdfId : null,
  };
}
