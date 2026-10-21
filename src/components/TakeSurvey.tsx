"use client";
import { useEffect, useRef, useState } from "react";
import { SurveyForm } from "./SurveyForm";
import { api, useToast } from "./ui";
import type { Answer, Question } from "@/lib/types";

interface Props {
  slug: string;
  kiosk: boolean;
  survey: { title: string; description: string; thankYou: string; questions: Question[]; purpose?: string; targetGroup?: string; consentText?: string };
}

/** Herkese açık katılım ekranı (hesap gerekmez) */
export function TakeSurvey({ slug, kiosk, survey }: Props) {
  const toast = useToast();
  const started = useRef(Date.now());
  const [state, setState] = useState<"form" | "done" | "already" | "limit">("form");
  const [round, setRound] = useState(0);
  const key = "maskder-done-" + slug;

  useEffect(() => {
    try {
      if (!kiosk && localStorage.getItem(key)) setState("already");
    } catch {}
  }, [kiosk, key]);

  async function submit(answers: Record<string, Answer>) {
    try {
      await api(`/api/public/${slug}`, "POST", { answers, startedAt: started.current, kiosk });
      try {
        if (!kiosk) localStorage.setItem(key, String(Date.now()));
      } catch {}
      setState("done");
      window.scrollTo(0, 0);
    } catch (e) {
      const m = (e as Error).message;
      if (m.includes("katılımcı sınırı")) setState("limit");
      else toast(m, 5000);
    }
  }

  if (state === "limit")
    return (
      <div className="take">
        <div className="card empty">
          <h2>Katılım sınırına ulaşıldı</h2>
          <p>Bu anket, araştırmacının üyelik planındaki katılımcı sınırına ulaştı. Araştırmacı planını yükselttiğinde yeniden açılacaktır.</p>
        </div>
      </div>
    );
  if (state === "already")
    return (
      <div className="take">
        <div className="take-head empty">
          <p className="eyebrow">Daha önce yanıtladınız</p>
          <h1>{survey.title}</h1>
          <p>Bu cihazdan bu ankete yanıt gönderilmiş. Teşekkür ederiz.</p>
          <button className="btn" onClick={() => setState("form")}>
            Başka bir kişi olarak yanıtla
          </button>
        </div>
      </div>
    );
  if (state === "done")
    return (
      <div className="take">
        <div className="take-head empty">
          <p className="eyebrow">Yanıtınız kaydedildi</p>
          <h1>{survey.thankYou || "Katılımınız için teşekkür ederiz."}</h1>
          <p>{survey.title}</p>
          {kiosk ? (
            <button
              className="btn"
              onClick={() => {
                started.current = Date.now();
                setRound((r) => r + 1);
                setState("form");
                window.scrollTo(0, 0);
              }}
            >
              Yeni katılımcı için yeniden başlat
            </button>
          ) : null}
        </div>
      </div>
    );
  return <SurveyForm key={round} survey={survey} onSubmit={submit} />;
}
