import { prisma } from "@/lib/db";
import { PageHead } from "@/components/PublicCards";

export const metadata = { title: "Kaydı iptal et" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const v = token ? await prisma.volunteer.findUnique({ where: { unsubscribeToken: token } }) : null;
  if (v && !v.unsubscribedAt) await prisma.volunteer.update({ where: { id: v.id }, data: { unsubscribedAt: new Date() } });
  return (
    <div className="stack" style={{ gap: 28 }}>
      <PageHead eyebrow="Araştırma topluluğu" title={v ? "Kaydınız iptal edildi" : "Bağlantı geçersiz"} />
      <div className="card empty">
        <p>{v ? "Araştırma davetleri listesinden çıkarıldınız; size yeni davet gönderilmeyecek. Dilediğiniz zaman yeniden kayıt olabilirsiniz." : "Kayıt iptal bağlantısı geçersiz veya eksik."}</p>
        <a className="btn" href="/katil">
          Araştırmaya katıl
        </a>
      </div>
    </div>
  );
}
