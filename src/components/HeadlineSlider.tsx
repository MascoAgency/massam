"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";

export type Headline = {
  key: string;
  kicker: string;
  title: string;
  text: string;
  value: number | null;
  href: string;
  source: string;
  tone: "t" | "e" | "n";
  intro?: boolean;
  /** Rozet metni (varsayılan: HABER 01) */
  label?: string;
  /** Bağlantı metni */
  cta?: string;
  /** Oran yoksa sağ tarafta gösterilecek büyük bilgi */
  stat?: { big: string; small: string };
  /** Konuya ait fotoğraf ve künyesi */
  image?: { src: string; alt: string; credit: string } | null;
};

const INTERVAL = 4000;

/** Ana sayfa manşet bandı: 4 saniyede bir kayar, fare üzerindeyken veya odaktayken durur, kaydırma hareketini destekler */
export function HeadlineSlider({ items, label = "Öne çıkan haberler", variant }: { items: Headline[]; label?: string; variant?: "live" }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const startX = useRef<number | null>(null);
  const dragged = useRef(false);
  const n = items.length;
  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
  }, []);
  useEffect(() => {
    if (paused || reduced || n < 2) return;
    const t = setTimeout(() => {
      if (!document.hidden) go(i + 1);
    }, INTERVAL);
    return () => clearTimeout(t);
  }, [i, paused, reduced, n, go]);

  if (!n) return null;
  return (
    <section
      className={"headlines" + (variant ? " " + variant : "")}
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current == null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        dragged.current = Math.abs(dx) > 10;
        if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
      }}
      onClickCapture={(e) => {
        // Kaydırma hareketinin sonundaki tıklama bağlantıyı açmasın
        if (dragged.current) {
          e.preventDefault();
          dragged.current = false;
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(i + 1);
        if (e.key === "ArrowLeft") go(i - 1);
      }}
    >
      <div className="hl-viewport">
        <div className="hl-track" style={{ transform: `translateX(-${i * 100}%)` }} aria-live={paused ? "polite" : "off"}>
          {items.map((h, k) => (
            <Link
              key={h.key}
              href={h.href}
              className={"hl-slide " + h.tone + (h.intro ? " intro" : "") + (h.image ? " has-img" : "")}
              aria-roledescription="slide"
              aria-label={`${k + 1} / ${n}: ${h.title}`}
              aria-hidden={k !== i}
              tabIndex={k === i ? 0 : -1}
              draggable={false}
            >
              <div className="hl-copy">
                <span className="hl-kicker">
                  <b>{h.label || (h.intro ? "DUYURU" : `HABER ${String(k).padStart(2, "0")}`)}</b> · {h.kicker}
                </span>
                <h2>{h.title}</h2>
                {h.text ? <p>{h.text}</p> : null}
                <span className="hl-more">
                  {h.cta || (h.intro ? "Platformu tanıyın" : "Araştırmanın ayrıntıları")} <Icon name="arrow" />
                </span>
                <span className="hl-src">{h.source}</span>
              </div>
              <div className={h.image ? "hl-photo" : "hl-visual"} aria-hidden={h.image ? undefined : true}>
                {h.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="hl-img" src={h.image.src} alt={h.image.alt} draggable={false} loading={k === 0 ? "eager" : "lazy"} />
                ) : null}
                {h.image && h.image.credit ? <span className="hl-credit">{h.image.credit}</span> : null}
                <div className={h.image ? "hl-chip" : "hl-chip-plain"} aria-hidden="true">
                {h.value != null ? (
                  <svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface-2)" strokeWidth="12" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={h.tone === "e" ? "var(--efl)" : h.tone === "n" ? "var(--navy)" : "var(--tur)"}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${(Math.min(100, h.value) / 100) * 314.16} 314.16`}
                      transform="rotate(-90 60 60)"
                      className={k === i ? "hl-arc on" : "hl-arc"}
                    />
                    <text x="60" y="68" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--head)" style={{ fontFamily: "var(--f-display)" }}>
                      %{h.value.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}
                    </text>
                  </svg>
                ) : h.stat ? (
                  <div className="hl-stat">
                    <b>{h.stat.big}</b>
                    <span>{h.stat.small}</span>
                  </div>
                ) : h.image ? null : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/massam-logo.svg" alt="" draggable={false} />
                )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="hl-bar">
        <div className="hl-dots" role="tablist" aria-label={label + ": seç"}>
          {items.map((h, k) => (
            <button key={h.key} role="tab" aria-selected={k === i} aria-label={`${k + 1}. öğe`} onClick={() => go(k)}>
              {k === i && !paused && !reduced && n > 1 ? <i key={i} /> : null}
            </button>
          ))}
        </div>
        <span className="hl-count mono">
          {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
        </span>
        <div className="row" style={{ gap: 6 }}>
          <button className="iconbtn" aria-label="Önceki" onClick={() => go(i - 1)} style={{ transform: "scaleX(-1)" }}>
            <Icon name="arrow" />
          </button>
          <button className="iconbtn" aria-label="Sonraki" onClick={() => go(i + 1)}>
            <Icon name="arrow" />
          </button>
        </div>
      </div>
    </section>
  );
}
