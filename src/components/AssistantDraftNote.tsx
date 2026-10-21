"use client";
import { useEffect, useState } from "react";
import { Icon } from "./icons";

/** Asistanın hazırladığı taslak açıldığında gösterilen yönlendirme ve yöntem notu */
export function AssistantDraftNote({ id }: { id: string }) {
  const [note, setNote] = useState("");
  useEffect(() => {
    try {
      setNote(sessionStorage.getItem("maskder-asistan-yontem-" + id) || "");
    } catch {}
  }, [id]);
  return (
    <div className="callout" style={{ marginBottom: 16, flexDirection: "column", gap: 8 }}>
      <div className="row" style={{ gap: 8 }}>
        <Icon name="spark" />
        <b>Araştırma Merkezi Asistanı bu taslağı hazırladı.</b>
      </div>
      <span className="small">Soruları, seçenekleri, araştırma alanını ve tarihleri kontrol edin. Onayladığınızda durumu “Yayında” yapıp kaydedin: anket ana sayfada, Anketler sayfasında ve seçilen araştırma alanının sayfasında yayımlanır.</span>
      {note ? (
        <span className="small">
          <b>Yöntem önerisi:</b> {note}
        </span>
      ) : null}
    </div>
  );
}
