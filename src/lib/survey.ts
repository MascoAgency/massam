import type { Question, QType, Answer, Filter, Resp } from "./types";
import { fmtDate, trDayStart } from "./format";

export const TYPE_LABEL: Record<QType, string> = {
  single: "Tek seçimli",
  multi: "Çoktan seçmeli",
  open: "Açık uçlu",
  likert: "Likert ölçeği",
  rating: "Derecelendirme",
};

export const LIKERT: Record<5 | 7, string[]> = {
  5: ["Kesinlikle katılmıyorum", "Katılmıyorum", "Kararsızım", "Katılıyorum", "Kesinlikle katılıyorum"],
  7: ["Kesinlikle katılmıyorum", "Katılmıyorum", "Biraz katılmıyorum", "Kararsızım", "Biraz katılıyorum", "Katılıyorum", "Kesinlikle katılıyorum"],
};

export const PALETTE = ["#0B1F3A", "#14B8C4", "#9B7FD1", "#3C5A85", "#0E8C96", "#CDBDEB", "#9FE3E8", "#6F52A8"];

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function blankQuestion(type: QType): Question {
  const q: Question = { id: "q" + newId().slice(-6), type, title: "", help: "", required: false };
  if (type === "single" || type === "multi") q.options = ["Seçenek 1", "Seçenek 2"];
  if (type === "likert") q.scale = 5;
  if (type === "rating") {
    q.max = 10;
    q.minLabel = "Hiç";
    q.maxLabel = "Kesinlikle";
  }
  return q;
}

export const hasAnswer = (a: unknown): boolean => a != null && a !== "" && !(Array.isArray(a) && !a.length);
export const numericQ = (q: Question) => q.type === "likert" || q.type === "rating";
export const scaleMax = (q: Question) => (q.type === "likert" ? q.scale || 5 : q.max || 10);

