/**
 * MASKDER'in yayımladığı üç araştırma raporunu "Yayınlar ve Raporlar" bölümüne ekler.
 * Kapaklar raporların ilk sayfasından üretilmiştir (prisma/data/rapor-kapaklari); PDF'ler yayıncının (maskder.com) sitesindeki
 * özgün dosyalara bağlanır. Tekrar çalıştırılabilir: aynı adresli (slug) yayın varsa atlanır.
 * Kullanım: npx tsx prisma/publish-reports.ts
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

type Rapor = {
  slug: string;
  title: string;
  category: string;
  authors: string;
  publishedAt: string;
  pdfUrl: string;
  cover: string;
  coverAlt: string;
  summary: string;
  body: string;
};

const RAPORLAR: Rapor[] = [
  {
    slug: "yerel-yonetimde-beklentiler-ve-hizmetler-raporu",
    title: "Yerel Yönetimde Beklentiler ve Hizmetler; Yöneten ve Yönetilen Karşılaştırması Araştırması",
    category: "yerel-yonetimler-ve-kalkinma",
    authors: "MASKDER Araştırma Ekibi · Araştırma sorumlusu: Enes Çifçi",
    publishedAt: "2024-11-27T12:00:00+03:00",
    pdfUrl: "https://maskder.com/uploads/reports/yerel-yonetimler-27-11-2024-7a7d9f2b.pdf",
    cover: "yerel.jpg",
    coverAlt: "Yerel Yönetimde Beklentiler ve Hizmetler raporunun kapağı",
    summary:
      "Altı ilde 1.598 kişiyle yüz yüze yapılan saha araştırması; kentlilerin yerel yönetimlerden beklentilerini, belediye hizmetlerine ve yöneticilere ilişkin değerlendirmelerini, afet hazırlığı ve sivil katılım algılarını ortaya koyuyor.",
    body: `## Raporun kapsamı

Rapor, yerel yönetimlerin hizmet sunumunu yönetilenlerin (vatandaşların) gözünden değerlendirmekte; kentlilerin en önemli gördüğü sorunları, çözüm için başvurdukları kurumları, belediyeyle iletişim kanallarını ve yerel yönetimlere güveni incelemektedir.

## Yöntem

- **Saha çalışması:** 1 Mart 2024, 52 gönüllü saha araştırmacısı, 6 il ve 33 ilçe
- **Örneklem:** Küme örnekleme yöntemiyle 18 yaş ve üzeri **1.598** katılımcı (İstanbul %59,4 · Sakarya %18,9 · Bursa %10,7 · Bolu %5,1 · diğer iller %5,9)
- **Ölçme aracı:** 9 kategoride 40 sorudan oluşan yüz yüze anket (ortalama ~14 dakika)

## Öne çıkan bulgular

- Katılımcıların **%74,7**'si yaşadığı kentin deprem ve afetlere hazırlığını yetersiz buluyor; güvenli bir toplanma alanı bildiğini söyleyenlerin oranı yalnızca **%18,7**.
- En büyük kent sorunları birbirine çok yakın: sığınmacılar ve göçmenler (**%18,6**), afetlere karşı yetersiz önlemler (**%18,0**) ve çarpık kentleşme (**%16,1**).
- Kent sorunlarında ilk muhatap belediye: katılımcıların **%42,0**'si çözümü il veya ilçe belediyesinden bekliyor.
- Yerel yöneticileri sorunları çözmede “kesinlikle yetersiz” bulanlar **%32,5**, “kesinlikle yeterli” bulanlar **%7,5**.
- Kararlara sivil katılım olanaklarını yetersiz bulanların oranı **%63,9**.
- Belediyeye başvuruda dijital kanallar öne çıkıyor: internet **%36,2**, telefon **%30,4**.

Raporun grafiklerle özetlenmiş bulguları için [rapor verileri sayfasını](/bulgular/yerel-yonetimde-beklentiler-ve-hizmetler) inceleyebilirsiniz.

## Künye

MASKDER (Modern Araştırmalar ve Stratejik Kalkınma Derneği). (2024). *Yerel Yönetimde Beklentiler ve Hizmetler; Yöneten ve Yönetilen Karşılaştırması Araştırması.* MASKDER Yayınları 03. ISBN 978-625-94588-1-6. İstanbul: MASKDER.`,
  },
  {
    slug: "siyasi-bilinc-arastirmasi-raporu",
    title: "Siyasi Bilinç Araştırması Raporu",
    category: "genclik-ve-universite",
    authors: "MASKDER Araştırma Ekibi · Araştırma yöneticisi: Enes Çifçi",
    publishedAt: "2024-11-27T12:00:00+03:00",
    pdfUrl: "https://maskder.com/uploads/reports/siyasi-bilinc-arastirmasi-27-11-2024-0e8403d8.pdf",
    cover: "siyasi.jpg",
    coverAlt: "Siyasi Bilinç Araştırması Raporu'nun kapağı",
    summary:
      "Üniversiteli gençlerin siyasi bilinç düzeylerini ve politik tercihlerini şekillendiren etkenleri inceleyen araştırma; gençlerin bilgi kaynaklarını, öncelikli siyasi konularını, demokrasiye ve siyasetçilere bakışlarını siyasi yönelimlere göre karşılaştırıyor.",
    body: `## Raporun kapsamı

Araştırma, genç bireylerin siyasal bilinç düzeylerini ve politik tercihlerini şekillendiren unsurları; ekonomik durum, eğitim, medya ve sosyal çevrenin etkisini incelemektedir. Bulgular, katılımcıların siyasi yönelimlerine (milliyetçi, sosyalist, merkez sağ, cumhuriyetçi, liberal) göre ayrıca karşılaştırılmıştır.

## Yöntem

- **Veri toplama:** 30 Eylül 2024, yüz yüze anket
- **Örneklem:** İstanbul Medipol Üniversitesi'nde düzenlenen MASK MECLİS Simülasyonu katılımcıları; tam sayım
- **Ölçme aracı:** 11 kategoride 35 soru; analizler SPSS 27 ile yapılmıştır
- **Katılımcı profili:** Büyük çoğunluğu 18–24 yaş aralığında; %89'u üniversite öğrencisi

## Öne çıkan bulgular

- Gençlerin **%74**'ü siyasi görüşlerinin kendi araştırma ve okumalarıyla şekillendiğini söylüyor; okulun (%9,6) ve ailenin (%8,9) etkisi sınırlı.
- En önemli siyasi konu: iç politika (**%34,2**), dış politika (**%25,3**) ve ekonomi (**%23,3**).
- Demokrasiyi destekleyenlerin oranı **%72,6**; siyasilerin söylemlerine güvenmeyenlerin oranı **%67,8**.
- Gençlerin **%43,2**'si en çok ekonomi ve maliye politikalarında bilgi ve eğitim ihtiyacı duyuyor.
- Siyasi parti teşkilatlarında yer almayı önemli bulanlar **%45,9**; en büyük grup (**%35,6**) kararsız.
- Gençlerin değer profilinde işçi hakları (%91,8), vatanseverlik (%90,4) ve çevre koruma (%88,3) öne çıkıyor.

Raporun grafiklerle özetlenmiş bulguları için [rapor verileri sayfasını](/bulgular/universiteli-genclerde-siyasi-bilinc) inceleyebilirsiniz.

## Künye

MASKDER (Modern Araştırmalar ve Stratejik Kalkınma Derneği). (2024). *Siyasi Bilinç Araştırması Raporu.* MASKDER Yayınları 02. ISBN 978-625-94588-2-3. İstanbul: MASKDER.`,
  },
  {
    slug: "turkiyede-afet-krizi-yonetimi-ve-hatay-deprem-saha-arastirmasi-raporu",
    title: "Türkiye'de Afet Krizi Yönetimi ve Hatay İli Deprem Saha Araştırması Raporu",
    category: "afet-ve-saha-arastirmalari",
    authors: "MASKDER Araştırma Ekibi · Saha yöneticisi: Enes Çifçi",
    publishedAt: "2024-02-06T12:00:00+03:00",
    pdfUrl: "https://maskder.com/uploads/reports/maskder-turkiyede-afet-krizi-yonetimi-ve-hatay-ili-deprem-saha-arastirmasi-raporu-compressed-b3cd9dca.pdf",
    cover: "afet.jpg",
    coverAlt: "Türkiye'de Afet Krizi Yönetimi ve Hatay İli Deprem Saha Araştırması Raporu'nun kapağı",
    summary:
      "6 Şubat 2023 depremlerinin ardından Hatay'da yürütülen karma yöntemli saha araştırması; depremzedelerin arama kurtarma ve yardım dağıtımı süreçlerine ilişkin değerlendirmelerini ve sivil toplum kuruluşlarının afet bölgesindeki çalışmalarını inceliyor.",
    body: `## Raporun kapsamı

Araştırma, “Depremzedeler arama kurtarma ve yardım dağıtımı faaliyetlerini ne ölçüde yeterli buluyor?” sorusundan yola çıkmaktadır. Birinci aşamada depremzedelerle anket, ikinci aşamada bölgede faaliyet gösteren sivil toplum kuruluşlarının yöneticileriyle derinlemesine görüşmeler yapılmıştır.

## Yöntem

- **Desen:** Karma yöntem (nicel anket + nitel yarı yapılandırılmış mülakat ve saha gözlemi)
- **Saha:** Hatay (İBBS TR631)
- **Anket örneklemi:** Rastgele örneklemeyle **288** depremzede; yüz yüze, kâğıt-kalem anket (ortalama ~10 dakika)
- **Mülakatlar:** Amaçlı örneklemeyle seçilen STK yöneticileri; görüşmeler katılımcı izniyle kayda alınmış ve deşifre edilmiştir
- **Analiz:** Anket verileri SPSS ile frekans analizi; hata payı %95 güven düzeyinde ±%5,77

## Öne çıkan bulgular

- Depremzedelerin **%65,1**'i arama kurtarma ekiplerinin hızını “hiç yeterli değil” olarak değerlendirdi; iletişim (%54,7) ve koordinasyon (%48,1) da olumsuz değerlendirilen boyutlar arasında.
- Sahadaki görevli ve gönüllüler en olumlu değerlendirilen boyut: katılımcıların **%52,9**'u onları yeterli ya da çok yeterli buldu.
- Katılımcıların **%60,2**'si yardım dağıtım noktalarına doğru yönlendirilmediğini, **%49,1**'i yardımların ihtiyaçlarını karşılamadığını belirtti.
- Barınma en kritik eksik: her on depremzededen dördü (**%40**) çadır ihtiyacının karşılanmadığını söyledi.
- Yardımların **%93,3**'ü Türkiye'deki kuruluşlardan alındı; yabancı kuruluşlar ağırlıklı olarak sağlık ve tıbbi yardım alanında çalıştı.

Raporun grafiklerle özetlenmiş bulguları için [rapor verileri sayfasını](/bulgular/hatay-deprem-saha-arastirmasi) inceleyebilirsiniz.

## Künye

MASKDER (Modern Araştırmalar ve Stratejik Kalkınma Derneği). (2024). *Türkiye'de Afet Krizi Yönetimi ve Hatay İli Deprem Saha Araştırması Raporu.* MASKDER Yayınları 01. İstanbul: MASKDER.`,
  },
];

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" }, select: { id: true } });
  for (const r of RAPORLAR) {
    if (await prisma.publication.findUnique({ where: { slug: r.slug } })) {
      console.log("Zaten var, atlandı:", r.title);
      continue;
    }
    const cat = await prisma.category.findUnique({ where: { slug: r.category } });
    const buf = readFileSync(path.join(__dirname, "data", "rapor-kapaklari", r.cover));
    const cover = await prisma.media.create({
      data: { filename: `kapak-${r.cover}`, mime: "image/jpeg", size: buf.length, width: 990, height: 1400, alt: r.coverAlt, data: buf, uploadedById: admin?.id ?? null },
      select: { id: true },
    });
    await prisma.publication.create({
      data: {
        slug: r.slug,
        title: r.title,
        type: "rapor",
        summary: r.summary,
        body: r.body,
        authors: r.authors,
        categoryId: cat?.id ?? null,
        pdfUrl: r.pdfUrl,
        coverId: cover.id,
        published: true,
        publishedAt: new Date(r.publishedAt),
      },
    });
    console.log("Yayımlandı:", r.title, `(/yayinlar/${r.slug})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
