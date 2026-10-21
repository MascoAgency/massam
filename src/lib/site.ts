import "server-only";
import { prisma } from "./db";
import type { HomeContent, PagesContent, ContactContent, LegalContent } from "./types";
import { DEFAULT_HOME, DEFAULT_PAGES, DEFAULT_CONTACT, DEFAULT_LEGAL } from "./defaults";

export async function getHome(): Promise<HomeContent> {
  const row = await prisma.siteSetting.findUnique({ where: { key: "home" } });
  const h = Object.assign({}, DEFAULT_HOME, (row?.value as Partial<HomeContent>) || {});
  // Başlık ve tanıtım metni boş bırakılırsa varsayılan metin gösterilir (duyuru boş kalabilir)
  if (!h.heroTitle.trim()) h.heroTitle = DEFAULT_HOME.heroTitle;
  if (!h.heroText.trim()) h.heroText = DEFAULT_HOME.heroText;
  return h;
}

export async function getPages(): Promise<PagesContent> {
  const row = await prisma.siteSetting.findUnique({ where: { key: "pages" } });
  // Boş bırakılan alanlarda varsayılan metin gösterilir
  const saved = Object.fromEntries(Object.entries((row?.value as Partial<PagesContent>) || {}).filter(([, v]) => typeof v === "string" && v.trim()));
  return Object.assign({}, DEFAULT_PAGES, saved);
}

export async function getContact(): Promise<ContactContent> {
  const row = await prisma.siteSetting.findUnique({ where: { key: "contact" } });
  const v = (row?.value as Partial<ContactContent>) || {};
  return { ...DEFAULT_CONTACT, ...v, footerAbout: v.footerAbout?.trim() || DEFAULT_CONTACT.footerAbout, social: { ...DEFAULT_CONTACT.social, ...(v.social || {}) } };
}

export async function getLegal(): Promise<LegalContent> {
  const row = await prisma.siteSetting.findUnique({ where: { key: "legal" } });
  const v = (row?.value as Partial<LegalContent>) || {};
  return {
    kvkk: v.kvkk?.trim() || DEFAULT_LEGAL.kvkk,
    cookies: v.cookies?.trim() || DEFAULT_LEGAL.cookies,
    terms: v.terms?.trim() || DEFAULT_LEGAL.terms,
    updatedAt: v.updatedAt || "",
  };
}

/** Yayımlanmış raporlar (herkese açık Raporlar sayfası) */
export async function publishedReports(take?: number) {
  const rows = await prisma.report.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take,
    include: { survey: { select: { title: true, description: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.survey.title,
    description: r.survey.description,
    n: r.n,
    createdAt: r.createdAt.getTime(),
    publishedAt: r.publishedAt ? r.publishedAt.getTime() : null,
  }));
}

export { paragraphs } from "./site-text";

export const appUrl = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
export const shareUrl = (slug: string) => `${appUrl()}/s/${slug}`;
