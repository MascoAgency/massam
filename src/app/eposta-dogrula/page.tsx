import { VerifyEmail } from "@/components/VerifyEmail";

export const metadata = { title: "E-posta doğrulama" };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = String((await searchParams).token || "");
  return (
    <div className="verify-wrap">
      <VerifyEmail token={token} />
    </div>
  );
}
