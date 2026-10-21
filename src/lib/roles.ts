// Rol ve yetki tanımları (istemci ve sunucuda ortak kullanılır)
export type RoleName = "USER" | "ADMIN" | "RESEARCHER" | "EDITOR" | "ANALYST";

export const ROLE_LABEL: Record<RoleName, string> = {
  ADMIN: "Yönetici",
  RESEARCHER: "Araştırma sorumlusu",
  EDITOR: "Editör",
  ANALYST: "Analist",
  USER: "Üye",
};

export const ROLE_DESC: Record<RoleName, string> = {
  ADMIN: "Tüm yetkiler: kullanıcılar ve roller, paketler, içerik, anketler, ham veri.",
  RESEARCHER: "Platform anketlerini oluşturur ve yönetir; ham veri, analiz, rapor ve sonuç yayımlama.",
  EDITOR: "Site içeriği, araştırma alanları, yayınlar ve sonuç sayfası metinleri. Ham veriye erişemez.",
  ANALYST: "Platform anketlerinin sonuçlarını, ham yanıtlarını görür; analiz yapar ve dışa aktarır.",
  USER: "Kendi anketlerini oluşturan üye araştırmacı.",
};

/**
 * users     : kullanıcılar ve roller
 * plans     : üyelik paketleri
 * content   : site içeriği, araştırma alanları, yayınlar
 * surveys   : platform anketlerini oluşturma/düzenleme/yayına alma
 * raw       : ham yanıt verisi (yanıt tablosu, CSV dışa/içe aktarma)
 * analyze   : analiz çalıştırma ve PDF rapor oluşturma
 * publish   : araştırma sonuçlarını yayımlama ve sonuç sayfası metinleri
 * volunteers: gönüllü katılımcı listesi (kişisel veri)
 */
export type Perm = "users" | "plans" | "content" | "surveys" | "raw" | "analyze" | "publish" | "volunteers";

const PERMS: Record<RoleName, Perm[]> = {
  ADMIN: ["users", "plans", "content", "surveys", "raw", "analyze", "publish", "volunteers"],
  RESEARCHER: ["surveys", "raw", "analyze", "publish", "volunteers"],
  EDITOR: ["content", "publish"],
  ANALYST: ["raw", "analyze"],
  USER: [],
};

export const can = (role: string | undefined | null, perm: Perm) => !!role && (PERMS[role as RoleName] || []).includes(perm);
export const isStaff = (role: string | undefined | null) => !!role && role !== "USER";

/** Bir anket üzerindeki yetkiler: sahibi her şeyi yapar; platform anketlerinde personel rolüne göre */
export function surveyAccess(user: { id: string; role: string }, s: { ownerId: string; isPlatform: boolean }) {
  const own = s.ownerId === user.id;
  const admin = user.role === "ADMIN";
  // Sonuç ekranı tek tek yanıtları yüklediği için yalnızca anket/ham veri/analiz yetkisi olan roller açabilir (editör açamaz)
  const staffOnPlatform = s.isPlatform && (can(user.role, "surveys") || can(user.role, "raw") || can(user.role, "analyze"));
  return {
    view: own || admin || staffOnPlatform,
    edit: own || admin || (s.isPlatform && can(user.role, "surveys")),
    raw: own || admin || (s.isPlatform && can(user.role, "raw")),
    analyze: own || admin || (s.isPlatform && can(user.role, "analyze")),
    publish: s.isPlatform && can(user.role, "publish"),
  };
}
