"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Icon } from "./icons";
import { api, useToast, StatusPill } from "./ui";
import { StatusButton } from "./SurveyActions";
import { AnalysisView } from "./AnalysisView";
import { ChartCanvas, makeChartConfig, chartTheme, wrapLabel, type ChartKind } from "./ChartCanvas";
import { computeStats, pearson, rStrength, type QStats } from "@/lib/stats";
import { TYPE_LABEL, PALETTE, numericQ, scaleMax, filterResponses, filterLabel } from "@/lib/survey";
import { parseCsv, mapCsv, csvTemplate } from "@/lib/csv";
import { fmtDateTime, fmtN, limTxt, slugify } from "@/lib/format";
import type { AnalysisLite, Filter, PlanLite, Question, ReportLite, Resp, SurveyLite } from "@/lib/types";
import type { ChartConfiguration } from "chart.js";

type Tab = "summary" | "compare" | "responses" | "ai" | "report" | "share";
const TABS: [Tab, string][] = [
  ["summary", "Sonuçlar"],
  ["compare", "Dağılım ve segment"],
  ["responses", "Yanıtlar"],
  ["ai", "Analiz"],
  ["report", "PDF rapor"],
  ["share", "Paylaşım"],
];

interface Props {
  survey: SurveyLite;
  responses: Resp[];
  analyses: AnalysisLite[];
  reports: ReportLite[];
  plan: PlanLite;
  usage: { ai: number; pdf: number };
  shareUrl: string;
  initialTab?: string;
  access: { view: boolean; edit: boolean; raw: boolean; analyze: boolean; publish: boolean };
}

const defaultKind = (q: Question): ChartKind => (q.type === "single" ? "pie" : q.type === "multi" ? "bar" : "column");

