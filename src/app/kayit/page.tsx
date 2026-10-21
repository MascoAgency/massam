import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Kayıt ol" };

export default async function Page() {
  if (await getCurrentUser()) redirect("/panel");
  return <RegisterForm />;
}
