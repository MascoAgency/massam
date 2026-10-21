import Link from "next/link";
import { getContact } from "@/lib/site";
import { footerPages } from "@/lib/public";
import { TAGLINE, Wordmark } from "./Brand";

const SOCIAL: [keyof Awaited<ReturnType<typeof getContact>>["social"], string][] = [
  ["x", "X"],
  ["instagram", "Instagram"],
  ["linkedin", "LinkedIn"],
  ["youtube", "YouTube"],
  ["facebook", "Facebook"],
];

export async function SiteFooter() {
  const [c, pages] = await Promise.all([getContact(), footerPages()]);
  const socials = SOCIAL.filter(([k]) => c.social[k]);
  return (
    <footer className="site-footer">
      <div className="site-footer-in">
        <div className="stack" style={{ gap: 12 }}>
          <span className="footer-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/massam-logo.svg" alt="MASSAM amblemi" />
            <b>
              <Wordmark className="on-dark" /> Araştırma
            </b>
          </span>
          <p className="small">{c.footerAbout}</p>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <b className="small">Platform</b>
          <Link href="/arastirma-alanlari">Araştırma Alanları</Link>
          <Link href="/anketler">Anketler</Link>
          <Link href="/arastirma-sonuclari">Araştırma Sonuçları</Link>
          <Link href="/yayinlar">Yayınlar ve Raporlar</Link>
          <Link href="/haberler">Haberler ve Duyurular</Link>
          <Link href="/katil">Araştırmaya Katıl</Link>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <b className="small">Kurumsal</b>
          <Link href="/hakkimizda">MASSAM hakkında</Link>
          <Link href="/kvkk">Gizlilik ve kişisel verilerin korunması</Link>
          <Link href="/cerez-politikasi">Çerez politikası</Link>
          <Link href="/kullanim-kosullari">Kullanım koşulları</Link>
          <Link href="/gorsel-kunyeleri">Görsel künyeleri</Link>
          {pages.map((p) => (
            <Link key={p.slug} href={`/sayfa/${p.slug}`}>
              {p.title}
            </Link>
          ))}
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <b className="small">İletişim</b>
          {c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : null}
          {c.phone ? <span>{c.phone}</span> : null}
          {c.address ? <span>{c.address}</span> : null}
          {!c.email && !c.phone && !c.address ? <Link href="/hakkimizda#maskder">İletişim bilgileri</Link> : null}
          {socials.length ? (
            <div className="row" style={{ gap: 10, marginTop: 4 }}>
              {socials.map(([k, l]) => (
                <a key={k} href={c.social[k]} target="_blank" rel="noopener" className="social">
                  {l}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="site-footer-bottom">
        <span>KAMUYA AÇIK · ANONİM TOPLU VERİ · Kişisel veriler KVKK kapsamında korunur</span>
        <span>© {new Date().getFullYear()} MASSAM · {TAGLINE}</span>
      </div>
    </footer>
  );
}
