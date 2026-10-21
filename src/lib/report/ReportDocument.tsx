import path from "path";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Svg, Path, Rect, Defs, LinearGradient, Stop, Circle, Ellipse, Line, Polyline, Polygon, ClipPath, G } from "@react-pdf/renderer";
import type { ReportSnapshot } from "./types";
import type { Question } from "../types";
import type { QStats } from "../stats";
import { TYPE_LABEL, PALETTE, numericQ } from "../survey";
import { fmtDate, fmtDateTime, fmtN } from "../format";

// Türkçe karakterleri (ğ, ş, ı, İ) eksiksiz içeren Inter TTF dosyaları
const F = (f: string) => path.join(process.cwd(), "assets", "fonts", f);
let fontsReady = false;
function registerFonts() {
  if (fontsReady) return;
  Font.register({
    family: "Inter",
    fonts: [
      { src: F("Inter-Regular.ttf"), fontWeight: 400 },
      { src: F("Inter-Italic.ttf"), fontWeight: 400, fontStyle: "italic" },
      { src: F("Inter-SemiBold.ttf"), fontWeight: 600 },
      { src: F("Inter-Bold.ttf"), fontWeight: 700 },
      { src: F("Inter-ExtraBold.ttf"), fontWeight: 800 },
    ],
  });
  Font.registerHyphenationCallback((w) => [w]); // Türkçe kelimeleri yanlış bölmesin
  fontsReady = true;
}

const INK = "#05070C", NAVY = "#0B1F3A", ACCENT = "#0E8C96", MUTED = "#5b6474", LINE = "#e2e6ee";

const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 9.5, lineHeight: 1.5, color: INK, paddingTop: 40, paddingBottom: 48, paddingHorizontal: 40 },
  cover: { position: "relative", marginTop: -40, marginHorizontal: -40, paddingTop: 34, paddingBottom: 26, paddingHorizontal: 40, marginBottom: 14, backgroundColor: "#13294B", color: "#ffffff" },
  coverBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  brandline: { flexDirection: "row", alignItems: "center", fontSize: 8, letterSpacing: 0.8, textTransform: "uppercase", color: "#9FE3E8", fontWeight: 600 },
  logo: { width: 26, height: 26, borderRadius: 13, marginRight: 8 },
  h1: { fontWeight: 800, fontSize: 22, letterSpacing: -0.4, color: "#ffffff", marginTop: 12, marginBottom: 6, lineHeight: 1.2 },
  h2: { fontWeight: 700, fontSize: 14, letterSpacing: -0.2, color: NAVY, marginTop: 16, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1.6, borderBottomColor: ACCENT },
  h3: { fontWeight: 700, fontSize: 10.5, marginBottom: 4, color: NAVY },
  p: { marginBottom: 6 },
  kvRow: { flexDirection: "row", marginBottom: 2 },
  kvK: { width: 110, color: "#9FE3E8", fontWeight: 600 },
  q: { paddingTop: 8, paddingBottom: 10, borderBottomWidth: 0.8, borderBottomColor: LINE },
  meta: { fontSize: 8, color: MUTED, marginBottom: 4 },
  table: { borderWidth: 0.8, borderColor: LINE, marginVertical: 4 },
  tr: { flexDirection: "row", borderBottomWidth: 0.8, borderBottomColor: LINE },
  th: { backgroundColor: "#EEF2F8", color: "#45464d", fontWeight: 600, fontSize: 8.5, padding: 3.5 },
  td: { padding: 3.5, fontSize: 8.8 },
  num: { textAlign: "right", width: 48 },
  comment: { backgroundColor: "#E3F7F8", borderLeftWidth: 2.5, borderLeftColor: ACCENT, padding: 6, marginTop: 5 },
  li: { flexDirection: "row", marginBottom: 2.5 },
  bullet: { width: 10, color: ACCENT },
  foot: { marginTop: 18, fontSize: 8, color: MUTED, borderTopWidth: 0.8, borderTopColor: LINE, paddingTop: 6 },
  pageNo: { position: "absolute", bottom: 22, left: 40, right: 40, fontSize: 7.5, color: "#94a3b8", flexDirection: "row", justifyContent: "space-between" },
});

