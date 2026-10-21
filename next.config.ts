import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF ve e-posta kütüphaneleri Node.js ortamında paketlenmeden çalışır
  serverExternalPackages: ["@react-pdf/renderer", "nodemailer", "bcryptjs"],
  // PDF yazı tipleri ve kapak logosu sunucusuz ortama (Vercel) dahil edilsin
  outputFileTracingIncludes: {
    // pdfkit standart yazı tiplerini çalışma anında dinamik yüklediği için izleyici bunları kendiliğinden bulamaz
    "/api/reports/[id]/pdf": ["./assets/**/*", "./node_modules/pdfkit/js/**/*"],
    "/api/public/reports/[id]": ["./assets/**/*", "./node_modules/pdfkit/js/**/*"],
  },
  poweredByHeader: false,
  // Önceki sürümdeki sayfa adresleri yeni menüye yönlendirilir
  async redirects() {
    return [
      { source: "/hakkinda", destination: "/hakkimizda", permanent: true },
      { source: "/maskder", destination: "/hakkimizda#maskder", permanent: true },
      { source: "/arastirmalar", destination: "/anketler", permanent: true },
      { source: "/raporlar", destination: "/yayinlar", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Panel ve yönetim başka sitelere gömülemez; anket katılım sayfaları (/s/...) maskder.com gibi sitelere gömülebilir
        source: "/((?!s/).*)",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
};

export default nextConfig;
