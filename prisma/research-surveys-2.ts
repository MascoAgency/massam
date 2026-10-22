/**
 * MASSAM Araştırma — araştırması bulunmayan alanlar için 2026 güz dönemi anketleri (5 anket):
 * Sosyal Sorunlar, Güvenlik ve Jeopolitik, Eğitim ve Bilim, Teknoloji ve Medya, Afet ve Saha Araştırmaları.
 * Kimlik ve iletişim bilgisi istenmez; demografik değişkenler kategorik toplanır. Tekrar çalıştırılabilir.
 * Kullanım: npx tsx prisma/research-surveys-2.ts
 */
import { CINSIYET, EGITIM, IL, UC_SECIM, YAS_YETISKIN, YERLESIM, TL, likert, multi, open, publishSurveys, rate10, rate5, single, when, type ResearchSurvey } from "./research-kit";

const GUVEN = ["Hiç güvenmiyorum", "Tamamen güveniyorum"] as const;

// ───────────────────────── 1. Sosyal sorunlar ─────────────────────────
const s1: ResearchSurvey = {
  konu: "hayat pahalılığı, toplumsal güven ve yaşam memnuniyeti",
  title: "Hayat Pahalılığı, Toplumsal Güven ve Yaşam Memnuniyeti Araştırması",
  category: "sosyal-sorunlar",
  description:
    "Hanelerin geçim koşullarını, hayat pahalılığıyla başa çıkma yollarını, insanlar arası güveni, sosyal ilişkileri ve yaşam memnuniyetini inceliyoruz. Anket yaklaşık 8 dakika sürer ve tamamen anonimdir.",
  purpose:
    "Araştırmanın amacı, hanelerin ekonomik baskıyı nasıl deneyimlediğini (geçinme güçlüğü, harcama kalemleri ve başa çıkma stratejileri), öznel iyi oluşu (yaşam memnuniyeti ve mutluluk), genelleştirilmiş ve kişilerarası güveni, sosyal destek ağlarını ve toplumsal risk algılarını betimlemek; bu göstergeler arasındaki ilişkileri gelir, yaş, öğrenim ve yerleşim yerine göre incelemektir.\n\n" +
    "Araştırma soruları: (1) Haneler ay sonunu getirmekte ne ölçüde zorlanmakta ve hangi başa çıkma stratejilerine başvurmaktadır? (2) Ekonomik baskı ile yaşam memnuniyeti ve mutluluk arasında nasıl bir ilişki vardır? (3) Genelleştirilmiş güven ve sosyal destek düzeyi nedir? (4) Vatandaşlar yaşadıkları çevrede hangi sosyal riskleri öncelikli görmektedir?\n\n" +
    "Yöntem: Kesitsel tarama deseni; çevrim içi, gönüllülük esasına dayalı anket. Geçinme güçlüğü Avrupa İstatistik Ofisi'nin (Eurostat) “ay sonunu getirme” sorusuna, genelleştirilmiş güven Dünya Değerler Araştırması'nın klasik güven sorusuna, mutluluk TÜİK Yaşam Memnuniyeti Araştırması'nın beşli ölçeğine dayanan maddelerle ölçülür; yaşam memnuniyeti 1–10 ölçeğiyle sorulur. Hane geliri gizliliği korumak için aralıklarla ve “belirtmek istemiyorum” seçeneğiyle sorulur.",
  targetGroup: "Türkiye'de yaşayan 18 yaş ve üzeri yetişkinler",
  questions: [
    CINSIYET,
    YAS_YETISKIN,
    EGITIM,
    IL(),
    YERLESIM,
    single("haneBuyukluk", "Hanenizde sizinle birlikte kaç kişi yaşıyor?", ["1 (yalnız yaşıyorum)", "2", "3", "4", "5", "6 veya daha fazla"]),
    single("haneGelir", "Hanenizin aylık toplam net geliri hangi aralıkta?", [TL("15.000'den az"), TL("15.000–29.999"), TL("30.000–49.999"), TL("50.000–74.999"), TL("75.000–99.999"), TL("100.000 ve üzeri"), "Belirtmek istemiyorum"]),
    single("gecinme", "Hanenizin geliriyle ay sonunu getirmekte ne ölçüde zorlanıyorsunuz?", ["Çok zorlanıyoruz", "Zorlanıyoruz", "Biraz zorlanıyoruz", "Kolaylıkla getiriyoruz", "Çok kolay getiriyoruz"]),
    single("degisim", "Son 12 ayda hanenizin ekonomik durumu nasıl değişti?", ["Çok kötüleşti", "Biraz kötüleşti", "Değişmedi", "Biraz iyileşti", "Çok iyileşti"]),
    single("zorlayanKalem", "Bütçenizi en çok zorlayan harcama kalemi hangisi?", ["Gıda", "Kira veya konut kredisi", "Elektrik, doğal gaz ve su faturaları", "Ulaşım", "Eğitim", "Sağlık", "Borç ve kredi ödemeleri", "Diğer"]),
    multi("basaCikma", "Son 12 ayda geçinmek için aşağıdakilerden hangilerini yaptınız?", ["Gıda harcamalarını azalttık", "Daha ucuz ürün ve markalara yöneldik", "Kredi kartı veya kredi ile borçlandık", "Birikimlerimizi kullandık", "Hane üyelerinden biri ek iş yaptı", "Fatura veya kira ödemelerini geciktirdik", "Sağlık harcamalarını erteledik", "Tatil ve sosyal etkinliklerden vazgeçtik", "Bunların hiçbirini yapmadık"]),
    rate10("yasamMemnuniyet", "Her şeyi göz önüne aldığınızda, genel olarak hayatınızdan ne kadar memnunsunuz?", "Hiç memnun değilim", "Tamamen memnunum"),
    single("mutluluk", "Hayatınızı bir bütün olarak düşündüğünüzde kendinizi ne kadar mutlu hissediyorsunuz?", ["Çok mutlu", "Mutlu", "Ne mutlu ne mutsuz", "Mutsuz", "Çok mutsuz"]),
    single("genelGuven", "Genel olarak insanların çoğuna güvenilebileceğini mi düşünürsünüz, yoksa insanlarla ilişkilerde çok dikkatli olmak gerektiğini mi?", ["İnsanların çoğuna güvenilebilir", "İnsanlarla ilişkilerde çok dikkatli olmak gerekir", "Fikrim yok"]),
    rate5("komsuGuven", "Komşularınıza ne kadar güveniyorsunuz?", GUVEN[0], GUVEN[1]),
    rate5("yabanciGuven", "İlk kez karşılaştığınız insanlara ne kadar güveniyorsunuz?", GUVEN[0], GUVEN[1]),
    likert("lDestek", "Zor bir durumda yardım isteyebileceğim yakınlarım var."),
    likert("lYalniz", "Son dönemde kendimi sık sık yalnız hissediyorum."),
    multi("sosyalRisk", "Yaşadığınız çevrede aşağıdakilerden hangilerini ciddi bir sorun olarak görüyorsunuz?", ["Madde bağımlılığı", "Kumar ve yasa dışı bahis", "Dijital ve ekran bağımlılığı", "Aile içi şiddet", "Suç ve asayiş sorunları", "Çocuk ve gençlerde akran zorbalığı", "Yoksulluk", "Gençlerde umutsuzluk", "Yaşlıların yalnızlığı ve bakımı"], { help: UC_SECIM }),
    likert("lGelirAdalet", "Türkiye'de gelir dağılımı adildir."),
    likert("lEmek", "Toplumumuzda emek veren herkes hak ettiğini alabiliyor."),
    likert("lKutup", "Son yıllarda toplumdaki kutuplaşma arttı."),
    single("beklenti", "Önümüzdeki 12 ayda hanenizin ekonomik durumunun nasıl olacağını düşünüyorsunuz?", ["Daha iyi olacak", "Aynı kalacak", "Daha kötü olacak", "Fikrim yok"]),
    open("enOnemli", "Sizce Türkiye'nin en önemli sosyal sorunu nedir?"),
  ],
};

