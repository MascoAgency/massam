"use client";
import { renderMarkdown } from "@/lib/markdown";

/** İstemci tarafı önizleme için RichText eşi */
export function RichTextClient({ text }: { text: string }) {
  return <div className="prose md">{renderMarkdown(text)}</div>;
}
