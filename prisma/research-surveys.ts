/**
 * MASSAM Araştırma — 2026 güz dönemi saha araştırmaları (5 anket).
 * Kimlik ve iletişim bilgisi istenmez; yalnızca analiz için gerekli demografik değişkenler (cinsiyet, yaş grubu,
 * öğrenim durumu, il, gerektiğinde ilçe) kategorik olarak toplanır. Anketler platform anketi olarak yayına alınır.
 * Tekrar çalıştırılabilir: aynı başlıklı anket varsa atlanır.
 * Kullanım: npx tsx prisma/research-surveys.ts
 */
import { CINSIYET, EGITIM, IL, UC_SECIM, YAS_GENC, YAS_YETISKIN, YERLESIM, TL, likert, multi, open, publishSurveys, rate10, rate5, single, when, type ResearchSurvey } from "./research-kit";

// ───────────────────────── 1. Gençlerin istihdam beklentileri ─────────────────────────
const S1_DURUM = ["Yalnızca öğrenciyim", "Hem öğrenciyim hem çalışıyorum", "Tam zamanlı çalışıyorum", "Yarı zamanlı veya geçici bir işte çalışıyorum", "Kendi işimi yapıyorum (serbest çalışan / girişimci)", "Çalışmıyorum, iş arıyorum", "Çalışmıyorum, iş de aramıyorum"];
const S1_CALISAN = [S1_DURUM[1], S1_DURUM[2], S1_DURUM[3], S1_DURUM[4]];
const s1: ResearchSurvey = {
  konu: "gençlerin istihdam beklentileri ve işsizlik algısı",
  title: "Gençlerin İstihdam Beklentileri ve İşsizlik Algısı Araştırması",
  category: "ekonomi-ve-istihdam",
  description:
    "18–29 yaş arasındaki gençlerin iş gücü piyasasındaki konumlarını, iş arama deneyimlerini, ücret ve çalışma koşullarına ilişkin beklentilerini ve işsizliğe bakışlarını inceliyoruz. Anket yaklaşık 8 dakika sürer ve tamamen anonimdir.",
  purpose:
    "Araştırmanın amacı, Türkiye'de 18–29 yaş grubundaki gençlerin istihdam durumunu, iş arama stratejilerini, rezervasyon ücreti (kabul edilebilir en düşük ücret) ve iş seçimindeki önceliklerini betimlemek; eğitim–iş uyumu, işsizlik algısı ve ekonomik geleceğe ilişkin beklentileri cinsiyet, yaş grubu, öğrenim düzeyi ve il değişkenlerine göre karşılaştırmaktır.\n\n" +
    "Araştırma soruları: (1) Gençlerin iş gücü piyasasındaki durumu ve iş arama süreleri nasıl dağılmaktadır? (2) Gençlerin kabul edebilecekleri en düşük ücret ve tercih ettikleri sektör/çalışma biçimi nedir? (3) Gençler işsizliğin nedenlerini nasıl açıklamaktadır? (4) Eğitimin iş piyasasına hazırlama düzeyi ve gelecek beklentileri demografik gruplara göre farklılaşmakta mıdır?\n\n" +
    "Yöntem: Kesitsel tarama deseni; çevrim içi, gönüllülük esasına dayalı anket. Ölçme aracı; demografik değişkenler, iş gücü durumu (koşullu dallanma ile), beklenti soruları, 5'li Likert tutum maddeleri ve bir açık uçlu sorudan oluşur. Bulgular betimsel istatistikler ve çapraz tablolarla (ki-kare) analiz edilecektir.",
  targetGroup: "Türkiye'de yaşayan 18–29 yaş arası gençler (öğrenci, çalışan ve iş arayanlar dahil)",
  questions: [
    CINSIYET,
    YAS_GENC,
    EGITIM,
    IL(),
    single("durum", "Şu anki eğitim ve çalışma durumunuzu en iyi hangisi tanımlar?", S1_DURUM),
    single("aramaSure", "Ne kadar süredir iş arıyorsunuz?", ["3 aydan az", "3–6 ay", "6–12 ay", "1–2 yıl", "2 yıldan fazla"], when("durum", S1_DURUM[5])),
    multi("aramaYol", "İş ararken hangi yöntemleri kullanıyorsunuz?", ["Çevrim içi iş ilanı siteleri", "Sosyal medya / profesyonel ağlar (LinkedIn vb.)", "İŞKUR", "Aile, akraba ve tanıdıklar", "Şirketlere doğrudan başvuru", "Okulun kariyer merkezi", "Özel istihdam büroları", "Kamu personel sınavları (KPSS vb.)"], when("durum", S1_DURUM[5])),
    single("aramamaNeden", "İş aramamanızın temel nedeni nedir?", ["Eğitimime devam ediyorum veya sınava hazırlanıyorum", "Uygun bir iş bulamayacağımı düşünüyorum", "Ev içi bakım sorumluluklarım var", "Sağlık nedenleri", "Ailem maddi olarak destekliyor, çalışma ihtiyacı duymuyorum", "Askerlik vb. yükümlülükler", "Diğer"], when("durum", S1_DURUM[6])),
    single("alanUyum", "Şu anki işiniz aldığınız eğitimle ne ölçüde ilgili?", ["Tamamen ilgili", "Kısmen ilgili", "İlgisiz", "Belirli bir alanda eğitim almadım"], when("durum", ...S1_CALISAN)),
    rate5("isMemnuniyet", "Şu anki işinizden genel olarak ne kadar memnunsunuz?", "Hiç memnun değilim", "Çok memnunum", when("durum", ...S1_CALISAN)),
    single("rezervasyonUcret", "Bir işe başlamak için kabul edebileceğiniz en düşük aylık net ücret hangisidir?", ["Asgari ücret veya altı", "Asgari ücretin 1–1,5 katı", "Asgari ücretin 1,5–2 katı", "Asgari ücretin 2–3 katı", "Asgari ücretin 3 katından fazla", "Fikrim yok"]),
    single("sektor", "Hangi sektörde çalışmayı tercih edersiniz?", ["Kamu sektörü", "Özel sektör – büyük ölçekli şirket", "Özel sektör – küçük ve orta ölçekli işletme", "Kendi işim / girişimcilik", "Sivil toplum veya uluslararası kuruluş", "Henüz karar vermedim"]),
    multi("isOnceligi", "Bir iş seçerken aşağıdakilerden hangileri sizin için en önemlidir?", ["Yüksek ücret", "İş güvencesi", "Kariyer ve yükselme olanağı", "Esnek çalışma saatleri veya uzaktan çalışma", "İşin eğitim aldığım alanla ilgili olması", "Çalışma ortamı ve yönetim anlayışı", "Sosyal haklar (sigorta, yan haklar)", "İşin toplumsal saygınlığı", "İşyerinin konuma yakınlığı"], { help: UC_SECIM }),
    single("calismaBicimi", "Hangi çalışma biçimini tercih edersiniz?", ["Tamamen işyerinde", "Hibrit (işyeri + uzaktan)", "Tamamen uzaktan", "Fark etmez"]),
    likert("lBeceri", "Aldığım eğitim bana iş piyasasının beklediği becerileri kazandırdı / kazandırıyor."),
    likert("lTanidik", "Türkiye'de nitelikli bir iş bulmak için tanıdık veya referans gerekir."),
    likert("lUmut", "Önümüzdeki 12 ay içinde beklentilerime uygun bir iş bulabileceğimi düşünüyorum."),
    likert("lAgirlasma", "Gençlerin karşılaştığı işsizlik sorunu son yıllarda ağırlaştı."),
    likert("lYurtdisi", "Fırsatım olsa yurt dışında çalışmayı tercih ederim."),
    likert("lPolitika", "Gençlerin istihdamına yönelik kamu politikaları yeterlidir."),
    single("issizlikNeden", "Size göre gençler arasında işsizliğin en önemli nedeni nedir?", ["Eğitim sisteminin iş piyasasıyla uyumsuzluğu", "Ekonomik durgunluk ve yetersiz iş olanakları", "İşverenlerin deneyim şartı", "Ücretlerin düşük olması nedeniyle işlerin tercih edilmemesi", "Torpil ve kayırmacılık", "Gençlerin beklentilerinin yüksek olması", "Diğer"]),
    single("gelecek", "Önümüzdeki 12 ay içinde kendi ekonomik durumunuzun nasıl olacağını düşünüyorsunuz?", ["Çok daha iyi olacak", "Biraz daha iyi olacak", "Aynı kalacak", "Biraz daha kötü olacak", "Çok daha kötü olacak", "Fikrim yok"]),
    open("oneri", "Sizce gençlerin istihdamını artırmak için öncelikle ne yapılmalı?"),
  ],
};

