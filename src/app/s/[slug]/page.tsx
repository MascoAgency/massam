import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { TakeSurvey } from "@/components/TakeSurvey";
import { isOpenNow } from "@/lib/survey";
import { fmtDateTime } from "@/lib/format";
import type { Question } from "@/lib/types";

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
  return (
    <TakeSurvey
      slug={slug}
      kiosk={(await searchParams).kiosk === "1"}
      survey={{ title: s.title, description: s.description, thankYou: s.thankYou, questions: s.questions as unknown as Question[], purpose: s.purpose, targetGroup: s.targetGroup, consentText: s.consentText }}
    />
  );
}
