/**
 * Katılımcı profili: yaş, cinsiyet ve eğitim durumu.
 * Ad soyad istenmez. Bu bilgiler yalnızca örneklemin dağılımını izlemek ve sonuçları
 * yaş, cinsiyet ve eğitime göre ağırlıklandırıp karşılaştırmak (araştırma metodolojisinin
 * ve politika önerilerinin sağlamlığı) için kullanılır.
 * Yanıta yalnızca yaş grubu, cinsiyet ve eğitim kopyalanır; yanıt ile üye arasında bağlantı tutulmaz.
 */
export const GENDERS = ["Kadın", "Erkek", "Belirtmek istemiyorum"] as const;
export const EDUCATIONS = ["İlkokul veya altı", "Ortaokul / ilköğretim", "Lise veya dengi", "Ön lisans", "Lisans", "Yüksek lisans veya doktora"] as const;
export const AGE_GROUPS = ["18–24", "25–34", "35–44", "45–54", "55–64", "65 ve üzeri"] as const;
export const MIN_AGE = 18;
export const MAX_AGE = 100;

export const DEMOGRAPHICS_NOTICE =
  "Ad soyad bilgisi kesinlikle istenmez. Yaş, cinsiyet ve eğitim durumu yalnızca araştırma metodolojisinin ve politika önerilerinin sağlamlığı için, örneklemin toplumu ne ölçüde yansıttığını görmek ve sonuçları gruplara göre karşılaştırmak amacıyla istenir.";

export type Demographics = { ageGroup: string; gender: string; education: string };

const thisYear = () => new Date().getFullYear();
export const ageOf = (birthYear: number) => thisYear() - birthYear;

export function ageGroup(age: number) {
  if (age < 25) return AGE_GROUPS[0];
  if (age < 35) return AGE_GROUPS[1];
  if (age < 45) return AGE_GROUPS[2];
  if (age < 55) return AGE_GROUPS[3];
  if (age < 65) return AGE_GROUPS[4];
  return AGE_GROUPS[5];
}

/** Formdan gelen yaş, cinsiyet ve eğitimi doğrular; hata varsa mesaj döner */
export function parseDemographics(b: { age?: unknown; gender?: unknown; education?: unknown }) {
  const age = Number(b.age);
  const gender = String(b.gender ?? "");
  const education = String(b.education ?? "");
  if (!Number.isInteger(age) || age < 1 || age > MAX_AGE) return { error: "Yaşınızı rakamla yazın." } as const;
  if (age < MIN_AGE) return { error: "Anketlerimiz yalnızca 18 yaşını doldurmuş kişilere açıktır." } as const;
  if (!(GENDERS as readonly string[]).includes(gender)) return { error: "Cinsiyet seçeneklerinden birini işaretleyin." } as const;
  if (!(EDUCATIONS as readonly string[]).includes(education)) return { error: "Eğitim durumunuzu seçin." } as const;
  return { data: { birthYear: thisYear() - age, gender, education, demographicsAt: new Date() } } as const;
}

type Profile = { birthYear: number | null; gender: string | null; education: string | null };
export const hasDemographics = (u: Profile) => !!(u.birthYear && u.gender && u.education);

/** Yanıta eklenecek kimliksiz özet (kesin yaş değil, yaş grubu) */
export const snapshot = (u: Profile): Demographics | null =>
  hasDemographics(u) ? { ageGroup: ageGroup(ageOf(u.birthYear!)), gender: u.gender!, education: u.education! } : null;
