/**
 * Konulara ait serbest lisanslı gerçek fotoğrafları Wikimedia Commons'tan indirip medya kütüphanesine ekler,
 * araştırma alanlarına, rapor verilerine ve manşet bandının tanıtım haberine bağlar.
 * Yalnızca boş olan görsel alanlarını doldurur; yönetimden seçilmiş görsellerin üzerine yazmaz. Tekrar çalıştırılabilir.
 * Kullanım: npx tsx prisma/import-photos.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const UA = "MASSAM-Arastirma/1.0 (https://maskder-arastirma.vercel.app)";

type Target = { category?: string; finding?: string; intro?: true };
const PHOTOS: { file: string; alt: string; to: Target }[] = [
  { file: "Panoramic view of Istanbul- Yeni Cami (The New Mosque), Galata Bridge. Turkey, Southeastern Europe.jpg", alt: "Eminönü'nde Yeni Cami ve Galata Köprüsü çevresinde gündelik yaşam, İstanbul", to: { intro: true } },
  { file: "Panorama-view-Istanbul-October-2012.jpg", alt: "İstanbul'da yoğun kentsel doku ve konut alanları", to: { finding: "yerel-yonetimde-beklentiler-ve-hizmetler" } },
  { file: "İBB binası.JPG", alt: "İstanbul Büyükşehir Belediyesi binası, Saraçhane", to: { category: "yerel-yonetimler-ve-kalkinma" } },
  { file: "Emergency Service of Ukraine conducts search and rescue work in Hatay Province (2023-02-10) 01.jpg", alt: "Hatay'da enkaz alanında arama kurtarma çalışması, 10 Şubat 2023", to: { finding: "hatay-deprem-saha-arastirmasi" } },
  { file: "City of Antakya after 7.8 magnitude earthquake in Türkiye.jpg", alt: "6 Şubat 2023 depremlerinin ardından Antakya kent merkezi", to: { category: "afet-ve-saha-arastirmalari" } },
  { file: "Wiki Training for New Media and Communication students 5 - 20241104.jpg", alt: "Bir eğitim seminerine katılan üniversite öğrencileri", to: { finding: "universiteli-genclerde-siyasi-bilinc" } },
  { file: "Mehmet Akif Ersoy University.jpg", alt: "Mehmet Akif Ersoy Üniversitesi kampüsünde öğrenciler", to: { category: "genclik-ve-universite" } },
  { file: "2. Meclis Binası.jpg", alt: "Ankara'daki İkinci Meclis Binası", to: { category: "siyaset-ve-kamuoyu" } },
  { file: "Grand Bazaar, Istanbul, by Rene Cortin.jpg", alt: "İstanbul Kapalıçarşı'da alışveriş yapan ziyaretçiler", to: { category: "ekonomi-ve-istihdam" } },
  { file: "People at Teknofest 2019.jpg", alt: "TEKNOFEST 2019'da ziyaretçiler", to: { category: "teknoloji-ve-medya" } },
  { file: "Bosphorus Bridge(15 July Martyrs Bridge), Istanbul, Turkey (Ank Kumar) 04.jpg", alt: "İstanbul Boğazı ve 15 Temmuz Şehitler Köprüsü", to: { category: "guvenlik-ve-jeopolitik" } },
  { file: "Istanbul Street (32597915).jpeg", alt: "İstanbul'da kalabalık bir cadde", to: { category: "sosyal-sorunlar" } },
  { file: "Wiki Training for New Media and Communication students 4 - 20241104.jpg", alt: "Sınıfta eğitime katılan öğrenciler", to: { category: "egitim-ve-bilim" } },
];

const clean = (h: string) =>
  h
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

async function info(file: string) {
  const u =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({ action: "query", format: "json", titles: "File:" + file, prop: "imageinfo", iiprop: "url|extmetadata|size", iiurlwidth: "1600", iiextmetadatafilter: "LicenseShortName|Artist" });
  const j = await (await fetch(u, { headers: { "user-agent": UA } })).json();
  const page = Object.values(j.query.pages)[0] as { imageinfo?: Record<string, unknown>[] };
  const i = page.imageinfo?.[0] as { thumburl: string; thumbwidth: number; thumbheight: number; descriptionurl: string; extmetadata: Record<string, { value: string }> } | undefined;
  if (!i) throw new Error("Bulunamadı: " + file);
  const lic = clean(i.extmetadata.LicenseShortName?.value || "");
  if (!/^(CC0|CC BY|Public domain|No restrictions)/i.test(lic) || /NC|ND/.test(lic)) throw new Error("Uygun olmayan lisans: " + file + " " + lic);
  const artist = clean(i.extmetadata.Artist?.value || "Bilinmiyor").slice(0, 120);
  return { url: i.thumburl, width: i.thumbwidth, height: i.thumbheight, source: i.descriptionurl, credit: `Fotoğraf: ${artist} · ${lic.replace(/^Public domain$/i, "Kamu malı").replace(/^No restrictions$/i, "Kısıtlama yok")} · Wikimedia Commons` };
}

async function main() {
  const home = await prisma.siteSetting.findUnique({ where: { key: "home" } });
  for (const p of PHOTOS) {
    const meta = await info(p.file);
    let m = await prisma.media.findFirst({ where: { sourceUrl: meta.source }, select: { id: true } });
    if (!m) {
      const res = await fetch(meta.url, { headers: { "user-agent": UA } });
      if (!res.ok) throw new Error("İndirilemedi: " + p.file + " " + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 4_000_000) throw new Error("Çok büyük: " + p.file);
      const mime = buf[0] === 0x89 ? "image/png" : "image/jpeg";
      m = await prisma.media.create({
        data: { filename: p.file.replace(/[^\p{L}\p{N}._ -]/gu, "").slice(0, 150), mime, size: buf.length, width: meta.width, height: meta.height, alt: p.alt, credit: meta.credit, sourceUrl: meta.source, data: buf },
        select: { id: true },
      });
      console.log("Eklendi:", p.alt, `(${Math.round(buf.length / 1024)} KB)`);
    }
    if (p.to.category) {
      const r = await prisma.category.updateMany({ where: { slug: p.to.category, coverId: null }, data: { coverId: m.id } });
      if (r.count) console.log("  → alan görseli:", p.to.category);
    }
    if (p.to.finding) {
      // Ham SQL: rapor verisinin "son düzenlenme" zamanını değiştirmemek için
      const n = await prisma.$executeRaw`UPDATE "Finding" SET "coverId" = ${m.id} WHERE slug = ${p.to.finding} AND "coverId" IS NULL`;
      if (n) console.log("  → rapor verisi görseli:", p.to.finding);
    }
    if (p.to.intro) {
      const v = (home?.value || {}) as Record<string, unknown>;
      if (home && !v.slideImageId) {
        await prisma.siteSetting.update({ where: { key: "home" }, data: { value: { ...v, slideImageId: m.id } } });
        console.log("  → manşet tanıtım görseli");
      }
    }
  }
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
