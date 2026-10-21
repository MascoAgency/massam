"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "./icons";
import { Modal, api, useToast } from "./ui";
import { SurveyForm } from "./SurveyForm";
import { LIKERT, TYPE_LABEL, blankQuestion, newId } from "@/lib/survey";
import { DEFAULT_CONSENT } from "@/lib/defaults";
import type { Question, QType, SurveyStatus } from "@/lib/types";

export interface Draft {
  id?: string;
  title: string;
  description: string;
  thankYou: string;
  status: SurveyStatus;
  isPlatform: boolean;
  questions: Question[];
  categoryId: string | null;
  purpose: string;
  targetGroup: string;
  consentText: string;
  startsAt: number | null;
  endsAt: number | null;
}

// Tarih alanları Türkiye saatine göre (UTC+3) girilir; sunucu ve tarayıcıda aynı sonucu verir
const toTrInput = (ms: number | null) => (ms ? new Date(ms + 3 * 3600_000).toISOString().slice(0, 16) : "");
const fromTrInput = (v: string) => (v ? new Date(v + ":00+03:00").getTime() : null);

/** Hazır demografik sorular */
const DEMOGRAPHICS: { label: string; q: Omit<Question, "id"> }[] = [
  { label: "Yaş grubu", q: { type: "single", title: "Yaş grubunuz nedir?", required: false, options: ["18 yaş altı", "18-24", "25-34", "35-44", "45-54", "55-64", "65 ve üzeri"] } },
  { label: "Cinsiyet", q: { type: "single", title: "Cinsiyetiniz nedir?", required: false, options: ["Kadın", "Erkek", "Belirtmek istemiyorum"] } },
  { label: "Eğitim durumu", q: { type: "single", title: "En son mezun olduğunuz okul nedir?", required: false, options: ["İlkokul veya altı", "Ortaokul", "Lise", "Ön lisans", "Lisans", "Yüksek lisans", "Doktora"] } },
  { label: "Çalışma durumu", q: { type: "single", title: "Çalışma durumunuz nedir?", required: false, options: ["Öğrenci", "Çalışıyor (kamu)", "Çalışıyor (özel sektör)", "Kendi işi", "Çalışmıyor / iş arıyor", "Emekli", "Ev hanımı / ev erkeği"] } },
  { label: "Yaşanılan bölge", q: { type: "single", title: "Hangi bölgede yaşıyorsunuz?", required: false, options: ["Marmara", "Ege", "Akdeniz", "İç Anadolu", "Karadeniz", "Doğu Anadolu", "Güneydoğu Anadolu", "Yurt dışı"] } },
  { label: "Yerleşim yeri", q: { type: "single", title: "Yaşadığınız yerleşim yeri hangisidir?", required: false, options: ["Büyükşehir merkezi", "İl merkezi", "İlçe merkezi", "Belde / köy"] } },
];

