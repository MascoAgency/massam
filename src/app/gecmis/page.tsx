import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { effectivePlan, allPlans } from "@/lib/plans";
import { responseCounts } from "@/lib/queries";
import { fmtDate, fmtN } from "@/lib/format";
import { StatusPill } from "@/components/ui";
import { CopyButton, ArchiveButton, DeleteButton } from "@/components/SurveyActions";
import { isStaff } from "@/lib/roles";

export const metadata = { title: "Geçmiş araştırmalar" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ arsiv?: string; tumu?: string }> }) {
  const user = await requireUser("/gecmis");
  const sp = await searchParams;
  const isAdmin = user.role === "ADMIN";
  const all = isAdmin && sp.tumu === "1";
  const arch = sp.arsiv === "1";
  const surveys = await prisma.survey.findMany({
    where: all ? {} : { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { name: true, role: true, planId: true } } },
  });
  const [plan, plans, counts] = await Promise.all([effectivePlan(user), allPlans(), responseCounts(surveys.map((s) => s.id))]);
  const corp = plans.find((p) => p.id === "corp");
  const retentionOf = (o: { role: string; planId: string }) => (isStaff(o.role) ? corp : plans.find((p) => p.id === o.planId))?.limits.retention ?? 6;
  const list = surveys.filter((s) => s.archived === arch);
  const q = (a: string, t: boolean) => `/gecmis?${new URLSearchParams({ ...(a ? { arsiv: a } : {}), ...(t ? { tumu: "1" } : {}) })}`;
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <p className="eyebrow">Arşiv</p>
          <h1>Geçmiş araştırmalar</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Önceki anketlerinizi görüntüleyin, sonuçlara ve raporlara geri dönün, anketleri kopyalayın veya arşivleyin. Planınızda veriler {plan.limits.retention} ay saklanır; süre dolduğunda yanıtlar, analizler ve raporlar silinir.
          </p>
        </div>
      </div>
      <div className="row">
        <div className="seg" role="group" aria-label="Liste">
          <Link className="btn sm ghost" href={q("", all)} aria-pressed={!arch} style={!arch ? { background: "var(--accent-soft)", color: "var(--accent)" } : {}}>
            Tüm araştırmalar ({surveys.filter((s) => !s.archived).length})
          </Link>
          <Link className="btn sm ghost" href={q("1", all)} aria-pressed={arch} style={arch ? { background: "var(--accent-soft)", color: "var(--accent)" } : {}}>
            Arşivlenenler ({surveys.filter((s) => s.archived).length})
          </Link>
        </div>
        {isAdmin ? (
          <Link className="btn sm" href={q(arch ? "1" : "", !all)}>
            {all ? "Yalnızca benimkiler" : "Tüm kullanıcıların araştırmaları"}
          </Link>
        ) : null}
      </div>
      <div className="card">
        {list.length ? (
          <div className="tbl-wrap" style={{ border: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Araştırma</th>
                  <th>Durum</th>
                  <th className="num">Yanıt</th>
                  <th>Oluşturma</th>
                  <th>Saklama bitişi</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => {
                  const exp = new Date(s.createdAt);
                  exp.setMonth(exp.getMonth() + retentionOf(s.owner));
                  const near = exp.getTime() - Date.now() < 30 * 86400000;
                  return (
                    <tr key={s.id}>
                      <td style={{ minWidth: 220 }}>
                        <b>{s.title}</b>
                        <div className="small muted">
                          {(s.questions as unknown[]).length} soru{all && s.ownerId !== user.id ? " · " + s.owner.name : ""}
                          {s.purgedAt ? " · veriler silindi" : ""}
                        </div>
                      </td>
                      <td><StatusPill s={s} /></td>
                      <td className="num">{fmtN(counts[s.id] || 0)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmtDate(s.createdAt)}</td>
                      <td style={{ whiteSpace: "nowrap", ...(near ? { color: "var(--warn)", fontWeight: 600 } : {}) }}>{fmtDate(exp)}</td>
                      <td>
                        <div className="row" style={{ gap: 4, flexWrap: "nowrap" }}>
                          <Link className="btn sm" href={`/panel/anket/${s.id}`}>Sonuçlar</Link>
                          <Link className="btn sm" href={`/panel/anket/${s.id}?sekme=report`}>Raporlar</Link>
                          <CopyButton id={s.id} />
                          <ArchiveButton id={s.id} archived={s.archived} />
                          <DeleteButton id={s.id} title={s.title} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <p>{arch ? "Arşivlenmiş araştırma yok." : "Henüz araştırma yok."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
