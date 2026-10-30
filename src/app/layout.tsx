import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { CursorField } from "@/components/CursorField";
import { ToastProvider } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";
import { effectivePlan } from "@/lib/plans";
import { isStaff } from "@/lib/roles";

// Yazı tipleri proje içinden sunulur (Google Fonts erişimine bağlı kalmadan derlenir); hepsi OFL lisanslı ve Türkçe karakterli
// Başlıklar: Source Serif 4 · metin ve künye: Source Sans 3 · kod alanları: IBM Plex Mono
const sans = localFont({ src: "./fonts/SourceSans3.ttf", weight: "200 900", variable: "--font-sans", display: "swap" });
const display = localFont({ src: "./fonts/SourceSerif4.ttf", weight: "200 900", variable: "--font-display", display: "swap" });
const mono = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexMono-Medium.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "MASSAM Araştırma", template: "%s · MASSAM Araştırma" },
  description: "MASSAM anket ve araştırma platformu: anket hazırlama, online veri toplama, grafikler, kapsamlı analiz ve PDF rapor.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const u = await getCurrentUser();
  const nav = u ? { name: u.name, planName: (await effectivePlan(u)).name, isAdmin: isStaff(u.role) } : null;
  return (
    <html lang="tr" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body>
        <CursorField />
        <ToastProvider>
          <TopNav user={nav} />
          <main>{children}</main>
          <SiteFooter />
        </ToastProvider>
      </body>
    </html>
  );
}
