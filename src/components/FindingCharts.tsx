"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { ChartConfiguration, Plugin } from "chart.js";
import { ChartCanvas, chartTheme, wrapLabel } from "./ChartCanvas";
import { Icon } from "./icons";
import { pct, type FindingChart, type PublicFinding } from "@/lib/findings";

type Theme = ReturnType<typeof chartTheme>;
const CANVAS_KINDS = ["bar", "column", "pie", "polar", "radar", "line", "area"];

/** Çubukların ucuna yüzde değerini yazan küçük eklenti */
const valueLabels: Plugin<"bar"> = {
  id: "valueLabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const th = chartTheme();
    const horiz = chart.options.indexAxis === "y";
    chart.getDatasetMeta(0).data.forEach((el, i) => {
      const v = chart.data.datasets[0].data[i] as number;
      const p = el.getProps(["x", "y"], true) as { x: number; y: number };
      ctx.save();
      ctx.fillStyle = th.head;
      ctx.font = "600 11px " + (getComputedStyle(document.body).getPropertyValue("--f-mono") || "monospace");
      ctx.textAlign = horiz ? "left" : "center";
      ctx.textBaseline = horiz ? "middle" : "bottom";
      ctx.fillText(pct(v), horiz ? p.x + 6 : p.x, horiz ? p.y : p.y - 4);
      ctx.restore();
    });
  },
};

/** Sıralı palet: lacivert, turkuaz, eflatun ve açık tonları */
const seq = (th: Theme) => [th.navy, th.tur, th.efl, th.navy3, th.accent, th.eflMid, th.turMid, th.efl2];

function configFor(c: FindingChart): ChartConfiguration {
  const th = chartTheme();
  const labels = c.items.map((i) => i.label);
  const values = c.items.map((i) => i.value);
  const max = Math.max(...values);
  const tooltip = { callbacks: { label: (x: { parsed: number | { x: number; y: number; r?: number } }) => " " + pct(typeof x.parsed === "number" ? x.parsed : (x.parsed.r ?? (c.kind === "bar" ? x.parsed.x : x.parsed.y))) } };
  const base = { responsive: true, maintainAspectRatio: false, animation: { duration: 400 } };
  if (c.kind === "pie" || c.kind === "polar")
    return {
      type: c.kind === "pie" ? "doughnut" : "polarArea",
      data: { labels, datasets: [{ data: values, backgroundColor: c.kind === "pie" ? seq(th) : seq(th).map((x) => x + "cc"), borderColor: th.bg, borderWidth: 2 }] },
      options: {
        ...base,
        ...(c.kind === "pie" ? { cutout: "58%" } : { scales: { r: { ticks: { display: false }, grid: { color: th.grid } } } }),
        plugins: { legend: { position: "right", labels: { color: th.fg, boxWidth: 10, font: { size: 11 } } }, tooltip },
      },
    } as ChartConfiguration;
  if (c.kind === "radar")
    return {
      type: "radar",
      data: { labels, datasets: [{ data: values, borderColor: th.efl2, backgroundColor: th.efl + "38", pointBackgroundColor: th.efl2, borderWidth: 2 }] },
      options: { ...base, plugins: { legend: { display: false }, tooltip }, scales: { r: { suggestedMin: 0, ticks: { backdropColor: "transparent", color: th.fg, callback: (v: number | string) => "%" + v }, grid: { color: th.grid }, angleLines: { color: th.grid }, pointLabels: { color: th.head, font: { size: 11 } } } } },
    } as ChartConfiguration;
  if (c.kind === "line" || c.kind === "area")
    return {
      type: "line",
      data: { labels: labels.map((l) => wrapLabel(l, 14)), datasets: [{ data: values, borderColor: th.accent, backgroundColor: th.tur + "33", fill: c.kind === "area", tension: 0.35, pointRadius: 3, pointBackgroundColor: th.accent, borderWidth: 2 }] },
      options: { ...base, plugins: { legend: { display: false }, tooltip }, scales: { y: { beginAtZero: true, grid: { color: th.grid }, ticks: { color: th.fg, callback: (v: number | string) => "%" + v } }, x: { grid: { display: false }, ticks: { color: th.fg } } } },
    } as ChartConfiguration;
  const horiz = c.kind === "bar";
  // En yüksek değer turkuaz, diğerleri lacivert tonu
  const colors = values.map((v) => (v === max ? th.tur : th.navy3));
  const valAxis = { beginAtZero: true, suggestedMax: Math.min(100, Math.ceil((max * 1.18) / 5) * 5), ticks: { color: th.fg, callback: (v: number | string) => "%" + v }, grid: { color: th.grid }, border: { display: false } };
  const catAxis = { ticks: { color: th.head, autoSkip: false, font: { size: 11.5 } }, grid: { display: false }, border: { color: th.grid } };
  return {
    type: "bar",
    data: { labels: labels.map((l) => wrapLabel(l, horiz ? 30 : 14)), datasets: [{ data: values, backgroundColor: colors, borderRadius: 3, maxBarThickness: horiz ? 24 : 46 }] },
    options: { ...base, indexAxis: horiz ? "y" : "x", layout: { padding: horiz ? { right: 48 } : { top: 18 } }, plugins: { legend: { display: false }, tooltip }, scales: horiz ? { x: valAxis, y: catAxis } : { x: catAxis, y: valAxis } },
    plugins: [valueLabels],
  } as ChartConfiguration;
}

