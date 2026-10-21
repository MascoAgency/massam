import { getLegal } from "@/lib/site";
import { RichText } from "@/components/RichText";
import { PageHead } from "@/components/PublicCards";
import { fmtDate, trDayStart } from "@/lib/format";

export const metadata = { title: "KVKK Aydınlatma Metni" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const l = await getLegal();
  return (
    <div className="stack" style={{ gap: 28 }}>
      <PageHead eyebrow="Gizlilik ve kişisel verilerin korunması" title="KVKK Aydınlatma Metni" lead={l.updatedAt ? `Son güncelleme: ${fmtDate(trDayStart(l.updatedAt))}` : undefined} />
      <RichText text={l.kvkk} />
    </div>
  );
}
