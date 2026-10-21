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

// Inter yazı tipi proje içinden sunulur (Google Fonts erişimine bağlı kalmadan derlenir); Türkçe karakterleri içerir
const sans = localFont({
  src: [
    { path: "./fonts/Inter-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Inter-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Inter-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Inter-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Inter-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

// Başlıklar: Space Grotesk · künye ve rakamlar: IBM Plex Mono (ikisi de OFL lisanslı, Türkçe karakterli)
const display = localFont({ src: "./fonts/SpaceGrotesk.ttf", weight: "300 700", variable: "--font-display", display: "swap" });
const mono = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexMono-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/IBMPlexMono-SemiBold.ttf", weight: "600", style: "normal" },
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
