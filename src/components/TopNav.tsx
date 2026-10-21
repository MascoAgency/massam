"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { initials } from "@/lib/format";
import { Icon } from "./icons";
import { TAGLINE, TAGLINE_SHORT, Wordmark } from "./Brand";

// Web sitesi ana menüsü (şartname bölüm 4)
const SITE: { href: string; label: string; cta?: "soft" | "solid" }[] = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/arastirma-alanlari", label: "Araştırma Alanları" },
  { href: "/anketler", label: "Anketler", cta: "soft" },
  { href: "/arastirma-sonuclari", label: "Araştırma Sonuçları" },
  { href: "/veri-ve-istatistikler", label: "Veri ve İstatistikler" },
  { href: "/yayinlar", label: "Yayınlar ve Raporlar" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/katil", label: "Araştırmaya Katıl", cta: "solid" },
];
// Üst şeritte sağdan sola kayan sloganlar
const SLOGANS = [
  "KAMUYA AÇIK",
  "MİLLETE DAİR",
  "ÜLKEMİZ İÇİN",
  "KİŞİSEL VERİ İÇERMEZ",
  "DOĞRU POLİTİKA ARACI",
  "HALKIN İHTİYAÇLARINI ÖĞREN",
  "BİLGİYİ DEĞERLİ KIL",
  "BİLİMSELLİK ÖNCELİĞİMİZ",
  "TOPLUMUN DÜŞÜNCESİ ÖNCELİĞİMİZ",
  "SAHA DAİMA DOĞRU SÖYLER",
];
// Üye alanı sayfaları (alt menüde gösterilir)
const MEMBER_PATHS = ["/panel", "/gecmis", "/uyelik", "/profil", "/yonetim"];

export function TopNav({ user }: { user: { name: string; planName: string; isAdmin: boolean } | null }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const takeMode = path.startsWith("/s/"); // katılım ekranında yalnızca marka görünür
  const inMember = !!user && MEMBER_PATHS.some((p) => path === p || path.startsWith(p + "/"));
  const cur = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  const member: [string, string][] = [
    ["/panel", "Anketlerim"],
    ["/gecmis", "Geçmiş araştırmalar"],
    ["/uyelik", "Plan ve kullanım"],
    ["/profil", "Profil"],
  ];
  if (user?.isAdmin) member.push(["/yonetim", "Yönetim"]);
  return (
    <header className="top">
      <div className="cls-band" role="marquee" aria-label={SLOGANS.join(", ")}>
        <div className="cls-track" aria-hidden="true">
          {[0, 1].map((k) => (
            <span className="cls-set" key={k}>
              {SLOGANS.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </span>
          ))}
        </div>
      </div>
      {!takeMode ? (
        <div className="utility">
          <div className="utility-in">
            <span className="ok">● {TAGLINE}</span>
            <span className="row" style={{ gap: 14 }}>
              {user ? (
                <>
                  <Link href="/panel">Panelim</Link>
                  <button className="link-btn" onClick={() => signOut({ callbackUrl: "/" })}>
                    Çıkış
                  </button>
                </>
              ) : (
                <Link href="/giris">Üye girişi</Link>
              )}
            </span>
          </div>
        </div>
      ) : null}
      <div className="top-in">
        <Link className="brand" href="/" aria-label="MASSAM Araştırma ana sayfa">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/massam-logo.svg" alt="MASSAM amblemi" width={40} height={40} />
          <span className="brand-div" aria-hidden="true" />
          <span className="brand-text">
            <b>
              <Wordmark />
            </b>
            <small>{TAGLINE_SHORT}</small>
          </span>
        </Link>
        {!takeMode ? (
          <>
            <nav className={"mainnav" + (open ? " open" : "")} aria-label="Ana menü" id="ana-menu">
              {SITE.map((i) => (
                <Link key={i.href} href={i.href} aria-current={cur(i.href) ? "page" : undefined} className={"navlink" + (i.cta ? " cta-" + i.cta : "")}>
                  {i.label}
                </Link>
              ))}
            </nav>
            <div className="who">
              {user ? (
                <span className="avatar" aria-hidden="true" title={user.name}>
                  {initials(user.name)}
                </span>
              ) : null}
              <button className="iconbtn menu-btn" aria-label={open ? "Menüyü kapat" : "Menüyü aç"} aria-expanded={open} aria-controls="ana-menu" onClick={() => setOpen((o) => !o)}>
                <Icon name={open ? "x" : "menu"} />
              </button>
            </div>
          </>
        ) : null}
      </div>
      {inMember ? (
        <div className="subnav">
          <div className="subnav-in">
            <span className="subnav-user">
              {user!.name} <span className="pill plain accent">{user!.planName}</span>
            </span>
            <nav aria-label="Üye menüsü">
              {member.map(([href, label]) => (
                <Link key={href} href={href} aria-current={cur(href) ? "page" : undefined}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
