/**
 * Anketler için konuya uygun kapak fotoğrafları (public/anket-gorselleri/*.jpg).
 * Fotoğraflar Unsplash'ten alınmıştır; Unsplash Lisansı ticari kullanım dahil ücretsiz kullanıma izin verir.
 * Kaynaklar: public/anket-gorselleri/KAYNAKLAR.md
 */

export type ArtKey = "istihdam" | "neet" | "ogrenci" | "siyaset" | "yerel" | "sosyal" | "guvenlik" | "egitim" | "teknoloji" | "afet" | "genel";

const ALT: Record<ArtKey, string> = {
  istihdam: "İş görüşmesinde el sıkışan iki kişi",
  neet: "Evde telefonuna bakan genç bir erkek",
  ogrenci: "Amfide sohbet eden üniversite öğrencileri",
  siyaset: "Oy pusulasını sandığa atan bir seçmen",
  yerel: "İstiklal Caddesi'nde nostaljik tramvay ve yayalar, İstanbul",
  sosyal: "Kalabalık bir çarşı caddesinde yürüyen insanlar, İstanbul",
  guvenlik: "Ortaköy Camii önünde dalgalanan Türk bayrağı, İstanbul",
  egitim: "Sınıfta öğretmeniyle ders işleyen öğrenciler",
  teknoloji: "Akıllı telefon kullanan gençler",
  afet: "Deprem sonrası yıkılmış binalar",
  genel: "Galata Köprüsü ve tarihi yarımadada gündelik yaşam, İstanbul",
};

/** Anket başlığı ve araştırma alanından görsel türü */
export function artKeyFor(title: string, categorySlug?: string | null): ArtKey {
  const t = title.toLocaleLowerCase("tr-TR");
  if (/ev gençleri|ne eğitimde ne istihdamda/.test(t)) return "neet";
  if (/öğrenci|harcama/.test(t)) return "ogrenci";
  if (/istihdam|işsizlik/.test(t)) return "istihdam";
  if (/siyasi|siyaset|parti|lider|seçim/.test(t)) return "siyaset";
  if (/yerel|belediye/.test(t)) return "yerel";
  if (/hayat pahalılığı|toplumsal güven|yaşam memnuniyeti/.test(t)) return "sosyal";
  if (/güvenlik|dış politika|jeopolitik/.test(t)) return "guvenlik";
  if (/afet|deprem/.test(t)) return "afet";
  if (/dijital|yapay zek|medya|dezenformasyon/.test(t)) return "teknoloji";
  if (/eğitim/.test(t)) return "egitim";
  const bySlug: Record<string, ArtKey> = {
    "ekonomi-ve-istihdam": "istihdam",
    "genclik-ve-universite": "ogrenci",
    "siyaset-ve-kamuoyu": "siyaset",
    "yerel-yonetimler-ve-kalkinma": "yerel",
    "sosyal-sorunlar": "sosyal",
    "guvenlik-ve-jeopolitik": "guvenlik",
    "afet-ve-saha-arastirmalari": "afet",
    "teknoloji-ve-medya": "teknoloji",
    "egitim-ve-bilim": "egitim",
  };
  return (categorySlug && bySlug[categorySlug]) || "genel";
}

/** Konuya uygun kapak fotoğrafı. `className` ile boyutlandırılır (varsayılan en–boy oranı 16:10). */
export function SurveyArt({ art, label, className, eager }: { art: ArtKey; label?: string; className?: string; eager?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={"survey-art " + (className || "")} src={`/anket-gorselleri/${art}.jpg`} alt={label ? `${label} — ${ALT[art]}` : ALT[art]} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} />
  );
}
