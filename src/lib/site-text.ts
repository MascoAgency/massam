// İstemci ve sunucuda ortak metin yardımcıları
export const paragraphs = (s: string) => s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
