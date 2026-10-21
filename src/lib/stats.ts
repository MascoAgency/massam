import type { Question, Resp } from "./types";
import { hasAnswer, numericQ, LIKERT } from "./survey";

const STOP = new Set(
  "ve ile bir bu da de için çok daha gibi ama en mi mı mu mü ne o şu ki ya hem olarak olan olması olsun var yok kadar sonra önce her ben biz siz onlar benim bizim daha fazla az şey ise yani veya diye göre üzerine ayrıca kendi tüm bazı hiç değil oldu olur olacak etmek etme eden edilmesi yapmak yapılması the and of to a in is".split(
    " ",
  ),
);

export interface CountRow {
  label: string;
  count: number;
  pct: number;
}

export interface QStats {
  type: Question["type"];
  answered: number;
  counts: CountRow[];
  mean: number | null;
  sd: number | null;
  median: number | null;
  max?: number;
  agree?: number;
  disagree?: number;
  texts: string[];
  words: [string, number][];
}

export interface SurveyStats {
  n: number;
  q: Record<string, QStats>;
  avgDuration: number | null;
  completion: number | null;
  first: number | null;
  last: number | null;
}

export function computeStats(questions: Question[], responses: Resp[]): SurveyStats {
  const out: SurveyStats = { n: responses.length, q: {}, avgDuration: null, completion: null, first: null, last: null };
  for (const q of questions) {
    const vals = responses.map((r) => (r.answers || {})[q.id]).filter(hasAnswer);
    const st: QStats = { type: q.type, answered: vals.length, counts: [], mean: null, sd: null, median: null, texts: [], words: [] };
    if (q.type === "single" || q.type === "multi") {
      const m = new Map<string, number>((q.options || []).map((o) => [o, 0]));
      const other = new Map<string, number>();
      vals.forEach((v) =>
        (Array.isArray(v) ? v : [v]).forEach((x) => {
          const k = String(x);
          if (m.has(k)) m.set(k, m.get(k)! + 1);
          else other.set(k, (other.get(k) || 0) + 1);
        }),
      );
      other.forEach((c, k) => m.set(k, c));
      st.counts = [...m].map(([label, count]) => ({ label, count, pct: vals.length ? (count / vals.length) * 100 : 0 }));
    } else if (numericQ(q)) {
      const max = q.type === "likert" ? q.scale || 5 : q.max || 10;
      const labels = q.type === "likert" ? LIKERT[(q.scale || 5) as 5 | 7] : Array.from({ length: max }, (_, i) => String(i + 1));
      const nums = vals.map(Number).filter((v) => v >= 1 && v <= max);
      st.counts = labels.map((label, i) => {
        const c = nums.filter((v) => v === i + 1).length;
        return { label: q.type === "likert" ? `${i + 1} · ${label}` : label, count: c, pct: nums.length ? (c / nums.length) * 100 : 0 };
      });
      st.max = max;
      if (nums.length) {
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        const sd = Math.sqrt(nums.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, nums.length - 1));
        const sorted = [...nums].sort((a, b) => a - b);
        const mid = sorted.length >> 1;
        st.mean = mean;
        st.sd = sd;
        st.median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        if (q.type === "likert") {
          const half = ((q.scale || 5) + 1) / 2;
          st.agree = (nums.filter((v) => v > half).length / nums.length) * 100;
          st.disagree = (nums.filter((v) => v < half).length / nums.length) * 100;
        }
      }
    } else if (q.type === "open") {
      st.texts = vals.map((v) => String(v).trim()).filter(Boolean);
      const wc = new Map<string, number>();
      st.texts.forEach((t) =>
        t
          .toLocaleLowerCase("tr-TR")
          .replace(/[^\p{L}\s]/gu, " ")
          .split(/\s+/)
          .forEach((w) => {
            if (w.length > 2 && !STOP.has(w)) wc.set(w, (wc.get(w) || 0) + 1);
          }),
      );
      st.words = [...wc].sort((a, b) => b[1] - a[1]).slice(0, 24);
    }
    out.q[q.id] = st;
  }
  const durs = responses.map((r) => r.durationSec).filter((d): d is number => d != null && d > 0 && d < 7200);
  out.avgDuration = durs.length ? durs.reduce((a, b) => a + b, 0) / durs.length : null;
  out.completion =
    responses.length && questions.length
      ? (responses.reduce((a, r) => a + questions.filter((q) => hasAnswer((r.answers || {})[q.id])).length / questions.length, 0) / responses.length) * 100
      : null;
  out.last = responses.reduce((a, r) => Math.max(a, r.submittedAt || 0), 0) || null;
  const first = responses.reduce((a, r) => Math.min(a, r.submittedAt || Infinity), Infinity);
  out.first = first === Infinity ? null : first;
  return out;
}

export function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

export function rStrength(r: number) {
  const a = Math.abs(r);
  return a < 0.1 ? "ilişki yok denecek kadar zayıf" : a < 0.3 ? "zayıf" : a < 0.5 ? "orta düzeyde" : a < 0.7 ? "güçlü" : "çok güçlü";
}

export function crossTabs(questions: Question[], responses: Resp[]) {
  const cats = questions.filter((q) => q.type === "single");
  const nums = questions.filter(numericQ);
  const out: { grupSorusu: string; olcumSorusu: string; gruplar: { grup: string; n: number; ortalama: number | null }[] }[] = [];
  for (const c of cats)
    for (const nq of nums) {
      const groups = (c.options || [])
        .map((o) => {
          const v = responses.filter((r) => r.answers?.[c.id] === o).map((r) => Number(r.answers?.[nq.id])).filter((x) => x > 0);
          return { grup: o, n: v.length, ortalama: v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : null };
        })
        .filter((g) => g.n > 0);
      if (groups.length > 1) out.push({ grupSorusu: c.title, olcumSorusu: nq.title, gruplar: groups });
    }
  return out.slice(0, 12);
}

export function correlations(questions: Question[], responses: Resp[]) {
  const nums = questions.filter(numericQ);
  const out: { x: string; y: string; r: number; n: number }[] = [];
  for (let i = 0; i < nums.length; i++)
    for (let j = i + 1; j < nums.length; j++) {
      const pairs = responses
        .map((r) => [Number(r.answers?.[nums[i].id]), Number(r.answers?.[nums[j].id])])
        .filter(([a, b]) => a > 0 && b > 0);
      const r = pearson(pairs.map((p) => p[0]), pairs.map((p) => p[1]));
      if (r != null) out.push({ x: nums[i].title, y: nums[j].title, r: +r.toFixed(2), n: pairs.length });
    }
  return out;
}
