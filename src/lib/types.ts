export type QType = "single" | "multi" | "open" | "likert" | "rating";
export type SurveyStatus = "draft" | "open" | "closed";

export interface Question {
  id: string;
  type: QType;
  title: string;
  help?: string;
  required: boolean;
  options?: string[];
  scale?: 5 | 7;
  max?: 5 | 10;
  minLabel?: string;
  maxLabel?: string;
  /** Koşullu gösterim: yalnızca önceki bir tek/çoktan seçmeli soruda bu seçeneklerden biri işaretlenirse gösterilir */
  showIf?: { q: string; values: string[] };
}

export type Answer = string | string[] | number;
export type Answers = Record<string, Answer>;

/** İstemciye ve istatistik motoruna giden sade yanıt biçimi (tarihler ms) */
export interface Resp {
  id: string;
  answers: Answers;
  submittedAt: number;
  durationSec: number | null;
}

export interface SurveyLite {
  id: string;
  slug: string;
  title: string;
  description: string;
  thankYou: string;
  status: SurveyStatus;
  archived: boolean;
  isPlatform: boolean;
  questions: Question[];
  ownerId: string;
  ownerName?: string;
  categoryId?: string | null;
  purpose?: string;
  targetGroup?: string;
  consentText?: string;
  startsAt?: number | null;
  endsAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface PlanLimits {
  surveys: number;
  responses: number;
  ai: number;
  pdf: number;
  retention: number;
}

export interface PlanLite {
  id: string;
  name: string;
  note: string;
  price: number;
  limits: PlanLimits;
  stripePriceId?: string | null;
}

export interface Filter {
  segQ?: string;
  segV?: string;
  from?: string; // yyyy-mm-dd
  to?: string;
}

export interface AIResult {
  ozet: string;
  istatistikselOzet: string;
  egilimler: string[];
  onemliNoktalar: string[];
  icgoruler: string[];
  bulgular: { soruId: string; yorum: string }[];
  acikUclu: {
    soruId: string;
    temalar: { tema: string; aciklama: string; oran: string }[];
    duygu: string;
    ornekAlinti: string;
  }[];
  sinirliliklar: string[];
  sonuc: string;
  oneriler: string[];
  _local?: boolean;
}

export interface AnalysisLite {
  id: string;
  createdAt: number;
  model: string;
  filter: string;
  n: number;
  result: AIResult;
}

export interface ReportLite {
  published?: boolean;
  id: string;
  createdAt: number;
  filename: string;
  n: number;
  filter: string;
  model: string;
}

export const HOME_SECTIONS = {
  surveys: "Öne çıkan anketler",
  news: "Haberler ve duyurular",
  results: "Öne çıkan araştırmalar",
  findings: "Raporlarımızdan veriler",
  agenda: "Türkiye gündemi",
  data: "Veri ve istatistikler",
  categories: "Araştırma alanları",
  community: "Araştırma topluluğuna katıl",
} as const;
export type HomeSection = keyof typeof HOME_SECTIONS;

export interface HomeContent {
  heroTitle: string;
  heroText: string;
  announcement: string;
  featured: string[];
  heroImageId?: string | null; // açılış alanında gösterilecek görsel
  hidden?: HomeSection[]; // gizlenen ana sayfa bölümleri
}

export interface PagesContent {
  aboutLead: string;
  aboutBody: string; // paragraflar boş satırla ayrılır
  maskderLead: string;
  maskderBody: string;
  maskderUrl: string;
}

export interface PublicReport {
  id: string;
  title: string;
  description: string;
  n: number;
  createdAt: number;
  publishedAt: number | null;
}

export interface ContactContent {
  footerAbout: string;
  email: string;
  phone: string;
  address: string;
  social: { x: string; instagram: string; linkedin: string; youtube: string; facebook: string };
}

export interface LegalContent {
  kvkk: string;
  cookies: string;
  terms: string;
  updatedAt: string; // yyyy-aa-gg
}
