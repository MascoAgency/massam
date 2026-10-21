import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { fmtDate, fmtN } from "@/lib/format";
import { ProfileForm, PasswordForm } from "@/components/ProfileForms";
import { ROLE_LABEL } from "@/lib/roles";

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
      <ProfileForm u={{ name: u.name, institution: u.institution, title: u.title, field: u.field }} />
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
