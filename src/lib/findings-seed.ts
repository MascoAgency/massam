/**
 * MASKDER raporlarından derlenen başlangıç verileri. Tüm değerler ilgili rapordaki tablolardan aynen alınmıştır.
 * Seed yalnızca eksik kayıtları ekler; yönetim panelinden yapılan düzenlemelerin üzerine yazmaz.
 */
import type { FindingChartKind } from "./findings";

type Item = [string, number];
const ch = (title: string, kind: FindingChartKind, items: Item[], insight: string, question = "") => ({
  title,
  question,
  kind,
  insight,
  items: items.map(([label, value]) => ({ label, value })),
});
const st = (value: string, label: string) => ({ value, label });

export const SEED_FINDINGS = [
  {
    slug: "yerel-yonetimde-beklentiler-ve-hizmetler",
    categorySlug: "yerel-yonetimler-ve-kalkinma",
    sortOrder: 1,
    title: "Yerel yönetimde beklentiler ve hizmetler",
    summary:
      "Altı ilde 1.598 kişiyle yüz yüze yapılan araştırmaya göre katılımcıların dörtte üçü yaşadığı kentin depreme ve afetlere hazır olmadığını düşünüyor. Sığınmacılar, afet önlemlerinin yetersizliği ve çarpık kentleşme en büyük kent sorunları olarak öne çıkıyor.",
    method:
      "Saha çalışması 52 gönüllü araştırmacıyla 6 il ve 33 ilçede yürütüldü. Küme örnekleme yöntemiyle 18 yaş ve üzeri 1.598 kişiyle yüz yüze görüşüldü; 9 kategoride 40 sorudan oluşan anket formu kullanıldı. Katılımcıların %59,4'ü İstanbul, %18,9'u Sakarya, %10,7'si Bursa, %5,1'i Bolu ve %5,9'u diğer illerde yaşıyor.",
    sourceTitle: "Yerel Yönetimde Beklentiler ve Hizmetler; Yöneten ve Yönetilen Karşılaştırması Araştırması",
    sourceUrl: "https://maskder.com/uploads/reports/yerel-yonetimler-27-11-2024-7a7d9f2b.pdf",
    sourceSeries: "MASKDER Yayınları 03",
    sourceYear: 2024,
    isbn: "978-625-94588-1-6",
    stats: [
      st("1.598", "Katılımcı · 6 il, 33 ilçe"),
      st("%74,7", "Kentinin afetlere hazırlığını yetersiz bulanlar"),
      st("%42", "Kent sorunlarının çözümünü belediyeden bekleyenler"),
      st("%18,7", "Güvenli bir toplanma alanı bildiğini söyleyenler"),
    ],
    charts: [
      ch(
        "Kentin en büyük sorunu",
        "bar",
        [
          ["Sığınmacılar ve göçmenler", 18.6],
          ["Deprem ve afetlere karşı yetersiz önlemler", 17.96],
          ["Çarpık kentleşme", 16.1],
          ["Ulaşım", 14.37],
          ["Barınma, gıda gibi temel ihtiyaçların pahalılığı", 11.61],
          ["Çevre ve doğa kirliliği", 9.36],
          ["Güvenlik", 3.4],
          ["Kültür-sanat faaliyetlerinin yetersizliği", 2.95],
        ],
        "İlk üç sorun birbirine çok yakın: sığınmacılar (%18,6), afet önlemlerinin yetersizliği (%18,0) ve çarpık kentleşme (%16,1) katılımcıların yarısından fazlasının birinci önceliği. Grafikte %2,5'in altındaki seçenekler gösterilmemiştir.",
        "Yaşadığınız kentin en büyük sorunu nedir?",
      ),
      ch(
        "Kent deprem ve afetlere hazır mı?",
        "pie",
        [
          ["Kesinlikle yetersiz", 41.1],
          ["Yetersiz", 33.61],
          ["Emin değilim", 16.07],
          ["Yeterli", 7.43],
          ["Kesinlikle yeterli", 1.73],
        ],
        "Kentinin afet hazırlığını yeterli bulanların oranı yalnızca %9,2.",
      ),
      ch(
        "Güvenli toplanma alanı ya da sığınak biliniyor mu?",
        "waffle",
        [
          ["Evet", 18.65],
          ["Hayır", 42.45],
          ["Bilmiyorum / emin değilim", 38.9],
        ],
        "Her beş kişiden dördü, afet anında gidebileceği güvenli bir toplanma noktası bildiğini söyleyemiyor.",
      ),
      ch(
        "Kent sorunlarını hangi kurum çözmeli?",
        "bar",
        [
          ["İl / ilçe belediyesi", 41.99],
          ["Cumhurbaşkanlığı", 24.79],
          ["Bakanlıklar", 10.45],
          ["TBMM", 7.46],
          ["Valilik", 7.2],
          ["Sivil toplum kuruluşları", 4.35],
          ["Kaymakamlık", 3.76],
        ],
        "Kent sorunlarında ilk muhatap yerel yönetim: her beş kişiden ikisi çözümü belediyeden bekliyor.",
      ),
      ch(
        "Yerel yöneticiler sorunları çözmede yeterli mi?",
        "diverging",
        [
          ["Kesinlikle yetersiz", 32.46],
          ["Bazen yetersiz", 16.07],
          ["Emin değilim", 17.92],
          ["Kısmen yeterli", 26.08],
          ["Kesinlikle yeterli", 7.46],
        ],
        "Yöneticileri kesinlikle yeterli bulanlar %7,5'te kalırken kesinlikle yetersiz bulanlar %32,5.",
      ),
      ch(
        "Kentte güvenlik hissi",
        "bar",
        [
          ["Evet, kesinlikle güvende hissediyorum", 19.03],
          ["Güvende ama endişeli", 32.59],
          ["Bazen güvende hissetmiyorum", 20.94],
          ["Genellikle güvende hissetmiyorum", 16.23],
          ["Hiç güvende hissetmiyorum", 11.2],
        ],
        "Kendini kesinlikle güvende hisseden yalnızca beş kişiden biri; en büyük grup “güvende ama endişeli”.",
      ),
      ch(
        "Belediyeye ulaşma kanalı",
        "pie",
        [
          ["İnternet", 36.23],
          ["Telefon", 30.37],
          ["Yüz yüze", 13.64],
          ["Beyaz masa", 11.13],
          ["Tanıdık aracılığıyla", 8.63],
        ],
        "Dijital kanallar öne çıkıyor: başvuruların üçte birinden fazlası internet üzerinden yapılıyor.",
      ),
      ch(
        "Yönetime sivil katılım olanakları",
        "diverging",
        [
          ["Çok yetersiz", 25.78],
          ["Yetersiz", 38.1],
          ["Emin değilim", 24.83],
          ["Yeterli", 9.14],
          ["Çok yeterli", 2.18],
        ],
        "Kentlilerin yerel karar süreçlerine katılım olanaklarını yetersiz bulanların oranı %63,9.",
      ),
    ],
    body:
      "Araştırma, kentlilerin önceliklerinin afet güvenliği ve plansız kentleşme etrafında yoğunlaştığını gösteriyor. Afet hazırlığını yetersiz bulanların yüksek oranı ile güvenli toplanma alanlarının bilinmemesi birlikte değerlendirildiğinde, **afet bilinçlendirmesi ve toplanma alanlarının duyurulması** yerel yönetimler için öncelikli bir iletişim alanı olarak öne çıkıyor.\n\nKatılımcıların kent sorunlarında ilk olarak belediyeyi muhatap alması, buna karşın yöneticileri ve sivil katılım olanaklarını büyük ölçüde yetersiz bulması; yerel yönetimlerden beklentinin yüksek, memnuniyetin ise sınırlı olduğuna işaret ediyor.",
  },
  {
    slug: "universiteli-genclerde-siyasi-bilinc",
    categorySlug: "genclik-ve-universite",
    sortOrder: 2,
    title: "Üniversiteli gençlerde siyasi bilinç",
    summary:
      "MASK Meclis Simülasyonu'na katılan gençlerle yapılan araştırmada gençlerin dörtte üçü siyasi görüşlerinin kendi araştırma ve okumalarıyla şekillendiğini söylüyor. Gençler demokrasiyi güçlü biçimde desteklerken siyasetçilerin söylemlerine güven düşük.",
    method:
      "Araştırma 30 Eylül 2024'te İstanbul Medipol Üniversitesi'nde düzenlenen MASK MECLİS Simülasyonu programının katılımcılarıyla tam sayım yoluyla, yüz yüze anket yöntemiyle yapıldı. 11 kategoride 35 soruluk form kullanıldı; veriler SPSS 27 ile analiz edildi. Katılımcıların büyük çoğunluğu 18-24 yaş aralığında ve %89'u üniversite öğrencisi. Sonuçlar program katılımcılarının görüşlerini yansıtır; tüm gençliği temsil etmez.",
    sourceTitle: "Siyasi Bilinç Araştırması Raporu",
    sourceUrl: "https://maskder.com/uploads/reports/siyasi-bilinc-arastirmasi-27-11-2024-0e8403d8.pdf",
    sourceSeries: "MASKDER Yayınları 02",
    sourceYear: 2024,
    isbn: "978-625-94588-2-3",
    stats: [
      st("%74", "Siyasi görüşünü kendi araştırma ve okumalarıyla oluşturanlar"),
      st("%72,6", "Demokrasiyi destekleyenler"),
      st("%67,8", "Siyasilerin söylemlerine güvenmeyenler"),
      st("%43,2", "Ekonomi politikalarında daha fazla bilgiye ihtiyaç duyanlar"),
    ],
    charts: [
      ch(
        "Siyasi görüşler nasıl şekilleniyor?",
        "lollipop",
        [
          ["Kendi araştırmalarım ve okumalarım", 74.0],
          ["Okul veya üniversite eğitimim", 9.6],
          ["Ailemden etkilendim", 8.9],
          ["Toplumsal olaylar ve protestolar", 6.2],
          ["Ekonomik deneyimlerim", 1.4],
        ],
        "Aile ve okulun etkisi birlikte %20'nin altında kalıyor; gençler siyasi görüşlerini büyük ölçüde kendi okumalarıyla oluşturduğunu düşünüyor.",
        "Siyasi görüşleriniz nasıl şekillendi?",
      ),
      ch(
        "Gençler için en önemli siyasi konu",
        "bar",
        [
          ["İç politika", 34.2],
          ["Dış politika", 25.3],
          ["Ekonomi", 23.3],
          ["Güvenlik", 11.6],
          ["Sağlık", 4.8],
          ["Tarım", 0.7],
        ],
        "Gençlerin gündeminde iç ve dış politika ilk sırada; ekonomi %23,3 ile üçüncü.",
        "Hangi siyasi konu sizin için daha önemlidir?",
      ),
      ch(
        "Demokrasiye destek",
        "pie",
        [
          ["Kesinlikle evet", 32.9],
          ["Evet", 39.7],
          ["Kararsızım", 17.8],
          ["Hayır", 6.8],
          ["Kesinlikle hayır", 2.7],
        ],
        "Her dört gençten yaklaşık üçü demokrasiyi destekliyor; karşı çıkanlar %9,5.",
        "Demokrasiyi destekliyor musunuz?",
      ),
      ch(
        "Siyasilerin söylemlerine güven",
        "diverging",
        [
          ["Hiç güvenmiyorum", 28.8],
          ["Güvenmiyorum", 39.0],
          ["Emin değilim", 19.2],
          ["Güveniyorum", 10.3],
          ["Çok güveniyorum", 2.7],
        ],
        "Siyasilerin söylemlerine güvenen gençlerin oranı yalnızca %13.",
        "Siyasilerin söylemlerine ne kadar güveniyorsunuz?",
      ),
      ch(
        "Daha fazla bilgi ve eğitim istenen konular",
        "bar",
        [
          ["Ekonomik ve mali politikalar", 43.2],
          ["Dış politika ve uluslararası ilişkiler", 23.3],
          ["Eğitim sistemi ve eğitim politikaları", 16.4],
          ["Sağlık politikaları ve sağlık hizmetleri", 11.0],
          ["Göç ve göçmenlik politikaları", 6.2],
        ],
        "Ekonomi ve maliye, gençlerin en çok bilgi açığı hissettiği alan; her on gençten dördü bu konuda eğitim ihtiyacı duyuyor.",
        "Hangi siyasi konularda daha fazla bilgiye veya eğitime ihtiyaç duyuyorsunuz?",
      ),
      ch(
        "Siyasi parti teşkilatlarına katılımın önemi",
        "diverging",
        [
          ["Hiç önemli değil", 7.5],
          ["Önemli değil", 11.0],
          ["Emin değilim", 35.6],
          ["Önemli", 30.1],
          ["Çok önemli", 15.8],
        ],
        "Gençlerin %45,9'u parti teşkilatlarında yer almayı önemli buluyor; ancak en büyük grup (%35,6) kararsız.",
        "Siyasi parti teşkilatlarına katılım sizce önemli midir?",
      ),
      ch(
        "Gençlerin değer profili",
        "radar",
        [
          ["Demokrasi", 72.6],
          ["Çevre koruma", 88.3],
          ["İşçi hakları", 91.8],
          ["Özel mülkiyet", 87.0],
          ["Vatanseverlik", 90.4],
          ["Seferberlik", 85.6],
        ],
        "Gençler işçi hakları, vatanseverlik ve çevre korumayı %88'in üzerinde önemsiyor; demokrasiye destek %72,6 ile profildeki en düşük değer.",
        "Her eksen “destekliyorum / önemli” yanıtlarının toplamıdır.",
      ),
      ch(
        "Sığınmacılar hakkındaki görüşler",
        "column",
        [
          ["Çok olumsuz", 50.0],
          ["Olumsuz", 24.0],
          ["Emin değilim", 20.5],
          ["Olumlu", 4.1],
          ["Çok olumlu", 1.4],
        ],
        "Görüşler ağırlıklı olarak olumsuz (%74). Bu bulgu, yerel yönetimler araştırmasında sığınmacıların en büyük kent sorunu olarak öne çıkmasıyla örtüşüyor.",
        "Ülkemizde bulunan sığınmacılar hakkında görüşleriniz nedir?",
      ),
    ],
    body:
      "Bulgular, siyasete ilgi duyan üniversiteli gençlerin bilgiye kendi kaynaklarıyla ulaşmayı tercih ettiğini ve demokratik değerlere güçlü bir bağlılık taşıdığını gösteriyor. Buna karşın siyasetçilerin söylemlerine güvenin düşük olması ve parti teşkilatlarına katılım konusundaki kararsızlık, **gençlerin siyasal katılımını güçlendirecek güvenilir ve açık iletişim kanallarına** ihtiyaç olduğuna işaret ediyor.\n\nEkonomi ve maliye politikalarında belirgin bir bilgi ihtiyacı bulunması, gençlere yönelik eğitim ve simülasyon programlarında bu alana öncelik verilebileceğini düşündürüyor.",
  },
  {
    slug: "hatay-deprem-saha-arastirmasi",
    categorySlug: "afet-ve-saha-arastirmalari",
    sortOrder: 3,
    title: "Hatay deprem saha araştırması: arama kurtarma ve yardım dağıtımı",
    summary:
      "6 Şubat 2023 depremlerinin ardından Hatay'da 288 depremzedeyle yapılan anket ve sivil toplum kuruluşu yöneticileriyle yapılan görüşmeler; depremzedelerin arama kurtarma hızını ve koordinasyonu büyük ölçüde yetersiz bulduğunu, sahadaki görevli ve gönüllüleri ise daha olumlu değerlendirdiğini gösteriyor.",
    method:
      "Araştırma karma yöntemle Hatay'da (İBBS TR631) yürütüldü. Rastgele örneklemeyle seçilen 288 depremzedeyle yüz yüze, kâğıt-kalem anket yapıldı (ortalama 10 dakika); amaçlı örneklemeyle seçilen sivil toplum kuruluşu yöneticileriyle yarı yapılandırılmış mülakatlar ve saha gözlemleri gerçekleştirildi. Anket verileri SPSS ile frekans analiziyle incelendi; hata payı %95 güven düzeyinde ±%5,77.",
    sourceTitle: "Türkiye'de Afet Krizi Yönetimi ve Hatay İli Deprem Saha Araştırması Raporu",
    sourceUrl: "https://maskder.com/yayinlar/arastirma-raporlari/turkiyede-afet-krizi-yonetim-ve-hatay-ili-deprem-saha-arastirmasi-raporu/",
    sourceSeries: "MASKDER Yayınları 01",
    sourceYear: 2024,
    isbn: "",
    stats: [
      st("288", "Depremzedeyle yüz yüze anket"),
      st("%65,1", "Arama kurtarma hızını “hiç yeterli değil” bulanlar"),
      st("%60,2", "Yardım noktalarına doğru yönlendirilmediğini söyleyenler"),
      st("%40", "Karşılanmayan ihtiyaç olarak çadırı gösterenler"),
    ],
    charts: [
      ch(
        "Arama kurtarma süreçlerini “hiç yeterli değil” bulanlar",
        "bar",
        [
          ["Ekiplerin hızı", 65.12],
          ["Ekiplerin iletişimi", 54.68],
          ["Koordinasyon", 48.12],
          ["Güvenlik ve teknik önlemler", 42.8],
          ["İhtiyaçların karşılanması", 42.65],
          ["Görevli ve gönüllüler", 24.26],
        ],
        "En olumsuz değerlendirilen boyut ekiplerin bölgeye ulaşma hızı. Görevli ve gönüllüler ise en olumlu değerlendirilen boyut: katılımcıların %52,9'u onları yeterli ya da çok yeterli buldu.",
      ),
      ch(
        "Arama kurtarma ekiplerinin hızı",
        "column",
        [
          ["Hiç yeterli değil", 65.12],
          ["Biraz yeterli", 15.66],
          ["Nötr", 4.27],
          ["Yeterli", 9.96],
          ["Çok yeterli", 4.96],
        ],
        "Depremzedelerin üçte ikisi ekiplerin hızını hiç yeterli bulmadı. Yıkımın 11 ili kapsaması, Hatay'a çevre illerden desteğin gecikmesinde etkili oldu.",
        "Arama kurtarma ekiplerinin hızı sizce yeterli miydi?",
      ),
      ch(
        "Görevli ve gönüllülerin değerlendirilmesi",
        "pie",
        [
          ["Çok yeterli", 29.04],
          ["Yeterli", 23.9],
          ["Nötr", 13.97],
          ["Biraz yeterli", 8.82],
          ["Hiç yeterli değil", 24.26],
        ],
        "Hız ve iletişimden memnun olmayan depremzedeler bile sahadaki görevli ve gönüllüleri çoğunlukla olumlu değerlendirdi.",
        "Arama kurtarma faaliyetlerinde yer alan kuruluşların görevlileri ve gönüllüleri sizce nasıldı?",
      ),
      ch(
        "Karşılanmayan ihtiyaçlar",
        "treemap",
        [
          ["Çadır", 40],
          ["Battaniye / giysi", 22.67],
          ["Diğer", 20.89],
          ["İlaç", 6.67],
          ["Su", 6.22],
          ["Yiyecek", 3.56],
        ],
        "Çadır, karşılanmayan ihtiyaçlar arasında açık ara ilk sırada; battaniye ve giysi %22,7 ile ikinci.",
        "Halihazırda hangi yardımlara ihtiyacınız karşılanmadı?",
      ),
      ch(
        "Çadır ihtiyacı karşılanmayan depremzedeler",
        "people",
        [["Çadır ihtiyacı karşılanmadı", 40]],
        "Barınma en kritik eksik: her on depremzededen dördü çadır ihtiyacının karşılanmadığını belirtti.",
      ),
      ch(
        "Yardım dağıtımı hakkında genel görüş",
        "diverging",
        [
          ["Çok yetersiz", 25.8],
          ["Yetersiz", 19.43],
          ["Ne yetersiz ne yeterli", 16.61],
          ["Yeterli", 20.14],
          ["Çok yeterli", 18.02],
        ],
        "Görüşler bölünmüş: %45,2 yetersiz, %38,2 yeterli. Farklı bölgelerde farklı kuruluşlardan yardım alınması bu dağılımı açıklayan etkenlerden biri.",
        "Deprem sonrasında yardım dağıtımı hakkında genel olarak ne düşünüyorsunuz?",
      ),
      ch(
        "Dağıtım noktalarına doğru yönlendirme yapıldı mı?",
        "pie",
        [
          ["Evet", 22.22],
          ["Kısmen", 17.56],
          ["Hayır", 60.22],
        ],
        "Yönlendirmedeki aksaklıklar, depremzedelerin ihtiyaç duyduğu malzemelere ulaşmasını zorlaştırdı.",
        "Yardım malzemeleri dağıtım noktaları hakkında doğru yönlendirme yapıldı mı?",
      ),
      ch(
        "Yardımlar ihtiyaçları karşıladı mı?",
        "pie",
        [
          ["Evet", 22.22],
          ["Kısmen", 28.67],
          ["Hayır", 49.1],
        ],
        "Kişisel hijyen malzemeleri, mutfak eşyaları ve kronik hastalıklar için ilaç tedarikinde sorunlar gözlendi.",
        "Yardım malzemelerinin türlerinin ve miktarlarının ihtiyaçlarınızı karşıladığını düşünüyor musunuz?",
      ),
    ],
    body:
      "Saha bulguları, afetin ilk saatlerinde ulaşım ve iletişim altyapısındaki hasarın arama kurtarma hızını doğrudan etkilediğini; farklı kamu kurumları, sivil toplum kuruluşları ve gönüllü ekipler arasındaki koordinasyonun da en zayıf halkalardan biri olduğunu gösteriyor. Buna karşın depremzedelerin sahadaki görevli ve gönüllülerle kurduğu ilişki çoğunlukla olumlu.\n\nYardım dağıtımında ise **barınma ihtiyacı, doğru yönlendirme ve standartlaştırılmış yardım malzemesi** öne çıkan sorun alanları. Katılımcıların %93,3'ü yardımı Türkiye'deki kuruluşlardan aldığını belirtti; yabancı kuruluşların ağırlıklı olarak sağlık ve tıbbi yardım alanında çalıştığı gözlendi.",
  },
];