export function SurveyBuilder({ initial, categories }: { initial: Draft; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const toast = useToast();
  const [d, setD] = useState<Draft>(initial);
  const [dirty, setDirty] = useState(!initial.id);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const isNew = !d.id;

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const upd = (patch: Partial<Draft>) => {
    setD((x) => ({ ...x, ...patch }));
    setDirty(true);
  };
  const updQ = (i: number, patch: Partial<Question>) => upd({ questions: d.questions.map((q, k) => (k === i ? { ...q, ...patch } : q)) });
  const qs = d.questions;

  function addQ(t: QType) {
    const q = blankQuestion(t);
    upd({ questions: [...qs, q] });
    setTimeout(() => {
      const el = document.getElementById("qt-" + q.id) as HTMLInputElement | null;
      el?.scrollIntoView({ block: "center" });
      el?.focus();
    }, 30);
  }
  function move(i: number, dir: number) {
    const j = i + dir;
    if (j < 0 || j >= qs.length) return;
    const a = [...qs];
    [a[i], a[j]] = [a[j], a[i]];
    upd({ questions: a });
  }

  async function save() {
    if (!d.title.trim()) {
      toast("Anket başlığı gerekli.");
      document.getElementById("d-title")?.focus();
      return;
    }
    if (!qs.length) return toast("En az bir soru ekleyin.");
    const empty = qs.findIndex((q) => !q.title.trim());
    if (empty >= 0) {
      toast(`S${empty + 1} için soru metni gerekli.`);
      document.getElementById("qt-" + qs[empty].id)?.focus();
      return;
    }
    setBusy(true);
    try {
      if (isNew) {
        const r = await api<{ id: string }>("/api/surveys", "POST", d);
        setDirty(false);
        toast("Anket kaydedildi.");
        router.replace(`/panel/anket/${r.id}/duzenle`);
      } else {
        await api(`/api/surveys/${d.id}`, "PUT", d);
        setDirty(false);
        toast("Anket kaydedildi.");
        router.refresh();
      }
    } catch (e) {
      toast((e as Error).message, 5000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <p className="eyebrow">
            {isNew ? "Yeni anket" : "Anket düzenleme"}
            {d.isPlatform ? " · Platform anketi" : ""}
          </p>
          <h1>{d.title || "Adsız anket"}</h1>
        </div>
        <div className="row">
          <span className="small muted">{dirty ? "Kaydedilmemiş değişiklikler" : "Tüm değişiklikler kaydedildi"}</span>
          {!isNew ? (
            <Link className="btn" href={`/panel/anket/${d.id}`}>
              Sonuçlar
            </Link>
          ) : null}
          <button className="btn" onClick={() => setPreview(true)}>
            <Icon name="eye" /> Önizle
          </button>
          <button className="btn primary" onClick={save} disabled={busy}>
            {busy ? <span className="spinner" /> : null} Kaydet
          </button>
        </div>
      </div>
      <div className="card stack" style={{ gap: 14 }}>
        <label className="f">
          Anket başlığı
          <input type="text" id="d-title" value={d.title} onChange={(e) => upd({ title: e.target.value })} placeholder="Örn. Gençlerin Siyasete Katılımı Araştırması" />
        </label>
        <label className="f">
          Açıklama
          <textarea value={d.description} onChange={(e) => upd({ description: e.target.value })} placeholder="Araştırmanın amacı, süresi ve gizlilik bilgisi" />
        </label>
        <div className="qrow">
          <label className="f">
            Teşekkür mesajı
            <input type="text" value={d.thankYou} onChange={(e) => upd({ thankYou: e.target.value })} placeholder="Katılımınız için teşekkür ederiz." />
          </label>
          <label className="f">
            Durum
            <select value={d.status} onChange={(e) => upd({ status: e.target.value as SurveyStatus })}>
              <option value="draft">Taslak</option>
              <option value="open">Yayında (yanıt kabul ediyor)</option>
              <option value="closed">Yayından kaldırıldı</option>
            </select>
          </label>
        </div>
        <div className="grid g3">
          <label className="f">
            Araştırma alanı
            <select value={d.categoryId || ""} onChange={(e) => upd({ categoryId: e.target.value || null })}>
              <option value="">Seçilmedi</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="f">
            Başlangıç (isteğe bağlı)
            <input type="datetime-local" value={toTrInput(d.startsAt)} onChange={(e) => upd({ startsAt: fromTrInput(e.target.value) })} />
          </label>
          <label className="f">
            Bitiş (isteğe bağlı)
            <input type="datetime-local" value={toTrInput(d.endsAt)} onChange={(e) => upd({ endsAt: fromTrInput(e.target.value) })} />
          </label>
        </div>
        <p className="small muted" style={{ marginTop: -6 }}>Tarihler Türkiye saatine göredir. Durum “Yayında” olsa bile anket yalnızca bu tarihler arasında yanıt kabul eder.</p>
        <div className="qrow">
          <label className="f">
            Araştırmanın amacı
            <textarea value={d.purpose} onChange={(e) => upd({ purpose: e.target.value })} placeholder="Bu araştırmayla neyi öğrenmek istiyorsunuz?" />
          </label>
          <label className="f">
            Hedef katılımcı grubu
            <textarea value={d.targetGroup} onChange={(e) => upd({ targetGroup: e.target.value })} placeholder="Örn. 18-29 yaş arası üniversite öğrencileri" />
          </label>
        </div>
        <label className="f">
          <span className="row between">
            Bilgilendirme ve onay metni
            <button type="button" className="btn sm ghost" onClick={() => upd({ consentText: DEFAULT_CONSENT })}>
              Varsayılan metni ekle
            </button>
          </span>
          <textarea rows={4} value={d.consentText} onChange={(e) => upd({ consentText: e.target.value })} placeholder="Doldurulursa katılımcı ankete başlamadan önce bu metni okuyup onaylar." />
        </label>
      </div>

      <div className="stack" style={{ gap: 12 }}>
        {qs.map((q, i) => (
          <div className="qcard" key={q.id}>
            <div className="qcard-head">
              <div className="row" style={{ gap: 8 }}>
                <span className="qnum">S{i + 1}</span>
                <span className="pill plain">{TYPE_LABEL[q.type]}</span>
              </div>
              <div className="qtools">
                <button className="iconbtn" onClick={() => move(i, -1)} aria-label="Yukarı taşı" disabled={i === 0}>
                  <Icon name="up" />
                </button>
                <button className="iconbtn" onClick={() => move(i, 1)} aria-label="Aşağı taşı" disabled={i === qs.length - 1}>
                  <Icon name="down" />
                </button>
                <button
                  className="iconbtn"
                  aria-label="Soruyu çoğalt"
                  onClick={() => {
                    const c = { ...JSON.parse(JSON.stringify(q)), id: "q" + newId().slice(-6) };
                    upd({ questions: [...qs.slice(0, i + 1), c, ...qs.slice(i + 1)] });
                  }}
                >
                  <Icon name="copy" />
                </button>
                <button className="iconbtn" aria-label="Soruyu sil" onClick={() => upd({ questions: qs.filter((_, k) => k !== i) })}>
                  <Icon name="trash" />
                </button>
              </div>
            </div>
            <label className="f">
              Soru metni
              <input type="text" id={"qt-" + q.id} value={q.title} onChange={(e) => updQ(i, { title: e.target.value })} placeholder="Sorunuzu yazın" />
            </label>
            <label className="f">
              Yardım metni (isteğe bağlı)
              <input type="text" value={q.help || ""} onChange={(e) => updQ(i, { help: e.target.value })} />
            </label>
            {q.type === "single" || q.type === "multi" ? (
              <div className="stack" style={{ gap: 6 }}>
                <span className="eyebrow">Seçenekler</span>
                {q.options!.map((o, j) => (
                  <div className="opt-row" key={j}>
                    <span className="mono small muted" style={{ width: 20 }}>{j + 1}</span>
                    <input type="text" id={`o-${q.id}-${j}`} value={o} aria-label={`Seçenek ${j + 1}`} onChange={(e) => updQ(i, { options: q.options!.map((x, k) => (k === j ? e.target.value : x)) })} />
                    <button className="iconbtn" aria-label="Seçeneği sil" disabled={q.options!.length <= 2} onClick={() => updQ(i, { options: q.options!.filter((_, k) => k !== j) })}>
                      <Icon name="x" />
                    </button>
                  </div>
                ))}
                <div>
                  <button
                    className="btn sm ghost"
                    onClick={() => {
                      updQ(i, { options: [...q.options!, "Seçenek " + (q.options!.length + 1)] });
                      setTimeout(() => (document.getElementById(`o-${q.id}-${q.options!.length}`) as HTMLInputElement | null)?.select(), 30);
                    }}
                  >
                    <Icon name="plus" /> Seçenek ekle
                  </button>
                </div>
              </div>
            ) : q.type === "likert" ? (
              <div className="qrow">
                <label className="f">
                  Ölçek
                  <select value={q.scale} onChange={(e) => updQ(i, { scale: Number(e.target.value) as 5 | 7 })}>
                    <option value={5}>5&apos;li Likert</option>
                    <option value={7}>7&apos;li Likert</option>
                  </select>
                </label>
                <div className="small muted" style={{ alignSelf: "end" }}>
                  {LIKERT[(q.scale || 5) as 5 | 7].join(" · ")}
                </div>
              </div>
            ) : q.type === "rating" ? (
              <div className="grid g3">
                <label className="f">
                  En yüksek puan
                  <select value={q.max} onChange={(e) => updQ(i, { max: Number(e.target.value) as 5 | 10 })}>
                    <option value={5}>1–5</option>
                    <option value={10}>1–10</option>
                  </select>
                </label>
                <label className="f">
                  En düşük etiket
                  <input type="text" value={q.minLabel || ""} onChange={(e) => updQ(i, { minLabel: e.target.value })} />
                </label>
                <label className="f">
                  En yüksek etiket
                  <input type="text" value={q.maxLabel || ""} onChange={(e) => updQ(i, { maxLabel: e.target.value })} />
                </label>
              </div>
            ) : (
              <p className="small muted">Katılımcı serbest metin yazar. Cevaplar analiz aşamasında temalara ayrılır.</p>
            )}
            <label className="check">
              <input type="checkbox" checked={q.required} onChange={(e) => updQ(i, { required: e.target.checked })} /> Zorunlu soru
            </label>
            {(() => {
              const refs = qs.slice(0, i).filter((x) => (x.type === "single" || x.type === "multi") && x.title.trim());
              if (!refs.length) return null;
              const ref = refs.find((x) => x.id === q.showIf?.q);
              return (
                <div className="cond">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={!!q.showIf}
                      onChange={(e) => updQ(i, { showIf: e.target.checked ? { q: refs[refs.length - 1].id, values: [] } : undefined })}
                    />{" "}
                    Koşullu göster (yalnızca önceki bir sorunun cevabına göre)
                  </label>
                  {q.showIf ? (
                    <div className="stack" style={{ gap: 8 }}>
                      <select value={q.showIf.q} onChange={(e) => updQ(i, { showIf: { q: e.target.value, values: [] } })} aria-label="Koşul sorusu">
                        {refs.map((x) => (
                          <option key={x.id} value={x.id}>
                            S{qs.indexOf(x) + 1}. {x.title.slice(0, 70)}
                          </option>
                        ))}
                      </select>
                      <div className="row" style={{ gap: 8 }}>
                        <span className="small muted">Şu cevaplardan biri seçilirse göster:</span>
                        {(ref?.options || []).map((o) => (
                          <label className="check small" key={o}>
                            <input
                              type="checkbox"
                              checked={q.showIf!.values.includes(o)}
                              onChange={(e) =>
                                updQ(i, { showIf: { q: q.showIf!.q, values: e.target.checked ? [...q.showIf!.values, o] : q.showIf!.values.filter((v) => v !== o) } })
                              }
                            />{" "}
                            {o}
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })()}
          </div>
        ))}
      </div>
      <div className="addq">
        <span className="small muted" style={{ alignSelf: "center", marginRight: 4 }}>
          Soru ekle:
        </span>
        {(Object.entries(TYPE_LABEL) as [QType, string][]).map(([t, l]) => (
          <button className="btn sm" key={t} onClick={() => addQ(t)}>
            <Icon name="plus" /> {l}
          </button>
        ))}
      </div>
      <div className="addq">
        <span className="small muted" style={{ alignSelf: "center", marginRight: 4 }}>
          Demografik soru ekle:
        </span>
        {DEMOGRAPHICS.map((x) => (
          <button className="btn sm" key={x.label} onClick={() => upd({ questions: [...qs, { ...JSON.parse(JSON.stringify(x.q)), id: "q" + newId().slice(-6) }] })}>
            <Icon name="plus" /> {x.label}
          </button>
        ))}
      </div>
      <div className="row between">
        <Link className="btn ghost" href={d.isPlatform ? "/yonetim?sekme=research" : "/panel"}>
          Panele dön
        </Link>
        <button className="btn primary" onClick={save} disabled={busy}>
          Kaydet
        </button>
      </div>
      {preview ? (
        <Modal title="Anket önizleme" onClose={() => setPreview(false)}>
          <SurveyForm survey={d} preview />
        </Modal>
      ) : null}
    </div>
  );
}
