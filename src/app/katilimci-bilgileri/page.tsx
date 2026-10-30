import { DemographicsForm } from "@/components/AuthForms";
import { requireUser } from "@/lib/session";
import { safeNext } from "@/lib/verify";
import { ageOf } from "@/lib/demographics";

export const metadata = { title: "Katılımcı bilgileri" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const u = await requireUser("/katilimci-bilgileri" + (next ? `?next=${encodeURIComponent(next)}` : ""));
  return (
    <DemographicsForm
      next={next}
      value={{ age: u.birthYear ? ageOf(u.birthYear) : undefined, gender: u.gender ?? undefined, education: u.education ?? undefined }}
    />
  );
}
