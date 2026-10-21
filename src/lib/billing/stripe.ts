import "server-only";
import Stripe from "stripe";
import { prisma } from "../db";
import { isStaff } from "../roles";

let client: Stripe | null = null;
export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY tanımlı değil");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

/** Stripe aboneliğini kullanıcının planına yansıtır. */
export async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const user =
    (sub.metadata?.userId && (await prisma.user.findUnique({ where: { id: sub.metadata.userId } }))) ||
    (await prisma.user.findUnique({ where: { stripeCustomerId: customerId } }));
  if (!user) {
    console.warn("Stripe aboneliği için kullanıcı bulunamadı:", sub.id);
    return;
  }
  const item = sub.items.data[0];
  const priceId = item?.price?.id;
  const plan = priceId ? await prisma.plan.findFirst({ where: { stripePriceId: priceId } }) : null;
  const active = ["active", "trialing", "past_due"].includes(sub.status);
  // API sürümüne göre dönem sonu abonelikte ya da kalemde bulunur
  const periodEnd =
    (item as unknown as { current_period_end?: number })?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeCustomerId: customerId,
      subscriptionId: active ? sub.id : null,
      subscriptionStatus: sub.status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      planId: active && plan ? plan.id : isStaff(user.role) ? user.planId : "free",
      requestedPlanId: null,
      requestedAt: null,
    },
  });
}
