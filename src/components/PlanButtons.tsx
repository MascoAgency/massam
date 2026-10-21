"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, useToast } from "./ui";

export function PlanButton({ planId, label, primary, online }: { planId: string; label: string; primary: boolean; online: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className={"btn" + (primary ? " primary" : "")}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          if (online) {
            const r = await api<{ url: string }>("/api/billing/checkout", "POST", { planId });
            window.location.href = r.url;
            return;
          }
          const r = await api<{ switched?: boolean }>("/api/billing/request", "POST", { planId });
          toast(r.switched ? "Planınız güncellendi." : "Talebiniz yöneticiye iletildi.");
          router.refresh();
        } catch (e) {
          toast((e as Error).message, 5000);
        }
        setBusy(false);
      }}
    >
      {busy ? <span className="spinner" /> : null} {label}
    </button>
  );
}

export function PortalButton() {
  const toast = useToast();
  return (
    <button
      className="btn"
      onClick={async () => {
        try {
          const r = await api<{ url: string }>("/api/billing/portal");
          window.location.href = r.url;
        } catch (e) {
          toast((e as Error).message, 5000);
        }
      }}
    >
      Aboneliği yönet
    </button>
  );
}