// ───────────────────────── 2. Güvenlik ve jeopolitik ─────────────────────────
const TEHDIT = ["Terör", "Düzensiz göç", "Bölgesel savaş ve çatışmalar", "Ekonomik kriz", "Siber saldırılar", "Deprem ve doğal afetler", "İklim değişikliği", "Dezenformasyon", "Organize suç", "Salgın hastalıklar"];
const s2: ResearchSurvey = {
  konu: "güvenlik algısı ve dış politika tutumları",
  title: "Türkiye'de Güvenlik Algısı ve Dış Politika Tutumları Araştırması",
  category: "guvenlik-ve-jeopolitik",
  description:
    "Vatandaşların günlük ve ulusal güvenlik algısını, tehdit önceliklerini, Türkiye'nin dış politikasına ve uluslararası işbirliklerine bakışını, göç ve siber güvenlik konularındaki tutum ve deneyimlerini inceliyoruz. Anket yaklaşık 8 dakika sürer ve tamamen anonimdir.",
  purpose:
    "Araştırmanın amacı, 18 yaş ve üzeri vatandaşların bireysel güvenlik hissini, ulusal tehdit algılarını, güvenlik kurumlarına güvenini, dış politika tercih ve değerlendirmelerini, düzensiz göç ve sığınmacılara ilişkin tutumlarını ve siber güvenlik deneyimlerini betimlemek; bu tutumları yaş, öğrenim, yerleşim yeri ve bilgi kaynağına göre karşılaştırmaktır.\n\n" +
    "Araştırma soruları: (1) Vatandaşlar Türkiye için en önemli güvenlik tehditlerini neler olarak görmektedir? (2) Türkiye'nin uluslararası işbirliği tercihleri ve AB üyeliğine destek nasıl dağılmaktadır? (3) Sığınmacıların geleceğine ilişkin tercihler nelerdir? (4) Vatandaşların siber tehditlerle karşılaşma ve korunma davranışları nasıldır?\n\n" +
    "Yöntem: Kesitsel tarama deseni; çevrim içi, gönüllülük esasına dayalı anket. Bireysel güvenlik hissi Avrupa Sosyal Araştırması'nın (ESS) “karanlıkta yürürken güvende hissetme” sorusuyla ölçülür. Dış politika tutumları dengeli (karşıt yönlü) ifadelerle sorulur; hiçbir ülke, parti veya hükümet politikası lehine yönlendirme yapılmaz. Analizlerde betimsel istatistikler ve çapraz tablolar kullanılacaktır.",
  targetGroup: "Türkiye'de yaşayan 18 yaş ve üzeri vatandaşlar",
  questions: [
    CINSIYET,
    YAS_YETISKIN,
    EGITIM,
    IL(),
    YERLESIM,
    single("guvendeHis", "Hava karardıktan sonra yaşadığınız bölgede tek başınıza yürürken kendinizi ne kadar güvende hissedersiniz?", ["Çok güvende", "Güvende", "Güvensiz", "Çok güvensiz"]),
    multi("tehditler", "Size göre Türkiye'nin güvenliğini en çok tehdit eden konular hangileridir?", TEHDIT, { help: UC_SECIM }),
    single("enBuyukTehdit", "Bunlar arasında en önemlisi hangisidir?", [...TEHDIT, "Diğer"]),
    rate5("kurumGuven", "Güvenlik kurumlarına (Türk Silahlı Kuvvetleri, Emniyet, Jandarma) genel olarak ne kadar güveniyorsunuz?", GUVEN[0], GUVEN[1]),
    single("dpIlgi", "Dış politika gelişmelerini ne kadar takip ediyorsunuz?", ["Yakından takip ediyorum", "Ara sıra takip ediyorum", "Pek takip etmiyorum", "Hiç takip etmiyorum"]),
    rate5("dpBasari", "Türkiye'nin dış politikasını genel olarak nasıl değerlendiriyorsunuz?", "Çok başarısız", "Çok başarılı"),
    single("isbirligi", "Sizce Türkiye dış politikada öncelikle kimlerle işbirliğini geliştirmelidir?", ["Avrupa Birliği ülkeleri", "Amerika Birleşik Devletleri", "Rusya", "Çin", "Türk devletleri", "İslam ülkeleri", "Komşu ülkeler", "Hiçbiri; dengeli ve bağımsız bir politika izlemeli", "Fikrim yok"]),
    single("ab", "Türkiye'nin Avrupa Birliği'ne tam üyeliğini destekliyor musunuz?", ["Destekliyorum", "Desteklemiyorum", "Kararsızım"]),
    likert("lNato", "NATO üyeliği Türkiye'nin güvenliğine katkı sağlıyor."),
    likert("lUzak", "Türkiye bölgesindeki çatışmalardan mümkün olduğunca uzak durmalıdır."),
    likert("lEtkin", "Türkiye bölgesinde daha etkin ve belirleyici bir rol üstlenmelidir."),
    likert("lSavunma", "Yerli savunma sanayiindeki gelişmeler Türkiye'nin güvenliğini güçlendiriyor."),
    single("siginmaci", "Türkiye'deki sığınmacıların geleceğine ilişkin görüşünüze en yakın ifade hangisidir?", ["Tamamı ülkelerine geri dönmeli", "Bir kısmı dönmeli, uyum sağlayanlar kalabilmeli", "Kalmaları ve topluma uyumları desteklenmeli", "Fikrim yok"]),
    multi("siberDeneyim", "Son 12 ayda aşağıdakilerden hangilerini yaşadınız?", ["Dolandırıcılık amaçlı mesaj, e-posta veya arama aldım", "Bir sosyal medya veya e-posta hesabım ele geçirildi", "Kişisel verilerimin sızdırıldığını öğrendim", "Kart veya banka bilgilerim izinsiz kullanıldı", "Bunların hiçbirini yaşamadım"]),
    single("ikiAdim", "İnternet hesaplarınızda iki aşamalı doğrulama kullanıyor musunuz?", ["Evet, önemli hesaplarımın tamamında", "Bazı hesaplarımda", "Hayır", "Ne olduğunu bilmiyorum"]),
    single("dpKaynak", "Dış politika ve güvenlik konularında en çok hangi kaynaktan bilgi ediniyorsunuz?", ["Televizyon", "Sosyal medya", "İnternet haber siteleri", "Gazete", "YouTube ve podcast yayınları", "Uzman ve akademik kaynaklar", "Takip etmiyorum"]),
    open("gorus", "Türkiye'nin güvenliği ve dış politikasıyla ilgili eklemek istediğiniz bir görüş var mı?"),
  ],
};