// ───────────────────────── 2. Ev gençleri (NEET) ─────────────────────────
const S2_EKRAN = ["Hayır, şu anda ne okula gidiyorum ne de çalışıyorum", "Evet, örgün eğitime devam ediyorum", "Evet, ücretli bir işte çalışıyorum", "Hem eğitime devam ediyorum hem çalışıyorum"];
const NEET = S2_EKRAN[0];
const DIGER = [S2_EKRAN[1], S2_EKRAN[2], S2_EKRAN[3]];
const s2: ResearchSurvey = {
  konu: "ne eğitimde ne istihdamda olan gençlerin gündelik yaşamı ve yönelimleri",
  title: "Ne Eğitimde Ne İstihdamda Olan Gençler (Ev Gençleri): Gündelik Yaşam, Yönelimler ve Davranışlar Araştırması",
  category: "genclik-ve-universite",
  description:
    "Ne okula giden ne de bir işte çalışan, kamuoyunda “ev gençleri” olarak anılan 18–29 yaş arası gençlerin gündelik yaşamlarını, bu duruma gelme nedenlerini, geleceğe dair yönelimlerini ve ihtiyaç duydukları destekleri inceliyoruz. Bu durumda olmayan gençler de kısa bir bölümle katkı verebilir. Anket yaklaşık 8 dakika sürer ve tamamen anonimdir.",
  purpose:
    "Araştırmanın amacı, Türkiye'de ne eğitimde ne istihdamda olan (NEET) 18–29 yaş gençlerin bu duruma giriş nedenlerini, durumun süresini, zaman kullanımı ve dijital davranışlarını, geçim kaynaklarını, öznel iyi oluş ve geleceğe yönelik tutumlarını betimlemek; eğitim ve istihdama yeniden katılım önündeki engelleri ve tercih edilen destek türlerini ortaya koymaktır.\n\n" +
    "Araştırma soruları: (1) Gençleri NEET durumuna iten başlıca nedenler nelerdir ve bu nedenler cinsiyete göre farklılaşmakta mıdır? (2) NEET gençler zamanlarını nasıl geçirmekte, iş arama ve beceri edinme davranışları nasıldır? (3) NEET gençlerin yaşam memnuniyeti, umut, yalnızlık ve damgalanma algısı hangi düzeydedir? (4) Eğitime veya istihdama dönüş için hangi destekler öncelikli görülmektedir?\n\n" +
    "Yöntem: Kesitsel tarama deseni; çevrim içi, gönüllülük esasına dayalı anket. Tarama sorusu ile katılımcılar NEET grubuna ve karşılaştırma grubuna ayrılır; NEET grubu ana modülü, diğer gençler kısa algı modülünü yanıtlar. Tanım, TÜİK ve OECD'nin “ne eğitimde ne istihdamda” (NEET) yaklaşımına dayanır. Yaşam memnuniyeti 1–10 ölçeğiyle, tutumlar 5'li Likert maddeleriyle ölçülür.",
  targetGroup: "Türkiye'de yaşayan 18–29 yaş arası gençler; öncelikle ne eğitime devam eden ne de bir işte çalışan gençler",
  questions: [
    CINSIYET,
    YAS_GENC,
    EGITIM,
    single("medeni", "Medeni durumunuz", ["Bekâr", "Evli", "Boşanmış / ayrı yaşıyor", "Belirtmek istemiyorum"]),
    IL(),
    YERLESIM,
    single("ekran", "Şu anda örgün eğitime devam ediyor veya ücretli bir işte çalışıyor musunuz?", S2_EKRAN),
    // NEET modülü
    single("sure", "Ne kadar süredir ne eğitimde ne de bir işte bulunuyorsunuz?", ["6 aydan az", "6–12 ay", "1–2 yıl", "2–3 yıl", "3 yıldan fazla"], when("ekran", NEET)),
    single("ayrilis", "Son öğrenim kurumunuzdan nasıl ayrıldınız?", ["Mezun oldum", "Mezun olmadan ayrıldım", "Sınava hazırlanmak için ara verdim", "Zorunlu eğitimden sonra devam etmedim"], when("ekran", NEET)),
    single("neden", "Şu anki durumunuzun temel nedeni nedir?", ["İş bulamıyorum", "Bulduğum işler beklentimi karşılamıyor (ücret, çalışma koşulları)", "Üniversite veya kamu sınavına hazırlanıyorum", "Aile bireylerinin bakımını üstleniyorum", "Sağlık sorunlarım var", "Ne yapmak istediğime henüz karar vermedim", "Ailem çalışmamı veya okumamı istemiyor", "Diğer"], when("ekran", NEET)),
    single("isArama", "Son 4 hafta içinde iş aradınız mı?", ["Evet, düzenli olarak aradım", "Evet, ara sıra baktım", "Hayır"], when("ekran", NEET)),
    multi("zaman", "Gününüzün büyük bölümünü nasıl geçiriyorsunuz?", ["Ev işleri ve aile içi sorumluluklar", "Sınav hazırlığı veya kendi kendine öğrenme", "Sosyal medya ve video izleme", "Çevrim içi oyun", "Arkadaşlarla vakit geçirme", "Spor ve fiziksel etkinlik", "Kitap okuma", "Gönüllü çalışmalar / sivil toplum", "Ara sıra yapılan kayıt dışı işler"], { ...when("ekran", NEET), help: UC_SECIM }),
    single("internet", "Eğitim ve iş dışında günde ortalama kaç saat internette vakit geçiriyorsunuz?", ["1 saatten az", "1–3 saat", "3–5 saat", "5–8 saat", "8 saatten fazla"], when("ekran", NEET)),
    single("kurs", "Son 12 ay içinde bir kurs, sertifika veya meslek edindirme programına katıldınız mı?", ["Evet, tamamladım", "Evet, devam ediyor", "Hayır, ama katılmak isterim", "Hayır, ilgilenmiyorum"], when("ekran", NEET)),
    single("gecim", "Geçiminizi temel olarak nasıl sağlıyorsunuz?", ["Aile desteği", "Eşimin geliri", "Sosyal yardım veya burs", "Ara sıra yapılan / kayıt dışı işler", "Birikimlerim", "Diğer"], when("ekran", NEET)),
    likert("lYarar", "Kendimi toplumun işe yarar bir parçası olarak hissediyorum.", when("ekran", NEET)),
    likert("lUmut", "Geleceğim konusunda umutluyum.", when("ekran", NEET)),
    likert("lYalniz", "Son dönemde kendimi çoğu zaman yalnız hissediyorum.", when("ekran", NEET)),
    likert("lElestiri", "Çevremdekiler okumadığım veya çalışmadığım için beni eleştiriyor.", when("ekran", NEET)),
    likert("lHazir", "Uygun bir fırsat sunulursa hemen çalışmaya başlarım.", when("ekran", NEET)),
    rate10("memnuniyet", "Her şeyi göz önüne aldığınızda, hayatınızdan genel olarak ne kadar memnunsunuz?", "Hiç memnun değilim", "Tamamen memnunum", when("ekran", NEET)),
    single("destek", "Eğitime veya çalışma hayatına dönmeniz için size en çok hangi destek yardımcı olur?", ["Ücretli staj veya işbaşı eğitim programları", "Mesleki kurs ve sertifikalar", "Kariyer danışmanlığı ve rehberlik", "Girişimcilik destekleri ve hibeler", "Psikolojik destek ve danışmanlık", "Esnek veya uzaktan çalışma olanakları", "Çocuk / yaşlı bakım desteği", "Diğer"], when("ekran", NEET)),
    open("ekNeet", "Bulunduğunuz durumla ilgili eklemek istediğiniz bir şey var mı?", when("ekran", NEET)),
    // Karşılaştırma modülü
    single("cevre", "Yakın çevrenizde ne okuyan ne de çalışan genç var mı?", ["Evet, birden fazla", "Evet, bir kişi", "Hayır", "Bilmiyorum"], when("ekran", ...DIGER)),
    single("algiNeden", "Size göre gençlerin ne eğitimde ne de istihdamda olmasının en önemli nedeni nedir?", ["İş olanaklarının yetersizliği", "Düşük ücretler ve kötü çalışma koşulları", "Eğitim sisteminin iş piyasasına hazırlamaması", "Sınav sistemi ve uzun hazırlık süreçleri", "Aile içi bakım sorumlulukları", "Motivasyon ve gelecek kaygısı", "Ailelerin maddi desteği", "Diğer"], when("ekran", ...DIGER)),
    likert("lPolitikaAlgi", "Ne eğitimde ne istihdamda olan gençlerin sorunları kamu politikalarında yeterince yer almıyor.", when("ekran", ...DIGER)),
  ],
};

