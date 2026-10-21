import { getLegal } from "@/lib/site";
import { RichText } from "@/components/RichText";
import { PageHead } from "@/components/PublicCards";
import { fmtDate, trDayStart } from "@/lib/format";

export const metadata = { title: "Çerez Politikası" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const l = await getLegal();
  return (
    <div className="stack" style={{ gap: 28 }}>
      <PageHead eyebrow="Çerezler" title="Çerez Politikası" lead={l.updatedAt ? `Son güncelleme: ${fmtDate(trDayStart(l.updatedAt))}` : undefined} />
      <RichText text={l.cookies} />
    </div>
  );
}