const fmt = (v: number) => v.toLocaleString("tr-TR", { maximumFractionDigits: 1 });

/** Iraksak ölçek: ilk yarı olumsuz, orta değer kararsız, son yarı olumlu; kararsız merkez çizginin iki yanına bölünür */
function Diverging({ c }: { c: FindingChart }) {
  const n = c.items.length;
  const mid = n % 2 ? (n - 1) / 2 : -1;
  const neg = c.items.slice(0, Math.floor(n / 2)).reduce((a, i) => a + i.value, 0) + (mid >= 0 ? c.items[mid].value / 2 : 0);
  const S = 0.5;
  const shades = ["var(--navy)", "var(--navy-3)", "var(--line)", "var(--tur-mid)", "var(--tur)"];
  const col = (i: number) => (n === 5 ? shades[i] : i < n / 2 ? (i === 0 ? shades[0] : shades[1]) : i === mid ? shades[2] : i === n - 1 ? shades[4] : shades[3]);
  return (
    <div className="diverge">
      <div className="trk" role="img" aria-label={c.title}>
        <span style={{ width: `${Math.max(0, 50 - neg * S)}%` }} />
        {c.items.map((it, i) => (
          <span key={it.label} title={`${it.label}: ${pct(it.value)}`} style={{ width: `${it.value * S}%`, background: col(i) }} />
        ))}
      </div>
      <div className="fleg" style={{ marginTop: 10 }}>
        {c.items.map((it, i) => (
          <span key={it.label}>
            <i style={{ background: col(i) }} />
            {it.label} {pct(it.value)}
          </span>
        ))}
      </div>
      <div className="fleg mono" style={{ justifyContent: "space-between", marginTop: 6 }}>
        <span>← olumsuz</span>
        <span>olumlu →</span>
      </div>
    </div>
  );
}

const WAFFLE = ["var(--tur)", "var(--navy)", "var(--efl)", "var(--navy-3)", "var(--tur-mid)", "var(--efl-mid)", "var(--tur-2)", "var(--efl-2)"];

