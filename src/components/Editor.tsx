"use client";
import { useEffect, useRef, useState } from "react";
import { Modal, useToast } from "./ui";
import { Icon } from "./icons";
import { RichTextClient } from "./RichTextClient";

export type MediaItem = { id: string; url: string; filename: string; mime: string; size: number; width: number | null; height: number | null; alt: string; credit?: string };

const kb = (n: number) => (n > 1_000_000 ? (n / 1_000_000).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1000)) + " KB");

/** Görseli tarayıcıda küçültür (en uzun kenar 1920 px) ve WEBP/JPEG olarak sıkıştırır */
async function prepareImage(file: File): Promise<{ blob: Blob; width: number; height: number; name: string }> {
  if (file.type === "image/gif") {
    const dim = await new Promise<{ w: number; h: number }>((res) => {
      const im = new Image();
      im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight });
      im.onerror = () => res({ w: 0, h: 0 });
      im.src = URL.createObjectURL(file);
    });
    return { blob: file, width: dim.w, height: dim.h, name: file.name };
  }
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error("Görsel okunamadı."));
    im.src = URL.createObjectURL(file);
  });
  const scale = Math.min(1, 1920 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  cv.getContext("2d")!.drawImage(img, 0, 0, w, h);
  const toBlob = (type: string, q: number) => new Promise<Blob | null>((res) => cv.toBlob(res, type, q));
  let blob = await toBlob("image/webp", 0.85);
  let ext = "webp";
  if (!blob || blob.type !== "image/webp") {
    blob = await toBlob("image/jpeg", 0.85);
    ext = "jpg";
  }
  if (!blob) throw new Error("Görsel işlenemedi.");
  return { blob, width: w, height: h, name: file.name.replace(/\.[^.]+$/, "") + "." + ext };
}

export async function uploadFile(file: File, alt = ""): Promise<MediaItem> {
  const fd = new FormData();
  if (file.type.startsWith("image/")) {
    const p = await prepareImage(file);
    fd.append("file", new File([p.blob], p.name, { type: p.blob.type }));
    fd.append("width", String(p.width));
    fd.append("height", String(p.height));
  } else fd.append("file", file);
  fd.append("alt", alt);
  const res = await fetch("/api/admin/media", { method: "POST", body: fd });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error || "Dosya yüklenemedi.");
  return d as MediaItem;
}

