"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChartConfiguration } from "chart.js";
import { api, useToast, StatusPill } from "./ui";
import { ChartCanvas, makeChartConfig, chartTheme } from "./ChartCanvas";
import { HOME_SECTIONS, type HomeContent, type HomeSection, type PagesContent, type PlanLite } from "@/lib/types";
import { ImageField, MarkdownEditor } from "./Editor";
import { fmtDate, TZ } from "@/lib/format";
import { ROLE_LABEL, ROLE_DESC, type RoleName } from "@/lib/roles";

export function AdminCharts({ planDist, created }: { planDist: { name: string; n: number }[]; created: number[] }) {
  const pie = useMemo(() => makeChartConfig("pie", planDist.map((x) => x.name), planDist.map((x) => x.n)), [planDist]);
  const line = useMemo<ChartConfiguration>(() => {
    const th = chartTheme();
    const days = created.map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (created.length - 1) + i);
      return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", timeZone: TZ });
    });
    return {
      type: "line",
      data: { labels: days, datasets: [{ data: created, borderColor: th.accent, backgroundColor: th.accent + "22", fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0, color: th.fg }, grid: { color: th.grid } }, x: { ticks: { color: th.fg, maxTicksLimit: 6 }, grid: { display: false } } },
      },
    };
  }, [created]);
  return (
    <div className="grid g2">
      <div className="card stack" style={{ gap: 10 }}>
        <h3>Plan dağılımı</h3>
        <ChartCanvas config={pie} label="Plan dağılımı" height={240} />
      </div>
      <div className="card stack" style={{ gap: 10 }}>
        <h3>Son 30 günde oluşturulan anketler</h3>
        <ChartCanvas config={line} label="Anket oluşturma trendi" height={240} />
      </div>
    </div>
  );
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  institution: string;
  field: string;
  role: string;
  disabled: boolean;
  planId: string;
  requestedPlanId: string | null;
  subscriptionStatus: string | null;
  createdAt: number;
  surveys: number;
}

export function AdminUsers({ users, plans, me }: { users: UserRow[]; plans: PlanLite[]; me: string }) {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState("");
  const patch = async (id: string, body: Record<string, unknown>, msg: string) => {
    try {
      await api(`/api/admin/users/${id}`, "PATCH", body);
      toast(msg);
      router.refresh();
    } catch (e) {
      toast((e as Error).message, 5000);
    }
  };
  const lc = (s: string) => s.toLocaleLowerCase("tr-TR");
  const list = users.filter((u) => !q || lc(u.name + " " + u.email + " " + u.institution).includes(lc(q)));
  const planName = (id: string | null) => plans.find((p) => p.id === id)?.name || id;
  return (
    <div className="card stack" style={{ gap: 12 }}>
      <input type="search" placeholder="Ad, e-posta veya kurum ara" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 360 }} aria-label="Kullanıcı ara" />
      {list.length ? (
        <div className="tbl-wrap" style={{ border: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>Kurum</th>
                <th>Alan</th>
                <th className="num">Anket</th>
                <th>Kayıt</th>
                <th>Plan</th>
                <th>Talep</th>
                <th>Rol / durum</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} style={u.disabled ? { opacity: 0.55 } : undefined}>
                  <td>
                    <b>{u.name || "Adsız"}</b> {u.role !== "USER" ? <span className="pill plain accent">{ROLE_LABEL[u.role as RoleName]}</span> : null}
                    <div className="small muted">{u.email}</div>
                  </td>
                  <td>{u.institution || "—"}</td>
                  <td>{u.field || "—"}</td>
                  <td className="num">{u.surveys}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmtDate(u.createdAt)}</td>
                  <td>
                    <select value={u.planId} aria-label="Plan" onChange={(e) => patch(u.id, { planId: e.target.value }, "Plan güncellendi.")}>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {u.subscriptionStatus ? <div className="small muted">Stripe: {u.subscriptionStatus}</div> : null}
                  </td>
                  <td>
                    {u.requestedPlanId && u.requestedPlanId !== u.planId ? (
                      <div className="row" style={{ gap: 4, flexWrap: "nowrap" }}>
                        <button className="btn sm primary" onClick={() => patch(u.id, { planId: u.requestedPlanId }, "Talep onaylandı.")}>
                          {planName(u.requestedPlanId)} onayla
                        </button>
                        <button className="btn sm ghost" onClick={() => patch(u.id, { rejectRequest: true }, "Talep reddedildi.")}>
                          Reddet
                        </button>
                      </div>
                    ) : (
                      <span className="muted small">—</span>
                    )}
                  </td>
                  <td>
                    {u.id === me ? (
                      <span className="small muted">Siz</span>
                    ) : (
                      <div className="row" style={{ gap: 4, flexWrap: "nowrap" }}>
                        <select value={u.role} aria-label="Rol" title={ROLE_DESC[u.role as RoleName]} onChange={(e) => patch(u.id, { role: e.target.value }, "Rol güncellendi: " + ROLE_LABEL[e.target.value as RoleName])}>
                          {(Object.keys(ROLE_LABEL) as RoleName[]).map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </option>
                          ))}
                        </select>
                        <button className="btn sm ghost danger" onClick={() => patch(u.id, { disabled: !u.disabled }, u.disabled ? "Hesap etkinleştirildi." : "Hesap devre dışı bırakıldı.")}>
                          {u.disabled ? "Etkinleştir" : "Devre dışı bırak"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <p>Kullanıcı bulunamadı.</p>
        </div>
      )}
    </div>
  );
}

