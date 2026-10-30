/**
 * Üyelikle katılıma geçiş (tek seferlik, tekrar çalıştırılabilir):
 * - Mevcut kullanıcıları e-posta doğrulanmış sayar (yönetici ve araştırmacı hesapları kilitlenmesin).
 * - Mevcut anketlerin onam ve teşekkür metinlerindeki "kimlik bilgisi istenmez" ifadesini üyelik açıklamasıyla değiştirir
 *   (ad soyad istenmez; yaş, cinsiyet ve eğitim durumu metodoloji için istenir).
 * Yanıtlara ve anket sorularına dokunmaz.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const OLD_CONSENT =
  "• Ad, soyad, telefon, e-posta, T.C. kimlik numarası gibi kimliğinizi belirleyen hiçbir bilgi istenmez; IP adresiniz açık olarak kaydedilmez; yalnızca tekrarlanan gönderimleri önlemek için geri çevrilemez biçimde şifrelenmiş kısa bir değer tutulur.";
const MID_CONSENT = // ilk üyelik sürümündeki metin (ad soyad istenen)
  "• Ankete katılım üyelikle yapılır. Ad soyad ve e-posta bilgileriniz yalnızca üyelik doğrulaması ve her üyenin bir kez katılmasını sağlamak için kullanılır; anket yanıtlarınız bu bilgilerle eşleştirilmeden, ayrı olarak kaydedilir. Ankette telefon, T.C. kimlik numarası gibi kimlik bilgileri sorulmaz.";
const NEW_CONSENT =
  "• Ankete katılım üyelikle yapılır ve ad soyad bilgisi kesinlikle istenmez. E-posta adresiniz yalnızca üyelik doğrulaması ve her üyenin bir kez katılmasını sağlamak için kullanılır. Yaş, cinsiyet ve eğitim durumunuz yalnızca araştırma metodolojisinin ve politika önerilerinin sağlamlığı için istenir. Anket yanıtlarınız e-posta adresinizle eşleştirilmeden, ayrı olarak kaydedilir. Ankette telefon, T.C. kimlik numarası gibi kimlik bilgileri sorulmaz.";
const OLD_THANKS = "Yanıtlarınız anonim olarak kaydedildi.";
const NEW_THANKS = "Yanıtlarınız kimliğinizle eşleştirilmeden kaydedildi.";

async function main() {
  const v = await prisma.user.updateMany({ where: { emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } });
  console.log("Doğrulanmış sayılan mevcut kullanıcı:", v.count);
  const surveys = await prisma.survey.findMany({ select: { id: true, title: true, consentText: true, thankYou: true } });
  let n = 0;
  for (const s of surveys) {
    const consentText = s.consentText.split(OLD_CONSENT).join(NEW_CONSENT).split(MID_CONSENT).join(NEW_CONSENT);
    const thankYou = s.thankYou.split(OLD_THANKS).join(NEW_THANKS);
    if (consentText !== s.consentText || thankYou !== s.thankYou) {
      await prisma.survey.update({ where: { id: s.id }, data: { consentText, thankYou } });
      n++;
      console.log("  güncellendi:", s.title);
    }
  }
  console.log("Onam metni güncellenen anket:", n, "/", surveys.length);
}

main().finally(() => prisma.$disconnect());
