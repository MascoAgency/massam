import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL, AIUnavailable } from "./ai";

/** Araştırma Merkezi Asistanı: yalnızca araştırma tasarımı, yöntem, ölçme, analiz ve raporlama konularında yardım eder. */
const SYSTEM = `Sen MASSAM (Millî Adalet, Siyaset ve Strateji Araştırmaları Merkezi) Araştırma Merkezi Asistanısın. Merkezin araştırma ekibine yardım edersin.

UZMANLIK ALANIN
Akademik, siyasal, toplumsal, finansal, yönetsel ve pazarlama odaklı araştırmaların neredeyse tamamında deneyimli bir araştırma metodoloğusun:
- Araştırma tasarımı: problem ve amaç tanımı, araştırma soruları, hipotezler, kavramsallaştırma ve işlevselleştirme
- Yöntemler: nicel (anket, deney, panel, kesitsel/boylamsal), nitel (derinlemesine görüşme, odak grup, etnografi, içerik ve söylem analizi), karma yöntem, vaka çalışması, saha araştırması, kamuoyu ve seçmen araştırmaları, pazar ve tüketici araştırmaları, müşteri memnuniyeti, marka algısı, fiyat duyarlılığı (Van Westendorp, conjoint), finansal ve ekonomik araştırmalar, kurumsal ve kamu yönetimi araştırmaları, politika analizi ve etki değerlendirmesi
- Örnekleme: olasılıklı/olasılıksız örnekleme, kota, küme ve tabakalı örnekleme, örneklem büyüklüğü ve hata payı hesabı, ağırlıklandırma
- Ölçme: soru yazımı, ölçek geliştirme, Likert ve diğer ölçekler, geçerlik ve güvenirlik (Cronbach alfa, faktör analizi), yanlılık türleri ve önleme
- Analiz: betimsel istatistik, çapraz tablolar, ki-kare, t-testi, ANOVA, korelasyon, regresyon, faktör ve kümeleme analizi, SPSS/R/Python kullanımı, nitel kodlama
- Raporlama: bulguların sunumu, grafik seçimi, sınırlılıklar, kaynakça (APA vb.), yönetici özeti, politika notu
- Araştırma etiği: bilgilendirilmiş onam, anonimlik, KVKK uyumu, hassas gruplarla çalışma

KAPSAM KURALI
Yalnızca araştırma faaliyetleriyle ilgili sorulara cevap ver. Araştırmayla ilgisi olmayan taleplerde (genel sohbet, kod yazımı, ödev çözme, kişisel tavsiye, güncel siyasi görüş bildirme vb.) kısa ve nazik bir cümleyle bu konuda yardımcı olamayacağını söyle ve araştırmayla ilgili nasıl destek olabileceğini öner.

İLKELER
- Türkçe, açık ve uygulanabilir yaz. Gerektiğinde başlık ve madde işaretleri kullan; gereksiz uzatma.
- Siyasi konularda tarafsız kal: hiçbir parti, aday veya ideoloji lehine ya da aleyhine görüş bildirme; yalnızca yöntem ve ölçme açısından yardım et.
- Veri, istatistik veya kaynak uydurma. Bilmediğin bir sayıyı tahmin olarak sunma; kaynak önerirken genel literatüre işaret et.
- Yönlendirici, çift anlamlı veya çift soru içeren anket maddelerini fark edip düzelt.
- Kullanıcı bir araştırma fikri anlattığında yöntem, hedef kitle, örneklem ve soru önerileri sun; fikrin ankete dönüştürülmesini isterse ekrandaki "Örnek ankete dönüştür" düğmesini kullanabileceğini hatırlat.`;

export type ChatMsg = { role: "user" | "assistant"; content: string };

const client = () => {
  if (!process.env.ANTHROPIC_API_KEY) throw new AIUnavailable("no_key");
  return new Anthropic({ maxRetries: 2 });
};

function mapError(e: unknown): never {
  if (e instanceof AIUnavailable) throw e;
  if (e instanceof Anthropic.RateLimitError) throw new AIUnavailable("rate_limited");
  if (e instanceof Anthropic.APIError) {
    console.error("Asistan API hatası:", e.status, e.message);
    throw new AIUnavailable(e.status === 529 ? "rate_limited" : "failed", e.message);
  }
  console.error("Asistan hatası:", e);
  throw new AIUnavailable("failed");
}

const textOf = (content: { type: string; text?: string }[]) => content.map((b) => (b.type === "text" ? b.text || "" : "")).join("");