// ───────────────────────── 3. Eğitim ve bilim ─────────────────────────
const ROL = ["Okula giden çocuğu olan veliyim", "Öğretmenim / eğitim çalışanıyım", "Üniversite öğrencisiyim", "Akademisyenim", "Bunların hiçbiri"];
const s3: ResearchSurvey = {
  konu: "eğitim sistemine yönelik memnuniyet, beklentiler ve fırsat eşitliği",
  title: "Eğitim Sistemine Yönelik Memnuniyet, Beklentiler ve Fırsat Eşitliği Algısı Araştırması",
  category: "egitim-ve-bilim",
  description:
    "Velilerin, öğretmenlerin, öğrencilerin ve tüm vatandaşların Türkiye'deki eğitim sistemine ilişkin memnuniyetini, öncelikli sorun alanlarını, eğitimde fırsat eşitliğine ve bilime bakışını inceliyoruz. Anket yaklaşık 8 dakika sürer ve tamamen anonimdir.",
  purpose:
    "Araştırmanın amacı, eğitim sisteminin farklı paydaşlarının (veliler, öğretmenler, üniversite öğrencileri, akademisyenler ve diğer vatandaşlar) eğitim sistemine ilişkin genel memnuniyetini, öncelikli sorun algılarını, eğitimde fırsat eşitliği ve merkezi sınavlara ilişkin tutumlarını, velilerin eğitim harcamalarını ve öğretmenlerin mesleki memnuniyetini betimlemek; ayrıca bilime ve bilim insanlarına güveni ölçmektir.\n\n" +
    "Araştırma soruları: (1) Eğitim sistemine ilişkin memnuniyet paydaş gruplarına göre farklılaşmakta mıdır? (2) Eğitim sisteminin öncelikli sorunları nelerdir? (3) Eğitimde fırsat eşitliği ve sınav sistemi nasıl algılanmaktadır? (4) Velilerin okul dışı eğitim harcamaları ve öğretmenlerin mesleki memnuniyeti hangi düzeydedir?\n\n" +
    "Yöntem: Kesitsel tarama deseni; çevrim içi, gönüllülük esasına dayalı anket. Katılımcılar eğitim sistemiyle ilişkilerine göre gruplandırılır; veli ve öğretmen modülleri koşullu dallanmayla yalnızca ilgili gruplara yöneltilir. Memnuniyet 1–5 ölçeğiyle, tutumlar 5'li Likert maddeleriyle ölçülür.",
  targetGroup: "Türkiye'de yaşayan 18 yaş ve üzeri veliler, öğretmenler, öğrenciler, akademisyenler ve diğer vatandaşlar",
  questions: [
    CINSIYET,
    YAS_YETISKIN,
    EGITIM,
    IL(),
    single("rol", "Eğitim sistemiyle ilişkinizi en iyi hangisi tanımlar?", ROL),
    multi("cocukKademe", "Çocuğunuz / çocuklarınız hangi kademede öğrenim görüyor?", ["Okul öncesi", "İlkokul", "Ortaokul", "Lise", "Üniversite"], when("rol", ROL[0])),
    single("okulTuru", "Çocuğunuzun / çocuklarınızın devam ettiği okulun türü", ["Devlet okulu", "Özel okul", "Her ikisi de"], when("rol", ROL[0])),
    single("disHarcama", "Çocuk başına aylık ortalama okul dışı eğitim harcamanız (özel ders, kurs, etüt merkezi) ne kadar?", ["Böyle bir harcamamız yok", TL("2.000'den az"), TL("2.000–4.999"), TL("5.000–9.999"), TL("10.000 ve üzeri")], when("rol", ROL[0])),
    rate5("okulMemnuniyet", "Çocuğunuzun okulundan genel olarak ne kadar memnunsunuz?", "Hiç memnun değilim", "Çok memnunum", when("rol", ROL[0])),
    single("ogretmenKademe", "Hangi kademede görev yapıyorsunuz?", ["Okul öncesi", "İlkokul", "Ortaokul", "Lise", "Mesleki ve teknik eğitim", "Diğer"], when("rol", ROL[1])),
    single("kidem", "Meslekteki kıdeminiz", ["5 yıldan az", "5–10 yıl", "11–20 yıl", "20 yıldan fazla"], when("rol", ROL[1])),
    rate5("meslekMemnuniyet", "Öğretmenlik mesleğinden ne kadar memnunsunuz?", "Hiç memnun değilim", "Çok memnunum", when("rol", ROL[1])),
    likert("lTukenme", "İş yüküm nedeniyle kendimi sık sık tükenmiş hissediyorum.", when("rol", ROL[1])),
    rate5("sistemMemnuniyet", "Türkiye'deki eğitim sisteminden genel olarak ne kadar memnunsunuz?", "Hiç memnun değilim", "Çok memnunum"),
    multi("sorunlar", "Size göre eğitim sisteminin en öncelikli sorunları hangileridir?", ["Sınav odaklı sistem", "Sık değişen müfredat ve politikalar", "Kalabalık sınıflar", "Öğretmen yetiştirme ve istihdamı", "Okulların fiziki altyapısı", "Okullar arası kalite farkı", "Özel ders ve kurs maliyetleri", "Değerler ve karakter eğitimi", "Dijital becerilerin yetersizliği", "Mesleki eğitimin zayıflığı"], { help: UC_SECIM }),
    likert("lFirsat", "Türkiye'de her çocuk, ailesinin gelirinden bağımsız olarak nitelikli eğitime erişebiliyor."),
    likert("lKaliteFark", "Okullar arasındaki kalite farkı öğrencilerin geleceğini belirliyor."),
    likert("lSinav", "Merkezi sınavlar öğrencilerin yeteneklerini doğru ölçüyor."),
    likert("lSaygi", "Öğretmenlik mesleği toplumda hak ettiği saygıyı görüyor."),
    likert("lArge", "Türkiye'de bilimsel araştırmalara yeterli kaynak ayrılıyor."),
    rate5("bilimGuven", "Bilim insanlarına ne kadar güveniyorsunuz?", GUVEN[0], GUVEN[1]),
    open("oneri", "Eğitim sisteminin iyileştirilmesi için en önemli önceliğiniz ne olurdu?"),
  ],
};

