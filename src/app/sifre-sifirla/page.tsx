import { ResetForm } from "@/components/AuthForms";

export const metadata = { title: "Şifre sıfırlama" };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  return <ResetForm token={(await searchParams).token} />;
}
