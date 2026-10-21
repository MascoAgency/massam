import React from "react";

/**
 * Basit ve güvenli metin biçimlendirme (Markdown alt kümesi). HTML kabul edilmez; React çıktıyı kaçışlar.
 *   # / ## / ###  başlık        > alıntı        - veya * madde        1. numaralı madde
 *   ![açıklama](adres) görsel   --- ayraç       **kalın**  *italik*  [metin](adres)
 */

const safeUrl = (u: string) => {
  const s = u.trim();
  return /^(https?:\/\/|\/(?!\/)|mailto:|#)/i.test(s) ? s : null;
};

function inline(text: string, key = "i"): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // Sıra önemli: bağlantı → kalın → italik
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|(?<![*\w])\*([^*\n]+)\*(?![*\w])|(?<![_\w])_([^_\n]+)_(?![_\w])/g;
  let last = 0, m: RegExpExecArray | null, n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${n++}`;
    if (m[1] !== undefined) {
      const href = safeUrl(m[2]);
      const ext = href && /^https?:\/\//i.test(href);
      out.push(href ? <a key={k} href={href} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{m[1]}</a> : m[1]);
    } else if (m[3] !== undefined) out.push(<strong key={k}>{inline(m[3], k)}</strong>);
    else out.push(<em key={k}>{m[4] ?? m[5]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const withBreaks = (t: string, key: string) =>
  t.split("\n").flatMap((line, i, arr) => [...inline(line, `${key}-${i}`), i < arr.length - 1 ? <br key={`${key}-br${i}`} /> : null]);

export function renderMarkdown(src: string): React.ReactNode[] {
  const lines = (src || "").replace(/\r\n?/g, "\n").split("\n");
  const out: React.ReactNode[] = [];
  let i = 0, k = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    const key = "b" + k++;
    if (!t) {
      i++;
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = t.match(/^(#{1,3})\s+(.+)$/))) {
      const lvl = m[1].length;
      out.push(React.createElement(lvl === 1 ? "h2" : lvl === 2 ? "h2" : "h3", { key }, inline(m[2], key)));
      i++;
    } else if (/^(-{3,}|\*{3,})$/.test(t)) {
      out.push(<hr key={key} className="sep" />);
      i++;
    } else if ((m = t.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) {
      const src = safeUrl(m[2]);
      if (src)
        out.push(
          <figure key={key} className="md-figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={m[1]} loading="lazy" />
            {m[1] ? <figcaption>{m[1]}</figcaption> : null}
          </figure>,
        );
      i++;
    } else if (/^>\s?/.test(t)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) buf.push(lines[i++].trim().replace(/^>\s?/, ""));
      out.push(<blockquote key={key} className="md-quote">{withBreaks(buf.join("\n"), key)}</blockquote>);
    } else if (/^[-*]\s+/.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) items.push(lines[i++].trim().replace(/^[-*]\s+/, ""));
      out.push(<ul key={key}>{items.map((x, j) => <li key={j}>{inline(x, `${key}-${j}`)}</li>)}</ul>);
    } else if (/^\d+[.)]\s+/.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) items.push(lines[i++].trim().replace(/^\d+[.)]\s+/, ""));
      out.push(<ol key={key}>{items.map((x, j) => <li key={j}>{inline(x, `${key}-${j}`)}</li>)}</ol>);
    } else {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|>|[-*]\s|\d+[.)]\s|!\[|-{3,}$)/.test(lines[i].trim())) buf.push(lines[i++]);
      if (!buf.length) buf.push(lines[i++]);
      out.push(<p key={key}>{withBreaks(buf.join("\n").trim(), key)}</p>);
    }
  }
  return out;
}

/** Metnin düz hâli (özet/arama için) */
export const plainText = (src: string) =>
  (src || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_#>`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
