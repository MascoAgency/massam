import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/session";
import { safeNext } from "@/lib/verify";

export const metadata = { title: "Giriş yap" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next || "/panel");
  return <LoginForm next={next || undefined} />;
}
