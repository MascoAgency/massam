import Link from "next/link";
import { StatusPill } from "./ui";
import { StatusButton } from "./SurveyActions";
import { fmtDate, fmtN } from "@/lib/format";
import type { SurveyLite } from "@/lib/types";

export function SurveyRow({ s, count, showOwner, adminToggle, canEdit = true }: { s: SurveyLite; count: number; showOwner?: boolean; adminToggle?: boolean; canEdit?: boolean }) {
  return (
    <div className="sitem">
      <div className="stack" style={{ gap: 4, minWidth: 0 }}>
        <div className="row" style={{ gap: 8 }}>
          <StatusPill s={s} />
          {s.isPlatform ? <span className="pill plain accent">Platform anketi</span> : null}
          {s.archived ? <span className="pill plain">Arşivde</span> : null}
        </div>
        <h3>{s.title || "Adsız anket"}</h3>
        <div className="meta">
          <span>{s.questions.length} soru</span>
          <span className="mono">{fmtN(count)} yanıt</span>
          <span>Güncelleme: {fmtDate(s.updatedAt)}</span>
          {showOwner ? <span>Sahibi: {s.ownerName || "—"}</span> : null}
        </div>
      </div>
      <div className="acts">
        {adminToggle && canEdit ? <StatusButton id={s.id} status={s.status} labels={["Durdur", "Başlat"]} className="btn sm" /> : null}
        <Link className="btn sm primary" href={`/panel/anket/${s.id}`}>
          Sonuçlar
        </Link>
        {canEdit ? (
          <Link className="btn sm" href={`/panel/anket/${s.id}/duzenle`}>
            Düzenle
          </Link>
        ) : null}
        <Link className="btn sm" href={`/panel/anket/${s.id}?sekme=share`}>
          Paylaş
        </Link>
      </div>
    </div>
  );
}
