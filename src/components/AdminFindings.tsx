"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, useToast } from "./ui";
import { Icon } from "./icons";
import { MarkdownEditor } from "./Editor";
import { FindingChartCard } from "./FindingCharts";
import { CHART_KINDS, parseCharts, type FindingChart, type FindingChartKind, type FindingStat } from "@/lib/findings";

export type FindingEdit = {
  id?: string;
  slug?: string;
  title: string;
  summary: string;
  body: string;
  categoryId: string | null;
  sourceTitle: string;
  sourceUrl: string;
  sourceSeries: string;
  sourceYear: number | null;
  isbn: string;
  method: string;
  stats: FindingStat[];
  charts: FindingChart[];
  featured: boolean;
  published: boolean;
  sortOrder: number;
};

type ChartDraft = { title: string; question: string; kind: FindingChartKind; data: string; insight: string };

const fmtV = (v: number) => String(v).replace(".", ",");
const toDraft = (c: FindingChart): ChartDraft => ({ title: c.title, question: c.question, kind: c.kind, insight: c.insight, data: c.items.map((i) => `${i.label} | ${fmtV(i.value)}`).join("\n") });
/** "Etiket | 34,2" satırlarını çözer */
const parseLines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.split("|"))
    .filter((p) => p.length >= 2)
    .map((p) => ({ label: p.slice(0, -1).join("|").trim(), value: p[p.length - 1].trim().replace("%", "") }));
const fromDraft = (d: ChartDraft) => ({ title: d.title, question: d.question, kind: d.kind, insight: d.insight, items: parseLines(d.data) });

