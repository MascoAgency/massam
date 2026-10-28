import Link from "next/link";
import { Icon, type IconName } from "./icons";
import { fmtDate, fmtN } from "@/lib/format";
import type { PublicResultCard, PublicSurveyCard } from "@/lib/public";
import { SurveyArt, artKeyFor } from "./SurveyArt";

const ICONS: IconName[] = ["vote", "users", "heart", "coin", "shield", "book", "cpu", "building", "globe", "chart", "file", "home", "alert"];
export const catIcon = (name: string): IconName => (ICONS.includes(name as IconName) ? (name as IconName) : "chart");

export function SurveyCard({ s }: { s: PublicSurveyCard }) {
  return (
    <article className="card stack survey-card" style={{ gap: 10 }}>
      <Link className="sc-art" href={s.open ? `/s/${s.slug}` : `/anketler/${s.slug}`} aria-label={(s.open ? "Ankete katıl: " : "Ayrıntılar: ") + s.title} tabIndex={-1}>
        <SurveyArt art={artKeyFor(s.title, s.category?.slug)} label={s.title} />
      </Link>
      {s.category ? (
        <Link className="cat-link" href={`/arastirma-alanlari/${s.category.slug}`}>
          {s.category.name}
        </Link>
      ) : null}
      <h3>{s.title}</h3>
      <p className="small muted">{s.description.slice(0, 180)}</p>
      <div className="row" style={{ marginTop: "auto", gap: 8 }}>
        {s.open ? (
          <Link className="btn primary sm" href={`/anketler/${s.slug}`}>
            Ankete katıl <Icon name="arrow" />
          </Link>
        ) : (
          <Link className="btn sm" href={`/anketler/${s.slug}`}>
            Ayrıntılar
          </Link>
        )}
      </div>
    </article>
  );
}

export function ResultCard({ r }: { r: PublicResultCard }) {
  return (
    <article className="card stack" style={{ gap: 10 }}>
      <div className="row between" style={{ gap: 8 }}>
        {r.category ? (
          <Link className="cat-link" href={`/arastirma-alanlari/${r.category.slug}`}>
            {r.category.name}
          </Link>
        ) : (
          <span />
        )}
        <span className="small muted">{fmtDate(r.publishedAt)}</span>
      </div>
      <h3>{r.title}</h3>
      <p className="small muted">{r.summary.slice(0, 220)}</p>
      <div className="row between" style={{ marginTop: "auto" }}>
        <span className="small muted">{fmtN(r.n)} katılımcı</span>
        <Link className="btn sm" href={`/arastirma-sonuclari/${r.slug}`}>
          Sonuçları incele <Icon name="arrow" />
        </Link>
      </div>
    </article>
  );
}

export function CategoryCard({ c }: { c: { slug: string; name: string; description: string; icon: string; topics: string[] } }) {
  return (
    <Link className="feature cat-card" href={`/arastirma-alanlari/${c.slug}`}>
      <span className="ic">
        <Icon name={catIcon(c.icon)} />
      </span>
      <h3>{c.name}</h3>
      <p>{c.description}</p>
      <span className="small cat-more">
        Alanı incele <Icon name="arrow" />
      </span>
    </Link>
  );
}

export function PageHead({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead?: string; children?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {lead ? (
          <p className="muted" style={{ marginTop: 8, fontSize: "1.03rem" }}>
            {lead}
          </p>
        ) : null}
      </div>
      {children ? <div className="row">{children}</div> : null}
    </div>
  );
}

export function NewsCard({ n }: { n: { slug: string; title: string; summary: string; coverId: string | null; publishedAt: number } }) {
  return (
    <article className="card news-card">
      <Link href={`/haberler/${n.slug}`} aria-label={n.title}>
        {n.coverId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/medya/${n.coverId}`} alt="" loading="lazy" />
        ) : (
          <span className="news-ph" style={{ display: "grid" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/massam-logo.svg" alt="" />
          </span>
        )}
      </Link>
      <div className="news-body">
        <span className="small muted">{fmtDate(n.publishedAt)}</span>
        <h3>
          <Link href={`/haberler/${n.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
            {n.title}
          </Link>
        </h3>
        {n.summary ? <p className="small muted">{n.summary.slice(0, 180)}</p> : null}
        <Link className="cat-more small" href={`/haberler/${n.slug}`} style={{ textDecoration: "none" }}>
          Devamını oku <Icon name="arrow" />
        </Link>
      </div>
    </article>
  );
}
