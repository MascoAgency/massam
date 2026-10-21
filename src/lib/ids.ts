import "server-only";
import { randomBytes, createHash } from "crypto";
import { prisma } from "./db";

const ALPHA = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomSlug(len = 8) {
  const b = randomBytes(len);
  return Array.from(b, (x) => ALPHA[x % ALPHA.length]).join("");
}

export async function uniqueSlug() {
  for (let i = 0; i < 8; i++) {
    const s = randomSlug();
    if (!(await prisma.survey.findUnique({ where: { slug: s }, select: { id: true } }))) return s;
  }
  return randomSlug(12);
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const randomToken = () => randomBytes(32).toString("base64url");
