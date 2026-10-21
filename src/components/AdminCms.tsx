"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, useToast } from "./ui";
import { Icon } from "./icons";
import { ImageField, MarkdownEditor } from "./Editor";

const MD_HINT = "Biçimlendirme: **kalın**, *italik*, ## başlık, - madde, > alıntı, [metin](adres). Görsel eklemek için “Görsel ekle” düğmesini kullanın.";

// Tarih alanı Türkiye saatine göre
const toTrInput = (ms: number | null) => (ms ? new Date(ms + 3 * 3600_000).toISOString().slice(0, 16) : "");

function useSubmit() {
  const toast = useToast();
  const router = useRouter();
  return async (url: string, method: string, body: unknown, msg: string, next?: (d: Record<string, unknown>) => string | void) => {
    try {
      const d = await api<Record<string, unknown>>(url, method, body);
      toast(msg);
      const to = next?.(d);
      if (to) router.replace(to);
      else router.refresh();
    } catch (e) {
      toast((e as Error).message, 5000);
    }
  };
}

export type NewsEdit = {
  id?: string;
  slug?: string;
  title: string;
  summary: string;
  body: string;
  authorName: string;
  coverId: string | null;
  categoryId: string | null;
  featured: boolean;
  published: boolean;
  publishedAt: number | null;
};

export function NewsEditor({ n, categories }: { n: NewsEdit; categories: { id: string; name: string }[] }) {
  const submit = useSubmit();
  const scheduled = n.published && n.publishedAt && n.publishedAt > Date.now();
  return (
    <form
      className="stack"
      style={{ gap: 16 }}
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const body = Object.fromEntries(fd.entries()) as Record<string, unknown>;
        body.published = fd.get("published") === "on";
        body.featured = fd.get("featured") === "on";
        if (n.id) await submit(`/api/admin/news/${n.id}`, "PATCH", body, "Haber kaydedildi.");
        else await submit("/api/admin/news", "POST", body, "Haber oluşturuldu.", (d) => `/yonetim?sekme=news&haber=${d.id}`);
      }}
    >
      <div className="card row between">
        <div className="row" style={{ gap: 8 }}>
          {n.published ? scheduled ? <span className="pill draft">Zamanlandı</span> : <span className="pill open">Yayında</span> : <span className="pill plain">Taslak</span>}
          {n.slug && n.published ? (
            <Link className="small" href={`/haberler/${n.slug}`} target="_blank">
              Haberi görüntüle →
            </Link>
          ) : null}
        </div>
        <button className="btn primary" type="submit">
          Kaydet
        </button>
      </div>
      <div className="card stack" style={{ gap: 14 }}>
        <label className="f">
          Başlık
          <input type="text" name="title" defaultValue={n.title} required />
        </label>
        <label className="f">
          Kısa özet (listelerde ve paylaşımlarda görünür)
          <textarea name="summary" rows={2} defaultValue={n.summary} />
        </label>
        <ImageField name="coverId" label="Kapak görseli" value={n.coverId} />
        <MarkdownEditor name="body" label="Haber metni" defaultValue={n.body} rows={16} hint={MD_HINT} />
        <div className="grid g3">
          <label className="f">
            Yazar / kaynak (isteğe bağlı)
            <input type="text" name="authorName" defaultValue={n.authorName} placeholder="Örn. MASKDER Basın Birimi" />
          </label>
          <label className="f">
            Araştırma alanı (isteğe bağlı)
            <select name="categoryId" defaultValue={n.categoryId || ""}>
              <option value="">Seçilmedi</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="f">
            Yayın tarihi (boşsa hemen)
            <input type="datetime-local" name="publishedAt" defaultValue={toTrInput(n.publishedAt)} />
          </label>
        </div>
        <div className="row" style={{ gap: 18 }}>
          <label className="check">
            <input type="checkbox" name="published" defaultChecked={n.published} /> Yayımla
          </label>
          <label className="check">
            <input type="checkbox" name="featured" defaultChecked={n.featured} /> Ana sayfada öne çıkar
          </label>
        </div>
        <p className="small muted" style={{ marginTop: -6 }}>İleri bir yayın tarihi seçip “Yayımla”yı işaretlerseniz haber o tarihte otomatik olarak yayına girer.</p>
        <div className="row between">
          {n.id ? (
            <button
              type="button"
              className="btn ghost danger"
              onClick={async () => {
                if (!confirm("Haber kalıcı olarak silinsin mi?")) return;
                await submit(`/api/admin/news/${n.id}`, "DELETE", undefined, "Haber silindi.", () => "/yonetim?sekme=news");
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
      </div>
    </form>
  );
}

export type PageEdit = { id?: string; slug?: string; title: string; summary: string; body: string; coverId: string | null; published: boolean; showInFooter: boolean };

export function PageEditor({ p }: { p: PageEdit }) {
  const submit = useSubmit();
  return (
    <form
      className="stack"
      style={{ gap: 16 }}
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const body = Object.fromEntries(fd.entries()) as Record<string, unknown>;
        body.published = fd.get("published") === "on";
        body.showInFooter = fd.get("showInFooter") === "on";
        if (p.id) await submit(`/api/admin/pages-cms/${p.id}`, "PATCH", body, "Sayfa kaydedildi.");
        else await submit("/api/admin/pages-cms", "POST", body, "Sayfa oluşturuldu.", (d) => `/yonetim?sekme=pages&sayfa=${d.id}`);
      }}
    >
      <div className="card row between">
        <div className="row" style={{ gap: 8 }}>
          {p.published ? <span className="pill open">Yayında</span> : <span className="pill plain">Taslak</span>}
          {p.slug ? (
            <span className="small muted">
              Adres: <span className="mono">/sayfa/{p.slug}</span>
              {p.published ? (
                <>
                  {" "}
                  ·{" "}
                  <Link href={`/sayfa/${p.slug}`} target="_blank">
                    görüntüle →
                  </Link>
                </>
              ) : null}
            </span>
          ) : null}
        </div>
        <button className="btn primary" type="submit">
          Kaydet
        </button>
      </div>
      <div className="card stack" style={{ gap: 14 }}>
        <label className="f">
          Sayfa başlığı
          <input type="text" name="title" defaultValue={p.title} required />
        </label>
        {!p.id ? (
          <label className="f">
            Adres (isteğe bağlı; boşsa başlıktan üretilir)
            <input type="text" name="slug" placeholder="ornek-sayfa" />
          </label>
        ) : null}
        <label className="f">
          Kısa açıklama (sayfa başlığının altında görünür)
          <textarea name="summary" rows={2} defaultValue={p.summary} />
        </label>
        <ImageField name="coverId" label="Kapak görseli (isteğe bağlı)" value={p.coverId} />
        <MarkdownEditor name="body" label="Sayfa içeriği" defaultValue={p.body} rows={18} hint={MD_HINT} />
        <div className="row" style={{ gap: 18 }}>
          <label className="check">
            <input type="checkbox" name="published" defaultChecked={p.published} /> Yayımla
          </label>
          <label className="check">
            <input type="checkbox" name="showInFooter" defaultChecked={p.showInFooter} /> Alt bilgide bağlantı göster
          </label>
        </div>
        <div className="row between">
          {p.id ? (
            <button
              type="button"
              className="btn ghost danger"
              onClick={async () => {
                if (!confirm("Sayfa kalıcı olarak silinsin mi?")) return;
                await submit(`/api/admin/pages-cms/${p.id}`, "DELETE", undefined, "Sayfa silindi.", () => "/yonetim?sekme=pages");
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
      </div>
    </form>
  );
}