/** Medya seçici: kütüphaneden seç veya yeni yükle */
export function MediaPicker({ kind = "gorsel", onPick, onClose }: { kind?: "gorsel" | "pdf"; onPick: (m: MediaItem) => void; onClose: () => void }) {
  const toast = useToast();
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [alt, setAlt] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    fetch(`/api/admin/media?tur=${kind}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  }, [kind]);
  async function upload(f: File) {
    setBusy(true);
    try {
      const m = await uploadFile(f, alt);
      toast("Dosya yüklendi.");
      onPick(m);
    } catch (e) {
      toast((e as Error).message, 5000);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={kind === "pdf" ? "PDF seç veya yükle" : "Görsel seç veya yükle"} onClose={onClose}>
      <div className="stack" style={{ gap: 14 }}>
        <div className="card stack" style={{ gap: 10, padding: 16 }}>
          <b className="small">Yeni dosya yükle</b>
          {kind === "gorsel" ? (
            <label className="f">
              Görsel açıklaması (erişilebilirlik için)
              <input type="text" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Örn. Ankara'da düzenlenen seminerden bir kare" />
            </label>
          ) : null}
          <div className="row">
            <button type="button" className="btn primary" disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? <span className="spinner" /> : <Icon name="plus" />} Bilgisayardan seç
            </button>
            <span className="small muted">{kind === "pdf" ? "PDF, en fazla 4 MB." : "JPG, PNG, WEBP veya GIF; büyük görseller otomatik küçültülür."}</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            hidden
            accept={kind === "pdf" ? "application/pdf" : "image/jpeg,image/png,image/webp,image/gif"}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) upload(f);
            }}
          />
        </div>
        <b className="small">Kütüphaneden seç</b>
        {items === null ? (
          <span className="spinner" />
        ) : items.length ? (
          <div className="media-grid">
            {items.map((m) => (
              <button type="button" key={m.id} className="media-tile" onClick={() => onPick(m)} title={m.filename}>
                {m.mime.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.alt} loading="lazy" />
                ) : (
                  <span className="media-pdf">
                    <Icon name="file" /> PDF
                  </span>
                )}
                <span className="media-name">{m.filename}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="small muted">Kütüphanede henüz dosya yok.</p>
        )}
      </div>
    </Modal>
  );
}

/** Kapak görseli alanı: form içinde gizli input ile medya kimliğini taşır */
export function ImageField({ name, label, value, url }: { name: string; label: string; value: string | null; url?: string | null }) {
  const [id, setId] = useState<string | null>(value);
  const [src, setSrc] = useState<string | null>(url ?? (value ? `/medya/${value}` : null));
  const [open, setOpen] = useState(false);
  return (
    <div className="f">
      <span>{label}</span>
      <input type="hidden" name={name} value={id || ""} />
      <div className="image-field">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" />
        ) : (
          <span className="small muted">Görsel seçilmedi</span>
        )}
        <div className="row" style={{ gap: 6 }}>
          <button type="button" className="btn sm" onClick={() => setOpen(true)}>
            {src ? "Değiştir" : "Görsel seç"}
          </button>
          {src ? (
            <button type="button" className="btn sm ghost danger" onClick={() => (setId(null), setSrc(null))}>
              Kaldır
            </button>
          ) : null}
        </div>
      </div>
      {open ? (
        <MediaPicker
          onClose={() => setOpen(false)}
          onPick={(m) => {
            setId(m.id);
            setSrc(m.url);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

/** PDF alanı */
export function PdfField({ name, label, value, filename }: { name: string; label: string; value: string | null; filename?: string | null }) {
  const [id, setId] = useState<string | null>(value);
  const [fname, setFname] = useState<string | null>(filename ?? null);
  const [open, setOpen] = useState(false);
  return (
    <div className="f">
      <span>{label}</span>
      <input type="hidden" name={name} value={id || ""} />
      <div className="row" style={{ gap: 8 }}>
        {id ? (
          <a className="small" href={`/medya/${id}`} target="_blank" rel="noopener">
            <Icon name="file" /> {fname || "PDF dosyası"}
          </a>
        ) : (
          <span className="small muted">PDF yüklenmedi</span>
        )}
        <button type="button" className="btn sm" onClick={() => setOpen(true)}>
          {id ? "Değiştir" : "PDF yükle / seç"}
        </button>
        {id ? (
          <button type="button" className="btn sm ghost danger" onClick={() => (setId(null), setFname(null))}>
            Kaldır
          </button>
        ) : null}
      </div>
      {open ? (
        <MediaPicker
          kind="pdf"
          onClose={() => setOpen(false)}
          onPick={(m) => {
            setId(m.id);
            setFname(m.filename);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

/** Biçimli metin düzenleyici: araç çubuğu, görsel ekleme ve önizleme */
export function MarkdownEditor({ name, label, defaultValue, rows = 14, hint }: { name: string; label: string; defaultValue: string; rows?: number; hint?: string }) {
  const [val, setVal] = useState(defaultValue);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [picker, setPicker] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);

  function wrap(before: string, after = before, placeholder = "metin") {
    const el = ta.current;
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = val.slice(s, e) || placeholder;
    const next = val.slice(0, s) + before + sel + after + val.slice(e);
    setVal(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  }
  function linePrefix(prefix: string) {
    const el = ta.current;
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const start = val.lastIndexOf("\n", s - 1) + 1;
    const block = val.slice(start, e);
    const replaced = block
      .split("\n")
      .map((l, i) => (prefix === "1. " ? `${i + 1}. ` : prefix) + l.replace(/^(#{1,3}\s|>\s?|[-*]\s|\d+[.)]\s)/, ""))
      .join("\n");
    setVal(val.slice(0, start) + replaced + val.slice(e));
    requestAnimationFrame(() => el.focus());
  }
  function insertBlock(text: string) {
    const el = ta.current;
    const pos = el ? el.selectionStart : val.length;
    const pre = val.slice(0, pos), post = val.slice(pos);
    const glue = (pre && !pre.endsWith("\n\n") ? (pre.endsWith("\n") ? "\n" : "\n\n") : "") + text + (post && !post.startsWith("\n") ? "\n\n" : "");
    setVal(pre + glue + post);
  }
  const tools: [string, string, () => void][] = [
    ["B", "Kalın", () => wrap("**")],
    ["İ", "İtalik", () => wrap("*")],
    ["H2", "Başlık", () => linePrefix("## ")],
    ["H3", "Alt başlık", () => linePrefix("### ")],
    ["•", "Madde listesi", () => linePrefix("- ")],
    ["1.", "Numaralı liste", () => linePrefix("1. ")],
    ["❝", "Alıntı", () => linePrefix("> ")],
    ["🔗", "Bağlantı", () => {
      const url = prompt("Bağlantı adresi (https://…)", "https://");
      if (url) wrap("[", `](${url})`, "bağlantı metni");
    }],
    ["—", "Ayraç", () => insertBlock("---")],
  ];
  return (
    <div className="f md-editor">
      <span className="row between">
        {label}
        <span className="seg" role="group" aria-label="Görünüm">
          <button type="button" aria-pressed={mode === "write"} onClick={() => setMode("write")}>
            Yaz
          </button>
          <button type="button" aria-pressed={mode === "preview"} onClick={() => setMode("preview")}>
            Önizle
          </button>
        </span>
      </span>
      {mode === "write" ? (
        <>
          <div className="md-toolbar" role="toolbar" aria-label="Biçimlendirme">
            {tools.map(([t, title, fn]) => (
              <button type="button" key={title} title={title} aria-label={title} onClick={fn}>
                {t}
              </button>
            ))}
            <button type="button" className="md-img" onClick={() => setPicker(true)}>
              <Icon name="plus" /> Görsel ekle
            </button>
          </div>
          <textarea ref={ta} name={name} rows={rows} value={val} onChange={(e) => setVal(e.target.value)} />
        </>
      ) : (
        <>
          <input type="hidden" name={name} value={val} />
          <div className="md-preview">{val.trim() ? <RichTextClient text={val} /> : <p className="small muted">Önizlenecek metin yok.</p>}</div>
        </>
      )}
      {hint ? <span className="small muted" style={{ fontWeight: 400 }}>{hint}</span> : null}
      {picker ? (
        <MediaPicker
          onClose={() => setPicker(false)}
          onPick={(m) => {
            insertBlock(`![${m.alt || ""}](${m.url})`);
            setPicker(false);
          }}
        />
      ) : null}
    </div>
  );
}

/** Medya kütüphanesi (yönetim) */
export function MediaLibrary({ initial }: { initial: (MediaItem & { createdAt: number })[] }) {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  async function uploadMany(files: FileList) {
    for (const f of Array.from(files)) {
      setBusy((b) => b + 1);
      try {
        const m = await uploadFile(f);
        setItems((xs) => [{ ...m, createdAt: Date.now() }, ...xs]);
      } catch (e) {
        toast(`${f.name}: ${(e as Error).message}`, 5000);
      } finally {
        setBusy((b) => b - 1);
      }
    }
  }
  return (
    <div className="stack">
      <div className="card row between">
        <div className="stack" style={{ gap: 4 }}>
          <b>Medya kütüphanesi</b>
          <span className="small muted">Haber, sayfa ve yayınlarda kullanılan görseller ve PDF dosyaları. Görseller yüklenirken otomatik küçültülür; dosya başına en fazla 4 MB.</span>
        </div>
        <button className="btn primary" disabled={busy > 0} onClick={() => fileRef.current?.click()}>
          {busy ? <span className="spinner" /> : <Icon name="plus" />} Dosya yükle
        </button>
        <input
          ref={fileRef}
          type="file"
          hidden
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          onChange={(e) => {
            if (e.target.files?.length) uploadMany(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {items.length ? (
        <div className="media-grid lib">
          {items.map((m) => (
            <div className="media-card" key={m.id}>
              {m.mime.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.alt} loading="lazy" />
              ) : (
                <span className="media-pdf">
                  <Icon name="file" /> PDF
                </span>
              )}
              <div className="stack" style={{ gap: 6, padding: 10 }}>
                <b className="small" style={{ wordBreak: "break-all" }}>{m.filename}</b>
                <span className="small muted">
                  {kb(m.size)}
                  {m.width ? ` · ${m.width}×${m.height}` : ""}
                </span>
                {m.mime.startsWith("image/") ? (
                  <input
                    type="text"
                    defaultValue={m.alt}
                    placeholder="Açıklama (alt metin)"
                    aria-label="Görsel açıklaması"
                    onBlur={async (e) => {
                      if (e.target.value === m.alt) return;
                      const r = await fetch(`/api/admin/media/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alt: e.target.value }) });
                      if (r.ok) {
                        setItems((xs) => xs.map((x) => (x.id === m.id ? { ...x, alt: e.target.value } : x)));
                        toast("Açıklama kaydedildi.");
                      }
                    }}
                  />
                ) : null}
                {m.mime.startsWith("image/") ? (
                  <input
                    type="text"
                    defaultValue={m.credit || ""}
                    placeholder="Künye: Fotoğraf: Ad Soyad · CC BY 4.0 · Kaynak"
                    aria-label="Fotoğraf künyesi"
                    onBlur={async (e) => {
                      if (e.target.value === (m.credit || "")) return;
                      const r = await fetch(`/api/admin/media/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credit: e.target.value }) });
                      if (r.ok) {
                        setItems((xs) => xs.map((x) => (x.id === m.id ? { ...x, credit: e.target.value } : x)));
                        toast("Künye kaydedildi.");
                      }
                    }}
                  />
                ) : null}
                <div className="row" style={{ gap: 4 }}>
                  <button
                    className="btn sm"
                    onClick={async () => {
                      const text = m.mime.startsWith("image/") ? `![${m.alt}](${m.url})` : `[${m.filename}](${m.url})`;
                      try {
                        await navigator.clipboard.writeText(text);
                        toast("Metne eklenecek kod kopyalandı.");
                      } catch {
                        toast(text, 6000);
                      }
                    }}
                  >
                    <Icon name="copy" /> Kopyala
                  </button>
                  <button
                    className="btn sm ghost danger"
                    onClick={async () => {
                      if (!confirm("Dosya kalıcı olarak silinsin mi?")) return;
                      const r = await fetch(`/api/admin/media/${m.id}`, { method: "DELETE" });
                      const d = await r.json().catch(() => ({}));
                      if (!r.ok) return toast(d.error || "Silinemedi.", 6000);
                      setItems((xs) => xs.filter((x) => x.id !== m.id));
                      toast("Dosya silindi.");
                    }}
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty">
          <p>Kütüphanede henüz dosya yok.</p>
        </div>
      )}
    </div>
  );
}
