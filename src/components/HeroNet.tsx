"use client";
import { useEffect, useRef } from "react";

/** Ana sayfa: parlayan ufkun üzerinde yavaşça süzülen anket "düğümleri" ağı */
export function HeroNet() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    // Şartname: gereksiz animasyondan kaçınılır; ağ bir kez çizilir ve durağan kalır
    const still = true;
    let W = 0, H = 0, raf = 0;
    let pts: { x: number; y: number; vx: number; vy: number; r: number; hot: boolean }[] = [];
    const LINK = 150;
    const seed = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, Math.max(28, (W * H) / 14000)));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() < 0.12 ? 2.6 : 1.2 + Math.random(),
        hot: Math.random() < 0.1,
      }));
    };
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(120,200,255,${(1 - d / LINK) * 0.32})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.hot ? "rgba(255,255,255,.95)" : "rgba(150,215,255,.9)";
        ctx.shadowColor = p.hot ? "rgba(255,255,255,.85)" : "rgba(57,184,253,.9)";
        ctx.shadowBlur = p.r > 2 ? 14 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;
        if (!still) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -20) p.x = W + 20;
          if (p.x > W + 20) p.x = -20;
          if (p.y < -20) p.y = H + 20;
          if (p.y > H + 20) p.y = -20;
        }
      }
      if (!still) raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      seed();
      if (still) frame();
    };
    seed();
    frame();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return <canvas ref={ref} aria-hidden="true" />;
}