export function HomeForm({ home, platformSurveys }: { home: HomeContent; platformSurveys: { id: string; title: string; status: "draft" | "open" | "closed" }[] }) {
  const toast = useToast();
  const router = useRouter();
  const [featured, setFeatured] = useState<string[]>(home.featured);
  const [hidden, setHidden] = useState<HomeSection[]>(home.hidden || []);
  return (
    <form
      className="card stack"
      style={{ gap: 14, maxWidth: 820 }}
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        try {
          await api("/api/admin/home", "PUT", { heroTitle: fd.get("heroTitle"), heroText: fd.get("heroText"), announcement: fd.get("announcement"), heroImageId: fd.get("heroImageId"), slideImageId: fd.get("slideImageId"), featured, hidden });
          toast("Ana sayfa güncellendi.");
          router.refresh();
        } catch (err) {
          toast((err as Error).message);
        }
      }}
    >
      <label className="f">
        Ana başlık
        <input type="text" name="heroTitle" defaultValue={home.heroTitle} />
      </label>
      <label className="f">
        Tanıtım metni
        <textarea name="heroText" rows={3} defaultValue={home.heroText} />
      </label>
      <label className="f">
        Duyuru (boş bırakılırsa gösterilmez)
        <input type="text" name="announcement" defaultValue={home.announcement} />
      </label>
      <ImageField name="heroImageId" label="Açılış alanı görseli (isteğe bağlı; boşsa saha haritası gösterilir)" value={home.heroImageId || null} />
      <ImageField name="slideImageId" label="Manşet bandı tanıtım haberi görseli (diğer haberlerde rapor veya araştırma alanı görseli kullanılır)" value={home.slideImageId || null} />
      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Ana sayfa bölümleri</span>
        <div className="row" style={{ gap: 8 }}>
          {(Object.entries(HOME_SECTIONS) as [HomeSection, string][]).map(([k, l]) => (
            <label className="check chip-check" key={k}>
              <input type="checkbox" checked={!hidden.includes(k)} onChange={(e) => setHidden(e.target.checked ? hidden.filter((x) => x !== k) : [...hidden, k])} /> {l}
            </label>
          ))}
        </div>
        <span className="small muted">İşareti kaldırılan bölüm ana sayfada gösterilmez. İçeriği olmayan bölümler zaten otomatik olarak gizlenir.</span>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Ana sayfada öne çıkan platform anketleri</span>
        {platformSurveys.length ? (
          platformSurveys.map((s) => (
            <label className="check" key={s.id}>
              <input type="checkbox" checked={featured.includes(s.id)} onChange={(e) => setFeatured(e.target.checked ? [...featured, s.id] : featured.filter((x) => x !== s.id))} /> {s.title}{" "}
              <StatusPill s={s} />
            </label>
          ))
        ) : (
          <p className="small muted">Henüz platform anketi yok.</p>
        )}
        <p className="small muted">Hiçbiri seçilmezse tüm açık platform anketleri gösterilir.</p>
      </div>
      <div className="row">
        <button className="btn primary" type="submit">
          Ana sayfayı kaydet
        </button>
        <a className="btn" href="/" target="_blank" rel="noopener">
          Ana sayfayı görüntüle
        </a>
      </div>
    </form>
  );
}

