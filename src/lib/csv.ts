import type { Question, Answer } from "./types";
import { LIKERT, numericQ } from "./survey";

export function csvCell(v: unknown) {
  let t = String(v ?? "");
  // Formül enjeksiyonu: =, +, -, @ ile başlayan metinler Excel'de çalıştırılmasın diye başına ' eklenir
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(t)) t = "'" + t;
  return /[",;\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  const first = text.split("\n")[0];
  const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ";" : ",";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
      } else cell += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

const lc = (s: string) => s.toLocaleLowerCase("tr-TR");

/** CSV satırlarını soru kimlikli cevaplara dönüştürür (başlık satırı soru metinleriyle eşleşir). */
export function mapCsv(questions: Question[], rows: string[][]) {
  const head = rows[0].map((h) => lc(h.trim()));
  const map = questions.map((q) => head.indexOf(lc(q.title.trim())));
  const matched = map.filter((i) => i >= 0).length;
  const data = rows.slice(1).map((r) => {
    const answers: Record<string, Answer> = {};
    questions.forEach((q, k) => {
      const i = map[k];
      if (i < 0) return;
      const raw = (r[i] || "").trim();
      if (!raw) return;
      if (q.type === "multi") answers[q.id] = raw.split(/\s*[|;]\s*/).filter(Boolean).map((v) => q.options!.find((o) => lc(o) === lc(v)) || v);
      else if (q.type === "single") answers[q.id] = q.options!.find((o) => lc(o) === lc(raw)) || raw;
      else if (numericQ(q)) {
        let n = parseInt(raw, 10);
        if (isNaN(n) && q.type === "likert") n = LIKERT[(q.scale || 5) as 5 | 7].findIndex((l) => lc(l) === lc(raw)) + 1;
        if (n > 0) answers[q.id] = n;
      } else answers[q.id] = raw;
    });
    return answers;
  });
  return { matched, data };
}

export function csvTemplate(questions: Question[]) {
  const ex = questions.map((q) =>
    q.type === "single" ? q.options![0] : q.type === "multi" ? q.options!.slice(0, 2).join(" | ") : q.type === "likert" ? "4" : q.type === "rating" ? "8" : "Örnek cevap",
  );
  return "﻿" + [questions.map((q) => csvCell(q.title)).join(";"), ex.map(csvCell).join(";")].join("\r\n");
}
