"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, useToast, Modal } from "./ui";
import { Icon } from "./icons";
import type { ContactContent, LegalContent } from "@/lib/types";
import { ImageField, MarkdownEditor, PdfField } from "./Editor";

const ICON_OPTIONS: [string, string][] = [
  ["vote", "Oy sandığı"],
  ["users", "Kişiler"],
  ["heart", "Kalp"],
  ["coin", "Para"],
  ["shield", "Kalkan"],
  ["book", "Kitap"],
  ["cpu", "İşlemci"],
  ["building", "Bina"],
  ["alert", "Uyarı / afet"],
  ["globe", "Küre"],
  ["chart", "Grafik"],
  ["file", "Belge"],
  ["home", "Ev"],
];

function useSave() {
  const toast = useToast();
  const router = useRouter();
  return async (url: string, method: string, body: unknown, msg: string, after?: (d: Record<string, unknown>) => void) => {
    try {
      const d = await api<Record<string, unknown>>(url, method, body);
      toast(msg);
      after?.(d);
      router.refresh();
      return true;
    } catch (e) {
      toast((e as Error).message, 5000);
      return false;
    }
  };
}

// ---------- Araştırma alanları ----------
type Cat = { id: string; name: string; description: string; icon: string; topics: string[]; active: boolean; surveys: number };