// ───────────────────────── 3. Öğrenci ihtiyaçları ve harcamalar ─────────────────────────
const s3: ResearchSurvey = {
  konu: "üniversite öğrencilerinin ihtiyaçları ve harcamaları",
  title: "Üniversite Öğrencilerinin Temel İhtiyaçları ve Aylık Harcama Örüntüleri Araştırması",
  category: "genclik-ve-universite",
  description:
    "Üniversite öğrencilerinin barınma, beslenme ve ulaşım gibi temel ihtiyaçlarını, gelir kaynaklarını ve aylık harcamalarını; ekonomik koşulların öğrenim yaşamına etkisini inceliyoruz. Ön lisans, lisans ve lisansüstü öğrencileri katılabilir. Anket yaklaşık 8 dakika sürer ve tamamen anonimdir.",
  purpose:
    "Araştırmanın amacı, Türkiye'deki yükseköğretim öğrencilerinin aylık gelir ve harcama yapısını, harcama kalemlerinin dağılımını, temel ihtiyaçların karşılanma düzeyini ve ekonomik kısıtların akademik yaşama etkisini ortaya koymak; bulguları barınma türü, üniversite türü, öğrenim düzeyi ve şehre göre karşılaştırarak öğrenci destek politikalarına veri sağlamaktır.\n\n" +
    "Araştırma soruları: (1) Öğrencilerin gelir kaynakları ve aylık gelir–gider düzeyleri nasıl dağılmaktadır? (2) Barınma, beslenme ve ulaşım harcamaları toplam harcama içinde nasıl bir yer tutmaktadır? (3) Öğrenciler ekonomik nedenlerle hangi yoksunlukları yaşamaktadır? (4) Ekonomik koşullar akademik başarı, okula devam ve gelecek kaygısıyla ilişkili midir?\n\n" +
    "Yöntem: Kesitsel tarama deseni; çevrim içi, gönüllülük esasına dayalı anket. Tutarlar, yanıt yükünü azaltmak ve gizliliği korumak için gruplandırılmış aralıklarla sorulur. Hizmet memnuniyeti 1–5 ölçeğiyle, tutumlar 5'li Likert maddeleriyle ölçülür; analizlerde betimsel istatistikler ve çapraz tablolar kullanılacaktır.",
  targetGroup: "Türkiye'deki üniversitelerde öğrenim gören ön lisans, lisans ve lisansüstü öğrencileri (18 yaş ve üzeri)",
  questions: [
    CINSIYET,
    single("yas", "Yaş grubunuz", ["18–20", "21–23", "24–26", "27 ve üzeri"]),
    single("duzey", "Öğrenim düzeyiniz", ["Ön lisans", "Lisans", "Yüksek lisans", "Doktora"]),
    single("sinif", "Sınıfınız", ["Hazırlık", "1. sınıf", "2. sınıf", "3. sınıf", "4. sınıf", "5. sınıf ve üzeri", "Lisansüstü"]),
    single("uniTur", "Üniversitenizin türü", ["Devlet üniversitesi", "Vakıf üniversitesi"]),
    single("alan", "Öğrenim gördüğünüz alan", ["Sağlık bilimleri", "Mühendislik ve teknik bilimler", "Fen bilimleri", "Sosyal ve beşerî bilimler", "İktisadi ve idari bilimler", "Eğitim bilimleri", "Hukuk", "Güzel sanatlar, iletişim ve tasarım", "Diğer"]),
    IL("Öğrenim gördüğünüz il"),
    single("barinma", "Öğrenim süresince nerede kalıyorsunuz?", ["KYK yurdu", "Özel yurt veya apart", "Ailemin yanında", "Arkadaşlarla kiralık evde", "Tek başıma kiralık evde", "Diğer"]),
    multi("gelirKaynak", "Gelir kaynaklarınız nelerdir?", ["Aile desteği", "KYK bursu veya kredisi", "Diğer burslar (vakıf, belediye, özel)", "Yarı zamanlı iş", "Tam zamanlı iş", "Kampüs içi kısmi zamanlı çalışma", "Birikimler", "Diğer"]),
    single("gelir", "Tüm kaynaklar dahil aylık toplam geliriniz ne kadar?", [TL("5.000'den az"), TL("5.000–9.999"), TL("10.000–14.999"), TL("15.000–19.999"), TL("20.000–29.999"), TL("30.000 ve üzeri")]),
    single("harcama", "Aylık toplam harcamanız ne kadar?", [TL("5.000'den az"), TL("5.000–9.999"), TL("10.000–14.999"), TL("15.000–19.999"), TL("20.000–29.999"), TL("30.000 ve üzeri")]),
    single("hBarinma", "Aylık barınma harcamanız (kira, yurt ücreti, aidat dahil) ne kadar?", ["Ödemiyorum", TL("3.000'den az"), TL("3.000–5.999"), TL("6.000–9.999"), TL("10.000–14.999"), TL("15.000 ve üzeri")]),
    single("hBeslenme", "Aylık beslenme harcamanız ne kadar?", [TL("3.000'den az"), TL("3.000–5.999"), TL("6.000–8.999"), TL("9.000–11.999"), TL("12.000 ve üzeri")]),
    single("hUlasim", "Aylık ulaşım harcamanız ne kadar?", ["Ödemiyorum / yürüyorum", TL("500'den az"), TL("500–999"), TL("1.000–1.999"), TL("2.000 ve üzeri")]),
    single("yeterlilik", "Geliriniz ay sonunu getirmeye ne ölçüde yetiyor?", ["Rahatlıkla yetiyor", "Yetiyor", "Zorlukla yetiyor", "Yetmiyor"]),
    multi("yoksunluk", "Son 3 ay içinde ekonomik nedenlerle aşağıdakilerden hangilerini yaşadınız?", ["Öğün atladım", "Ulaşım maliyeti nedeniyle derslere gitmekte zorlandım", "Ders kitabı veya materyal alamadım", "Sosyal ve kültürel etkinliklerden vazgeçtim", "Borçlandım (kredi kartı, KYK dışı borç vb.)", "Sağlık harcamamı erteledim", "Bunların hiçbirini yaşamadım"]),
    single("yemekhane", "Üniversite yemekhanesini ne sıklıkla kullanıyorsunuz?", ["Her gün", "Haftada birkaç kez", "Ayda birkaç kez", "Hiç kullanmıyorum", "Okulumda yemekhane yok"]),
    rate5("mBarinma", "Barınma koşullarınızdan ne kadar memnunsunuz?", "Hiç memnun değilim", "Çok memnunum"),
    rate5("mYemek", "Üniversitenizin yemek hizmetlerinden ne kadar memnunsunuz?", "Hiç memnun değilim", "Çok memnunum", { required: false, help: "Kullanmıyorsanız boş bırakınız." }),
    rate5("mUlasim", "Kampüse ulaşım olanaklarından ne kadar memnunsunuz?", "Hiç memnun değilim", "Çok memnunum"),
    rate5("mSosyal", "Kampüsteki sosyal, kültürel ve sportif olanaklardan ne kadar memnunsunuz?", "Hiç memnun değilim", "Çok memnunum"),
    multi("ihtiyac", "Size göre öğrenciler için en öncelikli ihtiyaçlar hangileridir?", ["Uygun fiyatlı barınma", "Uygun fiyatlı veya ücretsiz yemek", "Ulaşım indirimi", "Burs ve kredi miktarlarının artırılması", "Kampüste yarı zamanlı iş olanakları", "Psikolojik danışmanlık", "Kariyer ve staj desteği", "Çalışma alanları ve kütüphane", "Spor ve sosyal tesisler", "İnternet ve teknolojik donanım desteği"], { help: UC_SECIM }),
    likert("lBasari", "Ekonomik koşullar akademik başarımı olumsuz etkiliyor."),
    likert("lBirakma", "Ekonomik nedenlerle okulu bırakmayı veya dondurmayı düşündüm."),
    likert("lKaygi", "Mezun olduktan sonra iş bulma konusunda kaygılıyım."),
    open("oneri", "Öğrencilerin ekonomik koşullarının iyileştirilmesi için önerileriniz nelerdir?"),
  ],
};