export function FindingEditor({ f, categories }: { f: FindingEdit; categories: { id: string; name: string }[] }) {
  const toast = useToast();
  const router = useRouter();
  const [charts, setCharts] = useState<ChartDraft[]>(f.charts.map(toDraft));
  const [preview, setPreview] = useState<number | null>(null);
  const setC = (i: number, patch: Partial<ChartDraft>) => setCharts((cs) => cs.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  const move = (i: number, d: number) =>
    setCharts((cs) => {
      const j = i + d;
      if (j < 0 || j >= cs.length) return cs;
      const n = cs.slice();
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries()) as Record<string, unknown>;
    body.published = fd.get("published") === "on";
    body.featured = fd.get("featured") === "on";
    body.stats = String(fd.get("statsText") || "")
      .split("\n")
      .map((l) => l.split("|"))
      .filter((p) => p.length >= 2)
      .map((p) => ({ value: p[0].trim(), label: p.slice(1).join("|").trim() }));
    delete body.statsText;
    body.charts = charts.map(fromDraft);
    try {
      if (f.id) {
        await api(`/api/admin/findings/${f.id}`, "PATCH", body);
        toast("Kaydedildi.");
        router.refresh();
      } else {
        const d = await api<{ id: string }>("/api/admin/findings", "POST", body);
        toast("Oluşturuldu.");
        router.replace(`/yonetim?sekme=findings&veri=${d.id}`);
      }
    } catch (err) {
      toast((err as Error).message, 5000);
    }
  }

  return (
    <form className="stack" style={{ gap: 16 }} onSubmit={save}>
      <div className="card row between">
        <div className="row" style={{ gap: 8 }}>
          {f.published ? <span className="pill open">Yayında</span> : <span className="pill plain">Taslak</span>}
          {f.slug && f.published ? (
            <Link className="small" href={`/bulgular/${f.slug}`} target="_blank">
              Sayfayı görüntüle →
            </Link>
          ) : null}
        </div>
        <button className="btn primary" type="submit">
          Kaydet
        </button>
      </div>

      <div className="card stack" style={{ gap: 14 }}>
        <h3>Genel bilgiler</h3>
        <label className="f">
          Başlık
          <input type="text" name="title" defaultValue={f.title} required />
        </label>
        <label className="f">
          Kısa özet (kartlarda ve sayfa başında görünür)
          <textarea name="summary" rows={3} defaultValue={f.summary} />
        </label>
        <div className="grid g3">
          <label className="f">
            Araştırma alanı
            <select name="categoryId" defaultValue={f.categoryId || ""}>
              <option value="">Seçilmedi</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="f">
            Sıra (küçük önce)
            <input type="number" name="sortOrder" min={0} defaultValue={f.sortOrder} />
          </label>
          <div className="stack" style={{ gap: 8, justifyContent: "flex-end" }}>
            <label className="check">
              <input type="checkbox" name="published" defaultChecked={f.published} /> Yayımla
            </label>
            <label className="check">
              <input type="checkbox" name="featured" defaultChecked={f.featured} /> Ana sayfada göster
            </label>
          </div>
        </div>
        <label className="f">
          Öne çıkan rakamlar (her satır: <span className="mono">değer | açıklama</span>, en fazla 6)
          <textarea name="statsText" rows={4} className="mono" defaultValue={f.stats.map((s) => `${s.value} | ${s.label}`).join("\n")} placeholder={"1.598 | Katılımcı\n%74,6 | Afet hazırlığını yetersiz bulanlar"} />
        </label>
        <label className="f">
          Yöntem ve örneklem özeti
          <textarea name="method" rows={3} defaultValue={f.method} />
        </label>
      </div>

      <div className="card stack" style={{ gap: 14 }}>
        <h3>Kaynak rapor (kaynakça)</h3>
        <div className="grid g2">
          <label className="f">
            Rapor adı
            <input type="text" name="sourceTitle" defaultValue={f.sourceTitle} />
          </label>
          <label className="f">
            Rapor bağlantısı (PDF veya sayfa)
            <input type="url" name="sourceUrl" defaultValue={f.sourceUrl} placeholder="https://maskder.com/..." />
          </label>
        </div>
        <div className="grid g3">
          <label className="f">
            Yayın dizisi
            <input type="text" name="sourceSeries" defaultValue={f.sourceSeries} placeholder="MASKDER Yayınları 03" />
          </label>
          <label className="f">
            Yayın yılı
            <input type="number" name="sourceYear" defaultValue={f.sourceYear ?? ""} />
          </label>
          <label className="f">
            ISBN (isteğe bağlı)
            <input type="text" name="isbn" defaultValue={f.isbn} />
          </label>
        </div>
      </div>

      <div className="card stack" style={{ gap: 14 }}>
        <div className="row between">
          <h3>Grafikler</h3>
          <button type="button" className="btn sm" onClick={() => setCharts((cs) => [...cs, { title: "", question: "", kind: "bar", data: "", insight: "" }])}>
            <Icon name="plus" /> Grafik ekle
          </button>
        </div>
        <p className="small muted">Veri satırları <span className="mono">Etiket | 34,2</span> biçiminde yazılır; değerler yüzde olarak gösterilir. Iraksak ölçekte satırları olumsuzdan olumluya sıralayın; gösterge ve insan simgesi yalnızca ilk satırı kullanır.</p>
        {charts.map((c, i) => {
          const parsed = parseCharts([fromDraft(c)])[0];
          return (
            <div className="card stack" style={{ gap: 12, background: "var(--surface-2)" }} key={i}>
              <div className="row between">
                <b>Grafik {i + 1}</b>
                <div className="row" style={{ gap: 6 }}>
                  <button type="button" className="btn sm ghost" onClick={() => move(i, -1)} aria-label="Yukarı taşı">
                    <Icon name="up" />
                  </button>
                  <button type="button" className="btn sm ghost" onClick={() => move(i, 1)} aria-label="Aşağı taşı">
                    <Icon name="down" />
                  </button>
                  <button type="button" className="btn sm" onClick={() => setPreview(preview === i ? null : i)}>
                    {preview === i ? "Önizlemeyi kapat" : "Önizle"}
                  </button>
                  <button type="button" className="btn sm ghost danger" onClick={() => setCharts((cs) => cs.filter((_, k) => k !== i))} aria-label="Grafiği sil">
                    <Icon name="trash" />
                  </button>
                </div>
              </div>
              <div className="grid g2">
                <label className="f">
                  Grafik başlığı
                  <input type="text" value={c.title} onChange={(e) => setC(i, { title: e.target.value })} />
                </label>
                <label className="f">
                  Grafik türü
                  <select value={c.kind} onChange={(e) => setC(i, { kind: e.target.value as FindingChartKind })}>
                    {Object.entries(CHART_KINDS).map(([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="f">
                Sorulan soru (isteğe bağlı)
                <input type="text" value={c.question} onChange={(e) => setC(i, { question: e.target.value })} />
              </label>
              <label className="f">
                Veriler
                <textarea className="mono" rows={Math.max(4, c.data.split("\n").length + 1)} value={c.data} onChange={(e) => setC(i, { data: e.target.value })} />
              </label>
              <label className="f">
                Kısa yorum (grafiğin altında görünür)
                <textarea rows={2} value={c.insight} onChange={(e) => setC(i, { insight: e.target.value })} />
              </label>
              {preview === i ? parsed ? <FindingChartCard c={parsed} /> : <p className="small muted">Önizleme için başlık ve en az bir veri satırı girin.</p> : null}
            </div>
          );
        })}
        {!charts.length ? <p className="muted small">Henüz grafik eklenmedi.</p> : null}
      </div>

      <div className="card stack" style={{ gap: 14 }}>
        <MarkdownEditor name="body" label="Değerlendirme metni (isteğe bağlı)" defaultValue={f.body} rows={8} />
        <div className="row between">
          {f.id ? (
            <button
              type="button"
              className="btn ghost danger"
              onClick={async () => {
                if (!confirm("Bu kayıt kalıcı olarak silinsin mi?")) return;
                try {
                  await api(`/api/admin/findings/${f.id}`, "DELETE");
                  toast("Silindi.");
                  router.replace("/yonetim?sekme=findings");
                } catch (err) {
                  toast((err as Error).message, 5000);
                }
              }}
            >
              <Icon name="trash" /> Sil
            </button>
          ) : (
            <span />
          )}
          <button className="btn primary" type="submit">
            Kaydet
          </button>
        </div>
      </div>
    </form>
  );
}
