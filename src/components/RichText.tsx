import { renderMarkdown } from "@/lib/markdown";

/** Yönetimden girilen biçimli metni gösterir (başlık, liste, alıntı, bağlantı, görsel). */
export function RichText({ text }: { text: string }) {
  return <div className="prose md">{renderMarkdown(text)}</div>;
}
