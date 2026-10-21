"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "./ui";

/** Araştırma topluluğuna katıl: gönüllü katılımcı kaydı */
export function VolunteerForm({ categories, compact }: { categories: { slug: string; name: string }[]; compact?: boolean }) {
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setErr("");
    try {
      await api("/api/public/volunteer", "POST", {
        email: fd.get("email"),
        name: fd.get("name"),
        city: fd.get("city"),
        ageGroup: fd.get("ageGroup"),
        interests: fd.getAll("interests"),
        consent: fd.get("consent") === "on",
        website: fd.get("website"),
      });
      setDone(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (done)
    return (
      <div className="card stack" style={{ gap: 8 }}>
        <h3>Teşekkür ederiz!</h3>
        <p className="muted">Araştırma topluluğumuza katıldınız. İlgi alanlarınıza uygun yeni araştırmalar başladığında size e-posta ile davet göndereceğiz.</p>
      </div>
    );
  return (
    <form className="card stack volunteer" style={{ gap: 14 }} onSubmit={submit}>
      <div className="grid" style={{ gridTemplateColumns: compact ? "1fr 1fr" : "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: 12 }}>
        <label className="f">
          E-posta *
          <input type="email" name="email" required autoComplete="email" placeholder="ad@ornek.com" />
        </label>
        <label className="f">
          Ad (isteğe bağlı)
          <input type="text" name="name" autoComplete="given-name" />
        </label>
        {!compact ? (
          <>
            <label className="f">
              İl (isteğe bağlı)
              <input type="text" name="city" placeholder="Örn. Ankara" />
            </label>
            <label className="f">
              Yaş grubu (isteğe bağlı)
              <select name="ageGroup" defaultValue="">
                <option value="">Seçin</option>
                {["18-24", "25-34", "35-44", "45-54", "55-64", "65+"].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
          </>
        ) : null}
      </div>
      {!compact ? (
        <fieldset className="stack" style={{ gap: 8, border: 0, padding: 0, margin: 0 }}>
          <legend className="small" style={{ fontWeight: 600, marginBottom: 6 }}>
            İlgilendiğiniz araştırma alanları (isteğe bağlı)
          </legend>
          <div className="row" style={{ gap: 8 }}>
            {categories.map((c) => (
              <label className="check chip-check" key={c.slug}>
                <input type="checkbox" name="interests" value={c.slug} /> {c.name}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <label className="check small" style={{ alignItems: "flex-start" }}>
        <input type="checkbox" name="consent" required style={{ marginTop: 3 }} />
        <span>
          Gelecekteki araştırmalara davet almak amacıyla e-posta adresimin ve paylaştığım bilgilerin işlenmesine açık rıza veriyorum. <Link href="/kvkk">KVKK aydınlatma metni</Link>ni okudum. Davetlerden dilediğim an ayrılabilirim.
        </span>
      </label>
      <div className="hp" aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {err ? <p className="err-text">{err}</p> : null}
      <div>
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? <span className="spinner" /> : null} Araştırma topluluğuna katıl
        </button>
      </div>
    </form>
  );
}
