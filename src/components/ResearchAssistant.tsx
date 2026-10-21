"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, useToast } from "./ui";
import { Icon } from "./icons";
import { RichTextClient } from "./RichTextClient";

type Msg = { role: "user" | "assistant"; content: string };

const AREAS = ["Akademik", "Siyasal", "Toplumsal", "Finansal", "Yönetsel", "Pazarlama"];
const STARTERS = [
  "Üniversite öğrencilerinin siyasete katılımını ölçmek istiyorum. Hangi yöntem ve örneklem uygun olur?",
  "İstanbul'da belediye hizmetlerinden memnuniyet anketi için soru taslağı öner.",
  "Gençlerin finansal okuryazarlık düzeyini ölçmek için hangi ölçekleri kullanabilirim?",
  "Yeni bir marka için tüketici algısı araştırmasını nasıl tasarlamalıyım?",
];
const STORE = "maskder-asistan-sohbet";

export function ResearchAssistant({ categories, ready }: { categories: { id: string; name: string }[]; ready: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<"" | "chat" | "survey">("");
  const [idea, setIdea] = useState("");
  const [cat, setCat] = useState("");
  const [count, setCount] = useState(12);
  const end = useRef<HTMLDivElement>(null);

  // Sohbet bu tarayıcıda oturum boyunca saklanır
  useEffect(() => {
    try {
      const s = sessionStorage.getItem(STORE);
      if (s) setMsgs(JSON.parse(s));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-30)));
    } catch {}
    end.current?.scrollIntoView({ block: "nearest" });
  }, [msgs]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    const next = [...msgs, { role: "user" as const, content: t }];
    setMsgs(next);
    setInput("");
    if (!idea) setIdea(t);
    setBusy("chat");
    try {
      const d = await api<{ reply: string }>("/api/admin/assistant", "POST", { messages: next });
      setMsgs([...next, { role: "assistant", content: d.reply }]);
    } catch (e) {
      toast((e as Error).message, 6000);
      setMsgs(next);
    } finally {
      setBusy("");
    }
  }

  async function toSurvey() {
    const t = (idea || msgs.filter((m) => m.role === "user").map((m) => m.content).join("\n\n")).trim();
    if (t.length < 15) {
      toast("Önce araştırma fikrinizi birkaç cümleyle yazın.", 4000);
      return;
    }
    setBusy("survey");
    try {
      const d = await api<{ id: string; questions: number; methodNote: string }>("/api/admin/assistant/survey", "POST", { idea: t, messages: msgs, categoryId: cat || null, questionCount: count });
      try {
        sessionStorage.setItem("maskder-asistan-yontem-" + d.id, d.methodNote || "");
      } catch {}
      toast(`Taslak anket hazırlandı (${d.questions} soru). Düzenleyip onaylayabilirsiniz.`, 4000);
      router.push(`/panel/anket/${d.id}/duzenle?asistan=1`);
    } catch (e) {
      toast((e as Error).message, 6000);
      setBusy("");
    }
  }

  return (
    <div className="assistant">
      <div className="card asst-chat">
        <div className="asst-head">
          <span className="asst-av" aria-hidden="true">
            <Icon name="spark" />
          </span>
          <div className="stack" style={{ gap: 2, minWidth: 0 }}>
            <b>Araştırma Merkezi Asistanı</b>
            <span className="small muted">Araştırma tasarımı, yöntem, örneklem, ölçme, analiz ve raporlama</span>
          </div>
          {msgs.length ? (
            <button className="btn sm ghost" onClick={() => setMsgs([])}>
              Yeni sohbet
            </button>
          ) : null}
        </div>
        <div className="asst-areas">
          {AREAS.map((a) => (
            <span key={a} className="pill plain">
              {a}
            </span>
          ))}
        </div>
        {!ready ? (
          <div className="callout warn">
            <Icon name="info" />
            <span>
              Asistanın çalışması için sunucuda <span className="mono">ANTHROPIC_API_KEY</span> ortam değişkeni tanımlanmalıdır (Vercel → Settings → Environment Variables). Anahtar eklendikten sonra yeniden yayınlayın.
            </span>
          </div>
        ) : null}
        <div className="asst-log" aria-live="polite">
          {msgs.length ? (
            msgs.map((m, i) => (
              <div key={i} className={"asst-msg " + m.role}>
                {m.role === "assistant" ? <RichTextClient text={m.content} /> : <p>{m.content}</p>}
                {m.role === "user" ? (
                  <button className="link-mini" onClick={() => setIdea(m.content)} title="Bu mesajı ankete dönüştürülecek fikir olarak kullan">
                    Fikir olarak kullan
                  </button>
                ) : null}
              </div>
            ))
          ) : (
            <div className="asst-empty">
              <p className="muted small">Araştırma fikrinizi, sorunuzu veya taslağınızı yazın. Asistan yalnızca araştırma faaliyetleriyle ilgili sorulara yanıt verir.</p>
              <div className="stack" style={{ gap: 6 }}>
                {STARTERS.map((s) => (
                  <button key={s} className="asst-starter" onClick={() => send(s)} disabled={!ready}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {busy === "chat" ? (
            <div className="asst-msg assistant typing" aria-label="Asistan yazıyor">
              <i />
              <i />
              <i />
            </div>
          ) : null}
          <div ref={end} />
        </div>
        <form
          className="asst-input"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <textarea
            rows={2}
            value={input}
            placeholder="Örn. Hatay'da depremzedelerin konut ihtiyacını ölçen bir saha araştırması planlıyorum…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            aria-label="Asistana mesaj"
          />
          <button className="btn primary" type="submit" disabled={!input.trim() || !!busy || !ready}>
            Gönder
          </button>
        </form>
      </div>

      <aside className="card asst-side">
        <span className="eyebrow">Fikirden ankete</span>
        <h3>Örnek ankete dönüştür</h3>
        <p className="small muted">Asistan fikrinizi soruları, seçenekleri, onay metni ve araştırma alanıyla birlikte taslak bir ankete çevirir. Taslağı düzenleyici ekranda değiştirip durumunu “Yayında” yaptığınızda anket ana sayfada ve ilgili alan sayfasında yayımlanır.</p>
        <label className="f">
          Araştırma fikri
          <textarea rows={6} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Araştırmanın konusu, amacı ve hedef kitlesi…" />
        </label>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label className="f">
            Araştırma alanı
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">Asistan seçsin</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="f">
            Soru sayısı
            <input type="number" min={5} max={25} value={count} onChange={(e) => setCount(+e.target.value)} />
          </label>
        </div>
        <button className="btn signal" onClick={toSurvey} disabled={!!busy || !ready} style={{ justifyContent: "center" }}>
          {busy === "survey" ? (
            <>
              <span className="spinner" /> Anket hazırlanıyor…
            </>
          ) : (
            <>
              <Icon name="spark" /> Örnek ankete dönüştür
            </>
          )}
        </button>
        <ol className="asst-steps">
          <li>Fikrinizi yazın veya sohbetten bir mesajı seçin</li>
          <li>Taslak anket otomatik oluşturulur</li>
          <li>Soruları düzenleyin, tarihleri belirleyin</li>
          <li>Onaylayıp yayına alın</li>
        </ol>
      </aside>
    </div>
  );
}
