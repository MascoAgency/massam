import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { safeNext } from "@/lib/verify";
import { VerifyPending } from "@/components/VerifyEmail";

export const metadata = { title: "E-posta doğrulaması bekleniyor" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const u = await requireUser("/eposta-dogrulama" + (next ? `?next=${encodeURIComponent(next)}` : ""));
  if (u.emailVerifiedAt) redirect(next || "/anketler");
  return (
    <div className="verify-wrap">
      <VerifyPending email={u.email} next={next} />
    </div>
  );
}
