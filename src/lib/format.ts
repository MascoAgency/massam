// Tüm tarihler sunucunun bulunduğu yerden bağımsız olarak Türkiye saatiyle gösterilir
export const TZ = "Europe/Istanbul";
/** "yyyy-aa-gg" tarihinin Türkiye saatine göre gün başlangıcı (ms) */
export const trDayStart = (ymd: string) => new Date(ymd + "T00:00:00+03:00").getTime();
export const fmtDate = (ts?: number | Date | null) =>
  ts ? new Date(ts).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric", timeZone: TZ }) : "—";

export const fmtDateTime = (ts?: number | Date | null) =>
  ts
    ? new Date(ts).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ })
    : "—";

export const fmtN = (n: number | null | undefined, d = 0) =>
  n == null || isNaN(n) ? "—" : Number(n).toLocaleString("tr-TR", { maximumFractionDigits: d, minimumFractionDigits: d });

export const initials = (n?: string) =>
  (n || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toLocaleUpperCase("tr-TR"))
    .join("") || "?";

export const slugify = (t?: string) =>
  (t || "anket")
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) || "anket";

export const limTxt = (v: number) => (v < 0 ? "Sınırsız" : fmtN(v));
export const lim = (v: number) => (v < 0 ? Infinity : v);
