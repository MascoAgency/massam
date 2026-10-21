import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { effectivePlan, usageThisMonth } from "@/lib/plans";
import { responseCounts } from "@/lib/queries";
import { toSurveyLite } from "@/lib/mappers";
import { fmtN, limTxt } from "@/lib/format";
import { Icon } from "@/components/icons";
import { SurveyRow } from "@/components/SurveyRow";
import { SeedExampleButton } from "@/components/SurveyActions";

export const metadata = { title: "Panel" };

export default async function Panel() {
  const user = await requireUser("/panel");
  const [rows, plan, usage] = await Promise.all([
    prisma.survey.findMany({ where: { ownerId: user.id, archived: false }, orderBy: { updatedAt: "desc" } }),
    effectivePlan(user),
    usageThisMonth(user.id),
  ]);
  const mine = rows.map((s) => toSurveyLite(s));
  const counts = await responseCounts(mine.map((s) => s.id));
  const total = mine.reduce((a, s) => a + (counts[s.id] || 0), 0);
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <p className="eyebrow">Panel</p>
          <h1>Anketlerim</h1>
        </div>
        <div className="row">
          <Link className="btn primary" href="/panel/anket/yeni">
            <Icon name="plus" /> Yeni anket
          </Link>
        </div>
      </div>
      <div className="grid g4">
        <div className="card stat"><b>{fmtN(mine.length)}</b><span>Aktif anket</span></div>
        <div className="card stat"><b>{fmtN(mine.filter((s) => s.status === "open").length)}</b><span>Yanıt kabul eden</span></div>
        <div className="card stat"><b>{fmtN(total)}</b><span>Toplam yanıt</span></div>
        <div className="card stat">
          <b>
            {fmtN(usage.ai)}
            <span className="muted" style={{ fontSize: "1rem" }}> / {limTxt(plan.limits.ai)}</span>
          </b>
          <span>Bu ay analiz</span>
        </div>
      </div>
      <div className="card">
        {mine.length ? (
          <div className="slist">
            {mine.map((s) => (
              <SurveyRow key={s.id} s={s} count={counts[s.id] || 0} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h2>Henüz anketiniz yok</h2>
            <p>İlk anketinizi sıfırdan oluşturabilir ya da platformu tanımak için hazır bir örnek araştırma (örnek yanıtlarıyla birlikte) yükleyebilirsiniz.</p>
            <div className="row" style={{ justifyContent: "center" }}>
              <Link className="btn primary" href="/panel/anket/yeni">
                <Icon name="plus" /> Yeni anket
              </Link>
              <SeedExampleButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
