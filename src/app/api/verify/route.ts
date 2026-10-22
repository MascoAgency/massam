import { fail, ok, readJson } from "@/lib/api";
import { consumeVerification } from "@/lib/verify";

/** E-posta doğrulama: bağlantıdaki belirteç düğmeyle gönderilir (e-posta tarayıcılarının bağlantıyı önceden açması doğrulamayı tüketmez) */
export async function POST(req: Request) {
  const { token } = await readJson<{ token?: string }>(req);
  const r = token ? await consumeVerification(String(token)) : null;
  if (!r) return fail(400, "Doğrulama bağlantısı geçersiz veya süresi dolmuş. Giriş yaparak yeni bir doğrulama e-postası isteyebilirsiniz.");
  return ok({ next: r.next || "/anketler" });
}
