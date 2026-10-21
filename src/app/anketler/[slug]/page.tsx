import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isOpenNow, estMinutes } from "@/lib/survey";
import { fmtDateTime, fmtN } from "@/lib/format";
import { Icon } from "@/components/icons";
import { PageHead } from "@/components/PublicCards";
import type { Question } from "@/lib/types";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  return prisma.survey.findFirst({
    where: { slug, isPlatform: true, status: { not: "draft" } },
    include: {
      category: true,
      _count: { select: { responses: true } },
      reports: { where: { published: true, slug: { not: null } }, orderBy: { publishedAt: "desc" }, take: 1, select: { slug: true } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await load((await params).slug);
  return s ? { title: s.title, description: s.description.slice(0, 160) } : { title: "Anket bulunamadı" };
}

export default async function Page({ params }: Props) {
  const s = await load((await params).slug);
  if (!s) notFound();
  const qs = (s.questions as unknown as Question[]) || [];
  const open = isOpenNow(s);
  const minutes = estMinutes(qs);
  return (
    <div className="stack" style={{ gap: 28 }}>
      <PageHead eyebrow={s.category?.name || "Anket"} title={s.title}>
        {open ? (
          <Link className="btn primary" href={`/s/${s.slug}`}>
            Ankete başla <Icon name="arrow" />
          </Link>
        ) : null}
      </PageHead>
      <div className="kv-grid">
        <div className="kv-item">
          <span>Durum</span>
          <b>{open ? "Katılıma açık" : s.startsAt && s.startsAt.getTime() > Date.now() ? "Yakında" : "Tamamlandı"}</b>
        </div>
        <div className="kv-item">
          <span>Tahmini süre</span>
          <b>Yaklaşık {minutes} dakika</b>
        </div>
        <div className="kv-item">
          <span>Soru sayısı</span>
          <b>{qs.length}</b>
        </div>
        {s.endsAt ? (
          <div className="kv-item">
            <span>{open ? "Son katılım" : "Bitiş"}</span>
            <b>{fmtDateTime(s.endsAt)}</b>
          </div>
        ) : null}
        <div className="kv-item">
          <span>Katılım</span>
          <b>{fmtN(s._count.responses)} yanıt</b>
        </div>
      </div>
      <div className="split" style={{ alignItems: "start" }}>
        <div className="prose">
          {s.description ? <p style={{ whiteSpace: "pre-line" }}>{s.description}</p> : null}
          {s.purpose ? (
            <>
              <h2>Araştırmanın amacı</h2>
              <p style={{ whiteSpace: "pre-line" }}>{s.purpose}</p>
            </>
          ) : null}
          {s.targetGroup ? (
            <>
              <h2>Hedef katılımcı grubu</h2>
              <p>{s.targetGroup}</p>
            </>
          ) : null}
        </div>
        <div className="stack" style={{ gap: 14 }}>
          <div className="card stack" style={{ gap: 10 }}>
            <h3>Bilgilendirme</h3>
            <p className="small" style={{ whiteSpace: "pre-line" }}>
              {s.consentText ||
                "Katılım gönüllülük esasına dayanır. Anket sırasında kimliğinizi belirleyecek bilgiler istenmez; yanıtlarınız anonim olarak kaydedilir ve yalnızca toplu olarak, istatistiksel amaçla değerlendirilir."}
            </p>
            <p className="small muted">
              Ayrıntılı bilgi için <Link href="/kvkk">KVKK aydınlatma metni</Link>.
            </p>
          </div>
          {open ? (
            <Link className="btn primary" href={`/s/${s.slug}`} style={{ justifyContent: "center", padding: "12px 16px" }}>
              Ankete başla <Icon name="arrow" />
            </Link>
          ) : s.reports[0]?.slug ? (
            <Link className="btn primary" href={`/arastirma-sonuclari/${s.reports[0].slug}`} style={{ justifyContent: "center" }}>
              Araştırma sonuçlarını incele
            </Link>
          ) : (
            <div className="callout">
              <Icon name="info" />
              <span>Bu anket katılıma kapalıdır. Sonuçlar, analiz süreci tamamlanıp yayın onayı verildiğinde Araştırma Sonuçları sayfasında yayımlanacaktır.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