// ───────────────────────── 4. Siyasi eğilimler ─────────────────────────
// Partiler alfabetik sırayla verilir (sıra etkisini azaltmak için); listedeki partiler yayına almadan önce güncellik açısından kontrol edilmelidir.
const PARTILER = ["AK Parti", "Büyük Birlik Partisi (BBP)", "Cumhuriyet Halk Partisi (CHP)", "DEM Parti", "DEVA Partisi", "Gelecek Partisi", "İYİ Parti", "Milliyetçi Hareket Partisi (MHP)", "Saadet Partisi", "Türkiye İşçi Partisi (TİP)", "Yeniden Refah Partisi", "Zafer Partisi", "Diğer"];
const s4: ResearchSurvey = {
  konu: "siyasete, liderlere ve partilere yönelik kamuoyu algısı",
  title: "Türkiye Siyasi Eğilimler Araştırması: Siyasete, Liderlere ve Partilere Yönelik Kamuoyu Algısı",
  category: "siyaset-ve-kamuoyu",
  description:
    "Seçmenlerin Türkiye'nin gündemine, siyasete ilgilerine, parti tercihlerine ve siyasi liderlere bakışlarını inceliyoruz. Hiçbir parti veya kişi adına yürütülmeyen, tarafsız bir kamuoyu araştırmasıdır. Anket yaklaşık 7 dakika sürer ve tamamen anonimdir.",
  purpose:
    "Araştırmanın amacı, 18 yaş ve üzeri seçmenlerin ülke gündemine ilişkin öncelik algılarını, siyasete ilgi ve haber alma kaynaklarını, parti tercihlerini ve tercihlerinin kesinliğini, siyasi liderlerin performansına ve liderlik niteliklerine yönelik değerlendirmelerini ve siyasal kurumlara güven düzeyini betimlemektir.\n\n" +
    "Araştırma soruları: (1) Seçmenler Türkiye'nin en önemli sorunu olarak neyi görmektedir? (2) Parti tercihleri ve tercih kesinliği demografik gruplara göre nasıl farklılaşmaktadır? (3) Seçmenler siyasi liderlerin performansını ve hangi liderlik niteliklerini önemsemektedir? (4) Siyasal temsil ve seçimlere ilişkin tutumlar nasıldır?\n\n" +
    "Yöntem: Kesitsel tarama deseni; çevrim içi, gönüllülük esasına dayalı anket. Oy niyeti “Bu pazar seçim olsa” sorusuyla, geçmiş oy davranışı 2023 seçimi üzerinden sorulur; geçmiş oy, örneklem yapısının değerlendirilmesi ve ağırlıklandırma amacıyla kullanılır. Parti seçenekleri alfabetik sıradadır; en güvenilen lider sorusu, yönlendirmeyi önlemek için açık uçlu (kendiliğinden hatırlama) olarak sorulur. Sonuçlar gönüllü katılımcıların görüşlerini yansıtır, seçmen kitlesini temsil ettiği iddia edilmez ve seçim tahmini olarak yorumlanamaz.",
  targetGroup: "Türkiye'de yaşayan 18 yaş ve üzeri seçmenler",
  questions: [
    CINSIYET,
    YAS_YETISKIN,
    EGITIM,
    IL(),
    YERLESIM,
    single("calisma", "Çalışma durumunuz", ["Kamu sektöründe çalışıyorum", "Özel sektörde çalışıyorum", "Kendi işimi yapıyorum", "Öğrenciyim", "Ev hanımı / ev erkeğiyim", "Emekliyim", "İş arıyorum", "Diğer"]),
    single("sorun", "Size göre Türkiye'nin şu anki en önemli sorunu nedir?", ["Ekonomi ve hayat pahalılığı", "İşsizlik", "Eğitim", "Adalet ve hukukun üstünlüğü", "Terör ve güvenlik", "Sığınmacılar ve düzensiz göç", "Yolsuzluk", "Sağlık hizmetleri", "Deprem ve afet hazırlığı", "Dış politika", "Diğer"]),
    single("yon", "Genel olarak Türkiye'nin doğru yönde mi, yanlış yönde mi gittiğini düşünüyorsunuz?", ["Doğru yönde", "Yanlış yönde", "Fikrim yok"]),
    single("ilgi", "Siyasete ne kadar ilgilisiniz?", ["Çok ilgiliyim", "İlgiliyim", "Az ilgiliyim", "Hiç ilgili değilim"]),
    single("kaynak", "Siyasi gelişmeleri en çok hangi kaynaktan takip ediyorsunuz?", ["Televizyon", "Sosyal medya", "İnternet haber siteleri", "Gazete", "YouTube ve podcast yayınları", "Aile ve yakın çevre", "Takip etmiyorum"]),
    single("oyNiyet", "Bu pazar milletvekili genel seçimi olsa hangi partiye oy verirsiniz?", [...PARTILER, "Kararsızım", "Oy kullanmayacağım", "Cevap vermek istemiyorum"], { help: "Partiler alfabetik sırayla listelenmiştir." }),
    single("kesinlik", "Bu tercihiniz ne kadar kesin?", ["Kesin, değişmez", "Büyük ölçüde kesin", "Değişebilir"], when("oyNiyet", ...PARTILER)),
    single("oy2023", "14 Mayıs 2023 milletvekili genel seçiminde hangi partiye oy verdiniz?", [...PARTILER, "Oy kullanmadım", "O tarihte oy kullanma yaşında değildim", "Hatırlamıyorum", "Cevap vermek istemiyorum"]),
    single("oyEtken", "Oy verirken en çok neye dikkat edersiniz?", ["Parti programı ve politikaları", "Parti lideri", "Aday listeleri ve yerel adaylar", "Ekonomiyi yönetme becerisi", "İdeolojik ve dünya görüşü yakınlığı", "Aile ve yakın çevrenin görüşü", "Diğer"]),
    rate5("cbPerformans", "Cumhurbaşkanının görev performansını nasıl değerlendiriyorsunuz?", "Çok başarısız", "Çok başarılı"),
    rate5("muhalefetPerformans", "Ana muhalefet partisi genel başkanının performansını nasıl değerlendiriyorsunuz?", "Çok başarısız", "Çok başarılı"),
    open("guvenilenLider", "Türkiye'de en çok güvendiğiniz siyasi lider kimdir?", { short: true, help: "Yazmak istemiyorsanız boş bırakabilirsiniz." }),
    single("liderOzellik", "Bir siyasi liderde en önemli bulduğunuz özellik hangisidir?", ["Dürüstlük", "Ekonomiyi yönetme becerisi", "Kararlılık ve güçlü liderlik", "Halka yakınlık", "Uzlaşmacılık", "Vizyon ve proje üretme", "Eğitim ve bilgi birikimi", "Diğer"]),
    rate5("partiGuven", "Siyasi partilere genel olarak ne kadar güveniyorsunuz?", "Hiç güvenmiyorum", "Tamamen güveniyorum"),
    likert("lTemsil", "Siyasi partiler vatandaşların sorunlarını yeterince temsil ediyor."),
    likert("lSecim", "Türkiye'de seçimler adil ve özgür bir ortamda yapılıyor."),
    likert("lYeniParti", "Türkiye'de yeni bir siyasi partiye ihtiyaç var."),
    likert("lEkonomiCozum", "Mevcut partilerden en az biri ekonomik sorunları çözebilecek kapasitededir."),
  ],
};

