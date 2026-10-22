import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { TakeSurvey } from "@/components/TakeSurvey";
import { isOpenNow } from "@/lib/survey";
import { fmtDateTime } from "@/lib/format";
import type { Question } from "@/lib/types";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isStaff } from "@/lib/roles";
import { SurveyArt, artKeyFor } from "@/components/SurveyArt";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ kiosk?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await prisma.survey.findUnique({ where: { slug: (await params).slug }, select: { title: true, description: true } });
  return s ? { title: s.title, description: s.description.slice(0, 160) } : { title: "Anket bulunamadı" };
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const s = await prisma.survey.findUnique({ where: { slug } });
  if (!s)
    return (
      <div className="take">
        <div className="card empty">
          <h2>Anket bulunamadı</h2>
          <p>Bağlantı hatalı olabilir ya da anket kaldırılmış olabilir. Araştırmacıdan yeni bağlantı isteyin.</p>
        </div>
      </div>
    );
  if (!isOpenNow(s)) {
    const notYet = s.status === "open" && !s.archived && s.startsAt && s.startsAt.getTime() > Date.now();
    return (
      <div className="take">
        <div className="card empty">
          <h2>{s.title}</h2>
          <p>
            {notYet
              ? `Bu anket ${fmtDateTime(s.startsAt)} tarihinde katılıma açılacak.`
              : s.endsAt && s.endsAt.getTime() <= Date.now()
                ? `Bu anket ${fmtDateTime(s.endsAt)} tarihinde katılıma kapandı. Katılımınız için teşekkür ederiz.`
                : "Bu anket şu anda yanıt kabul etmiyor. Araştırmacı anketi kapattı veya henüz yayınlamadı."}
          </p>
          <a className="btn" href="/anketler">Diğer anketler</a>
        </div>
      </div>
    );
  }
  // Katılım üyelikle yapılır: giriş yapmış ve e-postasını doğrulamış üye, her ankete bir kez.
  // Aynı cihazdan veri toplama (kiosk) yalnızca anket sahibi veya yönetim ekibi için açıktır.
  const u = await getCurrentUser();
  const here = `/s/${slug}`;
  const kiosk = (await searchParams).kiosk === "1" && !!u && (u.id === s.ownerId || isStaff(u.role));
  if (!kiosk) {
    if (!u) {
      const cat = s.categoryId ? await prisma.category.findUnique({ where: { id: s.categoryId }, select: { slug: true } }) : null;
      const q = `?next=${encodeURIComponent(here)}`;
      return (
        <div className="take">
          <div className="card join-gate">
            <SurveyArt art={artKeyFor(s.title, cat?.slug)} label={s.title} className="join-gate-art" eager />
            <div className="join-gate-body">
              <p className="eyebrow">Ankete katılım</p>
              <h1>{s.title}</h1>
              <p>Bu ankete katılmak için üye girişi yapmanız gerekir. Üyelik ad soyad, e-posta ve şifre ile yapılır; e-posta adresinizi doğruladıktan sonra ankete hemen başlayabilirsiniz.</p>
              <ul className="join-gate-points">
                <li><Icon name="shield" /> Her üye her ankete bir kez katılır; bu, sonuçların güvenilirliğini korur.</li>
                <li><Icon name="eye" /> Anket yanıtlarınız ad ve e-posta bilginizle eşleştirilmeden, ayrı saklanır.</li>
              </ul>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <a className="btn signal" href={`/kayit${q}`}>Üye ol ve katıl <Icon name="arrow" /></a>
                <a className="btn" href={`/giris${q}`}>Giriş yap</a>
              </div>
              <p className="small muted">Üye olarak <a href="/kvkk">KVKK Aydınlatma Metni</a> ve <a href="/gizlilik-sozlesmesi">Gizlilik Sözleşmesi</a>&apos;ni onaylamış olursunuz.</p>
            </div>
          </div>
        </div>
      );
    }
    if (!u.emailVerifiedAt) redirect(`/eposta-dogrulama?next=${encodeURIComponent(here)}`);
    const done = await prisma.surveyParticipation.findUnique({ where: { surveyId_userId: { surveyId: s.id, userId: u.id } }, select: { createdAt: true } });
    if (done)
      return (
        <div className="take">
          <div className="take-head empty">
            <p className="eyebrow">Daha önce katıldınız</p>
            <h1>{s.title}</h1>
            <p>Bu ankete {fmtDateTime(done.createdAt)} tarihinde katıldınız. Her üye her ankete bir kez katılabilir. Teşekkür ederiz.</p>
            <a className="btn" href="/anketler">Diğer anketler</a>
          </div>
        </div>
      );
  }
  return (
    <TakeSurvey
      slug={slug}
      kiosk={kiosk}
      survey={{ title: s.title, description: s.description, thankYou: s.thankYou, questions: s.questions as unknown as Question[], purpose: s.purpose, targetGroup: s.targetGroup, consentText: s.consentText }}
    />
  );
}
