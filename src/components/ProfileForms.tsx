"use client";
import { useRouter } from "next/navigation";
import { api, useToast } from "./ui";

const FIELDS = ["", "Uluslararası İlişkiler", "Siyaset Bilimi", "Kamu Yönetimi", "Sosyoloji", "Ekonomi", "Diğer"];

export function ProfileForm({ u }: { u: { name: string; institution: string; title: string; field: string } }) {
  const router = useRouter();
  const toast = useToast();
  return (
    <form
      className="card stack"
      style={{ gap: 14 }}
      onSubmit={async (e) => {
        e.preventDefault();
        const body = Object.fromEntries(new FormData(e.currentTarget).entries());
        try {
          await api("/api/profile", "PUT", body);
          toast("Profil kaydedildi.");
          router.refresh();
        } catch (err) {
          toast((err as Error).message);
        }
      }}
    >
      <div className="grid g2">
        <label className="f">
          Ad soyad
          <input type="text" name="name" defaultValue={u.name} required />
        </label>
        <label className="f">
          Kurum / üniversite
          <input type="text" name="institution" defaultValue={u.institution} placeholder="Örn. MASKDER, Ankara Üniversitesi" />
        </label>
        <label className="f">
          Unvan
          <input type="text" name="title" defaultValue={u.title} placeholder="Örn. Araştırma görevlisi" />
        </label>
        <label className="f">
          Uzmanlık alanı
          <select name="field" defaultValue={u.field}>
            {FIELDS.map((f) => (
              <option key={f} value={f}>
                {f || "Seçin"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="small muted">Ad ve kurum bilgisi PDF raporların kapağında “Hazırlayan” olarak kullanılır.</p>
      <div className="row">
        <button className="btn primary" type="submit">
          Profili kaydet
        </button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const toast = useToast();
  return (
    <form
      className="stack"
      style={{ gap: 10 }}
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        if (fd.get("newPassword") !== fd.get("newPassword2")) return toast("Yeni şifreler eşleşmiyor.");
        try {
          await api("/api/profile", "PUT", { currentPassword: fd.get("currentPassword"), newPassword: fd.get("newPassword") });
          toast("Şifreniz güncellendi.");
          form.reset();
        } catch (err) {
          toast((err as Error).message);
        }
      }}
    >
      <div className="grid g3">
        <label className="f">
          Mevcut şifre
          <input type="password" name="currentPassword" autoComplete="current-password" required />
        </label>
        <label className="f">
          Yeni şifre
          <input type="password" name="newPassword" autoComplete="new-password" minLength={8} required />
        </label>
        <label className="f">
          Yeni şifre (tekrar)
          <input type="password" name="newPassword2" autoComplete="new-password" minLength={8} required />
        </label>
      </div>
      <div>
        <button className="btn" type="submit">
          Şifreyi değiştir
        </button>
      </div>
    </form>
  );
}
