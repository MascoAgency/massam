"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, useToast, Modal } from "./ui";
import { Icon } from "./icons";

/** Panel/geçmiş/yönetim listelerindeki istemci tarafı düğmeler */
export function SeedExampleButton() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const r = await api<{ id: string }>("/api/surveys/example");
          toast("Örnek araştırma hazır.");
          router.push(`/panel/anket/${r.id}`);
        } catch (e) {
          toast((e as Error).message, 5500);
          setBusy(false);
        }
      }}
    >
      {busy ? <span className="spinner" /> : null} Örnek araştırma yükle
    </button>
  );
}

export function StatusButton({ id, status, labels = ["Anketi kapat", "Anketi aç"], className = "btn" }: { id: string; status: string; labels?: [string, string]; className?: string }) {
  const router = useRouter();
  const toast = useToast();
  const next = status === "open" ? "closed" : "open";
  return (
    <button
      className={className}
      onClick={async () => {
        try {
          await api(`/api/surveys/${id}`, "PATCH", { status: next });
          toast(next === "open" ? "Anket yanıt kabul ediyor." : "Anket kapatıldı.");
          router.refresh();
        } catch (e) {
          toast((e as Error).message, 5000);
        }
      }}
    >
      {status === "open" ? labels[0] : labels[1]}
    </button>
  );
}

export function CopyButton({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  return (
    <button
      className="btn sm"
      onClick={async () => {
        try {
          await api(`/api/surveys/${id}/copy`);
          toast("Anket kopyalandı. Taslak olarak düzenleyebilirsiniz.");
          router.refresh();
        } catch (e) {
          toast((e as Error).message, 5500);
        }
      }}
    >
      <Icon name="copy" /> Kopyala
    </button>
  );
}

export function ArchiveButton({ id, archived }: { id: string; archived: boolean }) {
  const router = useRouter();
  const toast = useToast();
  return (
    <button
      className="btn sm ghost"
      onClick={async () => {
        try {
          await api(`/api/surveys/${id}`, "PATCH", { archived: !archived });
          toast(archived ? "Arşivden çıkarıldı." : "Arşivlendi ve yanıt alımı kapatıldı.");
          router.refresh();
        } catch (e) {
          toast((e as Error).message);
        }
      }}
    >
      {archived ? "Arşivden çıkar" : "Arşivle"}
    </button>
  );
}

export function DeleteButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn sm ghost danger" onClick={() => setOpen(true)}>
        <Icon name="trash" /> Sil
      </button>
      {open ? (
        <Modal
          title="Anketi sil"
          onClose={() => setOpen(false)}
          foot={
            <>
              <span />
              <div className="row">
                <button className="btn" onClick={() => setOpen(false)}>
                  Vazgeç
                </button>
                <button
                  className="btn danger"
                  onClick={async () => {
                    try {
                      await api(`/api/surveys/${id}`, "DELETE");
                      toast("Anket silindi.");
                      setOpen(false);
                      router.refresh();
                    } catch (e) {
                      toast((e as Error).message);
                    }
                  }}
                >
                  Kalıcı olarak sil
                </button>
              </div>
            </>
          }
        >
          <p>
            <b>{title}</b> anketi; tüm yanıtları, analizleri ve raporlarıyla birlikte kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </p>
        </Modal>
      ) : null}
    </>
  );
}
