import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { DEFAULT_PLANS, DEFAULT_HOME, DEFAULT_CATEGORIES, exampleSurvey } from "../src/lib/defaults";
import { SEED_FINDINGS } from "../src/lib/findings-seed";

const prisma = new PrismaClient();
const slug = () => randomBytes(6).toString("base64url").replace(/[-_]/g, "x").slice(0, 8);

async function upsertUser(email: string, password: string, name: string, role: "ADMIN" | "USER", planId: string, institution: string) {
  const e = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: e } });
  if (existing) return existing;
  return prisma.user.create({ data: { email: e, name, role, planId, institution, passwordHash: await bcrypt.hash(password, 11) } });
}

async function main() {
  for (const p of DEFAULT_PLANS) await prisma.plan.upsert({ where: { id: p.id }, update: {}, create: p });
  await prisma.siteSetting.upsert({ where: { key: "home" }, update: {}, create: { key: "home", value: DEFAULT_HOME as object } });
  // Araştırma alanları: yalnızca eksik olanlar eklenir, yönetimden yapılan düzenlemeler korunur
  for (const [i, c] of DEFAULT_CATEGORIES.entries()) await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: { ...c, sortOrder: i } });
  // MASKDER raporlarından veriler: yalnızca eksik olanlar eklenir
  for (const { categorySlug, ...f } of SEED_FINDINGS) {
    if (await prisma.finding.findUnique({ where: { slug: f.slug } })) continue;
    const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
    await prisma.finding.create({ data: { ...f, categoryId: cat?.id ?? null, featured: true, published: true, publishedAt: new Date() } });
    console.log("Rapor verisi eklendi:", f.slug);
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL, adminPass = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPass) {
    console.log("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD tanımlı değil; yalnızca planlar ve ana sayfa içeriği yüklendi.");
    return;
  }
  const admin = await upsertUser(adminEmail, adminPass, "MASKDER Yönetici", "ADMIN", "corp", "MASKDER");
  const demoMode = !!(process.env.SEED_DEMO_EMAIL && process.env.SEED_DEMO_PASSWORD);

  if (process.env.SEED_DEMO_EMAIL && process.env.SEED_DEMO_PASSWORD) {
    const demo = await upsertUser(process.env.SEED_DEMO_EMAIL, process.env.SEED_DEMO_PASSWORD, "Ayşe Yılmaz", "USER", "free", "Ankara Üniversitesi");
    if (!(await prisma.survey.count({ where: { ownerId: demo.id } }))) {
      const ex = exampleSurvey(64);
      await prisma.survey.create({
        data: {
          ...ex.survey,
          questions: ex.survey.questions as object[],
          slug: slug(),
          ownerId: demo.id,
          status: "open",
          example: true,
          createdAt: new Date(Date.now() - 12 * 86400000),
          responses: { create: ex.responses },
        },
      });
    }
  }

  if (!(await prisma.survey.count({ where: { isPlatform: true } }))) {
    const ex = exampleSurvey(24);
    await prisma.survey.create({
      data: {
        title: "MASK Akademi Güz Dönemi Eğitim İhtiyaç Analizi",
        description: "MASK Akademi'nin güz dönemi programını planlamak için görüşlerinizi alıyoruz. Anket yaklaşık 3 dakika sürer; yanıtlar anonimdir.",
        thankYou: "Katılımınız için teşekkür ederiz. Program duyurularını maskder.org üzerinden takip edebilirsiniz.",
        questions: ex.survey.questions as object[],
        slug: slug(),
        ownerId: admin.id,
        // Canlıda taslak ve yanıtsız başlar; yerel geliştirmede (örnek kullanıcıyla) açık ve örnek yanıtlı
        status: demoMode ? "open" : "draft",
        isPlatform: true,
        ...(demoMode ? { responses: { create: ex.responses.map((r) => ({ ...r, source: "ornek" })) } } : {}),
      },
    });
  }
  console.log("Seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