// ───────────────────────── 4. Teknoloji ve medya ─────────────────────────
const YZ = ["Neredeyse her gün", "Haftada birkaç kez", "Ayda birkaç kez", "Denedim ama düzenli kullanmıyorum", "Hiç kullanmadım"];
const s4: ResearchSurvey = {
  konu: "dijital alışkanlıklar, yapay zekâ kullanımı ve dezenformasyon algısı",
  title: "Dijital Alışkanlıklar, Yapay Zekâ Kullanımı ve Dezenformasyon Algısı Araştırması",
  category: "teknoloji-ve-medya",
  description:
    "İnternet ve sosyal medya kullanım alışkanlıklarını, haber kaynaklarını, yanlış ve yanıltıcı bilgiyle karşılaşma ve doğrulama davranışlarını, yapay zekâ araçlarının kullanımını ve yapay zekâya bakışı inceliyoruz. Anket yaklaşık 7 dakika sürer ve tamamen anonimdir.",
  purpose:
    "Araştırmanın amacı, 18 yaş ve üzeri internet kullanıcılarının dijital medya kullanım yoğunluğunu ve platform tercihlerini, haber edinme kaynaklarını ve medyaya güvenlerini, dezenformasyonla karşılaşma sıklığını ve bilgi doğrulama davranışlarını, üretken yapay zekâ araçlarını kullanma düzey ve amaçlarını ve yapay zekâya ilişkin tutumlarını betimlemektir.\n\n" +
    "Araştırma soruları: (1) Kullanıcılar haberleri hangi kanallardan edinmekte ve bu kanallara ne ölçüde güvenmektedir? (2) Yanıltıcı bilgiyle karşılaşma sıklığı ve doğrulama davranışları yaş ve öğrenim düzeyine göre farklılaşmakta mıdır? (3) Üretken yapay zekâ araçları kimler tarafından, hangi amaçlarla kullanılmaktadır? (4) Yapay zekânın iş hayatı, güvenilirlik ve düzenleme ihtiyacına ilişkin tutumlar nasıldır?\n\n" +
    "Yöntem: Kesitsel tarama deseni; çevrim içi, gönüllülük esasına dayalı anket. Yapay zekâ kullanım amaçları koşullu dallanmayla yalnızca araçları kullananlara sorulur. Dijital okuryazarlık öz değerlendirme 1–5 ölçeğiyle, tutumlar 5'li Likert maddeleriyle ölçülür. Çevrim içi örneklemin internet kullanıcılarıyla sınırlı olduğu bulguların yorumunda dikkate alınacaktır.",
  targetGroup: "Türkiye'de yaşayan 18 yaş ve üzeri internet kullanıcıları",
  questions: [
    CINSIYET,
    YAS_YETISKIN,
    EGITIM,
    IL(),
    single("internetSure", "İş ve eğitim dışında günde ortalama kaç saat internette vakit geçiriyorsunuz?", ["1 saatten az", "1–3 saat", "3–5 saat", "5–8 saat", "8 saatten fazla"]),
    multi("platformlar", "Düzenli olarak kullandığınız sosyal medya ve mesajlaşma platformları hangileri?", ["Instagram", "YouTube", "X (Twitter)", "TikTok", "Facebook", "WhatsApp", "Telegram", "LinkedIn", "Reddit ve forumlar", "Hiçbirini kullanmıyorum"]),
    single("haberKaynak", "Haberleri en çok hangi kaynaktan ediniyorsunuz?", ["Televizyon", "Sosyal medya", "Haber siteleri ve uygulamaları", "YouTube ve podcast yayınları", "Gazete", "Mesajlaşma grupları", "Haber takip etmiyorum"]),
    rate5("guvenGeleneksel", "Televizyon ve gazetelerdeki haberlere ne kadar güveniyorsunuz?", "Hiç güvenmiyorum", "Tamamen güveniyorum"),
    rate5("guvenSosyal", "Sosyal medyadaki haberlere ne kadar güveniyorsunuz?", "Hiç güvenmiyorum", "Tamamen güveniyorum"),
    single("yanlisBilgi", "Son bir ayda yanlış veya yanıltıcı olduğunu düşündüğünüz bir habere ya da içeriğe ne sıklıkla rastladınız?", ["Neredeyse her gün", "Haftada birkaç kez", "Ayda birkaç kez", "Hiç rastlamadım", "Emin değilim"]),
    multi("dogrulama", "Bir haberin doğruluğundan şüphelendiğinizde genellikle ne yaparsınız?", ["Farklı kaynaklardan kontrol ederim", "Teyit (doğrulama) platformlarına bakarım", "Haberin kaynağına ve tarihine bakarım", "Konunun uzmanlarının görüşlerine bakarım", "Genellikle kontrol etmem"]),
    single("paylasim", "Doğruluğundan emin olmadığınız bir içeriği hiç paylaştınız mı?", ["Evet, birkaç kez", "Evet, bir kez", "Hayır", "Hatırlamıyorum"]),
    rate5("dijitalOkuryazarlik", "Yanlış ve yanıltıcı bilgiyi ayırt etme becerinizi nasıl değerlendiriyorsunuz?", "Çok zayıf", "Çok iyi"),
    single("yzKullanim", "Son 3 ayda ChatGPT, Gemini, Claude gibi üretken yapay zekâ araçlarını ne sıklıkla kullandınız?", YZ),
    multi("yzAmac", "Yapay zekâ araçlarını hangi amaçlarla kullanıyorsunuz?", ["Bilgi arama ve araştırma", "Metin, e-posta veya rapor yazma", "Ders ve ödev çalışmaları", "İş görevleri", "Kod yazma", "Çeviri", "Görsel veya video üretimi", "Kişisel tavsiye ve sohbet", "Eğlence"], { ...when("yzKullanim", YZ[0], YZ[1], YZ[2], YZ[3]), help: UC_SECIM }),
    likert("lYzKolay", "Yapay zekâ araçları iş veya öğrenim hayatımı kolaylaştırıyor."),
    likert("lYzMeslek", "Yapay zekâ önümüzdeki 10 yılda birçok mesleği ortadan kaldıracak."),
    likert("lYzGuven", "Yapay zekâ araçlarının verdiği bilgilere güvenirim."),
    likert("lYzDuzenleme", "Yapay zekâ kullanımı yasal düzenlemelerle sınırlandırılmalıdır."),
    likert("lEkranAzalt", "İnternette geçirdiğim süreyi azaltmam gerektiğini düşünüyorum."),
    rate5("veriKaygi", "Kişisel verilerinizin internette nasıl kullanıldığı konusunda ne kadar kaygılısınız?", "Hiç kaygılı değilim", "Çok kaygılıyım"),
    open("gorus", "Dijital medya veya yapay zekâ ile ilgili eklemek istediğiniz bir görüş var mı?"),
  ],
};