// ───────────────────────── 5. Yerel yönetimler ─────────────────────────
const MEM = ["Hiç memnun değilim", "Çok memnunum"] as const;
const hizmet = (id: string, ad: string) => rate5(id, `${ad} hizmetlerinden ne kadar memnunsunuz?`, MEM[0], MEM[1], { required: false, help: "Bu hizmeti kullanmıyor veya değerlendiremiyorsanız boş bırakınız." });
const s5: ResearchSurvey = {
  konu: "yerel yönetim hizmetlerinden beklenti ve memnuniyet",
  title: "Yerel Yönetim Hizmetlerinden Beklenti ve Memnuniyet Araştırması",
  category: "yerel-yonetimler-ve-kalkinma",
  description:
    "Yaşadığınız ildeki ve ilçedeki belediye hizmetlerinden memnuniyetinizi, önceliklerinizi ve belediyenizle ilişkinizi inceliyoruz. Bulgular yerel hizmetlerin iyileştirilmesine yönelik önerilere dönüştürülecektir. Anket yaklaşık 8 dakika sürer ve tamamen anonimdir.",
  purpose:
    "Araştırmanın amacı, vatandaşların belediye hizmetlerine ilişkin genel ve hizmet alanı bazında memnuniyet düzeylerini, yerel yönetimlerden beklentilerini ve öncelik alanlarını, belediyelerle iletişim ve başvuru deneyimlerini, katılım, şeffaflık ve güven algılarını belirlemek; sonuçları il, ilçe, yaş, cinsiyet ve öğrenim düzeyine göre karşılaştırmaktır.\n\n" +
    "Araştırma soruları: (1) Vatandaşlar belediye hizmetlerinden genel olarak ve hizmet alanlarına göre ne ölçüde memnundur? (2) Yerel yönetimlerden öncelikli beklentiler nelerdir? (3) Belediyeye yapılan başvurular hangi kanallardan iletilmekte ve nasıl sonuçlanmaktadır? (4) Katılım, şeffaflık, hakkaniyet ve afet hazırlığına ilişkin algılar demografik gruplara göre farklılaşmakta mıdır?\n\n" +
    "Yöntem: Kesitsel tarama deseni; çevrim içi, gönüllülük esasına dayalı anket. Hizmet memnuniyeti dokuz hizmet alanında 1–5 ölçeğiyle; yönetişim algıları 5'li Likert maddeleriyle ölçülür. Başvuru deneyimi soruları koşullu dallanmayla yalnızca başvuru yapan katılımcılara yöneltilir. Analizlerde betimsel istatistikler, çapraz tablolar ve memnuniyet–önem karşılaştırması kullanılacaktır.",
  targetGroup: "Türkiye'de yaşayan 18 yaş ve üzeri vatandaşlar",
  questions: [
    CINSIYET,
    YAS_YETISKIN,
    EGITIM,
    IL(),
    open("ilce", "Yaşadığınız ilçe", { short: true, required: true, help: "Yalnızca ilçe adını yazınız (ör. Üsküdar). Mahalle veya adres yazmayınız." }),
    single("ikamet", "Bu ilçede ne kadar süredir yaşıyorsunuz?", ["1 yıldan az", "1–5 yıl", "5–10 yıl", "10 yıldan fazla"]),
    single("konut", "Oturduğunuz konut", ["Kendime / aileme ait", "Kira", "Lojman veya diğer"]),
    rate5("genelMemnuniyet", "Belediye hizmetlerinden genel olarak ne kadar memnunsunuz?", MEM[0], MEM[1]),
    hizmet("mTemizlik", "Temizlik ve çöp toplama"),
    hizmet("mYol", "Yol, kaldırım ve altyapı"),
    hizmet("mUlasim", "Toplu ulaşım ve trafik düzenlemesi"),
    hizmet("mPark", "Park, yeşil alan ve spor alanı"),
    hizmet("mSu", "Su ve kanalizasyon"),
    hizmet("mSosyal", "Sosyal yardım ve sosyal hizmet"),
    hizmet("mKultur", "Kültür, sanat ve gençlik etkinliği"),
    hizmet("mImar", "İmar, ruhsat ve belediye işlemleri"),
    hizmet("mAfet", "Afet ve acil durum hazırlığı"),
    multi("oncelik", "Belediyenizin önümüzdeki dönemde öncelik vermesi gereken alanlar hangileridir?", ["Kentsel dönüşüm ve depreme dayanıklı yapılar", "Uygun fiyatlı konut", "Toplu ulaşım", "Trafik ve otopark", "Park ve yeşil alanlar", "Temizlik", "Sosyal yardımlar", "Gençlere yönelik hizmetler", "Kreş ve çocuk hizmetleri", "Yaşlı ve engelli hizmetleri", "Kültür ve sanat", "Çevre ve iklim", "İstihdam ve girişimcilik desteği"], { help: UC_SECIM }),
    single("basvuru", "Son 12 ay içinde belediyenize bir talep, öneri veya şikâyet ilettiniz mi?", ["Evet", "Hayır"]),
    multi("kanal", "Hangi kanalı kullandınız?", ["Beyaz Masa veya çağrı merkezi", "Belediyenin web sitesi veya mobil uygulaması", "Sosyal medya", "Belediyeye bizzat başvuru", "CİMER", "Muhtarlık aracılığıyla", "Diğer"], when("basvuru", "Evet")),
    single("sonuc", "Başvurunuz nasıl sonuçlandı?", ["Olumlu sonuçlandı", "Kısmen sonuçlandı", "Olumsuz sonuçlandı", "Hiç geri dönüş olmadı"], when("basvuru", "Evet")),
    likert("lKatilim", "Belediyem, kararlara vatandaşların katılımı için yeterli olanak sunuyor."),
    likert("lSeffaf", "Belediyem kaynaklarını şeffaf ve hesap verebilir biçimde kullanıyor."),
    likert("lAdalet", "Belediye hizmetleri mahalleler arasında adil biçimde dağıtılıyor."),
    likert("lAfet", "Yaşadığım ilçe deprem ve diğer afetlere karşı hazırlıklıdır."),
    likert("lGuven", "Belediyeme güveniyorum."),
    rate5("yasamMemnuniyet", "Yaşadığınız ilçede yaşamaktan genel olarak ne kadar memnunsunuz?", MEM[0], MEM[1]),
    open("sorun", "Sizce ilçenizin en önemli sorunu nedir?"),
  ],
};

publishSurveys([s1, s2, s3, s4, s5]).catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
