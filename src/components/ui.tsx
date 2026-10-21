"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";
import type { SurveyStatus } from "@/lib/types";

// ---------- toast ----------
const ToastCtx = createContext<(msg: string, ms?: number) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((m: string, ms = 2800) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(null), ms);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast" hidden={!msg} role="status" aria-live="polite">
        {msg}
      </div>
    </ToastCtx.Provider>
  );
}

// ---------- modal ----------
export function Modal({ title, onClose, children, foot }: { title: string; onClose: () => void; children: ReactNode; foot?: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-in" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="iconbtn" onClick={onClose} aria-label="Kapat">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {foot ? (
          <div className="modal-head" style={{ borderTop: "1px solid var(--line)", borderBottom: 0, borderRadius: "0 0 var(--r) var(--r)", position: "static" }}>
            {foot}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function StatusPill({ s }: { s: { status: SurveyStatus } }) {
  return s.status === "open" ? <span className="pill open">Açık</span> : s.status === "closed" ? <span className="pill closed">Kapalı</span> : <span className="pill draft">Taslak</span>;
}

export function Spinner() {
  return <span className="spinner" />;
}

/** JSON API çağrısı; hata mesajını Türkçe olarak fırlatır. */
export async function api<T = Record<string, unknown>>(url: string, method = "POST", body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method, headers: body !== undefined ? { "Content-Type": "application/json" } : undefined, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error("Sunucuya ulaşılamadı. Bağlantınızı kontrol edip yeniden deneyin.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "İşlem tamamlanamadı. Yeniden deneyin.");
  return data as T;
}

export function Meter({ label, used, max }: { label: string; used: number; max: number }) {
  const m = max < 0 ? Infinity : max;
  const pct = m === Infinity ? 0 : Math.min(100, (used / Math.max(1, m)) * 100);
  return (
    <div className="meter">
      <div className="row between small">
        <span>{label}</span>
        <span className="mono">
          {used.toLocaleString("tr-TR")} / {max < 0 ? "Sınırsız" : max.toLocaleString("tr-TR")}
        </span>
      </div>
      <div className="bar">
        <i className={pct >= 100 ? "full" : pct >= 80 ? "hi" : ""} style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}
