// Bu dosya seed betiği tarafından da kullanılır; "server-only" içermemelidir.
import type { HomeContent, PagesContent, Question } from "./types";
import { blankQuestion } from "./survey";

export const DEFAULT_PLANS = [
  { id: "free", name: "Ücretsiz", priceTry: 0, sortOrder: 0, note: "Bireysel denemeler ve küçük çalışmalar", limitSurveys: 3, limitResponses: 100, limitAi: 3, limitPdf: 2, retentionMonths: 6 },
  { id: "pro", name: "Profesyonel", priceTry: 499, sortOrder: 1, note: "Araştırmacılar, öğrenci toplulukları, tez çalışmaları", limitSurveys: 50, limitResponses: 2000, limitAi: 40, limitPdf: 40, retentionMonths: 24 },
  { id: "corp", name: "Kurumsal", priceTry: 1999, sortOrder: 2, note: "Dernekler, kurumlar, belediyeler, düşünce kuruluşları", limitSurveys: -1, limitResponses: -1, limitAi: 300, limitPdf: 300, retentionMonths: 60 },
];

export const DEFAULT_HOME: HomeContent = {
  heroTitle: "Toplumu Anla, Veriyi Keşfet, Geleceği Birlikte Şekillendir.",
  heroText:
    "MASSAM araştırmalarıyla toplumsal eğilimleri keşfedin, görüşlerinizi paylaşın ve Türkiye’nin geleceğine ilişkin araştırmalara katkıda bulunun.",
  announcement: "",
  featured: [],
};

/** Hakkında ve MASKDER sayfalarının varsayılan metinleri (Yönetim → Site içeriği bölümünden düzenlenir) */
export const DEFAULT_PAGES: PagesContent = {
  aboutLead: "Araştırmayı herkes için erişilebilir, şeffaf ve güvenilir kılmak için çalışıyoruz.",
  aboutBody: [
    "MASSAM Araştırma, derneğimizin bilgi üretme çalışmalarını tek bir çatı altında topladığı araştırma platformudur. Toplumun, gençlerin ve karar vericilerin gündemindeki sorulara yanıt arayan anketler tasarlıyor, bu anketleri geniş katılımcı kitlelerine ulaştırıyor ve elde edilen verileri bilimsel yöntemlerle değerlendiriyoruz.",
    "Çalışmalarımız uluslararası ilişkiler, siyaset bilimi ve kamu yönetimi alanlarına odaklanır. Dış politika algısından siyasal katılıma, yerel yönetim hizmetlerinden eğitim ihtiyaçlarına kadar farklı konularda veri topluyor; sonuçları grafikler, istatistiksel özetler ve yorumlarla destekleyerek raporlaştırıyoruz.",
    "Katılımcı gizliliği çalışmalarımızın temelidir. Anketlerimize e-posta adresi doğrulanmış üyelikle katılabilirsiniz; yanıtlarınız kimliğinizle eşleştirilmeden saklanır, kişisel verileriniz 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında korunur ve yanıtlar yalnızca toplu olarak, istatistiksel amaçla değerlendirilir.",
    "Araştırmalarımız tamamlandığında bulguları Raporlar sayfasında yayımlıyoruz. Böylece katılımcılarımız, akademisyenler, öğrenciler ve kamuoyu, katkı verdikleri çalışmaların sonuçlarına doğrudan ulaşabiliyor.",
  ].join("\n\n"),
  maskderLead: "MASKDER, düşünceyi bilgiyle, bilgiyi eğitimle buluşturan bir sivil toplum kuruluşudur.",
  maskderBody: [
    "MASKDER; uluslararası ilişkiler, siyaset bilimi ve kamu yönetimi alanlarında genç araştırmacıların, öğrencilerin ve meslek mensuplarının gelişimine katkı sunmak amacıyla çalışan bir dernektir.",
    "Derneğimiz, MASK Akademi çatısı altında düzenlediği eğitim programları, seminerler ve atölyelerle akademik bilgi birikimini toplumla buluşturur; araştırma, yazım ve analiz becerilerinin gelişmesini destekler.",
    "MASSAM Araştırma platformu, bu çalışmaların veri ayağını oluşturur. Eğitim programlarımızın planlanmasından kamuoyu araştırmalarına kadar tüm çalışmalarımızda katılımcılarımızın görüşlerini sistemli biçimde topluyor ve değerlendiriyoruz.",
  ].join("\n\n"),
  maskderUrl: "https://maskder.com",
};

