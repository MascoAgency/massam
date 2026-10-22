"use client";
import { useMemo, useState } from "react";
import { Icon } from "./icons";
import { useToast } from "./ui";
import { LIKERT, hasAnswer, visibleQuestions, estMinutes } from "@/lib/survey";
import type { Answer, Question } from "@/lib/types";
import { SurveyArt, artKeyFor } from "./SurveyArt";

interface Props {
  survey: { title: string; description: string; questions: Question[]; purpose?: string; targetGroup?: string; consentText?: string };
  preview?: boolean;
  onSubmit?: (answers: Record<string, Answer>) => Promise<void>;
}

/** Adım adım anket formu: bilgilendirme/onay → her ekranda bir soru → gönder */
export function SurveyForm({ survey: s, preview, onSubmit }: Props) {
  const toast = useToast();
  const [ans, setAns] = useState<Record<string, Answer>>({});
  const [step, setStep] = useState(-1); // -1: bilgilendirme ekranı
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  const visible = useMemo(() => visibleQuestions(s.questions, ans), [s.questions, ans]);
  const total = visible.length;
  const q = step >= 0 ? visible[Math.min(step, total - 1)] : null;
  const minutes = estMinutes(s.questions);
  const needConsent = !!s.consentText?.trim();

  const set = (id: string, v: Answer) => {
    setAns((a) => ({ ...a, [id]: v }));
    setErr(false);
  };

  function next() {
    if (step === -1) {
      if (needConsent && !consent && !preview) {
        setErr(true);
        return;
      }
      setErr(false);
      setStep(0);
      return;
    }
    if (q && q.required && !hasAnswer(ans[q.id]) && !preview) {
      setErr(true);
      return;
    }
    setErr(false);
    if (step < total - 1) setStep(step + 1);
    else submit();
  }

  async function submit() {
    if (preview || !onSubmit) {
      toast("Önizleme modu: yanıtlar kaydedilmez.");
      return;
    }
    const missing = visible.filter((x) => x.required && !hasAnswer(ans[x.id]));
    if (missing.length) {
      setStep(visible.indexOf(missing[0]));
      setErr(true);
      return;
    }
    // Yalnızca görünür soruların cevapları gönderilir
    const out: Record<string, Answer> = {};
    visible.forEach((x) => {
      if (hasAnswer(ans[x.id])) out[x.id] = ans[x.id];
    });
    setBusy(true);
    try {
      await onSubmit(out);
    } finally {
      setBusy(false);
    }
  }

  const pct = step < 0 ? 0 : Math.round(((step + 1) / Math.max(1, total)) * 100);

  return (
    <div className="take stack">
      {preview ? (
        <div className="callout warn">
          <Icon name="info" />
          <span>Önizleme modu. Yanıtlar kaydedilmez.</span>
        </div>
      ) : null}
      {step < 0 ? <SurveyArt art={artKeyFor(s.title || "")} label={s.title} className="take-art" /> : null}
      <div className="take-head stack" style={{ gap: 10 }}>
        <p className="eyebrow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/massam-logo.svg" alt="" />
          MASSAM Araştırma
        </p>
        <h1>{s.title || "Adsız anket"}</h1>
        <div className="row small muted" style={{ gap: 14 }}>
          <span>{s.questions.length} soru</span>
          <span>Yaklaşık {minutes} dakika</span>
          {step >= 0 ? <span>Soru {Math.min(step + 1, total)} / {total}</span> : null}
        </div>
        <div className="progress" aria-label={`İlerleme %${pct}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>

      {step === -1 ? (
        <div className="tq">
          {s.description ? <p style={{ whiteSpace: "pre-line" }}>{s.description}</p> : null}
          {s.purpose ? (
            <div>
              <b className="small">Araştırmanın amacı</b>
              <p className="small muted" style={{ whiteSpace: "pre-line" }}>{s.purpose}</p>
            </div>
          ) : null}
          {s.targetGroup ? (
            <div>
              <b className="small">Hedef katılımcı grubu</b>
              <p className="small muted">{s.targetGroup}</p>
            </div>
          ) : null}
          {needConsent ? (
            <div className="consent">
              <b className="small">Bilgilendirme ve onay</b>
              <p className="small" style={{ whiteSpace: "pre-line" }}>{s.consentText}</p>
              <label className="check">
                <input type="checkbox" checked={consent} onChange={(e) => (setConsent(e.target.checked), setErr(false))} /> Bilgilendirme metnini okudum, araştırmaya gönüllü olarak katılmayı kabul ediyorum.
              </label>
            </div>
          ) : (
            <p className="small muted">Yanıtlarınız anonim olarak kaydedilir ve yalnızca toplu olarak, istatistiksel amaçla değerlendirilir.</p>
          )}
          {err ? <p className="small" style={{ color: "var(--bad)" }}>Devam etmek için bilgilendirme metnini onaylayın.</p> : null}
          <div className="row between">
            <span />
            <button className="btn primary" onClick={next}>
              Ankete başla <Icon name="arrow" />
            </button>
          </div>
        </div>
      ) : q ? (
        <fieldset className={"tq" + (err ? " err" : "")} key={q.id} style={{ margin: 0 }}>
          <legend className="sr-only">Soru {step + 1}</legend>
          <div>
            <span className="qnum">{step + 1}.</span> <b>{q.title}</b> {q.required ? <span className="req">*</span> : null}
          </div>
          {q.help ? <p className="small muted">{q.help}</p> : null}
          <QuestionInput q={q} a={ans[q.id]} set={(v) => set(q.id, v)} />
          {err ? <p className="small" style={{ color: "var(--bad)" }}>Bu soru zorunludur.</p> : null}
          <div className="row between" style={{ marginTop: 6 }}>
            <button className="btn" onClick={() => (setErr(false), setStep(step - 1))}>
              ← Geri
            </button>
            <button className="btn primary" onClick={next} disabled={busy}>
              {busy ? (
                <>
                  <span className="spinner" /> Gönderiliyor
                </>
              ) : step < total - 1 ? (
                <>
                  İleri <Icon name="arrow" />
                </>
              ) : (
                "Yanıtları gönder"
              )}
            </button>
          </div>
        </fieldset>
      ) : null}
      <p className="small muted" style={{ textAlign: "center" }}>
        <span className="req" style={{ color: "var(--bad)" }}>*</span> zorunlu soru · Yanıtlarınız anonim olarak kaydedilir.
      </p>
    </div>
  );
}

function QuestionInput({ q, a, set }: { q: Question; a: Answer | undefined; set: (v: Answer) => void }) {
  const name = "a-" + q.id;
  // Uzun seçenek listeleri (ör. 81 il) açılır menüyle gösterilir
  if (q.type === "single" && q.options!.length > 15)
    return (
      <select value={(a as string) || ""} onChange={(e) => set(e.target.value)} aria-label={q.title}>
        <option value="">Seçiniz</option>
        {q.options!.map((o, j) => (
          <option key={j} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  if (q.type === "single")
    return (
      <div className="stack" style={{ gap: 6 }} role="radiogroup">
        {q.options!.map((o, j) => (
          <label className="choice" key={j}>
            <input type="radio" name={name} value={o} checked={a === o} onChange={() => set(o)} />
            <span>{o}</span>
          </label>
        ))}
      </div>
    );
  if (q.type === "multi") {
    const cur = Array.isArray(a) ? a : [];
    return (
      <div className="stack" style={{ gap: 6 }}>
        <span className="small muted">Birden fazla seçebilirsiniz.</span>
        {q.options!.map((o, j) => (
          <label className="choice" key={j}>
            <input type="checkbox" name={name} value={o} checked={cur.includes(o)} onChange={(e) => set(e.target.checked ? [...cur, o] : cur.filter((x) => x !== o))} />
            <span>{o}</span>
          </label>
        ))}
      </div>
    );
  }
  if (q.type === "open" && q.short) return <input type="text" placeholder="Cevabınızı yazın" value={(a as string) || ""} onChange={(e) => set(e.target.value)} maxLength={120} aria-label={q.title} />;
  if (q.type === "open") return <textarea rows={5} placeholder="Cevabınızı yazın" value={(a as string) || ""} onChange={(e) => set(e.target.value)} maxLength={5000} aria-label={q.title} />;
  if (q.type === "likert") {
    const labels = LIKERT[(q.scale || 5) as 5 | 7];
    return (
      <div className="scale likert" role="radiogroup" style={{ gridTemplateColumns: `repeat(${labels.length},minmax(0,1fr))` }}>
        {labels.map((l, j) => (
          <label key={j}>
            <input type="radio" name={name} value={j + 1} checked={a === j + 1} onChange={() => set(j + 1)} />
            <b>{j + 1}</b>
            {l}
          </label>
        ))}
      </div>
    );
  }
  const max = q.max || 10;
  return (
    <>
      <div className="scale" role="radiogroup" style={{ gridTemplateColumns: `repeat(${max},minmax(0,1fr))` }}>
        {Array.from({ length: max }, (_, j) => (
          <label key={j}>
            <input type="radio" name={name} value={j + 1} checked={a === j + 1} onChange={() => set(j + 1)} />
            <b>{j + 1}</b>
          </label>
        ))}
      </div>
      <div className="row between small muted">
        <span>{q.minLabel || ""}</span>
        <span>{q.maxLabel || ""}</span>
      </div>
    </>
  );
}
