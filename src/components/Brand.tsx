/** MASSAM kelime markası: iki renkli "MAS" + "SAM" */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={"wordmark " + className} aria-label="MASSAM">
      <span className="mas" aria-hidden="true">MAS</span>
      <span className="sam" aria-hidden="true">SAM</span>
    </span>
  );
}

export const TAGLINE = "Millî Adalet, Siyaset ve Strateji Araştırmaları Merkezi";
export const TAGLINE_SHORT = "Araştırma, Veri ve Politika Merkezi";