/** Örnek araştırma: soru seti ve gerçekçi dağılımlı sentetik yanıtlar */
export function exampleSurvey(n = 64) {
  const q = (type: Question["type"], title: string, extra: Partial<Question> = {}): Question =>
    Object.assign(blankQuestion(type), { title, required: type !== "open" }, extra);
  const qs: Question[] = [
    q("single", "Eğitim durumunuz nedir?", { options: ["Lise", "Lisans öğrencisi", "Lisans mezunu", "Yüksek lisans / doktora"] }),
    q("multi", "Hangi alanlarda eğitim almak istersiniz?", { options: ["Uluslararası İlişkiler", "Siyaset Bilimi", "Kamu Yönetimi", "Araştırma Yöntemleri", "Akademik Yazım"] }),
    q("likert", "Bu alanlarda yeterli eğitim imkânına sahip olduğumu düşünüyorum."),
    q("likert", "Çevrim içi eğitimler yüz yüze eğitimler kadar verimlidir."),
    q("rating", "MASK Akademi'yi bir arkadaşınıza tavsiye etme olasılığınız nedir?", { max: 10, minLabel: "Hiç olası değil", maxLabel: "Çok olası" }),
    q("single", "Hangi eğitim formatını tercih edersiniz?", { options: ["Yüz yüze", "Çevrim içi", "Hibrit"] }),
    q("open", "Eğitim programından beklentileriniz nelerdir?"),
  ];
  qs.forEach((x, i) => (x.id = "q" + (i + 1) + Math.random().toString(36).slice(2, 6)));
  const texts = [
    "Akademik yazım ve makale yazma konusunda uygulamalı atölyeler bekliyorum.",
    "Türk dış politikası üzerine güncel vaka analizleri yapılmasını isterim.",
    "Kamu yönetiminde dijital dönüşüm ve e-devlet konularını öğrenmek istiyorum.",
    "Uzman konuşmacılarla soru-cevap imkânı olmalı.",
    "Sertifika verilmesi ve kariyer açısından katkı sağlaması önemli.",
    "Diplomasi ve müzakere simülasyonları çok faydalı olur.",
    "Araştırma yöntemleri ve anket tasarımı konusunda pratik bilgi istiyorum.",
    "Eğitimlerin kayıtlarına sonradan erişebilmek isterim.",
    "Seçim sistemleri ve karşılaştırmalı siyaset konularına ilgi duyuyorum.",
    "Mentorluk programı olursa çok iyi olur.",
    "Okuma listeleri ve kaynak önerileri paylaşılmalı.",
    "Politika notu yazımı öğrenmek istiyorum.",
    "Haftasonu yoğun programlar benim için daha uygun.",
    "Yerel yönetimler ve belediyecilik üzerine saha ziyaretleri yapılabilir.",
  ];
  const pick = <T,>(arr: T[], w: number[]) => {
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < arr.length; i++) {
      r -= w[i];
      if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
  };
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, Math.round(v)));
  const responses = Array.from({ length: n }, () => {
    const edu = pick(qs[0].options!, [8, 30, 16, 10]);
    const fmt = pick(qs[5].options!, [24, 18, 22]);
    const online =
      fmt === "Çevrim içi" ? clamp(3.9 + Math.random() * 1.4 - 0.4, 1, 5) : fmt === "Yüz yüze" ? clamp(2.1 + Math.random() * 1.6 - 0.5, 1, 5) : clamp(3 + Math.random() * 1.8 - 0.8, 1, 5);
    const enough = clamp((edu === "Lisans öğrencisi" ? 2.1 : 2.8) + Math.random() * 2 - 1, 1, 5);
    const nps = clamp(6 + (5 - enough) * 0.5 + Math.random() * 3 - 1, 1, 10);
    const ints = qs[1].options!.filter((_, k) => Math.random() < [0.55, 0.45, 0.38, 0.5, 0.42][k]);
    if (!ints.length) ints.push(qs[1].options![0]);
    const answers: Record<string, string | string[] | number> = {
      [qs[0].id]: edu,
      [qs[1].id]: ints,
      [qs[2].id]: enough,
      [qs[3].id]: online,
      [qs[4].id]: nps,
      [qs[5].id]: fmt,
    };
    if (Math.random() < 0.7) answers[qs[6].id] = texts[Math.floor(Math.random() * texts.length)];
    const at = Date.now() - Math.random() * 11 * 86400000;
    const dur = Math.round(120 + Math.random() * 300);
    return { answers, startedAt: new Date(at - dur * 1000), submittedAt: new Date(at), durationSec: dur, source: "ornek" };
  });
  return {
    survey: {
      title: "Örnek: MASK Akademi Eğitim İhtiyaç Analizi",
      description: "Bu bir örnek araştırmadır. Yanıtlar platformu tanıtmak için otomatik üretilmiştir; gerçek katılımcı verisi değildir.",
      thankYou: "Katılımınız için teşekkür ederiz.",
      questions: qs,
    },
    responses,
  };
}

