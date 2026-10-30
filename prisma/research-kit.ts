/** Araştırma anketleri için ortak ölçme araçları ve yayına alma yardımcısı (prisma/research-*.ts betikleri kullanır) */
import { PrismaClient } from "@prisma/client";
import { sanitizeQuestions } from "../src/lib/survey";
import { randomBytes } from "crypto";

// ───────────────────────── Ortak ölçme araçları ─────────────────────────
export type Q = Record<string, unknown>;
export const single = (id: string, title: string, options: string[], o: Partial<Q> = {}): Q => ({ id, type: "single", title, options, required: true, ...o });
export const multi = (id: string, title: string, options: string[], o: Partial<Q> = {}): Q => ({ id, type: "multi", title, options, required: true, ...o });
export const likert = (id: string, title: string, o: Partial<Q> = {}): Q => ({ id, type: "likert", title, scale: 5, required: true, ...o });
export const rate5 = (id: string, title: string, min: string, max: string, o: Partial<Q> = {}): Q => ({ id, type: "rating", title, max: 5, minLabel: min, maxLabel: max, required: true, ...o });
export const rate10 = (id: string, title: string, min: string, max: string, o: Partial<Q> = {}): Q => ({ id, type: "rating", title, max: 10, minLabel: min, maxLabel: max, required: true, ...o });
export const open = (id: string, title: string, o: Partial<Q> = {}): Q => ({ id, type: "open", title, required: false, ...o });
export const when = (q: string, ...values: string[]) => ({ showIf: { q, values } });

export const ILLER = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl",
  "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun",
  "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale", "Kırklareli",
  "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt",
  "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak",
];
if (ILLER.length !== 81) throw new Error("İl listesi 81 olmalı: " + ILLER.length);

export const CINSIYET = single("cinsiyet", "Cinsiyetiniz", ["Kadın", "Erkek", "Belirtmek istemiyorum"]);
export const YAS_GENC = single("yas", "Yaş grubunuz", ["18–20", "21–24", "25–29"]);
export const YAS_YETISKIN = single("yas", "Yaş grubunuz", ["18–24", "25–34", "35–44", "45–54", "55–64", "65 ve üzeri"]);
export const EGITIM = single("egitim", "Tamamladığınız en son öğrenim düzeyi", ["İlkokul veya altı", "Ortaokul / ilköğretim", "Lise veya dengi", "Ön lisans", "Lisans", "Yüksek lisans veya doktora"]);
export const IL = (title = "Yaşadığınız il") => single("il", title, ILLER, { help: "Listeden seçiniz." });
export const YERLESIM = single("yerlesim", "Yaşadığınız yerleşim yeri", ["Büyükşehir / il merkezi", "İlçe merkezi", "Belde veya köy"]);
export const UC_SECIM = "En fazla üç seçenek işaretleyiniz.";

export const CONSENT = (konu: string) =>
  `Bu anket, MASSAM Araştırma tarafından ${konu} konusunda bilimsel amaçla yürütülen bir araştırmanın parçasıdır.\n\n` +
  "• Katılım tamamen gönüllüdür ve yalnızca 18 yaşını doldurmuş kişilere açıktır.\n" +
  "• Ankete katılım üyelikle yapılır ve ad soyad bilgisi kesinlikle istenmez. E-posta adresiniz yalnızca üyelik doğrulaması ve her üyenin bir kez katılmasını sağlamak için kullanılır. Yaş, cinsiyet ve eğitim durumunuz yalnızca araştırma metodolojisinin ve politika önerilerinin sağlamlığı için istenir. Anket yanıtlarınız e-posta adresinizle eşleştirilmeden, ayrı olarak kaydedilir. Ankette telefon, T.C. kimlik numarası gibi kimlik bilgileri sorulmaz.\n" +
  "• Yanıtlar anonim olarak kaydedilir, yalnızca toplu istatistikler hâlinde analiz edilir ve raporlanır; tek tek yanıtlar hiçbir şekilde paylaşılmaz.\n" +
  "• Zorunlu olmayan soruları boş bırakabilir, ankete istediğiniz anda son verebilirsiniz.\n" +
  "Devam ederek bu koşulları okuduğunuzu ve araştırmaya gönüllü olarak katıldığınızı onaylamış olursunuz.";

export const THANKS = "Katılımınız için teşekkür ederiz. Yanıtlarınız kimliğinizle eşleştirilmeden kaydedildi. Araştırmanın sonuçları, veri toplama ve analiz süreci tamamlandıktan sonra Araştırma Sonuçları sayfasında yayımlanacaktır.";


export const TL = (a: string) => a + " TL";

export type ResearchSurvey = { title: string; konu: string; category: string; description: string; purpose: string; targetGroup: string; questions: Q[] };

/** Anketleri platform anketi olarak yayına alır; aynı başlıklı anket varsa atlar */
export async function publishSurveys(list: ResearchSurvey[], endsAt = new Date("2026-12-31T23:59:00+03:00")) {
  const prisma = new PrismaClient();
  try {
    const owner = await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
    if (!owner) throw new Error("Yönetici kullanıcı bulunamadı.");
    for (const s of list) {
      if (await prisma.survey.findFirst({ where: { title: s.title } })) {
        console.log("Zaten var, atlandı:", s.title);
        continue;
      }
      const { questions, error } = sanitizeQuestions(s.questions);
      if (error) throw new Error(`${s.title}: ${error}`);
      const lost = s.questions.filter((q) => q.showIf).length - questions!.filter((q) => q.showIf).length;
      if (lost) throw new Error(`${s.title}: ${lost} koşul bağlantısı doğrulanamadı`);
      const cat = await prisma.category.findUnique({ where: { slug: s.category } });
      if (!cat) throw new Error("Araştırma alanı yok: " + s.category);
      const slug = () => randomBytes(6).toString("base64url").replace(/[-_]/g, "x").slice(0, 8);
      let sl = slug();
      while (await prisma.survey.findUnique({ where: { slug: sl } })) sl = slug();
      await prisma.survey.create({
        data: {
          slug: sl,
          title: s.title,
          description: s.description,
          thankYou: THANKS,
          purpose: s.purpose,
          targetGroup: s.targetGroup,
          consentText: CONSENT(s.konu),
          questions: questions as object[],
          status: "open",
          isPlatform: true,
          categoryId: cat.id,
          ownerId: owner.id,
          startsAt: new Date(),
          endsAt,
        },
      });
      console.log(`Yayına alındı: ${s.title} (${questions!.length} soru, /s/${sl})`);
    }
  } finally {
    await prisma.$disconnect();
  }
}
