import "server-only";
import nodemailer from "nodemailer";

export async function sendMail(to: string, subject: string, text: string, html: string) {
  const url = process.env.SMTP_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      // Canlıda şifre sıfırlama bağlantısı gibi gizli içerik günlüğe yazılmaz
      console.warn(`[e-posta gönderilmedi: SMTP_URL tanımlı değil] Konu: ${subject}`);
      return;
    }
    // Geliştirme ortamı: e-posta yerine konsola yaz
    console.info(`\n[e-posta gönderilmedi: SMTP_URL tanımlı değil]\nKime: ${to}\nKonu: ${subject}\n${text}\n`);
    return;
  }
  const transport = nodemailer.createTransport(url);
  await transport.sendMail({ from: process.env.MAIL_FROM || "MASSAM Araştırma <no-reply@maskder.org>", to, subject, text, html });
}
