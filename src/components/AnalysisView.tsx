import { Icon } from "./icons";
import type { AIResult, Question } from "@/lib/types";

export function AnalysisView({ questions, r }: { questions: Question[]; r: AIResult }) {
  const qt = (id: string) => {
    const i = questions.findIndex((q) => q.id === id);
    return i >= 0 ? `S${i + 1}. ${questions[i].title}` : id;
  };
  const List = ({ t, xs }: { t: string; xs?: unknown[] }) =>
    xs && xs.length ? (
      <section className="stack" style={{ gap: 8 }}>
        <h3>{t}</h3>
        <ul>
          {xs.map((x, i) => (
            <li key={i}>{typeof x === "string" ? x : JSON.stringify(x)}</li>
          ))}
        </ul>
      </section>
    ) : null;
  return (
    <div className="ai-out">
      {r._local ? (
        <div className="callout warn">
          <Icon name="info" />
          <span>Bu sonuç yalnızca temel istatistiklerden üretilmiş kısa bir özettir; ayrıntılı yorum ve öneri içermez. Analizi daha sonra yeniden çalıştırabilirsiniz.</span>
        </div>
      ) : null}
      <section className="stack" style={{ gap: 8 }}>
        <h3>Araştırma özeti</h3>
        <p>{r.ozet}</p>
      </section>
      {r.istatistikselOzet ? (
        <section className="stack" style={{ gap: 8 }}>
          <h3>İstatistiksel özet</h3>
          <p>{r.istatistikselOzet}</p>
        </section>
      ) : null}
      <List t="Katılımcı eğilimleri" xs={r.egilimler} />
      <List t="Önemli veri noktaları" xs={r.onemliNoktalar} />
      <List t="İçgörüler" xs={r.icgoruler} />
      {r.acikUclu?.length ? (
        <section className="stack" style={{ gap: 10 }}>
          <h3>Açık uçlu cevapların metin analizi</h3>
          {r.acikUclu.map((o, k) => (
            <div className="card flat stack" style={{ gap: 6, padding: 14 }} key={k}>
              <b className="small">{qt(o.soruId)}</b>
              <div className="row small" style={{ gap: 8 }}>
                <span className="pill plain">Duygu: {o.duygu || "—"}</span>
              </div>
              {(o.temalar || []).map((t, j) => (
                <div className="theme-row" key={j}>
                  <div>
                    <b>{t.tema}</b>
                    <div className="small muted">{t.aciklama || ""}</div>
                  </div>
                  <span className="mono small">{t.oran || ""}</span>
                </div>
              ))}
              {o.ornekAlinti ? <p className="small muted">“{o.ornekAlinti}”</p> : null}
            </div>
          ))}
        </section>
      ) : null}
      {r.bulgular?.length ? (
        <section className="stack" style={{ gap: 8 }}>
          <h3>Soru bazlı bulgular</h3>
          <ul>
            {r.bulgular.map((b, i) => (
              <li key={i}>
                <b>{qt(b.soruId)}:</b> {b.yorum}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <List t="Sınırlılıklar" xs={r.sinirliliklar} />
      {r.sonuc ? (
        <section className="stack" style={{ gap: 8 }}>
          <h3>Sonuç</h3>
          <p>{r.sonuc}</p>
        </section>
      ) : null}
      <List t="Öneriler" xs={r.oneriler} />
    </div>
  );
}
