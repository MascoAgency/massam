"use client";
import { TAGLINE_SHORT, Wordmark } from "./Brand";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { api } from "./ui";

function safeNext(n?: string) {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/panel";
}

/** Üye ekranlarının ortak çerçevesi: solda marka paneli, sağda form */
function AuthShell({ children, title, points }: { children: ReactNode; title?: ReactNode; points?: string[] }) {
  return (
    <div className="auth-shell">
      <aside className="auth-side" aria-label="MASSAM Araştırma">
        <div className="auth-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/massam-logo.svg" alt="MASSAM amblemi" />
          <span>
            <b>
              <Wordmark className="on-dark" />
            </b>
            <small>{TAGLINE_SHORT}</small>
          </span>
        </div>
        <h2>
          {title ?? (
            <>
              Sahadan rapora, <span>tek panelde araştırma.</span>
            </>
          )}
        </h2>
        <ul>
          {(points ?? [
            "Anketinizi dakikalar içinde hazırlayın",
            "Doğrulanmış üyelerle güvenilir katılım",
            "Grafikler, segmentler ve kapsamlı analiz",
            "Akademik formatta PDF rapor",
          ]).map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="auth-quote">MASK Akademi · Uluslararası ilişkiler, siyaset bilimi ve kamu yönetimi araştırmaları</p>
      </aside>
      <div className="auth-main">{children}</div>
    </div>
  );
}

function PasswordInput({ name, autoComplete, minLength }: { name: string; autoComplete: string; minLength?: number }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-field">
      <input type={show ? "text" : "password"} name={name} autoComplete={autoComplete} minLength={minLength} required />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}>
        {show ? "Gizle" : "Göster"}
      </button>
    </div>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setErr("");
    const r = await signIn("credentials", { email: fd.get("email"), password: fd.get("password"), redirect: false });
    if (!r || r.error) {
      setBusy(false);
      setErr(
        r?.code === "disabled"
          ? "Hesabınız devre dışı bırakılmış. Platform yöneticisine başvurun."
          : r?.code === "locked"
            ? "Çok sayıda hatalı deneme yapıldı. 15 dakika sonra yeniden deneyin veya şifrenizi sıfırlayın."
            : "E-posta veya şifre hatalı.",
      );
      return;
    }
    window.location.href = safeNext(next);
  }
  return (
    <AuthShell>
      <form onSubmit={submit}>
        <div>
          <p className="eyebrow">Üye girişi</p>
          <h1>Tekrar hoş geldiniz</h1>
          <p className="lead">Anketlerinize, sonuçlarınıza ve raporlarınıza erişmek için giriş yapın.</p>
        </div>
        <label className="f">
          E-posta
          <input type="email" name="email" autoComplete="email" placeholder="ad@kurum.org" required />
        </label>
        <label className="f">
          <span className="row between">
            Şifre
            <Link href="/sifremi-unuttum" className="small" style={{ fontWeight: 500 }}>
              Şifremi unuttum
            </Link>
          </span>
          <PasswordInput name="password" autoComplete="current-password" />
        </label>
        {err ? <p className="err-text" role="alert">{err}</p> : null}
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? <span className="spinner" /> : null} Giriş yap
        </button>
        <div className="auth-divider">veya</div>
        <Link className="btn" href={"/kayit" + (next ? `?next=${encodeURIComponent(next)}` : "")} style={{ justifyContent: "center" }}>
          Üye ol
        </Link>
      </form>
    </AuthShell>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  const participant = target.startsWith("/s/") || target.startsWith("/anketler");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries()) as Record<string, string>;
    if (!/\S+\s+\S+/.test((body.name || "").trim())) return setErr("Lütfen adınızı ve soyadınızı birlikte yazın.");
    if (body.password !== body.password2) return setErr("Şifreler eşleşmiyor.");
    if (!fd.get("kvkk")) return setErr("Devam etmek için KVKK Aydınlatma Metni'ni onaylamanız gerekir.");
    if (!fd.get("privacy")) return setErr("Devam etmek için Gizlilik Sözleşmesi'ni kabul etmeniz gerekir.");
    setBusy(true);
    setErr("");
    try {
      await api("/api/register", "POST", { ...body, kvkk: true, privacy: true, next: target });
      const r = await signIn("credentials", { email: body.email, password: body.password, redirect: false });
      window.location.href = r && !r.error ? "/eposta-dogrulama" + (target ? `?next=${encodeURIComponent(target)}` : "") : "/giris";
    } catch (e) {
      setBusy(false);
      setErr((e as Error).message);
    }
  }
  return (
    <AuthShell
      title={
        participant ? (
          <>
            Ankete katılmak için <span>üye olun.</span>
          </>
        ) : (
          <>
            Ücretsiz planla <span>hemen başlayın.</span>
          </>
        )
      }
      points={
        participant
          ? ["Ad soyad, e-posta ve şifre ile üyelik", "E-posta doğrulamasıyla güvenli katılım", "Her ankete bir kez katılım", "Yanıtlarınız kimliğinizle eşleştirilmeden saklanır"]
          : ["3 anket, anket başına 100 katılımcı", "Ayda 3 analiz ve 2 PDF rapor", "Kredi kartı gerekmez", "İstediğiniz zaman plan yükseltme"]
      }
    >
      <form onSubmit={submit}>
        <div>
          <p className="eyebrow">Üye ol</p>
          <h1>{participant ? "Katılımcı üyeliği" : "Hesap oluşturun"}</h1>
          <p className="lead">
            {participant
              ? "Anketlere katılım üyelikle yapılır. Kayıttan sonra e-posta adresinize bir doğrulama bağlantısı göndereceğiz."
              : "Kayıttan sonra e-posta adresinize bir doğrulama bağlantısı göndereceğiz. Ad ve kurum bilginiz PDF raporların kapağında “Hazırlayan” olarak görünür."}
          </p>
        </div>
        <label className="f">
          Ad soyad
          <input type="text" name="name" autoComplete="name" required />
        </label>
        {participant ? null : (
          <label className="f">
            Kurum / üniversite (isteğe bağlı)
            <input type="text" name="institution" placeholder="Örn. MASKDER, Ankara Üniversitesi" />
          </label>
        )}
        <label className="f">
          E-posta
          <input type="email" name="email" autoComplete="email" placeholder="ad@ornek.com" required />
        </label>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label className="f">
            Şifre
            <PasswordInput name="password" autoComplete="new-password" minLength={8} />
          </label>
          <label className="f">
            Şifre (tekrar)
            <PasswordInput name="password2" autoComplete="new-password" minLength={8} />
          </label>
        </div>
        <p className="small muted" style={{ marginTop: -6 }}>En az 8 karakter.</p>
        <label className="consent-check">
          <input type="checkbox" name="kvkk" value="1" required />
          <span>
            <a href="/kvkk" target="_blank" rel="noopener">KVKK Aydınlatma Metni</a>&apos;ni okudum, kişisel verilerimin bu metin kapsamında işlenmesini onaylıyorum.
          </span>
        </label>
        <label className="consent-check">
          <input type="checkbox" name="privacy" value="1" required />
          <span>
            <a href="/gizlilik-sozlesmesi" target="_blank" rel="noopener">Gizlilik Sözleşmesi</a>&apos;ni okudum ve kabul ediyorum.
          </span>
        </label>
        <div className="hp" aria-hidden="true">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        {err ? <p className="err-text" role="alert">{err}</p> : null}
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? <span className="spinner" /> : null} Üye ol
        </button>
        <p className="small muted" style={{ textAlign: "center" }}>
          Zaten üye misiniz? <Link href={"/giris" + (target ? `?next=${encodeURIComponent(target)}` : "")}>Giriş yapın</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function ForgotForm() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    await api("/api/password/forgot", "POST", { email: new FormData(e.currentTarget).get("email") }).catch(() => null);
    setSent(true);
    setBusy(false);
  }
  return (
    <AuthShell title={<>Şifrenizi mi <span>unuttunuz?</span></>} points={["Kayıtlı e-postanıza bağlantı gönderilir", "Bağlantı 1 saat geçerlidir", "Bağlantı yalnızca bir kez kullanılabilir"]}>
      {sent ? (
        <div className="stack" style={{ gap: 10, maxWidth: 400, margin: "0 auto" }}>
          <p className="eyebrow">E-posta gönderildi</p>
          <h1>E-postanızı kontrol edin</h1>
          <p className="muted">Bu adresle kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzda yoksa istenmeyen klasörüne bakın.</p>
          <Link className="btn" href="/giris" style={{ justifyContent: "center" }}>
            Girişe dön
          </Link>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div>
            <p className="eyebrow">Şifre sıfırlama</p>
            <h1>Şifremi unuttum</h1>
            <p className="lead">Kayıtlı e-posta adresinizi girin; size şifre sıfırlama bağlantısı gönderelim.</p>
          </div>
          <label className="f">
            E-posta
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : null} Sıfırlama bağlantısı gönder
          </button>
          <Link className="small" href="/giris" style={{ textAlign: "center" }}>
            Girişe dön
          </Link>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetForm({ token }: { token?: string }) {
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("password") !== fd.get("password2")) return setErr("Şifreler eşleşmiyor.");
    try {
      await api("/api/password/reset", "POST", { token, password: fd.get("password") });
      setDone(true);
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  return (
    <AuthShell title={<>Yeni şifrenizi <span>belirleyin.</span></>} points={["En az 8 karakter kullanın", "Başka sitelerdeki şifrenizi tekrar kullanmayın"]}>
      {!token ? (
        <div className="stack" style={{ gap: 10, maxWidth: 400, margin: "0 auto" }}>
          <h1>Bağlantı geçersiz</h1>
          <p className="muted">Şifre sıfırlama bağlantısı eksik. Yeni bir bağlantı isteyin.</p>
          <Link className="btn" href="/sifremi-unuttum" style={{ justifyContent: "center" }}>
            Yeni bağlantı iste
          </Link>
        </div>
      ) : done ? (
        <div className="stack" style={{ gap: 10, maxWidth: 400, margin: "0 auto" }}>
          <h1>Şifreniz güncellendi</h1>
          <p className="muted">Yeni şifrenizle giriş yapabilirsiniz.</p>
          <Link className="btn primary" href="/giris" style={{ justifyContent: "center" }}>
            Giriş yap
          </Link>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div>
            <p className="eyebrow">Şifre sıfırlama</p>
            <h1>Yeni şifre</h1>
          </div>
          <label className="f">
            Yeni şifre
            <PasswordInput name="password" autoComplete="new-password" minLength={8} />
          </label>
          <label className="f">
            Yeni şifre (tekrar)
            <PasswordInput name="password2" autoComplete="new-password" minLength={8} />
          </label>
          {err ? <p className="err-text" role="alert">{err}</p> : null}
          <button className="btn primary" type="submit">
            Şifreyi kaydet
          </button>
        </form>
      )}
    </AuthShell>
  );
}
