# MASKDER Anket ve Araştırma Platformu

MASK Akademi ve MASKDER araştırmaları için tam sürüm web uygulaması: anket hazırlama, **hesapsız herkese açık katılım** (bağlantı ve QR kod), otomatik grafikler ve segmentasyon, Claude ile yapay zekâ analizi, sunucuda üretilen PDF raporlar, üyelik planları ve yönetim paneli.

Teknoloji: Next.js 15 (App Router, TypeScript) · PostgreSQL + Prisma · Auth.js (e-posta/şifre) · Stripe abonelikleri · Claude API (`claude-opus-5-5`) · @react-pdf/renderer · Chart.js.

## Modüller

| Modül | Nerede |
|---|---|
| 1. Anket hazırlama (tek/çoktan seçmeli, açık uçlu, Likert 5/7, derecelendirme 1–5/1–10, sıralama, zorunlu alan, önizleme) | Panel → Yeni anket |
| 2. Online veri toplama (herkese açık `/s/{kod}` bağlantısı, QR kod, sosyal paylaşım, aynı cihazdan kiosk modu, CSV içe aktarma) | Sonuçlar → Paylaşım / Yanıtlar |
| 3. Görselleştirme (pasta/sütun/çubuk, dağılım + Pearson r, segment karşılaştırması, tarih ve segment filtresi, CSV dışa aktarma) | Sonuçlar → Sonuçlar / Dağılım ve segment |
| 4. Yapay zekâ analizi (özet, eğilimler, önemli noktalar, soru bazlı bulgular, açık uçlu tema ve duygu analizi, sınırlılıklar, öneriler) | Sonuçlar → AI analiz |
| 5. PDF rapor (kapak, özet, yöntem, grafikli bulgular, yorumlar, sonuç ve öneriler; tekrar indirilebilir) | Sonuçlar → PDF rapor |

Ayrıca: kayıt/giriş/çıkış ve e-postayla şifre sıfırlama, profil, geçmiş araştırmalar (kopyala/arşivle/sil, saklama bitişi), üyelik ve kullanım sayaçları, yönetim paneli (sistem istatistikleri, kullanıcılar ve plan talepleri, tüm araştırmalar ve platform anketleri, ana sayfa içeriği, paket ve limit yönetimi).

### Plan sınırları
Her planın anket sayısı, anket başına katılımcı, aylık AI analiz, aylık PDF rapor ve veri saklama süresi (ay) sınırı vardır; değerler Yönetim → Üyelik paketleri ekranından değiştirilir (-1 = sınırsız). Sınırlar sunucuda uygulanır. Yöneticiler sınırsız çalışır. Saklama süresi dolan anketlerin yanıtları, analizleri ve raporları günlük zamanlanmış görevle (`/api/cron/retention`) silinir; anket tanımı kopyalanabilsin diye arşivde kalır.


## Web sitesi yapısı (sürüm 2)

| Menü | Adres | İçerik |
|---|---|---|
| Ana Sayfa | `/` | Açılış, öne çıkan anketler, öne çıkan araştırmalar, Türkiye gündemi, veri ve istatistikler, araştırma alanları, araştırma topluluğu kaydı |
| Araştırma Alanları | `/arastirma-alanlari` | 8 alan kartı; her alanın detay sayfası (konular, ilgili anketler, sonuçlar, yayınlar) |
| Anketler | `/anketler` | Aktif/tamamlanmış anketler, kategori filtresi, anahtar kelime, sıralama; anket detay sayfası (`/anketler/{kod}`) |
| Araştırma Sonuçları | `/arastirma-sonuclari` | Yayın onayı verilmiş sonuçlar; her sonucun sayfası (amaç, tarih, örneklem, kapsam, yöntem ve sınırlılıklar, grafikler, bulgular, değerlendirme, rapor indirme, ilgili araştırmalar) |
| Veri ve İstatistikler | `/veri-ve-istatistikler` | Seçilmiş grafikler, günlük katılım, karşılaştırmalı katılım oranları |
| Yayınlar ve Raporlar | `/yayinlar` | Yayın arşivi (tür, kategori, arama) ve yayın detayı |
| Hakkımızda | `/hakkimizda` | Platform ve MASKDER |
| Araştırmaya Katıl | `/katil` | Aktif anketler ve gönüllü katılımcı kaydı (açık rıza, kayıttan çıkma bağlantısı) |

