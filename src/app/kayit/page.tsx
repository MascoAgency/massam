import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/session";
import { safeNext } from "@/lib/verify";

export const metadata = { title: "Üye ol" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const u = await getCurrentUser();
  if (u) redirect(u.emailVerifiedAt ? next || "/panel" : "/eposta-dogrulama" + (next ? `?next=${encodeURIComponent(next)}` : ""));
  return <RegisterForm next={next} />;
}
