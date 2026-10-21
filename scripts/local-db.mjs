// Yerel geliştirme için gömülü PostgreSQL (kurulum gerektirmez).
// Kullanım: npm run db:local   (ayrı bir terminalde açık bırakın)
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "fs";
import path from "path";

const dir = path.resolve(".local-db");
const pg = new EmbeddedPostgres({ databaseDir: dir, user: "postgres", password: "postgres", port: 5433, persistent: true });

if (!existsSync(path.join(dir, "PG_VERSION"))) {
  console.log("Yerel veritabanı ilk kez hazırlanıyor…");
  await pg.initialise();
}
await pg.start();
try {
  await pg.createDatabase("maskder");
} catch {
  /* zaten var */
}
console.log("PostgreSQL çalışıyor: postgresql://postgres:postgres@localhost:5433/maskder  (durdurmak için Ctrl+C)");

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