Yasal sayfalar: `/kvkk`, `/cerez-politikasi`, `/kullanim-kosullari`. Metinler **taslaktır**; Yönetim → Site içeriği bölümünden düzenlenir ve yayından önce hukukçu tarafından gözden geçirilmelidir.

Anket doldurma ekranı adım adımdır: bilgilendirme ve onay → her ekranda bir soru (Geri/İleri, ilerleme göstergesi) → gönderim. Sorular önceki bir sorunun cevabına göre koşullu gösterilebilir; anketlere başlangıç ve bitiş tarihi verilebilir.

### İçerik yönetimi (Yönetim paneli)

- **Haberler:** kapak görseli, biçimli metin, kategori, ana sayfada öne çıkarma, ileri tarihli (zamanlanmış) yayın. Kamu sayfası: `/haberler`.
- **Yayınlar ve raporlar:** kapak görseli, biçimli metin, PDF yükleme veya bağlantı ya da platform raporunu bağlama.
- **Sayfalar:** `/sayfa/{adres}` altında serbest sayfalar; istenen sayfa alt bilgide listelenir.
- **Medya kütüphanesi:** JPG, PNG, WEBP, GIF ve PDF; dosya başına en fazla 4 MB (Vercel sınırı). Görseller tarayıcıda en uzun kenar 1920 px olacak şekilde küçültülür. Dosyalar veritabanında saklanır ve `/medya/{id}` adresinden sunulur; kullanımdaki dosya silinemez.
- **Site içeriği:** ana sayfa başlığı ve metni, açılış görseli, bölümleri gösterme/gizleme, Hakkımızda ve MASKDER metinleri, iletişim, sosyal medya, yasal metinler.
- **Biçimli metin:** `**kalın**`, `*italik*`, `## başlık`, `- madde`, `1. madde`, `> alıntı`, `[metin](adres)`, `![açıklama](görsel adresi)`. HTML kabul edilmez.

### Roller

| Rol | Yetkiler |
|---|---|
| Yönetici | Her şey: kullanıcılar ve roller, paketler, içerik, anketler, ham veri |
| Araştırma sorumlusu | Platform anketleri, ham veri, analiz, rapor, sonuç yayımlama, gönüllü listesi |
| Editör | Site içeriği, araştırma alanları, yayınlar, sonuç sayfası metinleri ve yayın onayı. **Ham veriye erişemez.** |
| Analist | Platform anketlerinin sonuçları ve ham yanıtları, analiz, rapor, CSV dışa aktarma |
| Üye | Kendi anketleri (plan sınırlarıyla) |

Roller Yönetim → Kullanıcılar ve roller bölümünden atanır. Araştırma sonuçları ve yayınlar, yayın onayı verilene kadar kamuya açılmaz; kamuya açık sayfalarda yalnızca toplu (anonim) veriler gösterilir.

## Yerel kurulum

Gerekenler: **Node.js 22 LTS** (macOS 13.4 için 22 sürümü; 24 sürümü macOS 13.5+ ister). Ayrı PostgreSQL kurulumu gerekmez.

```bash
cd ~/maskder-platform
cp .env.example .env          # değerleri gerektiği gibi düzenleyin
npm install
npm run db:local              # 1. terminal: gömülü PostgreSQL'i 5433 portunda başlatır, açık bırakın
```

İkinci terminalde:

```bash
npm run db:push               # tabloları oluşturur
npm run db:seed               # planlar, ana sayfa, yönetici + örnek kullanıcı ve örnek veriler
npm run dev                   # http://localhost:3000
```

Giriş bilgileri `.env` içindeki `SEED_ADMIN_*` (yönetici) ve `SEED_DEMO_*` (örnek araştırmacı, 64 yanıtlı örnek anketle) değişkenleridir.

