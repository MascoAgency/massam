import { prisma } from "@/lib/db";
import { fail, ok, readJson } from "@/lib/api";
import { randomToken, sha256 } from "@/lib/ids";

const AGE_GROUPS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

/** Araştırma topluluğu: gelecekteki araştırmalara davet almak isteyen gönüllü kaydı (açık rıza ile) */
export async function POST(req: Request) {
  const b = await readJson<{ email?: string; name?: string; city?: string; ageGroup?: string; interests?: unknown; consent?: boolean; website?: string }>(req);
  if (b.website) return ok(); // bot tuzağı
  const email = String(b.email || "").trim().toLowerCase().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, "Geçerli bir e-posta adresi girin.");
  if (!b.consent) return fail(400, "Kayıt için açık rıza metnini onaylamanız gerekir.");
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "yerel";
  const ipHash = sha256(ip + "|" + (process.env.AUTH_SECRET || "")).slice(0, 32);
  const recent = await prisma.volunteer.count({ where: { ipHash, createdAt: { gte: new Date(Date.now() - 3600_000) } } });
  if (recent >= 10) return fail(429, "Çok sayıda kayıt denemesi yapıldı. Lütfen daha sonra yeniden deneyin.");
  const cats = await prisma.category.findMany({ select: { slug: true } });
  const interests = Array.isArray(b.interests) ? b.interests.map(String).filter((s) => cats.some((c) => c.slug === s)).slice(0, 20) : [];
  const data = {
    name: String(b.name || "").trim().slice(0, 120),
    city: String(b.city || "").trim().slice(0, 60),
    ageGroup: AGE_GROUPS.includes(String(b.ageGroup)) ? String(b.ageGroup) : "",
    interests,
    consentAt: new Date(),
    ipHash,
  };
  // Aynı e-posta yeniden kayıt olursa bilgileri güncellenir ve kayıt yeniden etkinleşir (var olup olmadığı açığa vurulmaz)
  await prisma.volunteer.upsert({
    where: { email },
    update: { ...data, unsubscribedAt: null },
    create: { ...data, email, unsubscribeToken: randomToken() },
  });
  return ok({ ok: true }, { status: 201 });
}