export function PlansForm({ plans, stripe }: { plans: PlanLite[]; stripe: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [ps, setPs] = useState(plans);
  const set = (i: number, patch: Partial<PlanLite>) => setPs(ps.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const setL = (i: number, k: keyof PlanLite["limits"], v: string) => set(i, { limits: { ...ps[i].limits, [k]: parseInt(v, 10) } });
  const limits: [keyof PlanLite["limits"], string][] = [
    ["surveys", "Anket sayısı"],
    ["responses", "Katılımcı / anket"],
    ["ai", "Analiz / ay"],
    ["pdf", "PDF rapor / ay"],
    ["retention", "Saklama (ay)"],
  ];
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await api("/api/admin/plans", "PUT", { plans: ps });
          toast("Üyelik paketleri kaydedildi.");
          router.refresh();
        } catch (err) {
          toast((err as Error).message);
        }
      }}
    >
      <div className="grid g3">
        {ps.map((p, i) => (
          <div className="card stack" style={{ gap: 10 }} key={p.id}>
            <span className="eyebrow">{p.id}</span>
            <label className="f">
              Plan adı
              <input type="text" value={p.name} onChange={(e) => set(i, { name: e.target.value })} />
            </label>
            <label className="f">
              Açıklama
              <input type="text" value={p.note} onChange={(e) => set(i, { note: e.target.value })} />
            </label>
            <label className="f">
              Aylık ücret (₺)
              <input type="number" min={0} value={p.price} onChange={(e) => set(i, { price: parseInt(e.target.value, 10) || 0 })} />
            </label>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {limits.map(([k, l]) => (
                <label className="f" key={k}>
                  {l}
                  <input type="number" min={k === "retention" ? 1 : -1} value={isNaN(p.limits[k]) ? "" : p.limits[k]} onChange={(e) => setL(i, k, e.target.value)} />
                </label>
              ))}
            </div>
            <label className="f">
              Stripe fiyat kimliği (price_…)
              <input type="text" value={p.stripePriceId || ""} placeholder={p.price > 0 ? "price_123…" : "Ücretsiz planda gerekmez"} onChange={(e) => set(i, { stripePriceId: e.target.value })} />
            </label>
          </div>
        ))}
      </div>
      <p className="small muted">
        -1 sınırsız anlamına gelir. Değişiklikler tüm kullanıcılara anında uygulanır.{" "}
        {stripe ? "Kartla ödeme için Stripe panelinde TRY cinsinden aylık bir fiyat oluşturup kimliğini girin." : "Stripe yapılandırılmadığı için plan yükseltmeleri talep/onay ile çalışır."}
      </p>
      <div className="row">
        <button className="btn primary" type="submit">
          Paketleri kaydet
        </button>
      </div>
    </form>
  );
}

export function PagesForm({ pages }: { pages: PagesContent }) {
  const toast = useToast();
  const router = useRouter();
  return (
    <form
      className="card stack"
      style={{ gap: 14, maxWidth: 820 }}
      onSubmit={async (e) => {
        e.preventDefault();
        const body = Object.fromEntries(new FormData(e.currentTarget).entries());
        try {
          await api("/api/admin/pages", "PUT", body);
          toast("Sayfa metinleri kaydedildi.");
          router.refresh();
        } catch (err) {
          toast((err as Error).message);
        }
      }}
    >
      <div>
        <h3>Hakkında ve MASKDER sayfaları</h3>
        <p className="small muted">Paragrafları boş bir satırla ayırın. Boş bırakılan alanda varsayılan metin gösterilir.</p>
      </div>
      <label className="f">
        Hakkında · giriş cümlesi
        <input type="text" name="aboutLead" defaultValue={pages.aboutLead} />
      </label>
      <MarkdownEditor name="aboutBody" label="Hakkımızda · metin" defaultValue={pages.aboutBody} rows={10} />
      <label className="f">
        MASKDER · giriş cümlesi
        <input type="text" name="maskderLead" defaultValue={pages.maskderLead} />
      </label>
      <MarkdownEditor name="maskderBody" label="MASKDER · metin" defaultValue={pages.maskderBody} rows={8} />
      <label className="f">
        Derneğin web sitesi adresi
        <input type="url" name="maskderUrl" defaultValue={pages.maskderUrl} placeholder="https://maskder.com" />
      </label>
      <div className="row">
        <button className="btn primary" type="submit">
          Sayfa metinlerini kaydet
        </button>
        <a className="btn" href="/hakkinda" target="_blank" rel="noopener">
          Hakkında sayfası
        </a>
        <a className="btn" href="/maskder" target="_blank" rel="noopener">
          MASKDER sayfası
        </a>
      </div>
    </form>
  );
}