/** Sekiz ana araştırma alanı (Yönetim → Araştırma alanları bölümünden düzenlenir, yenileri eklenebilir) */
export const DEFAULT_CATEGORIES = [
  {
    slug: "siyaset-ve-kamuoyu",
    name: "Siyaset ve Kamuoyu Araştırmaları",
    icon: "vote",
    description: "Siyasal eğilimleri, kurumlara duyulan güveni ve toplumun siyasi gündeme ilişkin beklentilerini ölçen araştırmalar.",
    topics: ["Siyasi eğilimler ve seçmen davranışları", "Kamu kurumlarına ve siyasal yapılara güven", "Yerel yönetimler ve kamuoyu algısı", "Siyasi gündem ve toplumsal beklentiler"],
  },
  {
    slug: "genclik-ve-universite",
    name: "Gençlik ve Üniversite Araştırmaları",
    icon: "users",
    description: "Gençlerin ve üniversite öğrencilerinin beklentilerini, sorunlarını ve geleceğe bakışlarını anlamaya yönelik araştırmalar.",
    topics: ["Gençlerin beklenti ve sorunları", "Üniversite yaşamı ve eğitim memnuniyeti", "Barınma, burs ve geçim koşulları", "Kariyer, istihdam ve gelecek beklentileri"],
  },
  {
    slug: "sosyal-sorunlar",
    name: "Sosyal Sorunlar ve Toplumsal Eğilimler",
    icon: "heart",
    description: "Yaşam koşullarını, toplumsal ilişkileri ve değişen değerleri inceleyen sosyal araştırmalar.",
    topics: ["Hayat pahalılığı ve yaşam memnuniyeti", "Aile, toplumsal güven ve sosyal ilişkiler", "Bağımlılık ve sosyal riskler", "Sosyal adalet ve toplumsal değişim"],
  },
  {
    slug: "ekonomi-ve-istihdam",
    name: "Ekonomi ve İstihdam Araştırmaları",
    icon: "coin",
    description: "Ekonomik algıyı, çalışma hayatını ve gelir beklentilerini ölçen araştırmalar.",
    topics: ["İşsizlik ve ücret beklentileri", "Tüketici güveni ve ekonomik algı", "Girişimcilik ve çalışma hayatı", "Meslek tercihleri ve gelir beklentileri"],
  },
  {
    slug: "guvenlik-ve-jeopolitik",
    name: "Güvenlik ve Jeopolitik Araştırmalar",
    icon: "shield",
    description: "Güvenlik algısını, dış politikaya bakışı ve bölgesel gelişmelere ilişkin kamuoyu eğilimlerini inceleyen araştırmalar.",
    topics: ["Ulusal güvenlik algısı", "Dış politika ve uluslararası ilişkiler", "Göç ve bölgesel gelişmeler", "Savunma ve siber güvenlik"],
  },
  {
    slug: "egitim-ve-bilim",
    name: "Eğitim ve Bilim Araştırmaları",
    icon: "book",
    description: "Eğitim sistemini, eğitim politikalarını ve bilimsel üretimi değerlendiren araştırmalar.",
    topics: ["Eğitim sistemi ve eğitim politikaları", "Öğrenci ve öğretmen memnuniyeti", "Akademik gelişim ve bilimsel üretim", "Eğitimde fırsat eşitliği"],
  },
  {
    slug: "teknoloji-ve-medya",
    name: "Teknoloji, Dijital Algı ve Medya Araştırmaları",
    icon: "cpu",
    description: "Teknoloji kullanımını, dijital alışkanlıkları ve medya tüketimini inceleyen araştırmalar.",
    topics: ["Yapay zekâ ve teknoloji kullanımı", "Sosyal medya ve dijital alışkanlıklar", "Dezenformasyon ve dijital okuryazarlık", "Medya tüketimi ve dijital itibar"],
  },
  {
    slug: "yerel-yonetimler-ve-kalkinma",
    name: "Yerel Yönetimler ve Bölgesel Kalkınma",
    icon: "building",
    description: "Şehir yaşamını, belediye hizmetlerini ve bölgesel ihtiyaçları değerlendiren araştırmalar.",
    topics: ["Belediye hizmetleri ve şehir memnuniyeti", "Ulaşım, altyapı ve konut sorunları", "Afet hazırlığı ve şehir güvenliği", "Bölgesel ihtiyaçlar ve kalkınma"],
  },
  {
    slug: "afet-ve-saha-arastirmalari",
    name: "Afet ve Saha Araştırmaları",
    icon: "alert",
    description: "Afet bölgelerinde yürütülen saha çalışmaları; arama kurtarma, yardım dağıtımı ve sivil toplumun kriz yönetimindeki rolünü inceleyen araştırmalar.",
    topics: ["Afet sonrası arama kurtarma faaliyetleri", "Yardım dağıtımı ve ihtiyaçların karşılanması", "Sivil toplum kuruluşlarının afet bölgesindeki çalışmaları", "Afet hazırlığı ve risk yönetimi"],
  },
];