function Waffle({ c }: { c: FindingChart }) {
  // Kareler en büyük kalan yöntemiyle 100'e tamamlanır
  const tot = c.items.reduce((a, i) => a + i.value, 0) || 1;
  const raw = c.items.map((i) => (i.value / tot) * 100);
  const cnt = raw.map(Math.floor);
  let left = 100 - cnt.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => left-- > 0 && cnt[i]++);
  const cells = cnt.flatMap((k, i) => Array(k).fill(i));
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="waffle" role="img" aria-label={c.title}>
        {cells.map((i, k) => (
          <i key={k} style={{ background: WAFFLE[i % WAFFLE.length] }} />
        ))}
      </div>
      <div className="fleg">
        {c.items.map((it, i) => (
          <span key={it.label}>
            <i style={{ background: WAFFLE[i % WAFFLE.length] }} />
            {it.label} {pct(it.value)}
          </span>
        ))}
      </div>
    </div>
  );
}

function Gauge({ c }: { c: FindingChart }) {
  const v = Math.max(0, Math.min(100, c.items[0].value));
  const a = Math.PI * (1 - v / 100);
  const x = 140 + 110 * Math.cos(a), y = 140 - 110 * Math.sin(a);
  return (
    <svg className="gauge-svg" viewBox="0 0 280 160" role="img" aria-label={`${c.items[0].label}: ${pct(v)}`}>
      <path d="M30 140 A110 110 0 0 1 250 140" fill="none" stroke="var(--surface-2)" strokeWidth="20" strokeLinecap="round" />
      <path d={`M30 140 A110 110 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`} fill="none" stroke="var(--tur)" strokeWidth="20" strokeLinecap="round" />
      <text x="140" y="120" textAnchor="middle" fontSize="38" fontWeight="700" fill="var(--head)" style={{ fontFamily: "var(--f-display)" }}>
        {pct(v)}
      </text>
      <text x="140" y="148" textAnchor="middle" fontSize="11" fill="var(--muted)">
        {c.items[0].label.slice(0, 48)}
      </text>
    </svg>
  );
}

const SUFFIX = ["ı", "i", "si", "ü", "ü", "i", "sı", "si", "i", "u", "u"];

function People({ c }: { c: FindingChart }) {
  const on = Math.round(c.items[0].value / 10);
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="people-row" role="img" aria-label={`Her 10 kişiden ${on}: ${c.items[0].label}`}>
        {Array.from({ length: 10 }, (_, i) => (
          <svg key={i} viewBox="0 0 20 34" aria-hidden="true">
            <circle cx="10" cy="6" r="5" fill={i < on ? "var(--efl-2)" : "var(--line)"} />
            <path d="M2 32 V18 a8 8 0 0 1 16 0 V32 z" fill={i < on ? "var(--efl-2)" : "var(--line)"} />
          </svg>
        ))}
      </div>
      <p className="small">
        <b className="mono">Her 10 kişiden {on}’{SUFFIX[on]}</b> · {c.items[0].label} ({pct(c.items[0].value)})
      </p>
    </div>
  );
}