function download(name: string, blob: Blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function ResultsView(p: Props) {
  const s = p.survey;
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>((TABS.find(([k]) => k === p.initialTab)?.[0] as Tab) || "summary");
  const [f, setF] = useState<Filter>({});
  const [kinds, setKinds] = useState<Record<string, ChartKind>>({});
  const [analyses, setAnalyses] = useState(p.analyses);
  const [reports, setReports] = useState(p.reports);
  const [aid, setAid] = useState<string | undefined>(p.analyses[0]?.id);
  const [usage, setUsage] = useState(p.usage);
  const [aiBusy, setAiBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => setAnalyses(p.analyses), [p.analyses]);
  useEffect(() => setReports(p.reports), [p.reports]);

  const rs = useMemo(() => filterResponses(p.responses, f), [p.responses, f]);
  const st = useMemo(() => computeStats(s.questions, rs), [s.questions, rs]);
  const fl = filterLabel(s.questions, f);
  const total = p.responses.length;

  const switchTab = (t: Tab) => {
    setTab(t);
    const u = new URL(window.location.href);
    u.searchParams.set("sekme", t);
    window.history.replaceState(null, "", u);
  };

  const noResponses = (
    <div className="card empty">
      <h2>Henüz yanıt yok</h2>
      <p>
        {s.status === "open"
          ? "Anket yanıt kabul ediyor. Paylaşım sekmesinden bağlantıyı veya QR kodu katılımcılarınıza gönderin."
          : "Yanıt toplamaya başlamak için anketi açın ve paylaşın."}
      </p>
      <div className="row" style={{ justifyContent: "center" }}>
        {s.status !== "open" ? <StatusButton id={s.id} status={s.status} className="btn primary" /> : null}
        <button className="btn" onClick={() => switchTab("share")}>
          Paylaşım
        </button>
      </div>
    </div>
  );

  // ---------- filtre çubuğu ----------
  const segQs = s.questions.filter((q) => q.type === "single" || q.type === "multi");
  const segQ = s.questions.find((q) => q.id === f.segQ);
  const filterBar = (
    <div className="card stack" style={{ gap: 10, padding: 16 }}>
      <span className="eyebrow">Filtre ve segmentasyon</span>
      <div className="filterbar">
        <label className="f">
          Segment sorusu
          <select value={f.segQ || ""} onChange={(e) => setF({ ...f, segQ: e.target.value || undefined, segV: undefined })}>
            <option value="">Tüm katılımcılar</option>
            {segQs.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title.slice(0, 60)}
              </option>
            ))}
          </select>
        </label>
        <label className="f">
          Segment değeri
          <select value={f.segV || ""} disabled={!segQ} onChange={(e) => setF({ ...f, segV: e.target.value || undefined })}>
            <option value="">Seçin</option>
            {segQ?.options?.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label className="f">
          Başlangıç
          <input type="date" value={f.from || ""} onChange={(e) => setF({ ...f, from: e.target.value || undefined })} />
        </label>
        <label className="f">
          Bitiş
          <input type="date" value={f.to || ""} onChange={(e) => setF({ ...f, to: e.target.value || undefined })} />
        </label>
        <div>
          <button className="btn" onClick={() => setF({})}>
            Filtreyi temizle
          </button>
        </div>
      </div>
    </div>
  );

  // ---------- sekmeler ----------
  function Summary() {
    if (!total) return noResponses;
    return (
      <div className="stack">
        {filterBar}
        {fl ? (
          <div className="callout">
            <Icon name="info" />
            <span>
              Filtre uygulandı: <b>{fl}</b> · {fmtN(rs.length)} / {fmtN(total)} yanıt gösteriliyor.
            </span>
          </div>
        ) : null}
        <div className="grid g4">
          <div className="card stat"><b>{fmtN(st.n)}</b><span>Yanıt</span></div>
          <div className="card stat"><b>{st.completion == null ? "—" : "%" + fmtN(st.completion)}</b><span>Ortalama tamamlama</span></div>
          <div className="card stat"><b>{st.avgDuration == null ? "—" : fmtN(st.avgDuration / 60, 1) + " dk"}</b><span>Ortalama yanıt süresi</span></div>
          <div className="card stat"><b style={{ fontSize: "1.1rem", paddingBlock: 6 }}>{fmtDateTime(st.last)}</b><span>Son yanıt</span></div>
        </div>
        {s.questions.map((q, i) => (
          <QuestionResult key={q.id} q={q} i={i} x={st.q[q.id]} kind={kinds[q.id] || defaultKind(q)} setKind={(k) => setKinds({ ...kinds, [q.id]: k })} />
        ))}
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div className="stack" style={{ gap: 6 }}>
          <div className="row" style={{ gap: 8 }}>
            <StatusPill s={s} />
            <span className="mono small muted">{fmtN(total)} yanıt</span>
            {s.isPlatform ? <span className="pill plain accent">Platform anketi</span> : null}
          </div>
          <h1>{s.title}</h1>
        </div>
        {p.access.edit ? (
          <div className="row">
            <Link className="btn" href={`/panel/anket/${s.id}/duzenle`}>
              Düzenle
            </Link>
            <StatusButton id={s.id} status={s.status} />
          </div>
        ) : null}
      </div>
      <div className="tabs" role="tablist">
        {TABS.filter(([k]) => (k === "responses" ? p.access.raw : k === "ai" || k === "report" ? p.access.analyze : true)).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => switchTab(k)}>
            {l}
          </button>
        ))}
      </div>
      {tab === "summary" ? Summary() : null}
      {tab === "compare" ? total ? <Compare s={s} rs={rs} filterBar={filterBar} /> : noResponses : null}
      {tab === "responses" && p.access.raw ? Responses(p) : null}
      {tab === "ai" && p.access.analyze ? (total ? AITab() : noResponses) : null}
      {tab === "report" && p.access.analyze ? (total ? ReportTab() : noResponses) : null}
      {tab === "share" ? <Share s={s} url={p.shareUrl} /> : null}
    </div>
  );

  // ---------- AI ----------
  function AITab() {
    const a = analyses.find((x) => x.id === aid) || analyses[0];
    async function run() {
      setAiBusy(true);
      try {
        const r = await api<{ analysis: AnalysisLite; notice: string | null }>(`/api/surveys/${s.id}/analyses`, "POST", { filter: f });
        setAnalyses((xs) => [r.analysis, ...xs]);
        setAid(r.analysis.id);
        if (!r.analysis.result._local) setUsage((u) => ({ ...u, ai: u.ai + 1 }));
        toast(r.notice || "Analiz hazır.", r.notice ? 6000 : 2800);
      } catch (e) {
        toast((e as Error).message, 5500);
      } finally {
        setAiBusy(false);
      }
    }
    return (
      <div className="stack">
        {filterBar}
        <div className="card row between">
          <div className="stack" style={{ gap: 4 }}>
            <b>Kapsamlı veri analizi</b>
            <span className="small muted">
              {fmtN(rs.length)} yanıt analiz edilecek{fl ? " (filtreli)" : ""}. Bu ay {usage.ai} / {limTxt(p.plan.limits.ai)} hak kullanıldı.
            </span>
          </div>
          <button className="btn primary" onClick={run} disabled={aiBusy || !rs.length}>
            {aiBusy ? (
              <>
                <span className="spinner" /> Analiz ediliyor…
              </>
            ) : (
              <>
                <Icon name="spark" /> Analizi çalıştır
              </>
            )}
          </button>
        </div>
        {analyses.length > 1 ? (
          <label className="f" style={{ maxWidth: 420 }}>
            Önceki analizler
            <select value={a?.id} onChange={(e) => setAid(e.target.value)}>
              {analyses.map((x) => (
                <option key={x.id} value={x.id}>
                  {fmtDateTime(x.createdAt)} · n={x.n}
                  {x.filter ? " · filtreli" : ""} · {x.model}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {a ? (
          <div className="card stack">
            <div className="row between small muted">
              <span>
                {fmtDateTime(a.createdAt)} · {a.model} · n = {a.n}
                {a.filter ? " · Filtre: " + a.filter : ""}
              </span>
            </div>
            <AnalysisView questions={s.questions} r={a.result} />
          </div>
        ) : (
          <div className="card empty">
            <h2>Henüz analiz yok</h2>
            <p>Analiz; sonuçların yorumunu, katılımcı eğilimlerini, önemli veri noktalarını, istatistiksel özeti ve açık uçlu cevapların tema analizini üretir. İsterseniz önce bir segment filtresi seçin.</p>
          </div>
        )}
      </div>
    );
  }

  // ---------- PDF ----------
  function ReportTab() {
    async function create() {
      setPdfBusy(true);
      try {
        const a = analyses.find((x) => x.id === aid) || analyses[0];
        const r = await api<{ report: ReportLite; analysis: AnalysisLite; notice: string | null }>(`/api/surveys/${s.id}/reports`, "POST", { filter: f, analysisId: a?.id });
        setReports((xs) => [r.report, ...xs]);
        if (!analyses.some((x) => x.id === r.analysis.id)) {
          setAnalyses((xs) => [r.analysis, ...xs]);
          if (!r.analysis.result._local) setUsage((u) => ({ ...u, ai: u.ai + 1 }));
        }
        setAid(r.analysis.id);
        setUsage((u) => ({ ...u, pdf: u.pdf + 1 }));
        toast(r.notice ? r.notice + " PDF indiriliyor." : "PDF rapor hazır, indiriliyor.", 5000);
        window.location.href = `/api/reports/${r.report.id}/pdf`;
      } catch (e) {
        toast((e as Error).message, 5500);
      } finally {
        setPdfBusy(false);
      }
    }
    return (
      <div className="stack">
        {filterBar}
        <div className="card stack" style={{ gap: 14 }}>
          <div className="row between">
            <div className="stack" style={{ gap: 4 }}>
              <b>PDF araştırma raporu</b>
              <span className="small muted">
                Kapak, araştırma özeti, yöntem, soru bazlı bulgular ve grafikler, yorumlar, sonuç ve öneriler. Bu ay {usage.pdf} / {limTxt(p.plan.limits.pdf)} rapor oluşturuldu.
              </span>
            </div>
            <button className="btn primary" onClick={create} disabled={pdfBusy || !rs.length}>
              {pdfBusy ? (
                <>
                  <span className="spinner" /> Rapor hazırlanıyor…
                </>
              ) : (
                <>
                  <Icon name="file" /> Rapor oluştur ve indir
                </>
              )}
            </button>
          </div>
          <p className="small muted">Seçili filtreyle eşleşen güncel bir analiz yoksa rapordan önce otomatik olarak analiz yapılır.</p>
        </div>
        <div className="card stack" style={{ gap: 8 }}>
          <h3>Oluşturulan raporlar</h3>
          {reports.length ? (
            <div className="slist">
              {reports.map((r) => (
                <div className="sitem" key={r.id}>
                  <div className="stack" style={{ gap: 2 }}>
                    <b className="small">{r.filename}</b>
                    <span className="meta">
                      <span>{fmtDateTime(r.createdAt)}</span>
                      <span>n = {r.n}</span>
                      {r.filter ? <span>Filtre: {r.filter}</span> : null}
                      <span>{r.model}</span>
                      {r.published ? <span className="pill open">Sonuç sayfası yayında</span> : null}
                    </span>
                  </div>
                  <div className="acts">
                    {p.access.publish ? (
                      <button
                        className={"btn sm" + (r.published ? " ghost" : " primary")}
                        onClick={async () => {
                          try {
                            await api(`/api/admin/reports/${r.id}`, "PATCH", { published: !r.published });
                            setReports((xs) => xs.map((x) => (x.id === r.id ? { ...x, published: !r.published } : x)));
                            toast(r.published ? "Sonuç sayfası yayından kaldırıldı." : "Sonuç sayfası yayımlandı. Metinleri Yönetim → Araştırma sonuçları bölümünden düzenleyebilirsiniz.", 5000);
                          } catch (e) {
                            toast((e as Error).message, 5000);
                          }
                        }}
                      >
                        {r.published ? "Yayından kaldır" : "Sonuç sayfasında yayınla"}
                      </button>
                    ) : null}
                    <a className="btn sm" href={`/api/reports/${r.id}/pdf?inline=1`} target="_blank" rel="noopener">
                      <Icon name="eye" /> Önizle
                    </a>
                    <a className="btn sm" href={`/api/reports/${r.id}/pdf`}>
                      <Icon name="dl" /> İndir
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted small">Henüz rapor yok. İlk rapor oluşturulduğunda burada saklanır ve tekrar indirilebilir.</p>
          )}
        </div>
      </div>
    );
  }

  // ---------- yanıtlar ----------
  function Responses({ responses }: Props) {

    const list = [...responses].reverse();
    async function importCsv(file: File) {
      const rows = parseCsv((await file.text()).replace(/^﻿/, ""));
      if (rows.length < 2) return toast("CSV dosyasında veri satırı bulunamadı.");
      const { matched, data } = mapCsv(s.questions, rows);
      if (!matched) return toast("Başlık satırı soru metinleriyle eşleşmedi. Şablon CSV'yi kullanın.", 5000);
      toast(`${data.length} satır içe aktarılıyor…`, 60000);
      try {
        const r = await api<{ imported: number }>(`/api/surveys/${s.id}/import`, "POST", { rows: data });
        toast(`${r.imported} yanıt içe aktarıldı (${matched}/${s.questions.length} soru eşleşti).`, 5000);
        router.refresh();
      } catch (e) {
        toast((e as Error).message, 5000);
      }
    }
    return (
      <div className="stack">
        <div className="card row between">
          <div className="stack" style={{ gap: 2 }}>
            <b>{fmtN(list.length)} yanıt</b>
            <span className="small muted">CSV dosyaları Excel ve SPSS ile açılabilir. İçe aktarmada başlık satırı soru metinleriyle aynı olmalıdır.</span>
          </div>
          <div className="row">
            {list.length ? (
              <a className="btn" href={`/api/surveys/${s.id}/csv`}>
                <Icon name="dl" /> CSV indir
              </a>
            ) : (
              <button className="btn" disabled>
                <Icon name="dl" /> CSV indir
              </button>
            )}
            <button className="btn" onClick={() => download(slugify(s.title) + "-sablon.csv", new Blob([csvTemplate(s.questions)], { type: "text/csv;charset=utf-8" }))}>
              Şablon CSV
            </button>
            <button className="btn" onClick={() => document.getElementById("csvImport")?.click()}>
              CSV içe aktar
            </button>
            <input
              id="csvImport"
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) importCsv(file);
              }}
            />
          </div>
        </div>
        {list.length ? (
          <>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="num">#</th>
                    <th>Tarih</th>
                    {s.questions.map((q, i) => (
                      <th key={q.id} title={q.title}>
                        S{i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.slice(0, 200).map((r, k) => (
                    <tr key={r.id}>
                      <td className="num">{list.length - k}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(r.submittedAt)}</td>
                      {s.questions.map((q) => {
                        const a = r.answers?.[q.id];
                        return <td key={q.id}>{Array.isArray(a) ? a.join("; ") : String(a ?? "")}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {list.length > 200 ? <p className="small muted">Son 200 yanıt gösteriliyor. Tümü için CSV indirin.</p> : null}
          </>
        ) : (
          noResponses
        )}
      </div>
    );
  }
}

function QuestionResult({ q, i, x, kind, setKind }: { q: Question; i: number; x: QStats; kind: ChartKind; setKind: (k: ChartKind) => void }) {
  const config = useMemo(
    () => (q.type === "open" ? null : makeChartConfig(kind, x.counts.map((c) => c.label), x.counts.map((c) => c.count), numericQ(q) && kind !== "pie")),
    [q, x, kind],
  );
  return (
    <div className="card qres">
      <div className="qres-head">
        <div className="stack" style={{ gap: 4, minWidth: 0 }}>
          <span className="qnum">
            S{i + 1} · {TYPE_LABEL[q.type]} · {fmtN(x.answered)} cevap
          </span>
          <h3>{q.title}</h3>
        </div>
        {q.type !== "open" ? (
          <div className="seg" role="group" aria-label="Grafik türü">
            {(
              [
                ["pie", "Pasta"],
                ["column", "Sütun"],
                ["bar", "Çubuk"],
              ] as [ChartKind, string][]
            ).map(([k, l]) => (
              <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>
                {l}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {q.type === "open" ? (
        x.texts.length ? (
          <div className="grid g2">
            <div className="stack" style={{ gap: 8 }}>
              <span className="eyebrow">Cevaplar ({fmtN(x.texts.length)})</span>
              <div className="answers">
                {x.texts
                  .slice(-60)
                  .reverse()
                  .map((t, k) => (
                    <blockquote key={k}>{t}</blockquote>
                  ))}
              </div>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <span className="eyebrow">Sık geçen kelimeler</span>
              <div className="chips">
                {x.words.length ? (
                  x.words.map(([w, c]) => (
                    <span className="chip" key={w}>
                      {w}
                      <b>{c}</b>
                    </span>
                  ))
                ) : (
                  <span className="muted small">Yeterli metin yok.</span>
                )}
              </div>
              <p className="small muted">Tema ve duygu analizi için Analiz sekmesini kullanın.</p>
            </div>
          </div>
        ) : (
          <p className="muted small">Bu soruya henüz cevap yok.</p>
        )
      ) : (
        <div className="grid g2" style={{ alignItems: "start" }}>
          <ChartCanvas config={config!} label={`${q.title} grafiği`} />
          <div className="stack" style={{ gap: 10 }}>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Seçenek</th>
                    <th className="num">n</th>
                    <th className="num">%</th>
                  </tr>
                </thead>
                <tbody>
                  {x.counts.map((c) => (
                    <tr key={c.label}>
                      <td>{c.label}</td>
                      <td className="num">{c.count}</td>
                      <td className="num">{fmtN(c.pct, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {x.mean != null ? (
              <div className="row small" style={{ gap: 18 }}>
                <span>Ortalama <b className="mono">{fmtN(x.mean, 2)}</b></span>
                <span>Std. sapma <b className="mono">{fmtN(x.sd, 2)}</b></span>
                <span>Medyan <b className="mono">{fmtN(x.median, 1)}</b></span>
                {x.agree != null ? <span>Katılım <b className="mono">%{fmtN(x.agree)}</b></span> : null}
              </div>
            ) : null}
            {q.type === "multi" ? <p className="small muted">Yüzdeler, soruyu cevaplayan {x.answered} kişiye göredir; toplam %100&apos;ü aşabilir.</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}

function Compare({ s, rs, filterBar }: { s: SurveyLite; rs: Resp[]; filterBar: React.ReactNode }) {
  const nums = s.questions.filter(numericQ);
  const cats = s.questions.filter((q) => q.type === "single");
  const [sx, setSx] = useState(nums[0]?.id);
  const [sy, setSy] = useState(nums[1]?.id);
  const [gc, setGc] = useState(cats[0]?.id);
  const [gn, setGn] = useState(nums[0]?.id);

  const pair = useMemo(() => {
    if (nums.length < 2) return null;
    const qx = nums.find((q) => q.id === sx) || nums[0];
    const qy = nums.find((q) => q.id === sy && q.id !== qx.id) || nums.find((q) => q.id !== qx.id)!;
    const points = rs.map((r) => [Number(r.answers?.[qx.id]), Number(r.answers?.[qy.id])]).filter(([a, b]) => a > 0 && b > 0);
    return { qx, qy, points, r: pearson(points.map((p) => p[0]), points.map((p) => p[1])) };
  }, [nums, sx, sy, rs]);

  const seg = useMemo(() => {
    if (!cats.length || !nums.length) return null;
    const qc = cats.find((q) => q.id === gc) || cats[0];
    const qn = nums.find((q) => q.id === gn) || nums[0];
    const groups = qc.options!.map((o) => {
      const v = rs.filter((r) => r.answers?.[qc.id] === o).map((r) => Number(r.answers?.[qn.id])).filter((x) => x > 0);
      return { label: o, n: v.length, mean: v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0 };
    });
    return { qc, qn, groups, max: scaleMax(qn) };
  }, [cats, nums, gc, gn, rs]);

  const scatterCfg = useMemo<ChartConfiguration | null>(() => {
    if (!pair) return null;
    const th = chartTheme();
    const jitter = () => (Math.random() - 0.5) * 0.35;
    return {
      type: "scatter",
      data: { datasets: [{ data: pair.points.map(([x, y]) => ({ x: x + jitter(), y: y + jitter() })), backgroundColor: th.accent + "99", pointRadius: 5 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { title: { display: true, text: pair.qx.title.slice(0, 60), color: th.fg }, min: 0.5, max: scaleMax(pair.qx) + 0.5, ticks: { stepSize: 1, color: th.fg }, grid: { color: th.grid } },
          y: { title: { display: true, text: pair.qy.title.slice(0, 60), color: th.fg }, min: 0.5, max: scaleMax(pair.qy) + 0.5, ticks: { stepSize: 1, color: th.fg }, grid: { color: th.grid } },
        },
      },
    };
  }, [pair]);

  const segCfg = useMemo<ChartConfiguration | null>(() => {
    if (!seg) return null;
    const th = chartTheme();
    return {
      type: "bar",
      data: { labels: seg.groups.map((g) => wrapLabel(g.label, 14)), datasets: [{ data: seg.groups.map((g) => g.mean), backgroundColor: seg.groups.map((_, i) => PALETTE[i % PALETTE.length]), borderRadius: 3, maxBarThickness: 48 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: seg.max, ticks: { color: th.fg }, grid: { color: th.grid } }, x: { ticks: { color: th.fg }, grid: { display: false } } },
      },
    };
  }, [seg]);

  return (
    <div className="stack">
      {filterBar}
      <div className="card stack" style={{ gap: 12 }}>
        <div>
          <span className="eyebrow">Dağılım grafiği</span>
          <h3>İki ölçek sorusu arasındaki ilişki</h3>
        </div>
        {pair && scatterCfg ? (
          <>
            <div className="filterbar">
              <label className="f">
                X ekseni
                <select value={pair.qx.id} onChange={(e) => setSx(e.target.value)}>
                  {nums.map((q) => (
                    <option key={q.id} value={q.id}>{q.title.slice(0, 60)}</option>
                  ))}
                </select>
              </label>
              <label className="f">
                Y ekseni
                <select value={pair.qy.id} onChange={(e) => setSy(e.target.value)}>
                  {nums.map((q) => (
                    <option key={q.id} value={q.id}>{q.title.slice(0, 60)}</option>
                  ))}
                </select>
              </label>
            </div>
            <ChartCanvas config={scatterCfg} label="Dağılım grafiği" height={340} />
            <p className="small">
              Pearson korelasyonu: <b className="mono">r = {pair.r == null ? "—" : fmtN(pair.r, 2)}</b> (n = {pair.points.length})
              {pair.r != null ? ` · ${rStrength(pair.r)} ${pair.r >= 0 ? "pozitif" : "negatif"} ilişki` : ""}. Noktalar üst üste binmesin diye hafifçe kaydırılmıştır.
            </p>
          </>
        ) : (
          <p className="muted small">Dağılım grafiği için ankette en az iki Likert veya derecelendirme sorusu olmalı.</p>
        )}
      </div>
      <div className="card stack" style={{ gap: 12 }}>
        <div>
          <span className="eyebrow">Segment karşılaştırması</span>
          <h3>Gruplara göre ortalama puan</h3>
        </div>
        {seg && segCfg ? (
          <>
            <div className="filterbar">
              <label className="f">
                Grup sorusu
                <select value={seg.qc.id} onChange={(e) => setGc(e.target.value)}>
                  {cats.map((q) => (
                    <option key={q.id} value={q.id}>{q.title.slice(0, 60)}</option>
                  ))}
                </select>
              </label>
              <label className="f">
                Ölçüm sorusu
                <select value={seg.qn.id} onChange={(e) => setGn(e.target.value)}>
                  {nums.map((q) => (
                    <option key={q.id} value={q.id}>{q.title.slice(0, 60)}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid g2" style={{ alignItems: "start" }}>
              <ChartCanvas config={segCfg} label="Segment karşılaştırma grafiği" />
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Grup</th>
                      <th className="num">n</th>
                      <th className="num">Ortalama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seg.groups.map((g) => (
                      <tr key={g.label}>
                        <td>{g.label}</td>
                        <td className="num">{g.n}</td>
                        <td className="num">{g.n ? fmtN(g.mean, 2) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <p className="muted small">Segment karşılaştırması için en az bir tek seçimli ve bir ölçek sorusu gerekir.</p>
        )}
      </div>
    </div>
  );
}

function Share({ s, url }: { s: SurveyLite; url: string }) {
  const toast = useToast();
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toDataURL(url, { margin: 2, width: 360, errorCorrectionLevel: "M" }).then(setQr, () => setQr(""));
  }, [url]);
  const enc = encodeURIComponent;
  const msg = `${s.title} anketine katılır mısınız?`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast("Bağlantı kopyalandı.");
    } catch {
      (document.getElementById("shareLink") as HTMLInputElement | null)?.select();
      toast("Bağlantı seçildi; kopyalamak için Ctrl/Cmd + C.");
    }
  }
  async function dlQr() {
    const big = await QRCode.toDataURL(url, { margin: 2, width: 1024, errorCorrectionLevel: "M" });
    const a = document.createElement("a");
    a.href = big;
    a.download = slugify(s.title) + "-qr.png";
    a.click();
  }
  return (
    <div className="grid g2" style={{ alignItems: "start" }}>
      <div className="card stack" style={{ gap: 14 }}>
        <div className="row between">
          <h3>Paylaşım bağlantısı</h3>
          <StatusPill s={s} />
        </div>
        {s.status !== "open" ? (
          <div className="callout warn">
            <Icon name="info" />
            <span>Anket şu an {s.status === "draft" ? "taslak" : "kapalı"}; bağlantıyı açanlar yanıt veremez.</span>
            <StatusButton id={s.id} status={s.status} className="btn sm" />
          </div>
        ) : null}
        <div className="linkbox">
          <input type="text" id="shareLink" readOnly value={url} aria-label="Paylaşım bağlantısı" />
          <button className="btn" onClick={copy}>
            <Icon name="copy" /> Kopyala
          </button>
        </div>
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">Sosyal medyada paylaş</span>
          <div className="row">
            <a className="btn sm" href={`https://wa.me/?text=${enc(msg + " " + url)}`} target="_blank" rel="noopener">WhatsApp</a>
            <a className="btn sm" href={`https://twitter.com/intent/tweet?text=${enc(msg)}&url=${enc(url)}`} target="_blank" rel="noopener">X</a>
            <a className="btn sm" href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener">LinkedIn</a>
            <a className="btn sm" href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener">Facebook</a>
            <a className="btn sm" href={`https://t.me/share/url?url=${enc(url)}&text=${enc(msg)}`} target="_blank" rel="noopener">Telegram</a>
          </div>
        </div>
        <hr className="sep" />
        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow">Aynı cihazdan veri toplama</span>
          <p className="small muted">Seminer, saha çalışması veya stantta tablet/telefon üzerinden ardışık katılımcılardan yanıt almak için katılım ekranını bu cihazda açın. Her gönderimden sonra form sıfırlanır.</p>
          <div>
            <a className="btn" href={`${url}?kiosk=1`} target="_blank" rel="noopener">
              Katılım ekranını aç
            </a>
          </div>
        </div>
        <div className="callout">
          <Icon name="info" />
          <span className="small">Katılımcılar ad soyad vermeden; e-posta, yaş, cinsiyet ve eğitim durumuyla üye olup e-postasını doğruladıktan sonra yanıt verir; her üye bir kez katılır. Aynı cihazdan veri toplama ekranı yalnızca sizin oturumunuzda çalışır. Diğer kanallardan toplanan verileri Yanıtlar sekmesinden CSV ile içe aktarabilirsiniz.</span>
        </div>
      </div>
      <div className="card stack" style={{ gap: 12, alignItems: "flex-start" }}>
        <h3>QR kod</h3>
        {qr ? (
          <div className="qr-box">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="Anket bağlantısının QR kodu" />
          </div>
        ) : (
          <span className="spinner" />
        )}
        <p className="small muted">Afiş, broşür veya sunum slaytına ekleyin. Telefon kamerasıyla okutulduğunda anket açılır.</p>
        <button className="btn" onClick={dlQr}>
          <Icon name="dl" /> QR kodu indir (PNG)
        </button>
      </div>
    </div>
  );
}
