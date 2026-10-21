import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

class InvalidLogin extends CredentialsSignin {
  code = "invalid";
}
class DisabledAccount extends CredentialsSignin {
  code = "disabled";
}
class TooManyAttempts extends CredentialsSignin {
  code = "locked";
}

const MAX_FAILS = 5; // 15 dakikada en fazla 5 hatalı deneme
const WINDOW_MS = 15 * 60_000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 3600 },
  trustHost: true,
  pages: { signIn: "/giris" },
  providers: [
    Credentials({
      credentials: { email: { label: "E-posta" }, password: { label: "Şifre", type: "password" } },
      async authorize(c) {
        const email = String(c?.email || "").trim().toLowerCase();
        const password = String(c?.password || "");
        if (!email || !password) throw new InvalidLogin();
        const since = new Date(Date.now() - WINDOW_MS);
        const fails = await prisma.loginAttempt.count({ where: { email, success: false, createdAt: { gte: since } } });
        if (fails >= MAX_FAILS) throw new TooManyAttempts();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
          await prisma.loginAttempt.create({ data: { email, success: false } });
          throw new InvalidLogin();
        }
        if (user.disabled) throw new DisabledAccount();
        // Başarılı girişte bu e-postanın hatalı deneme sayacı sıfırlanır
        await prisma.loginAttempt.deleteMany({ where: { email, success: false } });
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.uid && session.user) session.user.id = String(token.uid);
      return session;
    },
  },
});