export function CategoriesManager({ categories }: { categories: Cat[] }) {
  const save = useSave();
  const [edit, setEdit] = useState<Cat | "new" | null>(null);
  return (
    <div className="stack">
      <div className="card row between">
        <div className="stack" style={{ gap: 4 }}>
          <b>Araştırma alanları</b>
          <span className="small muted">Kart sisteminde gösterilen kategoriler. Pasif alanlar sitede görünmez; yeni alanlar (ör. Tarih, Kültür ve Kimlik) buradan eklenir.</span>
        </div>
        <button className="btn primary" onClick={() => setEdit("new")}>
          <Icon name="plus" /> Yeni alan
        </button>
      </div>
      <div className="card">
        <div className="slist">
          {categories.map((c, i) => (
            <div className="sitem" key={c.id}>
              <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                <div className="row" style={{ gap: 8 }}>
                  {c.active ? <span className="pill open">Aktif</span> : <span className="pill plain">Pasif</span>}
                  <span className="small muted">{c.surveys} anket · {c.topics.length} konu</span>
                </div>
                <h3>{c.name}</h3>
                <p className="small muted">{c.description}</p>
              </div>
              <div className="acts">
                <button className="iconbtn" aria-label="Yukarı" disabled={i === 0} onClick={() => save(`/api/admin/categories/${c.id}`, "PATCH", { move: -1 }, "Sıralama güncellendi.")}>
                  <Icon name="up" />
                </button>
                <button className="iconbtn" aria-label="Aşağı" disabled={i === categories.length - 1} onClick={() => save(`/api/admin/categories/${c.id}`, "PATCH", { move: 1 }, "Sıralama güncellendi.")}>
                  <Icon name="down" />
                </button>
                <button className="btn sm" onClick={() => setEdit(c)}>
                  Düzenle
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {edit ? (
        <Modal title={edit === "new" ? "Yeni araştırma alanı" : "Araştırma alanını düzenle"} onClose={() => setEdit(null)}>
          <form
            className="stack"
            style={{ gap: 12 }}
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const body = { name: fd.get("name"), description: fd.get("description"), icon: fd.get("icon"), topics: String(fd.get("topics") || ""), active: fd.get("active") === "on" };
              const ok = edit === "new" ? await save("/api/admin/categories", "POST", body, "Alan eklendi.") : await save(`/api/admin/categories/${edit.id}`, "PATCH", body, "Alan güncellendi.");
              if (ok) setEdit(null);
            }}
          >
            <label className="f">
              Alan adı
              <input type="text" name="name" defaultValue={edit === "new" ? "" : edit.name} required />
            </label>
            <label className="f">
              Kısa açıklama
              <textarea name="description" rows={3} defaultValue={edit === "new" ? "" : edit.description} />
            </label>
            <label className="f">
              Konular (her satıra bir konu)
              <textarea name="topics" rows={5} defaultValue={edit === "new" ? "" : edit.topics.join("\n")} />
            </label>
            <div className="grid g2">
              <label className="f">
                İkon
                <select name="icon" defaultValue={edit === "new" ? "chart" : edit.icon}>
                  {ICON_OPTIONS.map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="check" style={{ alignSelf: "end" }}>
                <input type="checkbox" name="active" defaultChecked={edit === "new" ? true : edit.active} /> Sitede göster
              </label>
            </div>
            <div className="row between">
              {edit !== "new" ? (
                <button
                  type="button"
                  className="btn ghost danger"
                  onClick={async () => {
                    if (!confirm("Bu alan silinsin mi? Bağlı anketler ve yayınlar kategorisiz kalır.")) return;
                    if (await save(`/api/admin/categories/${edit.id}`, "DELETE", undefined, "Alan silindi.")) setEdit(null);
                  }}
                >
                  <Icon name="trash" /> Sil
                </button>
              ) : (
                <span />
              )}
              <button className="btn primary" type="submit">
                Kaydet
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

// ---------- Araştırma sonucu (sonuç sayfası) düzenleyici ----------
export type ResultEdit = {
  id: string;
  title: string;
  n: number;
  createdAt: number;
  published: boolean;
  slug: string | null;
  summary: string;
  scope: string;
  method: string;
  limitations: string;
  evaluation: string;
  highlights: string[];
  agenda: boolean;
  questions: { id: string; title: string }[];
  surveyId: string;
};

export function ResultEditor({ r, defaultLimitations }: { r: ResultEdit; defaultLimitations: string }) {
  const save = useSave();
  const [hl, setHl] = useState<string[]>(r.highlights);
  return (
    <form
      className="stack"
      style={{ gap: 14 }}
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await save(
          `/api/admin/reports/${r.id}`,
          "PATCH",
          {
            summary: fd.get("summary"),
            scope: fd.get("scope"),
            method: fd.get("method"),
            limitations: fd.get("limitations"),
            evaluation: fd.get("evaluation"),
            highlights: hl,
            agenda: fd.get("agenda") === "on",
          },
          "Sonuç sayfası kaydedildi.",
        );
      }}
    >
      <div className="card row between">
        <div className="stack" style={{ gap: 4 }}>
          <div className="row" style={{ gap: 8 }}>
            {r.published ? <span className="pill open">Yayında</span> : <span className="pill draft">Yayın onayı bekliyor</span>}
            <span className="small muted">n = {r.n}</span>
          </div>
          <b>{r.title}</b>
          {r.published && r.slug ? (
            <Link className="small" href={`/arastirma-sonuclari/${r.slug}`} target="_blank">
              Sonuç sayfasını görüntüle →
            </Link>
          ) : (
            <span className="small muted">Sonuçlar, yayın onayı verilene kadar kamuya açılmaz.</span>
          )}
        </div>
        <div className="row">
          <Link className="btn" href={`/panel/anket/${r.surveyId}?sekme=report`}>
            Anket ve raporlar
          </Link>
          <button
            type="button"
            className={"btn" + (r.published ? "" : " primary")}
            onClick={() => save(`/api/admin/reports/${r.id}`, "PATCH", { published: !r.published }, r.published ? "Yayından kaldırıldı." : "Yayın onayı verildi; sonuç sayfası yayında.")}
          >
            {r.published ? "Yayından kaldır" : "Yayın onayı ver"}
          </button>
        </div>
      </div>
      <div className="card stack" style={{ gap: 14 }}>
        <label className="f">
          Kısa özet (kartlarda ve sonuç sayfasının başında görünür)
          <textarea name="summary" rows={3} defaultValue={r.summary} />
        </label>
        <label className="f">
          Hedef kitle ve araştırma kapsamı
          <textarea name="scope" rows={3} defaultValue={r.scope} placeholder="Boş bırakılırsa anketin hedef katılımcı grubu kullanılır." />
        </label>
        <label className="f">
          Veri toplama ve örneklem yöntemi
          <textarea name="method" rows={4} defaultValue={r.method} placeholder="Örn. Veriler 1-15 Ekim tarihleri arasında, gönüllü katılıma dayalı çevrim içi anketle toplanmıştır. Anket bağlantısı sosyal medya ve e-posta yoluyla duyurulmuştur." />
        </label>
        <label className="f">
          Sınırlılıklar
          <textarea name="limitations" rows={4} defaultValue={r.limitations} placeholder={defaultLimitations} />
        </label>
        <p className="small muted" style={{ marginTop: -6 }}>
          Sınırlılıklar boş bırakılırsa varsayılan metin gösterilir: gönüllü çevrim içi anket sonuçlarının Türkiye genelini temsil etmediği açıkça belirtilir.
        </p>
        <label className="f">
          Araştırma değerlendirmesi
          <textarea name="evaluation" rows={6} defaultValue={r.evaluation} placeholder="Boş bırakılırsa analizdeki sonuç paragrafı kullanılır." />
        </label>
        <fieldset className="stack" style={{ gap: 8, border: 0, padding: 0, margin: 0 }}>
          <legend className="small" style={{ fontWeight: 600, marginBottom: 6 }}>
            Veri ve İstatistikler bölümünde öne çıkarılacak sorular
          </legend>
          {r.questions.map((q) => (
            <label className="check small" key={q.id}>
              <input type="checkbox" checked={hl.includes(q.id)} onChange={(e) => setHl(e.target.checked ? [...hl, q.id] : hl.filter((x) => x !== q.id))} /> {q.title}
            </label>
          ))}
          <span className="small muted">Seçilmezse ilk iki grafik gösterilir.</span>
        </fieldset>
        <label className="check">
          <input type="checkbox" name="agenda" defaultChecked={r.agenda} /> Ana sayfadaki “Türkiye gündemi” bölümünde öne çıkar
        </label>
        <div>
          <button className="btn primary" type="submit">
            Sonuç sayfasını kaydet
          </button>
        </div>
      </div>
    </form>
  );
}

// ---------- Yayınlar ----------
export type PubEdit = {
  id?: string;
  title: string;
  type: string;
  summary: string;
  body: string;
  authors: string;
  categoryId: string | null;
  reportId: string | null;
  pdfUrl: string;
  published: boolean;
  agenda: boolean;
  coverId: string | null;
  pdfId: string | null;
  pdfName: string | null;
};

export function PublicationEditor({ p, categories, reports, types }: { p: PubEdit; categories: { id: string; name: string }[]; reports: { id: string; title: string }[]; types: Record<string, string> }) {
  const save = useSave();
  const router = useRouter();
  return (
    <form
      className="card stack"
      style={{ gap: 14 }}
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const body = {
          title: fd.get("title"),
          type: fd.get("type"),
          summary: fd.get("summary"),
          body: fd.get("body"),
          authors: fd.get("authors"),
          categoryId: fd.get("categoryId"),
          reportId: fd.get("reportId"),
          pdfUrl: fd.get("pdfUrl"),
          coverId: fd.get("coverId"),
          pdfId: fd.get("pdfId"),
          published: fd.get("published") === "on",
          agenda: fd.get("agenda") === "on",
        };
        if (p.id) await save(`/api/admin/publications/${p.id}`, "PATCH", body, "Yayın kaydedildi.");
        else await save("/api/admin/publications", "POST", body, "Yayın oluşturuldu.", (d) => router.replace(`/yonetim?sekme=publications&yayin=${d.id}`));
      }}
    >
      <label className="f">
        Başlık
        <input type="text" name="title" defaultValue={p.title} required />
      </label>
      <div className="grid g3">
        <label className="f">
          Yayın türü
          <select name="type" defaultValue={p.type}>
            {Object.entries(types).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="f">
          Kategori
          <select name="categoryId" defaultValue={p.categoryId || ""}>
            <option value="">Seçilmedi</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="f">
          Yazar veya araştırma ekibi
          <input type="text" name="authors" defaultValue={p.authors} />
        </label>
      </div>
      <label className="f">
        Özet
        <textarea name="summary" rows={3} defaultValue={p.summary} />
      </label>
      <ImageField name="coverId" label="Kapak görseli (isteğe bağlı)" value={p.coverId} />
      <MarkdownEditor name="body" label="Metin (isteğe bağlı)" defaultValue={p.body} rows={12} hint="Biçimlendirme: **kalın**, *italik*, ## başlık, - madde, > alıntı, [metin](adres). Görsel eklemek için “Görsel ekle” düğmesini kullanın." />
      <PdfField name="pdfId" label="PDF dosyası yükle" value={p.pdfId} filename={p.pdfName} />
      <div className="grid g2">
        <label className="f">
          veya PDF bağlantısı
          <input type="url" name="pdfUrl" defaultValue={p.pdfUrl} placeholder="https://…/rapor.pdf" />
        </label>
        <label className="f">
          veya platform raporu bağla
          <select name="reportId" defaultValue={p.reportId || ""}>
            <option value="">Bağlanmadı</option>
            {reports.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="row" style={{ gap: 18 }}>
        <label className="check">
          <input type="checkbox" name="published" defaultChecked={p.published} /> Yayımla
        </label>
        <label className="check">
          <input type="checkbox" name="agenda" defaultChecked={p.agenda} /> Türkiye gündeminde öne çıkar
        </label>
      </div>
      <div className="row between">
        {p.id ? (
          <button
            type="button"
            className="btn ghost danger"
            onClick={async () => {
              if (!confirm("Bu yayın kalıcı olarak silinsin mi?")) return;
              if (await save(`/api/admin/publications/${p.id}`, "DELETE", undefined, "Yayın silindi.")) router.replace("/yonetim?sekme=publications");
            }}
          >
            <Icon name="trash" /> Sil
          </button>
        ) : (
          <span />
        )}
        <button className="btn primary" type="submit">
          Kaydet
        </button>
      </div>
    </form>
  );
}

// ---------- İletişim ve yasal metinler ----------
export function ContactForm({ c }: { c: ContactContent }) {
  const save = useSave();
  return (
    <form
      className="card stack"
      style={{ gap: 14, maxWidth: 820 }}
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const g = (k: string) => String(fd.get(k) || "");
        await save(
          "/api/admin/contact",
          "PUT",
          { footerAbout: g("footerAbout"), email: g("email"), phone: g("phone"), address: g("address"), social: { x: g("x"), instagram: g("instagram"), linkedin: g("linkedin"), youtube: g("youtube"), facebook: g("facebook") } },
          "İletişim bilgileri kaydedildi.",
        );
      }}
    >
      <div>
        <h3>Alt bilgi ve iletişim</h3>
        <p className="small muted">Boş bırakılan alanlar sitede gösterilmez.</p>
      </div>
      <label className="f">
        Alt bilgideki tanıtım metni
        <textarea name="footerAbout" rows={3} defaultValue={c.footerAbout} />
      </label>
      <div className="grid g3">
        <label className="f">
          E-posta
          <input type="email" name="email" defaultValue={c.email} />
        </label>
        <label className="f">
          Telefon
          <input type="text" name="phone" defaultValue={c.phone} />
        </label>
        <label className="f">
          Adres
          <input type="text" name="address" defaultValue={c.address} />
        </label>
      </div>
      <div className="grid g3">
        {(["x", "instagram", "linkedin", "youtube", "facebook"] as const).map((k) => (
          <label className="f" key={k}>
            {k === "x" ? "X (Twitter)" : k[0].toUpperCase() + k.slice(1)}
            <input type="url" name={k} defaultValue={c.social[k]} placeholder="https://" />
          </label>
        ))}
      </div>
      <div>
        <button className="btn primary" type="submit">
          İletişim bilgilerini kaydet
        </button>
      </div>
    </form>
  );
}

export function LegalForm({ l }: { l: LegalContent }) {
  const save = useSave();
  return (
    <form
      className="card stack"
      style={{ gap: 14, maxWidth: 980 }}
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await save("/api/admin/legal", "PUT", { kvkk: fd.get("kvkk"), cookies: fd.get("cookies"), terms: fd.get("terms") }, "Yasal metinler kaydedildi.");
      }}
    >
      <div>
        <h3>Yasal metinler</h3>
        <div className="callout warn" style={{ marginTop: 8 }}>
          <Icon name="info" />
          <span className="small">
            Bu metinler taslaktır. Yayımlamadan önce bir hukukçu tarafından gözden geçirilmeli; veri sorumlusunun unvanı, adresi ve başvuru kanalları eklenmelidir. “## ” ile başlayan satırlar başlık olarak gösterilir.
          </span>
        </div>
      </div>
      <MarkdownEditor name="kvkk" label="KVKK aydınlatma metni" defaultValue={l.kvkk} rows={12} />
      <MarkdownEditor name="cookies" label="Çerez politikası" defaultValue={l.cookies} rows={8} />
      <MarkdownEditor name="terms" label="Kullanım koşulları" defaultValue={l.terms} rows={10} />
      <div className="row">
        <button className="btn primary" type="submit">
          Yasal metinleri kaydet
        </button>
        <a className="btn" href="/kvkk" target="_blank" rel="noopener">
          KVKK sayfası
        </a>
      </div>
    </form>
  );
}
