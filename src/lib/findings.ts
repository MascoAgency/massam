/** Rapor verileri (Finding): yayımlanmış MASKDER raporlarından seçilmiş grafikler, kısa metinler ve kaynakça */

export const CHART_KINDS = {
  bar: "Yatay çubuk",
  column: "Sütun",
  pie: "Halka",
  polar: "Kutupsal alan",
  radar: "Radar",
  line: "Çizgi",
  area: "Alan",
  diverging: "Iraksak ölçek (olumsuz → olumlu)",
  treemap: "Ağaç haritası",
  waffle: "Waffle (100 kare)",
  lollipop: "Lolipop",
  gauge: "Gösterge (ilk değer)",
  people: "İnsan simgesi (ilk değer)",
} as const;
export type FindingChartKind = keyof typeof CHART_KINDS;
export type FindingChart = { title: string; question: string; kind: FindingChartKind; items: { label: string; value: number }[]; insight: string };
export type FindingStat = { value: string; label: string };

export type PublicFinding = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: { name: string; slug: string; icon: string } | null;
  sourceTitle: string;
  sourceUrl: string;
  sourceSeries: string;
  sourceYear: number | null;
  isbn: string;
  method: string;
  stats: FindingStat[];
  charts: FindingChart[];
  featured: boolean;
};

const str = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const KINDS = Object.keys(CHART_KINDS) as FindingChartKind[];

export function parseCharts(v: unknown): FindingChart[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, 24)
    .map((c) => {
      const o = (c || {}) as Record<string, unknown>;
      const items = (Array.isArray(o.items) ? o.items : [])
        .slice(0, 20)
        .map((i) => {
          const x = (i || {}) as Record<string, unknown>;
          const value = typeof x.value === "number" ? x.value : parseFloat(String(x.value ?? "").replace(",", "."));
          return { label: str(x.label, 120), value: Number.isFinite(value) ? Math.round(value * 100) / 100 : NaN };
        })
        .filter((i) => i.label && Number.isFinite(i.value));
      return {
        title: str(o.title, 200),
        question: str(o.question, 400),
        kind: KINDS.includes(o.kind as FindingChartKind) ? (o.kind as FindingChartKind) : "bar",
        items,
        insight: str(o.insight, 800),
      };
    })
    .filter((c) => c.title && c.items.length);
}

export function parseStats(v: unknown): FindingStat[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, 6)
    .map((s) => {
      const o = (s || {}) as Record<string, unknown>;
      return { value: str(o.value, 24), label: str(o.label, 160) };
    })
    .filter((s) => s.value && s.label);
}

/** Kaynakça satırı: Kurum. (Yıl). Rapor adı. Seri. ISBN. */
export function citation(f: Pick<PublicFinding, "sourceTitle" | "sourceSeries" | "sourceYear" | "isbn">) {
  return {
    lead: `MASKDER (Modern Araştırmalar ve Stratejik Kalkınma Derneği).${f.sourceYear ? ` (${f.sourceYear}).` : ""}`,
    title: f.sourceTitle,
    tail: [f.sourceSeries, f.isbn ? `ISBN ${f.isbn}` : "", "İstanbul: MASKDER"].filter(Boolean).join(". ") + ".",
  };
}

/** Yüzde biçimi: 34.2 → "%34,2" */
export const pct = (v: number) => "%" + v.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
