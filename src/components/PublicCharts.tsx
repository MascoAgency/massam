"use client";
import { useMemo, useState } from "react";
import type { ChartConfiguration } from "chart.js";
import { ChartCanvas, makeChartConfig, chartTheme, wrapLabel, type ChartKind } from "./ChartCanvas";
import { fmtN } from "@/lib/format";
import { PALETTE } from "@/lib/survey";
import type { ChartQ } from "@/lib/public";

const defaultKind = (q: ChartQ): ChartKind => (q.type === "single" ? (q.counts.length > 8 ? "bar" : "pie") : q.type === "multi" ? "bar" : "column");

/** Tek soru grafiği + tablo (yalnızca toplu sayılar) */
export function QuestionChart({ q, compact }: { q: ChartQ; compact?: boolean }) {
  const [kind, setKind] = useState<ChartKind>(defaultKind(q));
  const numeric = q.type === "likert" || q.type === "rating";
  const config = useMemo(() => makeChartConfig(kind, q.counts.map((c) => c.label), q.counts.map((c) => c.count), numeric && kind !== "pie"), [q, kind, numeric]);
  return (
    <div className="card qres">
      <div className="qres-head">
        <div className="stack" style={{ gap: 4, minWidth: 0 }}>
          <span className="small muted">{fmtN(q.answered)} cevap</span>
          <h3>{q.title}</h3>
        </div>
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
      </div>
      <div className={compact ? "" : "grid g2"} style={{ alignItems: "start" }}>
        <ChartCanvas config={config} label={`${q.title} grafiği`} height={compact ? 240 : 280} />
        {compact ? null : (
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
                  {q.counts.map((c) => (
                    <tr key={c.label}>
                      <td>{c.label}</td>
                      <td className="num">{c.count}</td>
                      <td className="num">{fmtN(c.pct, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {q.mean != null ? (
              <p className="small">
                Ortalama <b>{fmtN(q.mean, 2)}</b> / {q.max}
                {q.agree != null ? (
                  <>
                    {" "}
                    · Katılanların oranı <b>%{fmtN(q.agree)}</b>
                  </>
                ) : null}
              </p>
            ) : null}
            {q.type === "multi" ? <p className="small muted">Birden fazla seçim yapılabildiği için yüzdelerin toplamı %100&apos;ü aşabilir.</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}

/** Günlük katılım çizgi grafiği */
export function ParticipationChart({ data, title }: { data: { day: string; n: number }[]; title: string }) {
  const config = useMemo<ChartConfiguration>(() => {
    const th = chartTheme();
    return {
      type: "line",
      data: {
        labels: data.map((d) => new Date(d.day + "T12:00:00+03:00").toLocaleDateString("tr-TR", { day: "2-digit", month: "short", timeZone: "Europe/Istanbul" })),
        datasets: [{ data: data.map((d) => d.n), borderColor: th.accent, backgroundColor: th.accent + "22", fill: true, tension: 0.3, pointRadius: 2, borderWidth: 2 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0, color: th.fg }, grid: { color: th.grid } }, x: { ticks: { color: th.fg, maxTicksLimit: 8 }, grid: { display: false } } },
      },
    };
  }, [data]);
  return (
    <div className="card stack" style={{ gap: 10 }}>
      <div>
        <span className="small muted">Günlük katılım</span>
        <h3>{title}</h3>
      </div>
      <ChartCanvas config={config} label={`${title} günlük katılım grafiği`} height={240} />
    </div>
  );
}

/** Karşılaştırmalı gösterge: ölçek sorularında katılım (olumlu yanıt) oranları */
export function AgreeCompare({ items }: { items: { label: string; agree: number }[] }) {
  const config = useMemo<ChartConfiguration>(() => {
    const th = chartTheme();
    return {
      type: "bar",
      data: { labels: items.map((i) => wrapLabel(i.label, 40)), datasets: [{ data: items.map((i) => +i.agree.toFixed(1)), backgroundColor: items.map((_, k) => PALETTE[k % PALETTE.length]), borderRadius: 4, maxBarThickness: 28 }] },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` %${fmtN(c.parsed.x as number, 1)}` } } },
        scales: { x: { min: 0, max: 100, ticks: { color: th.fg, callback: (v) => "%" + v }, grid: { color: th.grid } }, y: { ticks: { color: th.fg }, grid: { display: false } } },
      },
    };
  }, [items]);
  return (
    <div className="card stack" style={{ gap: 10 }}>
      <div>
        <span className="small muted">Karşılaştırmalı gösterge</span>
        <h3>İfadelere katılım oranları</h3>
        <p className="small muted">Ölçek sorularında “katılıyorum” ve “kesinlikle katılıyorum” yanıtlarının oranı.</p>
      </div>
      <ChartCanvas config={config} label="İfadelere katılım oranları" height={Math.max(180, items.length * 46)} />
    </div>
  );
}
