import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { fmtDate, fmtN } from "@/lib/format";
import { ProfileForm, PasswordForm } from "@/components/ProfileForms";
import { ROLE_LABEL } from "@/lib/roles";
import { ageOf, hasDemographics } from "@/lib/demographics";

export const metadata = { title: "Profil" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const u = await requireUser("/profil");
  const [surveys, responses, ai, pdf] = await Promise.all([
    prisma.survey.count({ where: { ownerId: u.id } }),
    prisma.response.count({ where: { survey: { ownerId: u.id } } }),
    prisma.usageEvent.count({ where: { userId: u.id, kind: "ai" } }),
    prisma.usageEvent.count({ where: { userId: u.id, kind: "pdf" } }),
  ]);
  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <div className="page-head"><div><p className="eyebrow">Hesap</p><h1>Profil</h1></div></div>
      {/* Katılımcı üyeliğinde ad soyad tutulmaz; araştırmacı bilgileri yalnızca adı olan hesaplarda düzenlenir */}
      {u.name ? <ProfileForm u={{ name: u.name, institution: u.institution, title: u.title, field: u.field }} /> : null}
      <div className="card stack" style={{ gap: 10 }}>
        <h3>Katılımcı bilgileri</h3>
        {hasDemographics(u) ? (
          <div className="small" style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 6 }}>
            <span className="muted">Yaş</span><span>{ageOf(u.birthYear!)}</span>
            <span className="muted">Cinsiyet</span><span>{u.gender}</span>
            <span className="muted">Eğitim durumu</span><span>{u.education}</span>
          </div>
        ) : (
          <p className="small muted">Henüz belirtilmedi. Anketlere katılmadan önce bir kez doldurmanız gerekir.</p>
        )}
        <p className="small muted">Ad soyad bilgisi istenmez. Bu bilgiler yalnızca araştırma metodolojisinin ve politika önerilerinin sağlamlığı için kullanılır; yanıtlarınıza yalnızca yaş grubunuz, cinsiyetiniz ve eğitim durumunuz eklenir.</p>
        <div><Link className="btn" href="/katilimci-bilgileri?next=/profil">{hasDemographics(u) ? "Düzenle" : "Bilgileri doldur"}</Link></div>
      </div>
      <div className="card stack" style={{ gap: 10 }}>
        <h3>Giriş ve güvenlik</h3>
        <div className="small" style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 6 }}>
          <span className="muted">E-posta</span><span>{u.email}</span>
          <span className="muted">Rol</span><span>{ROLE_LABEL[u.role]}</span>
          <span className="muted">Kayıt tarihi</span><span>{fmtDate(u.createdAt)}</span>
        </div>
        <hr className="sep" />
        <PasswordForm />
        <p className="small muted">Şifrenizi unutursanız giriş ekranındaki “Şifremi unuttum” bağlantısıyla e-posta üzerinden sıfırlayabilirsiniz.</p>
      </div>
      <div className="card stack" style={{ gap: 8 }}>
        <h3>Araştırma geçmişi</h3>
        <p className="small muted">{surveys} anket · {fmtN(responses)} toplam yanıt · {ai} analiz · {pdf} PDF rapor</p>
        <div><Link className="btn" href="/gecmis">Geçmiş araştırmaları aç</Link></div>
      </div>
    </div>
  );
}