Yerelde:
- `ANTHROPIC_API_KEY` boşsa AI analizleri yerel istatistik özetiyle üretilir (kotadan düşmez).
- `SMTP_URL` boşsa şifre sıfırlama bağlantısı `npm run dev` terminaline yazılır.
- `STRIPE_SECRET_KEY` boşsa plan yükseltmeleri yönetici onaylı talep olarak çalışır.

## Canlıya alma (Vercel + Neon veya Supabase)

1. **Veritabanı**
   - *Neon*: proje oluşturun; *Pooled* bağlantıyı `DATABASE_URL`, *Direct* bağlantıyı `DATABASE_URL_UNPOOLED` olarak alın (Vercel → Storage üzerinden Neon eklerseniz ikisi de otomatik tanımlanır) (ikisinde de `?sslmode=require`).
   - *Supabase*: Project Settings → Database. `DATABASE_URL` = Transaction pooler (6543, sonuna `?pgbouncer=true`), `DATABASE_URL_UNPOOLED` = Session/Direct (5432).
2. **Kod deposu**: projeyi GitHub'a gönderin (`.env` dosyası `.gitignore` içindedir).
3. **Vercel**: *Add New → Project* ile depoyu içe aktarın (Framework: Next.js). Ortam değişkenlerini girin:
   - `APP_URL` (ör. `https://arastirma.maskder.org`), `DATABASE_URL`, `DATABASE_URL_UNPOOLED`
   - `AUTH_SECRET` (`openssl rand -base64 32`), `AUTH_TRUST_HOST=true`
   - `ANTHROPIC_API_KEY` (console.anthropic.com), isteğe bağlı `ANTHROPIC_MODEL`
   - `SMTP_URL`, `MAIL_FROM` (ör. Resend: `smtps://resend:API_ANAHTARI@smtp.resend.com:465`; gönderen alan adını Resend'de doğrulayın)
   - `CRON_SECRET` (rastgele uzun bir değer; Vercel Cron bunu `Authorization: Bearer` olarak gönderir)
   - Stripe kullanılacaksa `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
4. **Tabloları oluşturun ve ilk yöneticiyi ekleyin** (kendi bilgisayarınızdan, canlı veritabanı adresleriyle):
   ```bash
   DATABASE_URL="..." DATABASE_URL_UNPOOLED="..." npx prisma db push
   DATABASE_URL="..." DATABASE_URL_UNPOOLED="..." SEED_ADMIN_EMAIL="siz@maskder.org" SEED_ADMIN_PASSWORD="güçlü-bir-şifre" npm run db:seed
   ```
   Canlıda `SEED_DEMO_*` değişkenlerini vermeyin; örnek kullanıcı oluşturulmaz. (Şema değişikliklerini sürümlemek isterseniz `prisma migrate dev` ile migration oluşturup Vercel derleme komutuna `prisma migrate deploy` ekleyin.)
5. **Alan adı**: Vercel → Settings → Domains. Ardından `APP_URL` değerini bu adresle güncelleyip yeniden dağıtın; paylaşım bağlantıları ve QR kodlar bu adresle üretilir.
6. **Zamanlanmış görev**: `vercel.json` içindeki cron her gün 03:00'te (UTC) veri saklama temizliğini çalıştırır.
7. **Stripe (isteğe bağlı)**:
   - Stripe panelinde her ücretli plan için TRY cinsinden aylık yinelenen bir fiyat oluşturun ve fiyat kimliğini (`price_…`) Yönetim → Üyelik paketleri ekranına girin.
   - Developers → Webhooks: uç nokta `https://ALAN-ADINIZ/api/billing/webhook`; olaylar `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. İmza anahtarını `STRIPE_WEBHOOK_SECRET` olarak girin.
   - Settings → Billing → Customer portal'ı etkinleştirin (iptal ve kart güncelleme için).
   - **Not:** Stripe, Türkiye'de kurulu tüzel kişilere doğrudan hesap açmıyor. MASKDER için gerçekçi seçenek iyzico'dur; ödeme modülü (`src/lib/billing`) iyzico abonelik API'siyle değiştirilebilecek şekilde ayrıdır. O zamana kadar talep/onay akışı çalışır.

## Proje yapısı

```
prisma/schema.prisma          veri modeli
prisma/seed.ts                başlangıç verileri
scripts/local-db.mjs          gömülü yerel PostgreSQL
assets/fonts/                 PDF raporlar için Inter yazı tipi (Türkçe karakterli, OFL lisanslı); assets/maskder-logo.png kapak logosu
src/auth.ts                   Auth.js yapılandırması
src/lib/                      istatistik, AI, plan sınırları, CSV, PDF şablonu, Stripe
src/app/api/                  REST uç noktaları
src/app/                      sayfalar (panel, sonuçlar, /s/[kod] katılım, geçmiş, üyelik, profil, yönetim)
src/components/               istemci bileşenleri
docs/prototip-…html           claude.ai prototipi (referans)
```

## Güvenlik notları
- Şifreler bcrypt ile saklanır; şifre sıfırlama bağlantıları tek kullanımlıktır, 1 saat geçerlidir ve veritabanında yalnızca özetleri tutulur.
- Herkese açık katılımda IP adresi saklanmaz; kötüye kullanım sınırı için yalnızca tuzlanmış özeti tutulur. Bot tuzağı ve anket başına saatlik IP sınırı vardır.
- Katılımcı cevapları AI'ya yalnızca analiz verisi olarak gönderilir; istemde cevaplardaki talimatların yok sayılması belirtilmiştir.

## Rapor verileri (Bulgular)

Yönetim → **Rapor verileri** sekmesinden yayımlanmış MASKDER raporlarından seçilen veriler grafik, kısa yorum ve kaynakçayla yayımlanır (`Finding` modeli). Veri satırları `Etiket | 34,2` biçiminde girilir; değerler yüzde olarak gösterilir.

- Herkese açık sayfalar: `/bulgular`, `/bulgular/[slug]`; ayrıca ana sayfa ("Raporlarımızdan veriler"), Araştırma Sonuçları, Veri ve İstatistikler ve ilgili araştırma alanı sayfaları.
- Her sayfada rapor adıyla MASKDER'e atıf yapan **Kaynakça** bölümü bulunur.
- Başlangıç verileri `src/lib/findings-seed.ts` içindedir (Yerel Yönetimler, Siyasi Bilinç, Hatay Deprem Saha raporları); `npm run db:seed` yalnızca eksik kayıtları ekler, panelden yapılan düzenlemelerin üzerine yazmaz.

## Tema: İstihbarat Yönetim Ofisi (açık ton)

- Renkler yalnızca lacivert, turkuaz, beyaz, siyah ve eflatun ailelerinden oluşur; tüm değerler `src/app/globals.css` başındaki değişkenlerdedir (koyu mod dahil).
- Yazı tipleri proje içinden sunulur: Inter (metin), Space Grotesk (başlık), IBM Plex Mono (künye ve rakamlar) — `src/app/fonts`.
- Rapor verisi grafik türleri: yatay çubuk, sütun, halka, kutupsal alan, radar, çizgi, alan, ıraksak ölçek, ağaç haritası, waffle, lolipop, gösterge, insan simgesi.
- Saha haritasındaki iller `src/components/FieldMap.tsx` içindeki `FIELD_SITES` listesinden gelir.
- Başlangıç verilerindeki grafik değişikliklerini, panelden düzenlenmemiş kayıtlara uygulamak için: `npx tsx prisma/sync-findings.ts`.

## Slider görselleri ve künyeler

- Manşet ve aktif araştırmalar bantlarındaki slaytlar fotoğraflıdır: rapor verisinin kendi görseli, yoksa araştırma alanının görseli kullanılır; tanıtım haberinin görseli Yönetim → Site içeriği → “Manşet bandı tanıtım haberi görseli” alanından seçilir.
- Alan görseli: Yönetim → Araştırma alanları; rapor verisi görseli: Yönetim → Rapor verileri.
- Fotoğraf künyeleri (fotoğrafçı · lisans · kaynak) medya kütüphanesinde düzenlenir ve `/gorsel-kunyeleri` sayfasında listelenir.
- Başlangıç fotoğrafları Wikimedia Commons'taki serbest lisanslı görsellerdir: `npx tsx prisma/import-photos.ts` yalnızca boş görsel alanlarını doldurur.
