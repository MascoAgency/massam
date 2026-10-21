import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUser, fail, ok, readJson } from "@/lib/api";
import { stripe, stripeEnabled } from "@/lib/billing/stripe";
import { appUrl } from "@/lib/site";

/** Stripe Checkout ile abonelik başlatır; dönen adrese yönlendirilir. */
export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof NextResponse) return user;
  if (!stripeEnabled()) return fail(400, "Kartla ödeme henüz etkin değil. Plan talebi gönderebilirsiniz.");
  const { planId } = await readJson<{ planId?: string }>(req);
  const plan = planId ? await prisma.plan.findUnique({ where: { id: planId } }) : null;
  if (!plan || !plan.stripePriceId || plan.priceTry <= 0) return fail(400, "Bu plan için çevrim içi ödeme tanımlı değil.");
  if (user.subscriptionId) return fail(400, "Etkin bir aboneliğiniz var. Plan değişikliği için “Aboneliği yönet” bölümünü kullanın.");

  let customer = user.stripeCustomerId;
  if (!customer) {
    const c = await stripe().customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } });
    customer = c.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer } });
  }
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    subscription_data: { metadata: { userId: user.id, planId: plan.id } },
    metadata: { userId: user.id, planId: plan.id },
    locale: "tr",
    allow_promotion_codes: true,
    success_url: `${appUrl()}/uyelik?odeme=basarili`,
    cancel_url: `${appUrl()}/uyelik?odeme=iptal`,
  });
  return ok({ url: session.url });
}