function Lollipop({ c }: { c: FindingChart }) {
  const max = Math.max(...c.items.map((i) => i.value)) || 1;
  const top = Math.min(100, Math.ceil((max * 1.1) / 5) * 5);
  return (
    <div className="lolli">
      {c.items.map((it) => (
        <div className="r" key={it.label}>
          <span>{it.label}</span>
          <div className="ln">
            <i style={{ width: `${(it.value / top) * 100}%` }} />
            <b className={it.value === max ? "hi" : ""} style={{ left: `${(it.value / top) * 100}%` }} />
          </div>
          <span className="mono" style={{ textAlign: "right" }}>
            {fmt(it.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

const TREE = ["var(--navy)", "var(--navy-3)", "var(--tur-2)", "var(--tur)", "var(--efl-2)", "var(--efl)", "var(--efl-mid)", "var(--tur-mid)"];

function Treemap({ c }: { c: FindingChart }) {
  const sorted = [...c.items].sort((a, b) => b.value - a.value);
  return (
    <div className="tree" role="img" aria-label={c.title}>
      {sorted.map((it, i) => (
        <div key={it.label} style={{ flexBasis: `${Math.max(12, it.value * 2.2)}%`, flexGrow: it.value, background: TREE[i % TREE.length], color: i >= 6 || TREE[i % TREE.length] === "var(--tur)" ? "#05070C" : "#fff" }}>
          <span>{it.label}</span>
          <b>{pct(it.value)}</b>
        </div>
      ))}
    </div>
  );
}

/** Rapor verisi grafiği: grafik / tablo görünümü, kısa yorum ve kaynak satırı */
export function FindingChartCard({ c, source, compact }: { c: FindingChart; source?: string; compact?: boolean }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const canvas = CANVAS_KINDS.includes(c.kind);
  const config = useMemo(() => (canvas ? configFor(c) : null), [c, canvas]);
  const h = c.kind === "bar" ? Math.max(200, c.items.length * 38 + 40) : c.kind === "radar" ? 300 : 260;
  return (
    <figure className="card fchart">
      <div className="qres-head">
        <div className="stack" style={{ gap: 4, minWidth: 0 }}>
          {c.question ? <span className="small muted">“{c.question}”</span> : null}
          <h3>{c.title}</h3>
        </div>
        <div className="seg" role="group" aria-label="Görünüm">
          <button aria-pressed={view === "chart"} onClick={() => setView("chart")}>
            Grafik
          </button>
          <button aria-pressed={view === "table"} onClick={() => setView("table")}>
            Tablo
          </button>
        </div>
      </div>
      {view === "table" ? (
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Yanıt</th>
                <th className="num">%</th>
              </tr>
            </thead>
            <tbody>
              {c.items.map((i) => (
                <tr key={i.label}>
                  <td>{i.label}</td>
                  <td className="num">{pct(i.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : config ? (
        <ChartCanvas config={config} label={`${c.title} grafiği`} height={compact ? Math.min(h, 280) : h} />
      ) : c.kind === "diverging" ? (
        <Diverging c={c} />
      ) : c.kind === "waffle" ? (
        <Waffle c={c} />
      ) : c.kind === "gauge" ? (
        <Gauge c={c} />
      ) : c.kind === "people" ? (
        <People c={c} />
      ) : c.kind === "lollipop" ? (
        <Lollipop c={c} />
      ) : (
        <Treemap c={c} />
      )}
      {c.insight ? <p className="insight">{c.insight}</p> : null}
      {source ? <figcaption className="small muted">Kaynak: {source}</figcaption> : null}
    </figure>
  );
}

export function FindingShowcase({ items }: { items: PublicFinding[] }) {
  const [i, setI] = useState(0);
  const f = items[Math.min(i, items.length - 1)];
  if (!f) return null;
  const src = `MASKDER, ${f.sourceTitle}${f.sourceYear ? ` (${f.sourceYear})` : ""}`;
  return (
    <div className="showcase">
      <div className="showcase-tabs" role="tablist" aria-label="Araştırma raporları">
        {items.map((x, k) => (
          <button key={x.id} role="tab" aria-selected={k === i} onClick={() => setI(k)}>
            {x.category ? <span className="small">{x.category.name}</span> : null}
            <b>{x.title}</b>
          </button>
        ))}
      </div>
      <div className="showcase-body" role="tabpanel">
        <div className="stack" style={{ gap: 14 }}>
          <p className="showcase-lead">{f.summary}</p>
          {f.stats.length ? (
            <div className="figures">
              {f.stats.slice(0, 4).map((s) => (
                <div className="figure" key={s.label}>
                  <b>{s.value}</b>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="row" style={{ gap: 10 }}>
            <Link className="btn" href={`/bulgular/${f.slug}`}>
              Tüm verileri incele <Icon name="arrow" />
            </Link>
            {f.sourceUrl ? (
              <a className="btn onnavy" href={f.sourceUrl} target="_blank" rel="noopener noreferrer">
                Raporu oku (PDF)
              </a>
            ) : null}
          </div>
        </div>
        {f.charts[0] ? <FindingChartCard key={f.id} c={f.charts[0]} source={src} compact /> : null}
      </div>
    </div>
  );
}