/** Sohbet yanıtı */
export async function assistantReply(messages: ChatMsg[]): Promise<string> {
  const c = client();
  try {
    const msg = await c.messages
      .stream({
        model: AI_MODEL,
        max_tokens: 6000,
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        system: SYSTEM,
        messages,
      } as unknown as Parameters<typeof c.messages.stream>[0])
      .finalMessage();
    if (msg.stop_reason === "refusal") throw new AIUnavailable("refusal");
    return textOf(msg.content as { type: string; text?: string }[]).trim();
  } catch (e) {
    mapError(e);
  }
}

const str = { type: "string" } as const;
function surveySchema(categorySlugs: string[]) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["inScope", "title", "description", "purpose", "targetGroup", "consentText", "thankYou", "categorySlug", "methodNote", "questions"],
    properties: {
      inScope: { type: "boolean", description: "Fikir bir araştırma/anket konusu ise true" },
      title: str,
      description: str,
      purpose: str,
      targetGroup: str,
      consentText: str,
      thankYou: str,
      categorySlug: { type: "string", enum: [...categorySlugs, ""] },
      methodNote: { type: "string", description: "Önerilen yöntem, örneklem ve uygulama notları (yönetici için)" },
      questions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["type", "title", "help", "required", "options", "scale", "max", "minLabel", "maxLabel"],
          properties: {
            type: { type: "string", enum: ["single", "multi", "open", "likert", "rating"] },
            title: str,
            help: str,
            required: { type: "boolean" },
            options: { type: "array", items: str },
            scale: { type: "integer", enum: [5, 7] },
            max: { type: "integer", enum: [5, 10] },
            minLabel: str,
            maxLabel: str,
          },
        },
      },
    },
  };
}

export type SurveyDraft = {
  inScope: boolean;
  title: string;
  description: string;
  purpose: string;
  targetGroup: string;
  consentText: string;
  thankYou: string;
  categorySlug: string;
  methodNote: string;
  questions: { type: string; title: string; help: string; required: boolean; options: string[]; scale: number; max: number; minLabel: string; maxLabel: string }[];
};

/** Araştırma fikrinden örnek anket taslağı üretir */
export async function draftSurvey(idea: string, context: ChatMsg[], categories: { slug: string; name: string }[], questionCount: number): Promise<SurveyDraft> {
  const c = client();
  const catList = categories.map((x) => `${x.slug}: ${x.name}`).join("\n");
  const prompt = `Aşağıdaki araştırma fikrini, MASSAM Araştırma platformunda yayımlanacak örnek bir çevrim içi ankete dönüştür.

KURALLAR
- Fikir bir araştırma/anket konusu değilse inScope=false döndür, diğer alanları boş bırak.
- Yaklaşık ${questionCount} soru hazırla (en az 5, en çok 25). İlk sorular kısa demografik/profil soruları olabilir; ardından araştırma sorularına hizmet eden maddeler gelsin.
- Soru türleri: single (tek seçim), multi (çoklu seçim), open (açık uçlu), likert (katılım ölçeği; scale 5 veya 7), rating (puanlama; max 5 veya 10, minLabel/maxLabel ile).
- single ve multi sorularda 2-8 seçenek yaz; gerekiyorsa "Diğer" veya "Fikrim yok" ekle. Diğer türlerde options boş dizi olsun. Likert dışı sorularda scale=5, rating dışı sorularda max=10 yaz ve etiketleri boş bırak.
- Yönlendirici, çift anlamlı veya iki şeyi birden soran madde yazma. Kişiyi tanımlayıcı bilgi (ad, telefon, T.C. kimlik no, e-posta) isteme.
- Siyasi konularda tarafsız ifadeler kullan.
- consentText: katılımın gönüllü ve anonim olduğunu, verilerin yalnızca toplu olarak bilimsel amaçla kullanılacağını belirten 2-3 cümle.
- categorySlug: aşağıdaki listeden en uygun alan (uygun yoksa boş).
- methodNote: önerilen örneklem, hedef katılımcı sayısı, uygulama süresi ve dikkat edilecek noktalar (4-6 cümle).
- Tüm metinler Türkçe.

ARAŞTIRMA ALANLARI
${catList}

FİKİR
${idea}`;
  const messages: ChatMsg[] = [...context.slice(-8), { role: "user", content: prompt }];
  try {
    const msg = await c.messages
      .stream({
        model: AI_MODEL,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        output_config: { effort: "medium", format: { type: "json_schema", schema: surveySchema(categories.map((x) => x.slug)) } },
        system: SYSTEM,
        messages,
      } as unknown as Parameters<typeof c.messages.stream>[0])
      .finalMessage();
    if (msg.stop_reason === "refusal") throw new AIUnavailable("refusal");
    if (msg.stop_reason === "max_tokens") throw new AIUnavailable("failed", "Yanıt token sınırında kesildi");
    return JSON.parse(textOf(msg.content as { type: string; text?: string }[])) as SurveyDraft;
  } catch (e) {
    mapError(e);
  }
}
