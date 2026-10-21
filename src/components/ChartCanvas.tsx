"use client";
import { useEffect, useRef } from "react";
import { Chart, registerables, type ChartConfiguration } from "chart.js";
import { PALETTE } from "@/lib/survey";
import { fmtN } from "@/lib/format";

Chart.register(...registerables);
// Grafik yazıları sayfanın gövde yazı tipini kullanır
if (typeof window !== "undefined") Chart.defaults.font.family = getComputedStyle(document.body).fontFamily || "Inter, system-ui, sans-serif";

export function ChartCanvas({ config, label, height = 280 }: { config: ChartConfiguration; label: string; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const c = new Chart(ref.current, config);
    return () => c.destroy();
  }, [config]);
  return (
    <div className="chart-box" style={{ height }}>
      <canvas ref={ref} role="img" aria-label={label} />
    </div>
  );
}

export function chartTheme() {
  const css = (n: string) => (typeof window === "undefined" ? "" : getComputedStyle(document.documentElement).getPropertyValue(n).trim());
  return {
    fg: css("--muted") || "#5A6680",
    grid: css("--line") || "#DCE3EC",
    bg: css("--surface") || "#ffffff",
    head: css("--head") || "#05070C",
    accent: css("--tur-2") || "#0E8C96",
    tur: css("--tur") || "#14B8C4",
    turMid: css("--tur-mid") || "#9FE3E8",
    efl: css("--efl") || "#9B7FD1",
    efl2: css("--efl-2") || "#6F52A8",
    eflMid: css("--efl-mid") || "#CDBDEB",
    navy: css("--navy") || "#0B1F3A",
    navy3: css("--navy-3") || "#1E3A64",
    soft: css("--surface-2") || "#EEF2F8",
  };
}

function wrapLabel(l: string, n = 24): string | string[] {
  const words = String(l).split(" ");
  const lines: string[] = [];
  let cur = "";
  words.forEach((w) => {
    if ((cur + " " + w).trim().length > n) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  });
  if (cur) lines.push(cur);
  return lines.length > 1 ? lines : l;
}

export type ChartKind = "pie" | "column" | "bar";

export function makeChartConfig(kind: ChartKind, labels: string[], values: number[], mono = false): ChartConfiguration {
  const th = chartTheme();
  const colors = labels.map((_, i) => PALETTE[i % PALETTE.length]);
  const tot = values.reduce((a, b) => a + b, 0);
  const base = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 350 },
    plugins: {
      legend: { display: kind === "pie", position: "bottom" as const, labels: { color: th.fg, boxWidth: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (c: { parsed: number | { x: number; y: number } }) => {
            const p = c.parsed;
            const v = typeof p === "number" ? p : kind === "bar" ? p.x : p.y;
            return ` ${v} (${tot ? fmtN((v / tot) * 100, 1) : 0}%)`;
          },
        },
      },
    },
  };
  if (kind === "pie")
    return {
      type: "doughnut",
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderColor: th.bg, borderWidth: 2 }] },
      options: { ...base, cutout: "48%" },
    } as ChartConfiguration;
  const horiz = kind === "bar";
  const valAxis = { beginAtZero: true, ticks: { color: th.fg, precision: 0 }, grid: { color: th.grid }, border: { display: false } };
  const catAxis = { ticks: { color: th.fg, autoSkip: false }, grid: { display: false }, border: { color: th.grid } };
  return {
    type: "bar",
    data: { labels: labels.map((l) => wrapLabel(l, horiz ? 28 : 14)), datasets: [{ data: values, backgroundColor: mono ? th.accent : colors, borderRadius: 3, maxBarThickness: 44 }] },
    options: { ...base, indexAxis: horiz ? "y" : "x", scales: horiz ? { x: valAxis, y: catAxis } : { x: catAxis, y: valAxis } },
  } as ChartConfiguration;
}

export { wrapLabel };
