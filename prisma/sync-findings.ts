/**
 * Başlangıç rapor verilerinin grafik tanımlarını günceller. Yalnızca yönetim panelinden hiç düzenlenmemiş
 * (oluşturulduktan sonra güncellenmemiş) kayıtlara dokunur; panelden yapılan düzenlemeler korunur.
 * Kullanım: npx tsx prisma/sync-findings.ts
 */
import { PrismaClient } from "@prisma/client";
import { SEED_FINDINGS } from "../src/lib/findings-seed";

const prisma = new PrismaClient();

async function main() {
  for (const { slug, charts, stats } of SEED_FINDINGS) {
    const f = await prisma.finding.findUnique({ where: { slug } });
    if (!f) continue;
    if (f.updatedAt.getTime() - f.createdAt.getTime() > 60_000) {
      console.log("Panelden düzenlenmiş, atlandı:", slug);
      continue;
    }
    await prisma.$executeRaw`UPDATE "Finding" SET charts = ${JSON.stringify(charts)}::jsonb, stats = ${JSON.stringify(stats)}::jsonb WHERE id = ${f.id}`;
    console.log("Güncellendi:", slug, charts.length, "grafik");
  }
}
main().finally(() => prisma.$disconnect());