export const PUBLICATION_TYPES: Record<string, string> = {
  rapor: "Araştırma raporu",
  kamuoyu: "Kamuoyu araştırması",
  politika: "Politika notu",
  veri: "Veri analizi",
  akademik: "Akademik değerlendirme",
  dosya: "Özel araştırma dosyası",
};

/** Katılım öncesi varsayılan bilgilendirme ve onay metni (anket düzenleyicide tek tıkla eklenir) */
export const DEFAULT_CONSENT =
  "Bu anket MASKDER tarafından bilimsel araştırma amacıyla yürütülmektedir. Katılım gönüllülük esasına dayanır; dilediğiniz soruyu boş bırakabilir veya anketi istediğiniz an sonlandırabilirsiniz. Anket sırasında adınız, e-posta adresiniz gibi kimliğinizi belirleyecek bilgiler istenmez. Yanıtlarınız 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında korunur, yalnızca toplu olarak ve istatistiksel amaçla değerlendirilir; üçüncü kişilerle bireysel olarak paylaşılmaz.";

/** Sonuç sayfalarında yöntem alanı boş bırakılırsa gösterilen varsayılan sınırlılık metni */
export const DEFAULT_LIMITATIONS =
  "Bu araştırma, gönüllü katılıma dayalı çevrim içi anket yöntemiyle yürütülmüştür. Katılımcılar olasılığa dayalı bir örneklemle seçilmediğinden sonuçlar Türkiye genelini temsil etmez; yalnızca araştırmaya katılan kişilerin görüşlerini yansıtır. Bulgular bu sınırlılık göz önünde bulundurularak yorumlanmalıdır.";