// ───────────────────────── 5. Afet hazırlığı ─────────────────────────
const s5: ResearchSurvey = {
  konu: "hane halkının afet hazırlık düzeyi ve risk algısı",
  title: "Hane Halkının Afet Hazırlık Düzeyi ve Risk Algısı Araştırması",
  category: "afet-ve-saha-arastirmalari",
  description:
    "Hanelerin deprem ve diğer afetlere ne ölçüde hazırlıklı olduğunu, yaşanılan binanın güvenliğine ilişkin bilgi ve algıları, afet riskine bakışı, hazırlığın önündeki engelleri ve afet yönetiminde görev alan kurumlara güveni inceliyoruz. Anket yaklaşık 8 dakika sürer ve tamamen anonimdir.",
  purpose:
    "Araştırmanın amacı, hanelerin afet hazırlık düzeyini (afet çantası, eşya sabitleme, aile afet planı, toplanma alanı bilgisi, sigorta, bina dayanıklılık analizi ve ilk yardım bilgisi) ölçmek; risk algısı, afet deneyimi, konut sahipliği ve bina güvenliği bilgisi ile hazırlık davranışları arasındaki ilişkileri incelemek ve hazırlığın önündeki engelleri belirlemektir. MASSAM'ın Hatay deprem saha araştırmasında ortaya çıkan bulguların hane düzeyindeki hazırlıkla ilişkisini değerlendirmeye yöneliktir.\n\n" +
    "Araştırma soruları: (1) Haneler hangi hazırlık adımlarını atmış durumdadır? (2) Afet deneyimi ve risk algısı hazırlık davranışlarıyla ilişkili midir? (3) Hazırlığın önündeki temel engeller nelerdir? (4) Vatandaşların afet yönetiminde görev alan kurumlara güveni ve kentsel dönüşüme bakışı nasıldır?\n\n" +
    "Yöntem: Kesitsel tarama deseni; çevrim içi, gönüllülük esasına dayalı anket. Hazırlık göstergeleri AFAD'ın hane afet hazırlığı önerileri esas alınarak çoklu seçimle, risk algısı ve endişe 1–5 ölçeğiyle, tutumlar 5'li Likert maddeleriyle ölçülür. Kaderci tutumu ölçen ters yönlü bir madde yanıt yanlılığını azaltmak için ölçeğe eklenmiştir.",
  targetGroup: "Türkiye'de yaşayan 18 yaş ve üzeri vatandaşlar",
  questions: [
    CINSIYET,
    YAS_YETISKIN,
    EGITIM,
    IL(),
    open("ilce", "Yaşadığınız ilçe", { short: true, required: true, help: "Yalnızca ilçe adını yazınız (ör. Antakya). Mahalle veya adres yazmayınız." }),
    single("konut", "Oturduğunuz konut", ["Kendime / aileme ait", "Kira", "Lojman veya diğer"]),
    single("deneyim", "Daha önce can veya mal kaybına yol açan bir afet yaşadınız mı?", ["Evet, 6 Şubat 2023 depremlerinde", "Evet, başka bir depremde", "Evet, sel, yangın veya başka bir afette", "Hayır"]),
    single("binaYas", "Oturduğunuz bina kaç yaşında?", ["10 yıldan yeni", "10–20 yıl", "21–30 yıl", "30 yıldan eski", "Bilmiyorum"]),
    single("binaGuven", "Oturduğunuz binanın depreme dayanıklılığı hakkında ne biliyorsunuz?", ["Dayanıklılık analizi / raporu var, dayanıklı", "Raporu yok ama dayanıklı olduğunu düşünüyorum", "Emin değilim", "Dayanıklı olmadığını düşünüyorum"]),
    multi("hazirlik", "Hanenizde aşağıdakilerden hangileri var veya yapıldı?", ["Afet ve acil durum çantası hazır", "Dolap ve ağır eşyalar duvara sabitlendi", "Aile afet ve acil durum planı yapıldı", "En yakın toplanma alanını biliyoruz", "Zorunlu deprem sigortası (DASK) var", "Konut sigortası var", "Binanın deprem dayanıklılık analizi yaptırıldı", "Hanede ilk yardım eğitimi almış biri var", "Bunların hiçbiri"]),
    rate5("risk", "Önümüzdeki 10 yıl içinde yaşadığınız yerde hasar verici bir deprem olma olasılığını nasıl değerlendiriyorsunuz?", "Çok düşük", "Çok yüksek"),
    rate5("endise", "Olası bir afet konusunda ne kadar endişelisiniz?", "Hiç endişeli değilim", "Çok endişeliyim"),
    single("engel", "Afete hazırlık için daha fazla adım atmanızın önündeki en önemli engel nedir?", ["Maliyet", "Ne yapmam gerektiğini bilmemek", "Zaman ayıramamak", "Hazırlığın işe yaramayacağını düşünmek", "Kiracı olmak / karar yetkimin olmaması", "Gerek duymamak", "Diğer"]),
    single("donusum", "Oturduğunuz binanın kentsel dönüşümüne ilişkin durumu en iyi hangisi tanımlar?", ["Dönüşüm tamamlandı veya sürüyor", "Dönüşüme girmesini istiyorum", "Dönüşüme girmesini istemiyorum", "Kiracıyım, karar bende değil", "Gerek olduğunu düşünmüyorum"]),
    rate5("guvenAfad", "AFAD'a ne kadar güveniyorsunuz?", GUVEN[0], GUVEN[1]),
    rate5("guvenBelediye", "Belediyenizin afet yönetimi kapasitesine ne kadar güveniyorsunuz?", GUVEN[0], GUVEN[1]),
    rate5("guvenStk", "Afet alanında çalışan sivil toplum kuruluşlarına ne kadar güveniyorsunuz?", GUVEN[0], GUVEN[1]),
    likert("lBilgi", "Afet anında ne yapmam gerektiğini biliyorum."),
    likert("lKader", "Afetlere karşı bireylerin yapabileceği fazla bir şey yoktur."),
    likert("lDayanisma", "Mahallemde afet sonrasında komşular arasında dayanışma kurulabilir."),
    single("bilgiKaynak", "Afet hazırlığı konusunda en çok hangi kaynaktan bilgi ediniyorsunuz?", ["AFAD ve kamu kurumları", "Belediye", "Televizyon", "Sosyal medya", "Okul veya işyerindeki eğitimler", "Sivil toplum kuruluşları", "Bilgi edinmiyorum"]),
    open("ihtiyac", "Yaşadığınız yerin afetlere hazırlığı için en acil ihtiyaç sizce nedir?"),
  ],
};

publishSurveys([s1, s2, s3, s4, s5]).catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