/** Sunucu tarafında soru listesini doğrular ve temizler. Hata varsa Türkçe mesaj döner. */
export function sanitizeQuestions(input: unknown): { questions?: Question[]; error?: string } {
  if (!Array.isArray(input) || !input.length) return { error: "En az bir soru ekleyin." };
  if (input.length > 200) return { error: "Bir ankette en fazla 200 soru olabilir." };
  const out: Question[] = [];
  const ids = new Set<string>();
  for (let i = 0; i < input.length; i++) {
    const r = input[i] as Record<string, unknown>;
    const type = r.type as QType;
    if (!(type in TYPE_LABEL)) return { error: `S${i + 1}: geçersiz soru türü.` };
    const title = String(r.title ?? "").trim().slice(0, 500);
    if (!title) return { error: `S${i + 1} için soru metni gerekli.` };
    let id = String(r.id ?? "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24) || "q" + newId().slice(-6);
    while (ids.has(id)) id = "q" + newId().slice(-6);
    ids.add(id);
    const q: Question = { id, type, title, help: String(r.help ?? "").slice(0, 500), required: !!r.required };
    if (type === "single" || type === "multi") {
      const opts = Array.isArray(r.options) ? r.options.map((o) => String(o).trim().slice(0, 200)).filter(Boolean) : [];
      const uniq = [...new Set(opts)];
      if (uniq.length < 2) return { error: `S${i + 1}: en az iki farklı seçenek gerekli.` };
      q.options = uniq.slice(0, 100); // il listesi (81) gibi uzun listeler için
    }
    if (type === "open" && r.short) q.short = true;
    if (type === "likert") q.scale = Number(r.scale) === 7 ? 7 : 5;
    if (type === "rating") {
      q.max = Number(r.max) === 5 ? 5 : 10;
      q.minLabel = String(r.minLabel ?? "").slice(0, 80);
      q.maxLabel = String(r.maxLabel ?? "").slice(0, 80);
    }
    // Koşullu gösterim: yalnızca bu sorudan önceki tek/çoktan seçmeli sorulara bağlanabilir
    const si = r.showIf as { q?: unknown; values?: unknown } | undefined;
    if (si && typeof si.q === "string" && Array.isArray(si.values)) {
      const ref = out.find((x) => x.id === si.q && (x.type === "single" || x.type === "multi"));
      const vals = si.values.map(String).filter((v) => ref?.options?.includes(v));
      if (ref && vals.length) q.showIf = { q: ref.id, values: [...new Set(vals)] };
    }
    out.push(q);
  }
  return { questions: out };
}

/** Koşullu sorular dahil, verilen cevaplara göre görünür olan sorular (sıra korunur) */
export function visibleQuestions(questions: Question[], answers: Record<string, unknown>): Question[] {
  const shown = new Set<string>();
  const out: Question[] = [];
  for (const q of questions) {
    if (q.showIf) {
      if (!shown.has(q.showIf.q)) continue;
      const a = answers[q.showIf.q];
      const picked = Array.isArray(a) ? a.map(String) : a != null ? [String(a)] : [];
      if (!q.showIf.values.some((v) => picked.includes(v))) continue;
    }
    shown.add(q.id);
    out.push(q);
  }
  return out;
}

/** Tahmini tamamlanma süresi (dakika) */
export const estMinutes = (questions: Question[]) =>
  Math.max(1, Math.round(questions.reduce((a, q) => a + (q.type === "open" ? 1 : q.type === "multi" ? 0.4 : 0.25), 0)));

/** Anket şu anda katılıma açık mı (durum + başlangıç/bitiş tarihleri) */
export function isOpenNow(s: { status: string; archived: boolean; startsAt?: Date | number | null; endsAt?: Date | number | null }, now = Date.now()) {
  if (s.status !== "open" || s.archived) return false;
  const st = s.startsAt ? new Date(s.startsAt).getTime() : null;
  const en = s.endsAt ? new Date(s.endsAt).getTime() : null;
  if (st && now < st) return false;
  if (en && now >= en) return false;
  return true;
}

/** Katılımcı cevaplarını soru tanımına göre doğrular; geçersiz değerleri atar. */
export function sanitizeAnswers(questions: Question[], raw: unknown): { answers: Record<string, Answer>; missing: string[] } {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const answers: Record<string, Answer> = {};
  const missing: string[] = [];
  // Gizli (koşulu sağlanmayan) sorular atlanır; cevapları kaydedilmez, zorunlu sayılmaz
  const visible = visibleQuestions(questions, src);
  for (const q of visible) {
    const v = src[q.id];
    if (q.type === "single" && typeof v === "string" && q.options!.includes(v)) answers[q.id] = v;
    else if (q.type === "multi" && Array.isArray(v)) {
      const sel = [...new Set(v.filter((x): x is string => typeof x === "string" && q.options!.includes(x)))];
      if (sel.length) answers[q.id] = sel;
    } else if (q.type === "open" && typeof v === "string" && v.trim()) answers[q.id] = v.trim().slice(0, 5000);
    else if (numericQ(q)) {
      const n = Number(v);
      if (Number.isInteger(n) && n >= 1 && n <= scaleMax(q)) answers[q.id] = n;
    }
    if (q.required && !hasAnswer(answers[q.id])) missing.push(q.id);
  }
  return { answers, missing };
}

export function filterResponses(rs: Resp[], f: Filter): Resp[] {
  let r = rs;
  if (f.segQ && f.segV) {
    r = r.filter((x) => {
      const a = x.answers?.[f.segQ!];
      return Array.isArray(a) ? a.includes(f.segV!) : String(a) === f.segV;
    });
  }
  if (f.from) {
    const t = trDayStart(f.from);
    if (!isNaN(t)) r = r.filter((x) => (x.submittedAt || 0) >= t);
  }
  if (f.to) {
    const t = trDayStart(f.to) + 86400000;
    if (!isNaN(t)) r = r.filter((x) => (x.submittedAt || 0) < t);
  }
  return r;
}

export function filterLabel(questions: Question[], f: Filter): string {
  const parts: string[] = [];
  if (f.segQ && f.segV) {
    const q = questions.find((q) => q.id === f.segQ);
    parts.push(`${q ? q.title : "Soru"} = ${f.segV}`);
  }
  if (f.from) parts.push("başlangıç " + fmtDate(trDayStart(f.from)));
  if (f.to) parts.push("bitiş " + fmtDate(trDayStart(f.to)));
  return parts.join(", ");
}

export function cleanFilter(raw: unknown): Filter {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const s = (k: string) => (typeof r[k] === "string" && r[k] ? String(r[k]).slice(0, 300) : undefined);
  const f: Filter = { segQ: s("segQ"), segV: s("segV"), from: s("from"), to: s("to") };
  if (f.from && !/^\d{4}-\d{2}-\d{2}$/.test(f.from)) delete f.from;
  if (f.to && !/^\d{4}-\d{2}-\d{2}$/.test(f.to)) delete f.to;
  return f;
}
