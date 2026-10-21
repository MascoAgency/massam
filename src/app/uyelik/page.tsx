import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { allPlans, effectivePlan, usageThisMonth } from "@/lib/plans";
import { planFeatures } from "@/lib/plan-features";
import { stripeEnabled } from "@/lib/billing/stripe";
import { fmtDate, fmtN } from "@/lib/format";
import { Meter } from "@/components/ui";
import { Icon } from "@/components/icons";
import { PlanButton, PortalButton } from "@/components/PlanButtons";
import { isStaff } from "@/lib/roles";

export const metadata = { title: "Üyelik" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ odeme?: string; sinir?: string }> }) {
  const [user, plans, sp] = await Promise.all([getCurrentUser(), allPlans(), searchParams]);
  const online = stripeEnabled();
  if (!user)
    return (
      <div className="stack">
        <div className="page-head"><div><p className="eyebrow">Üyelik</p><h1>Planlar</h1></div></div>
        <div className="grid g3">
          {plans.map((p) => (
            <div className="card plan" key={p.id}>
              <h3>{p.name}</h3>
              <p className="small muted">{p.note}</p>
              <div className="price">₺{fmtN(p.price)}<small> / ay</small></div>
              <ul>{planFeatures(p).map((f) => <li key={f}>{f}</li>)}</ul>
              <Link className="btn primary" href="/kayit">Ücretsiz başlayın</Link>
            </div>
          ))}
        </div>
      </div>
    );
  const cur = await effectivePlan(user);
  const [usage, surveys] = await Promise.all([usageThisMonth(user.id), prisma.survey.findMany({ where: { ownerId: user.id }, select: { id: true } })]);
  const maxResp = surveys.length
    ? Math.max(0, ...(await prisma.response.groupBy({ by: ["surveyId"], where: { surveyId: { in: surveys.map((s) => s.id) } }, _count: { _all: true } })).map((r) => r._count._all))
    : 0;
  const req = user.requestedPlanId;
  const isAdmin = isStaff(user.role);
  return (
    <div className="stack">
      <div className="page-head"><div><p className="eyebrow">Üyelik</p><h1>Planlar ve kullanım</h1></div></div>
      {sp.odeme === "basarili" ? <div className="callout"><Icon name="info" /><span>Ödemeniz alındı. Planınız birkaç saniye içinde güncellenir; görünmüyorsa sayfayı yenileyin.</span></div> : null}
      {sp.odeme === "iptal" ? <div className="callout warn"><Icon name="info" /><span>Ödeme tamamlanmadı; planınız değişmedi.</span></div> : null}
      {sp.sinir === "anket" ? <div className="callout warn"><Icon name="info" /><span>Planınızdaki anket sınırına ulaştınız. Yeni anket için planınızı yükseltin veya eski anketleri silin.</span></div> : null}
      <div className="card stack" style={{ gap: 14 }}>
        <div className="row between">
          <div>
            <span className="eyebrow">Mevcut plan</span>
            <h2>{cur.name}</h2>
            {isAdmin ? <p className="small muted">Yönetim hesabı: sınırlar uygulanmaz.</p> : null}
            {user.subscriptionStatus && user.currentPeriodEnd ? (
              <p className="small muted">Abonelik durumu: {user.subscriptionStatus} · Dönem sonu: {fmtDate(user.currentPeriodEnd)}</p>
            ) : null}
          </div>
          <div className="row">
            {req && req !== cur.id ? <span className="pill draft">{plans.find((p) => p.id === req)?.name} talebi onay bekliyor</span> : null}
            {online && user.stripeCustomerId ? <PortalButton /> : null}
          </div>
        </div>
        <div className="grid g4">
          <Meter label="Anket" used={surveys.length} max={cur.limits.surveys} />
          <Meter label="En kalabalık anket (katılımcı)" used={maxResp} max={cur.limits.responses} />
          <Meter label="Bu ay analiz" used={usage.ai} max={cur.limits.ai} />
          <Meter label="Bu ay PDF rapor" used={usage.pdf} max={cur.limits.pdf} />
        </div>
      </div>
      <div className="grid g3">
        {plans.map((p) => {
          const isCur = p.id === cur.id;
          const canPayOnline = online && p.price > 0 && !!p.stripePriceId && !user.subscriptionId;
          return (
            <div className={"card plan" + (isCur ? " current" : "")} key={p.id}>
              <div className="row between">
                <h3>{p.name}</h3>
                {isCur ? <span className="pill accent plain">Mevcut plan</span> : null}
              </div>
              <p className="small muted">{p.note}</p>
              <div className="price">₺{fmtN(p.price)}<small> / ay</small></div>
              <ul>{planFeatures(p).map((f) => <li key={f}>{f}</li>)}</ul>
              {isCur || isAdmin ? (
                <button className="btn" disabled>{isCur ? "Kullanılıyor" : "—"}</button>
              ) : req === p.id ? (
                <button className="btn" disabled>Talep gönderildi</button>
              ) : user.subscriptionId && online ? (
                <PortalButton />
              ) : (
                <PlanButton
                  planId={p.id}
                  online={canPayOnline}
                  primary={p.price > cur.price}
                  label={p.price > cur.price ? (canPayOnline ? "Kartla öde ve yükselt" : "Yükseltme talep et") : "Bu plana geç"}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="small muted">
        {online
          ? "Ödemeler Stripe üzerinden güvenle alınır; abonelik her ay otomatik yenilenir ve “Aboneliği yönet” bölümünden istediğiniz zaman iptal edilebilir."
          : "Çevrim içi ödeme henüz etkin değil: plan talebiniz yöneticiye iletilir ve onaylandığında hesabınıza tanımlanır."}
      </p>
    </div>
  );
}
