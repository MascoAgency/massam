"use client";
import { useEffect, useRef } from "react";

/**
 * Sayfa zemininde fareye tepki veren nokta ağı: imleç yaklaştıkça noktalar büyür ve turkuaz/eflatun tonuna döner,
 * yakın noktalar ince çizgilerle imlece bağlanır ("tarama" etkisi). Dokunmatik cihazlarda ve
 * hareket azaltma tercihinde çalışmaz; yalnızca fare hareket ederken çizim yapar.
 */
export function CursorField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(pointer: fine)").matches) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const GAP = 26, R = 170;
    let w = 0, h = 0, dpr = 1;
    const target = { x: -999, y: -999 }, pos = { x: -999, y: -999 };
    let raf = 0, active = false, idle = 0;
    const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    let col = { dot: "#C6D0DD", tur: "#14B8C4", efl: "#9B7FD1" };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      cv.style.width = w + "px";
      cv.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      col = { dot: css("--line-2") || col.dot, tur: css("--tur") || col.tur, efl: css("--efl") || col.efl };
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const x0 = Math.max(0, Math.floor((pos.x - R) / GAP)), x1 = Math.ceil((pos.x + R) / GAP);
      const y0 = Math.max(0, Math.floor((pos.y - R) / GAP)), y1 = Math.ceil((pos.y + R) / GAP);
      for (let gx = x0; gx <= x1; gx++)
        for (let gy = y0; gy <= y1; gy++) {
          const x = gx * GAP + GAP / 2, y = gy * GAP + GAP / 2;
          const d = Math.hypot(x - pos.x, y - pos.y);
          if (d > R) continue;
          const t = 1 - d / R;
          ctx.globalAlpha = 0.15 + t * 0.75;
          ctx.fillStyle = (gx + gy) % 5 === 0 ? col.efl : col.tur;
          ctx.beginPath();
          ctx.arc(x, y, 1 + t * 2.2, 0, Math.PI * 2);
          ctx.fill();
          if (t > 0.55) {
            ctx.globalAlpha = (t - 0.55) * 0.9;
            ctx.strokeStyle = col.tur;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
        }
      // imleç çevresinde tarama halkası
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = col.tur;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 16 + Math.sin(idle / 12) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      idle++;
      draw();
      if (Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.5 || idle < 40) raf = requestAnimationFrame(tick);
      else active = false;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (pos.x < -900) {
        pos.x = e.clientX;
        pos.y = e.clientY;
      }
      target.x = e.clientX;
      target.y = e.clientY;
      idle = 0;
      if (!active) {
        active = true;
        raf = requestAnimationFrame(tick);
      }
    };
    const leave = () => {
      target.x = pos.x = -999;
      target.y = pos.y = -999;
      draw();
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("mouseleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, []);
  return <canvas ref={ref} className="cursor-field" aria-hidden="true" />;
}
