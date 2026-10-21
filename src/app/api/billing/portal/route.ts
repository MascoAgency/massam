import { NextResponse } from "next/server";
import { apiUser, fail, ok } from "@/lib/api";
import { stripe, stripeEnabled } from "@/lib/billing/stripe";
import { appUrl } from "@/lib/site";

/** Stripe müşteri portalı: kart güncelleme, fatura, plan değişikliği ve iptal */
export async function POST() {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  if (!stripeEnabled() || !user.stripeCustomerId) return fail(400, "Yönetilecek bir aboneliğiniz yok.");
  const s = await stripe().billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${appUrl()}/uyelik`, locale: "tr" });
  return ok({ url: s.url });
}
