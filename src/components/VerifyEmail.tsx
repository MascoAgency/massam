"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "./ui";
import { Icon } from "./icons";

/** Doğrulama bağlantısı açıldığında: tek tıkla doğrulama */
export function VerifyEmail({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const [next, setNext] = useState("/anketler");
  async function go() {
    setState("busy");
    try {
      const d = await api<{ next: string }>("/api/verify", "POST", { token });
      setNext(d.next);
      setState("ok");
    } catch (e) {
      setMsg((e as Error).message);
      setState("err");
    }
  }
  return (
    <div className="card verify-card">
      {state === "ok" ? (
        <>
          <span className="verify-ic ok">
            <Icon name="shield" />
          </span>
          <h1>E-posta adresiniz doğrulandı</h1>
          <p className="muted">Üyeliğiniz tamamlandı. Artık anketlere katılabilirsiniz.</p>
          <Link className="btn signal" href={next}>
            {next.startsWith("/s/") ? "Ankete devam et" : "Anketleri görüntüle"} <Icon name="arrow" />
          </Link>
        </>
      ) : state === "err" ? (
        <>
          <span className="verify-ic err">
            <Icon name="info" />
          </span>
          <h1>Doğrulama yapılamadı</h1>
          <p className="muted">{msg}</p>
          <Link className="btn primary" href="/eposta-dogrulama">
            Yeni doğrulama e-postası iste
          </Link>
        </>
      ) : (
        <>
          <span className="verify-ic">
            <Icon name="mail" />
          </span>
          <h1>E-posta adresinizi doğrulayın</h1>
          <p className="muted">Üyeliğinizi tamamlamak için aşağıdaki düğmeye basın.</p>
          <button className="btn signal" onClick={go} disabled={state === "busy"}>
            {state === "busy" ? <span className="spinner" /> : null} E-postamı doğrula
          </button>
        </>
      )}
    </div>
  );
}

/** Kayıttan sonra: doğrulama bekleniyor ekranı */
export function VerifyPending({ email, next }: { email: string; next: string }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="card verify-card">
      <span className="verify-ic">
        <Icon name="mail" />
      </span>
      <h1>E-postanızı kontrol edin</h1>
      <p>
        <b>{email}</b> adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıklayarak üyeliğinizi tamamlayın; ardından ankete devam edebilirsiniz.
      </p>
      <p className="small muted">E-posta birkaç dakika içinde gelmezse gereksiz (spam) klasörünü kontrol edin.</p>
      <div className="row" style={{ justifyContent: "center", gap: 8 }}>
        <button
          className="btn"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const d = await api<{ verified?: boolean }>("/api/verify/resend", "POST", { next });
              if (d.verified) window.location.href = next || "/anketler";
              else setMsg("Yeni doğrulama e-postası gönderildi.");
            } catch (e) {
              setMsg((e as Error).message);
            }
            setBusy(false);
          }}
        >
          {busy ? <span className="spinner" /> : null} E-postayı yeniden gönder
        </button>
        <a className="btn ghost" href={next || "/anketler"}>
          Doğruladım, devam et
        </a>
      </div>
      {msg ? (
        <p className="small" role="status" style={{ marginTop: 10 }}>
          {msg}
        </p>
      ) : null}
    </div>
  );
}