function Bullets({ items }: { items?: string[] }) {
  if (!items || !items.length) return null;
  return (
    <View style={{ marginBottom: 6 }}>
      {items.map((x, i) => (
        <View key={i} style={s.li} wrap={false}>
          <Text style={s.bullet}>•</Text>
          <Text style={{ flex: 1 }}>{typeof x === "string" ? x : JSON.stringify(x)}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------- grafikler (SVG şekilleri + metin etiketleri) ----------
function arc(cx: number, cy: number, R: number, r: number, a0: number, a1: number) {
  const p = (rad: number, a: number) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(R, a0), [x1, y1] = p(R, a1), [x2, y2] = p(r, a1), [x3, y3] = p(r, a0);
  return `M${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${r} ${r} 0 ${large} 0 ${x3} ${y3} Z`;
}

function PieChart({ st }: { st: QStats }) {
  const total = st.counts.reduce((a, c) => a + c.count, 0) || 1;
  let a = -Math.PI / 2;
  const slices = st.counts.map((c, i) => {
    const span = (c.count / total) * Math.PI * 2;
    const parts: string[] = [];
    if (span >= Math.PI * 2 - 1e-6) {
      parts.push(arc(70, 70, 64, 31, a, a + Math.PI), arc(70, 70, 64, 31, a + Math.PI, a + Math.PI * 2 - 1e-4));
    } else if (span > 0) parts.push(arc(70, 70, 64, 31, a, a + span));
    a += span;
    return { parts, color: PALETTE[i % PALETTE.length] };
  });
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 6 }} wrap={false}>
      <Svg width={140} height={140} viewBox="0 0 140 140">
        {slices.flatMap((sl, i) => sl.parts.map((d, j) => <Path key={`${i}-${j}`} d={d} fill={sl.color} stroke="#ffffff" strokeWidth={1.5} />))}
      </Svg>
      <View style={{ marginLeft: 16, flex: 1 }}>
        {st.counts.map((c, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
            <View style={{ width: 8, height: 8, backgroundColor: PALETTE[i % PALETTE.length], marginRight: 6 }} />
            <Text style={{ flex: 1, fontSize: 8.5 }}>{c.label}</Text>
            <Text style={{ fontSize: 8.5, color: MUTED }}>%{fmtN(c.pct, 1)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function BarChart({ st }: { st: QStats }) {
  const max = Math.max(1, ...st.counts.map((c) => c.count));
  return (
    <View style={{ marginVertical: 6 }} wrap={false}>
      {st.counts.map((c, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
          <Text style={{ width: 150, fontSize: 8.5, paddingRight: 6 }}>{c.label}</Text>
          <View style={{ flex: 1, height: 10, backgroundColor: "#f0f3f6" }}>
            <View style={{ width: `${(c.count / max) * 100}%`, height: 10, backgroundColor: PALETTE[i % PALETTE.length] }} />
          </View>
          <Text style={{ width: 34, textAlign: "right", fontSize: 8.5 }}>{c.count}</Text>
        </View>
      ))}
    </View>
  );
}

function ColumnChart({ st, likert }: { st: QStats; likert: boolean }) {
  const max = Math.max(1, ...st.counts.map((c) => c.count));
  const H = 110;
  return (
    <View style={{ marginVertical: 6 }} wrap={false}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: H + 12, borderBottomWidth: 0.8, borderBottomColor: "#c9d1da" }}>
        {st.counts.map((c, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", height: H + 12 }}>
            <Text style={{ fontSize: 7.5, color: MUTED, marginBottom: 2 }}>{c.count}</Text>
            <View style={{ width: "60%", maxWidth: 40, height: Math.max(0.5, (c.count / max) * H), backgroundColor: ACCENT }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", marginTop: 3 }}>
        {st.counts.map((c, i) => (
          <Text key={i} style={{ flex: 1, textAlign: "center", fontSize: likert ? 7 : 8, color: "#45464d", paddingHorizontal: 2 }}>
            {c.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function QuestionBlock({ q, i, x, snap }: { q: Question; i: number; x: QStats; snap: ReportSnapshot }) {
  const r = snap.analysis;
  const b = (r.bulgular || []).find((b) => b.soruId === q.id);
  const o = (r.acikUclu || []).find((o) => o.soruId === q.id);
  return (
    <View style={s.q}>
      <View wrap={false}>
        <Text style={s.h3}>S{i + 1}. {q.title}</Text>
        <Text style={s.meta}>{TYPE_LABEL[q.type]} · {x.answered} cevap</Text>
      </View>
      {q.type === "open" ? (
        <>
          {o ? (
            <>
              <View style={s.table}>
                <View style={s.tr}>
                  <Text style={[s.th, { width: 110 }]}>Tema</Text>
                  <Text style={[s.th, { flex: 1 }]}>Açıklama</Text>
                  <Text style={[s.th, { width: 48, textAlign: "right" }]}>Oran</Text>
                </View>
                {(o.temalar || []).map((t, k) => (
                  <View key={k} style={s.tr} wrap={false}>
                    <Text style={[s.td, { width: 110, fontWeight: 600 }]}>{t.tema}</Text>
                    <Text style={[s.td, { flex: 1 }]}>{t.aciklama || ""}</Text>
                    <Text style={[s.td, s.num]}>{t.oran || ""}</Text>
                  </View>
                ))}
              </View>
              {o.ornekAlinti ? <Text style={{ fontStyle: "italic", color: "#4a5563" }}>“{o.ornekAlinti}”</Text> : null}
            </>
          ) : (
            <Bullets items={x.texts.slice(0, 6)} />
          )}
        </>
      ) : (
        <>
          {x.answered ? q.type === "single" ? <PieChart st={x} /> : q.type === "multi" ? <BarChart st={x} /> : <ColumnChart st={x} likert={q.type === "likert"} /> : null}
          <View style={s.table}>
            <View style={s.tr}>
              <Text style={[s.th, { flex: 1 }]}>Seçenek</Text>
              <Text style={[s.th, { width: 48, textAlign: "right" }]}>n</Text>
              <Text style={[s.th, { width: 48, textAlign: "right" }]}>%</Text>
            </View>
            {x.counts.map((c, k) => (
              <View key={k} style={s.tr} wrap={false}>
                <Text style={[s.td, { flex: 1 }]}>{c.label}</Text>
                <Text style={[s.td, s.num]}>{c.count}</Text>
                <Text style={[s.td, s.num]}>{fmtN(c.pct, 1)}</Text>
              </View>
            ))}
          </View>
          {x.mean != null && numericQ(q) ? (
            <Text style={{ fontSize: 8.5, color: "#4a5563" }}>
              Ortalama {fmtN(x.mean, 2)} · Std. sapma {fmtN(x.sd, 2)} · Medyan {fmtN(x.median, 1)}
            </Text>
          ) : null}
          {q.type === "multi" ? <Text style={{ fontSize: 8, color: MUTED }}>Yüzdeler soruyu cevaplayan {x.answered} kişiye göredir; toplam %100&apos;ü aşabilir.</Text> : null}
        </>
      )}
      {b ? (
        <View style={s.comment} wrap={false}>
          <Text>{b.yorum}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** MASSAM amblemi (public/massam-logo.svg ile aynı çizim, PDF için vektör olarak) */
function MassamEmblem({ size }: { size: number }) {
  const pts = "50,122 78,100 122,78 156,44";
  const star = "9,0 3.51,1.46 6.36,6.36 1.46,3.51 0,9 -1.46,3.51 -6.36,6.36 -3.51,1.46 -9,0 -3.51,-1.46 -6.36,-6.36 -1.46,-3.51 0,-9 1.46,-3.51 6.36,-6.36 3.51,-1.46"
    .split(" ")
    .map((p) => p.split(",").map(Number))
    .map(([x, y]) => `${(156 + x * 1.4).toFixed(2)},${(44 + y * 1.4).toFixed(2)}`)
    .join(" ");
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" style={{ marginRight: 8 }}>
      <Defs>
        <ClipPath id="massam-pdf-c">
          <Circle cx="100" cy="100" r="96" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#massam-pdf-c)">
        <Rect x="0" y="0" width="100" height="200" fill="#1B2A5C" />
        <Rect x="100" y="0" width="100" height="200" fill="#5FB0D6" />
        <Ellipse cx="100" cy="100" rx="44" ry="96" fill="none" stroke="#FFFFFF" strokeOpacity={0.16} strokeWidth={2} />
        <Line x1="0" y1="56" x2="200" y2="56" stroke="#FFFFFF" strokeOpacity={0.16} strokeWidth={2} />
        <Line x1="0" y1="144" x2="200" y2="144" stroke="#FFFFFF" strokeOpacity={0.16} strokeWidth={2} />
        <Rect x="40" y="140" width="20" height="60" rx="3" fill="#FFFFFF" />
        <Rect x="68" y="116" width="20" height="84" rx="3" fill="#FFFFFF" />
        <Rect x="112" y="92" width="20" height="108" rx="3" fill="#1B2A5C" />
        <Rect x="140" y="70" width="20" height="130" rx="3" fill="#1B2A5C" />
      </G>
      <Circle cx="100" cy="100" r="96" fill="none" stroke="#5FB0D6" strokeWidth={3} />
      <Polyline points={pts} fill="none" stroke="#1B2A5C" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points={pts} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="50" cy="122" r="6" fill="#FFFFFF" stroke="#1B2A5C" strokeWidth={3} />
      <Circle cx="78" cy="100" r="6" fill="#FFFFFF" stroke="#1B2A5C" strokeWidth={3} />
      <Circle cx="122" cy="78" r="6" fill="#FFFFFF" stroke="#1B2A5C" strokeWidth={3} />
      <Polygon points={star} fill="#FFFFFF" stroke="#1B2A5C" strokeWidth={1.2} />
    </Svg>
  );
}

export function ReportDocument({ snap }: { snap: ReportSnapshot }) {
  registerFonts();
  const { survey: sv, stats: st, analysis: r } = snap;
  const typeCounts = Object.entries(
    sv.questions.reduce<Record<string, number>>((m, q) => ((m[TYPE_LABEL[q.type]] = (m[TYPE_LABEL[q.type]] || 0) + 1), m), {}),
  )
    .map(([k, v]) => `${v} ${k.toLocaleLowerCase("tr-TR")}`)
    .join(", ");
  const kv: [string, string][] = [
    ["Rapor tarihi", fmtDate(snap.createdAt)],
    ["Hazırlayan", [snap.author, snap.institution].filter(Boolean).join(", ") || "—"],
    ["Örneklem", `${st.n} katılımcı`],
    ["Veri toplama", `${fmtDate(st.first)} – ${fmtDate(st.last)}`],
    ["Filtre", snap.filter || "Tüm katılımcılar"],
    ["Analiz", snap.model],
  ];
  const isAI = !r._local;
  return (
    <Document title={`${sv.title} — Araştırma Raporu`} author={snap.author || "MASSAM Araştırma"} creator="MASSAM Araştırma" language="tr">
      <Page size="A4" style={s.page}>
        <View style={s.pageNo} fixed>
          <Text>MASSAM Araştırma · {sv.title.slice(0, 80)}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
        {/* Kapak: marka degradesi (lacivert → camgöbeği) üzerinde logo ve künye */}
        <View style={s.cover}>
          <Svg style={s.coverBg} viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="brand" x1="0" y1="0" x2="1" y2="0.6">
                <Stop offset="0" stopColor="#0B1F3A" />
                <Stop offset="0.48" stopColor="#13294B" />
                <Stop offset="1" stopColor="#1E3A64" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#brand)" />
          </Svg>
          <View style={s.brandline}>
            <MassamEmblem size={30} />
            <Text>MASSAM · Araştırma Raporu</Text>
          </View>
          <Text style={s.h1}>{sv.title}</Text>
          {sv.description ? <Text style={{ color: "rgba(255,255,255,0.78)", marginBottom: 8 }}>{sv.description}</Text> : null}
          <View style={{ marginTop: 8 }}>
            {kv.map(([k, v]) => (
              <View key={k} style={s.kvRow}>
                <Text style={s.kvK}>{k}</Text>
                <Text style={{ flex: 1, color: "#ffffff" }}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={s.h2}>1. Araştırma özeti</Text>
        <Text style={s.p}>{r.ozet}</Text>

        <Text style={s.h2}>2. Yöntem</Text>
        <Text style={s.p}>
          Veriler MASSAM Araştırma platformu üzerinden çevrim içi anketle toplanmıştır. Anket {sv.questions.length} sorudan oluşmaktadır ({typeCounts}). Toplam {st.n} yanıt analiz edilmiştir; ortalama tamamlama oranı %{fmtN(st.completion || 0)}.
        </Text>
        {r.istatistikselOzet ? <Text style={s.p}>{r.istatistikselOzet}</Text> : null}

        <Text style={s.h2}>3. Bulgular</Text>
        {sv.questions.map((q, i) => (st.q[q.id] ? <QuestionBlock key={q.id} q={q} i={i} x={st.q[q.id]} snap={snap} /> : null))}

        <Text style={s.h2} minPresenceAhead={60}>4. Yorumlar ve içgörüler</Text>
        {r.egilimler?.length ? <><Text style={s.h3}>Katılımcı eğilimleri</Text><Bullets items={r.egilimler} /></> : null}
        {r.onemliNoktalar?.length ? <><Text style={s.h3}>Önemli veri noktaları</Text><Bullets items={r.onemliNoktalar} /></> : null}
        {r.icgoruler?.length ? <><Text style={s.h3}>İçgörüler</Text><Bullets items={r.icgoruler} /></> : null}
        {r.sinirliliklar?.length ? <><Text style={s.h3}>Sınırlılıklar</Text><Bullets items={r.sinirliliklar} /></> : null}

        <Text style={s.h2} minPresenceAhead={60}>5. Sonuç ve öneriler</Text>
        {r.sonuc ? <Text style={s.p}>{r.sonuc}</Text> : null}
        <Bullets items={r.oneriler} />

        <Text style={s.foot}>
          Bu rapor MASSAM Araştırma platformunda {fmtDateTime(snap.createdAt)} tarihinde {isAI ? "analiz modülüyle otomatik olarak" : "temel istatistiklerle otomatik olarak"} oluşturulmuştur. Yorumlar araştırmacı tarafından doğrulanmalıdır.
        </Text>
      </Page>
    </Document>
  );
}