export const DEFAULT_CONTACT: import("./types").ContactContent = {
  footerAbout:
    "MASSAM Araştırma; siyaset, toplum, ekonomi, güvenlik, eğitim, teknoloji ve yerel yönetimler alanlarında bilimsel yöntemlerle araştırmalar yürüten, bulgularını kamuoyuyla paylaşan araştırma platformudur.",
  email: "",
  phone: "",
  address: "",
  social: { x: "", instagram: "", linkedin: "", youtube: "", facebook: "" },
};

/**
 * Yasal metin taslakları. Yayına almadan önce bir hukukçu tarafından gözden geçirilmeli ve
 * veri sorumlusu bilgileriyle (unvan, adres, KEP/e-posta) tamamlanmalıdır.
 */
export const DEFAULT_LEGAL: import("./types").LegalContent = {
  updatedAt: "",
  kvkk: [
    "## Veri sorumlusu",
    "Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, veri sorumlusu sıfatıyla MASKDER tarafından, MASSAM Araştırma platformunu kullanan kişilerin kişisel verilerinin işlenmesine ilişkin olarak hazırlanmıştır.",
    "## İşlenen kişisel veriler",
    "Katılımcı üyeliği: Anketlere katılım üyelikle yapılır. Üyelik sırasında ad-soyad, e-posta adresi ve şifreniz (yalnızca geri döndürülemez biçimde özetlenmiş hâliyle), e-posta doğrulama kaydı, KVKK aydınlatma metni ile gizlilik sözleşmesinin onay tarihleri ve giriş kayıtları işlenir. Hangi ankete katıldığınız, her üyenin her ankete yalnızca bir kez katılabilmesi için kaydedilir.",
    "Anket yanıtları: Anket yanıtlarınız üyelik bilgilerinizle (ad-soyad, e-posta) eşleştirilmeden, ayrı olarak saklanır; araştırmacılar ve yöneticiler bir yanıtın hangi üyeye ait olduğunu göremez. Kötüye kullanımı önlemek amacıyla IP adresiniz yalnızca geri döndürülemez biçimde özetlenerek (karma değer) saklanır. Bazı anketlerde cinsiyet, yaş grubu, öğrenim durumu, yaşanılan il ve ilçe gibi demografik sorular yer alabilir.",
    "Araştırma topluluğu kaydı: Gelecekteki araştırmalara davet almak için kayıt olursanız e-posta adresiniz ve isteğe bağlı olarak paylaştığınız ad, il, yaş grubu ve ilgi alanlarınız işlenir.",
    "Üye hesapları: Platformda anket hazırlamak için hesap açan araştırmacıların ad-soyad, e-posta, kurum ve unvan bilgileri ile giriş kayıtları işlenir.",
    "## İşleme amaçları ve hukuki sebepler",
    "Kişisel veriler; bilimsel araştırma ve istatistik çalışmalarının yürütülmesi, araştırma sonuçlarının toplu ve anonim olarak raporlanması, araştırma davetlerinin iletilmesi, üyelik hizmetlerinin sunulması, e-posta adresinin doğrulanması, her ankete tek katılımın sağlanması, bilgi güvenliğinin sağlanması ve kötüye kullanımın önlenmesi amaçlarıyla; KVKK madde 5/1 kapsamında açık rızanız, madde 5/2-c (sözleşmenin kurulması ve ifası) ve madde 5/2-f (meşru menfaat) hukuki sebeplerine dayanılarak işlenir. Araştırma topluluğu kaydı yalnızca açık rızanıza dayanır.",
    "## Aktarım",
    "Kişisel veriler; barındırma, veritabanı ve e-posta gönderimi gibi teknik hizmetlerin alındığı hizmet sağlayıcılarla, yalnızca bu hizmetlerin sunulması için gerekli ölçüde ve KVKK'nın 8. ve 9. maddelerine uygun olarak paylaşılabilir. Araştırma sonuçları yalnızca toplu ve anonim istatistikler hâlinde yayımlanır; bireysel yanıtlar üçüncü kişilerle paylaşılmaz.",
    "## Saklama süresi",
    "Anket yanıtları, ilgili araştırmanın saklama süresi boyunca saklanır ve süre sonunda silinir. Üyelik bilgileriniz, üyeliğiniz sürdüğü müddetçe saklanır; üyeliğinizin silinmesini istediğinizde ad-soyad, e-posta ve katılım kayıtlarınız silinir, kimliğinizle eşleştirilmemiş anket yanıtları ise toplu istatistiklerde kullanılmaya devam eder. Araştırma topluluğu kaydınız, kaydınızı iptal edene kadar saklanır; her davet e-postasındaki bağlantıyla dilediğiniz an ayrılabilirsiniz.",
    "## Haklarınız",
    "KVKK'nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini, KVKK'da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme, itiraz etme ve zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz. Başvurularınızı iletişim bölümünde yer alan kanallardan iletebilirsiniz.",
  ].join("\n\n"),
  cookies: [
    "## Çerez nedir?",
    "Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınıza kaydedilen küçük metin dosyalarıdır.",
    "## Kullandığımız çerezler",
    "MASSAM Araştırma platformu yalnızca sitenin çalışması için zorunlu çerezleri kullanır: üye girişi yapan kullanıcıların oturumunu sürdüren oturum çerezi ve güvenlik amaçlı doğrulama çerezi. Reklam, pazarlama veya üçüncü taraf takip çerezleri kullanılmaz.",
    "## Çerezleri yönetme",
    "Tarayıcınızın ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezleri engellemeniz hâlinde üye girişi ve anketlere katılım çalışmaz.",
  ].join("\n\n"),
  terms: [
    "## Kapsam",
    "Bu kullanım koşulları, MASSAM Araştırma platformunun ziyaretçiler, anket katılımcıları ve üye araştırmacılar tarafından kullanımına ilişkin kuralları belirler. Platformu kullanarak bu koşulları kabul etmiş sayılırsınız.",
    "## Anket katılımı",
    "Anketlere katılım gönüllüdür ve e-posta adresi doğrulanmış üyelikle yapılır; her üye her ankete bir kez katılabilir. Gerçeğe aykırı kimlik bilgisiyle üye olunamaz, birden fazla üyelik açılarak aynı ankete tekrar katılınamaz. Katılımcılar yanıtlarını kendi görüşleri doğrultusunda, dürüstçe vermeli; anketleri otomatik araçlarla veya sonuçları yanıltacak biçimde tekrar tekrar doldurmamalıdır.",
    "## Üye araştırmacılar",
    "Üyeler; hazırladıkları anketlerin içeriğinden, katılımcılara yönelik bilgilendirmeden ve elde ettikleri verilerin hukuka uygun kullanımından sorumludur. Kişisel verilerin korunması mevzuatına, araştırma etiğine ve genel ahlaka aykırı anket hazırlanamaz.",
    "## Araştırma sonuçları ve fikrî haklar",
    "Platformda yayımlanan raporlar, grafikler ve metinler MASKDER'e aittir. Kaynak gösterilerek alıntı yapılabilir; izinsiz olarak ticari amaçla çoğaltılamaz. Gönüllü çevrim içi anket sonuçları, aksi belirtilmedikçe Türkiye genelini temsil etmez.",
    "## Sorumluluğun sınırlandırılması",
    "MASKDER, platformun kesintisiz ve hatasız çalışması için gerekli özeni gösterir; ancak teknik arızalardan veya üçüncü kişilerin eylemlerinden doğabilecek zararlardan sorumlu tutulamaz.",
    "## Değişiklikler",
    "MASKDER bu koşulları gerektiğinde güncelleyebilir. Güncel metin her zaman bu sayfada yayımlanır.",
  ].join("\n\n"),
  privacy: [
    "## Taraflar ve konu",
    "Bu gizlilik sözleşmesi, MASSAM (Millî Adalet, Siyaset ve Strateji Araştırmaları Merkezi) Araştırma platformunu işleten MASKDER ile platforma üye olan kişi (“Üye”) arasında, üyelik ve anket katılımı sırasında elde edilen bilgilerin gizliliğine ilişkin karşılıklı hak ve yükümlülükleri düzenler. Üye, üyelik formunda bu sözleşmeyi onaylayarak hükümlerini kabul eder.",
    "## Toplanan bilgiler",
    "Üyelik bilgileri: ad-soyad, e-posta adresi ve şifre. Şifre açık olarak saklanmaz; yalnızca geri döndürülemez biçimde özetlenmiş hâli tutulur. E-posta adresi, üyelik sırasında gönderilen doğrulama bağlantısıyla teyit edilir.",
    "Katılım kaydı: Üyenin hangi ankete hangi tarihte katıldığı bilgisi. Bu kayıt yalnızca her üyenin her ankete bir kez katılmasını sağlamak için tutulur.",
    "Anket yanıtları: Anketlerde verilen cevaplar ve isteğe bağlı demografik bilgiler (cinsiyet, yaş grubu, öğrenim durumu, il, ilçe gibi).",
    "## Yanıtların kimlikten ayrılması",
    "Anket yanıtları, üyelik bilgilerinden ve katılım kaydından ayrı olarak saklanır; bir yanıt ile onu veren üye arasında sistemde bağlantı tutulmaz. Araştırmacılar, yöneticiler ve üçüncü kişiler hiçbir yanıtın hangi üyeye ait olduğunu göremez. Sonuçlar yalnızca toplu istatistikler hâlinde analiz edilir ve yayımlanır.",
    "## Bilgilerin kullanımı",
    "Üyelik bilgileri yalnızca kimlik doğrulama, e-posta doğrulaması, şifre sıfırlama, tek katılımın sağlanması ve üyelikle ilgili zorunlu bildirimler için kullanılır. Üyenin ayrıca açık rıza vermediği hâllerde ticari ileti, reklam veya pazarlama e-postası gönderilmez. Üyelik bilgileri satılmaz, kiralanmaz ve üçüncü kişilerle paylaşılmaz; yalnızca yasal bir zorunluluk bulunduğunda yetkili kamu kurumlarına ve hizmetin sunulması için zorunlu teknik hizmet sağlayıcılara (barındırma, veritabanı, e-posta gönderimi) gerekli ölçüde aktarılabilir.",
    "## Güvenlik",
    "MASKDER, bilgilerin yetkisiz erişime, kayba ve değiştirilmeye karşı korunması için şifreli bağlantı, şifre özetleme, erişim yetkilendirmesi ve hatalı giriş denemelerinin sınırlandırılması gibi makul teknik ve idari tedbirleri alır. Üye, şifresinin gizliliğinden ve hesabının kendi kontrolü dışında kullanılmamasından sorumludur.",
    "## Üyenin hakları ve üyeliğin sona ermesi",
    "Üye; bilgilerine erişme, düzeltilmesini ve üyeliğinin silinmesini isteme haklarına sahiptir. Üyelik silindiğinde ad-soyad, e-posta ve katılım kayıtları silinir; kimlikle eşleştirilmemiş anket yanıtları toplu istatistiklerde kullanılmaya devam eder. Kişisel verilerin işlenmesine ilişkin ayrıntılar KVKK Aydınlatma Metni'nde yer alır.",
    "## Değişiklikler",
    "MASKDER bu sözleşmeyi gerektiğinde güncelleyebilir. Güncel metin her zaman bu sayfada yayımlanır; esaslı değişiklikler üyelere e-postayla bildirilir.",
  ].join("\n\n"),
};
