import type Stripe from "stripe";
import { dueTodayCents, effectivePriceCents, getProduct, type Product } from "@/config/pricing";
import { absoluteUrl } from "@/config/site";
import { db } from "@/lib/db";
import { getStripe, priceIdFor, setupPriceIdFor } from "./client";

/**
 * Building a Stripe Checkout session — or the demo equivalent.
 *
 * The demo path is not a stub. It creates the same Order and Application rows
 * a real payment would, so the funnel, the portal, and the admin pipeline can
 * all be exercised end to end without a Stripe account. Demo orders carry
 * `isDemo: true` and are excluded from revenue metrics.
 */

export type CheckoutOutcome =
  | { kind: "stripe"; url: string; sessionId: string }
  | { kind: "demo"; orderId: string; reason: string };

export async function createCheckout({
  productId,
  leadId,
  email,
  addOnIds = [],
}: {
  productId: string;
  leadId: string;
  email: string;
  addOnIds?: string[];
}): Promise<CheckoutOutcome> {
  const product = getProduct(productId);
  if (!product) throw new Error(`Unknown product "${productId}".`);

  const addOns = addOnIds
    .map((id) => getProduct(id))
    .filter((p): p is Product => p !== undefined && !p.isPackage);

  const stripe = getStripe();
  const priceId = priceIdFor(product);

  // Fall back to the demo path when Stripe is not usable, and say why. A
  // missing price ID is a setup mistake, not a reason to show an error page.
  if (!stripe) {
    return createDemoOrder(product, addOns, leadId, "Stripe is not configured (no STRIPE_SECRET_KEY).");
  }
  if (!priceId) {
    return createDemoOrder(
      product,
      addOns,
      leadId,
      `No Stripe price ID configured for "${product.id}" (set ${product.stripePriceEnv}).`,
    );
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: priceId, quantity: 1 },
  ];

  // A subscription with a setup fee is one subscription line plus a one-time
  // line in the same session, which is how Stripe expects it.
  const setupPriceId = setupPriceIdFor(product);
  if (product.setupFeeCents && setupPriceId) {
    lineItems.push({ price: setupPriceId, quantity: 1 });
  }

  for (const addOn of addOns) {
    const addOnPriceId = priceIdFor(addOn);
    if (addOnPriceId) lineItems.push({ price: addOnPriceId, quantity: 1 });
    else console.warn(`[stripe] Skipping add-on "${addOn.id}": ${addOn.stripePriceEnv} is not set.`);
  }

  const isSubscription = product.period === "monthly" || product.period === "yearly";

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? "subscription" : "payment",
    line_items: lineItems,
    customer_email: email,
    // The webhook reads these to provision the account. Stripe returns them
    // verbatim, so they are the reliable link between payment and lead.
    metadata: {
      leadId,
      productId: product.id,
      addOnIds: addOns.map((a) => a.id).join(","),
    },
    ...(isSubscription
      ? { subscription_data: { metadata: { leadId, productId: product.id } } }
      : { payment_intent_data: { metadata: { leadId, productId: product.id } } }),
    success_url: absoluteUrl("/intake/complete?session_id={CHECKOUT_SESSION_ID}"),
    cancel_url: absoluteUrl(`/intake?step=package&canceled=1`),
    allow_promotion_codes: true,
    billing_address_collection: "required",
  });

  await db.order.create({
    data: {
      leadId,
      stripeSessionId: session.id,
      productId: product.id,
      amountCents: dueTodayCents(product) + addOns.reduce((sum, a) => sum + effectivePriceCents(a), 0),
      status: "pending",
    },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return { kind: "stripe", url: session.url, sessionId: session.id };
}

async function createDemoOrder(
  product: Product,
  addOns: Product[],
  leadId: string,
  reason: string,
): Promise<CheckoutOutcome> {
  console.info(`[stripe] Using the demo checkout path. ${reason}`);

  const order = await db.order.create({
    data: {
      leadId,
      productId: product.id,
      amountCents: dueTodayCents(product) + addOns.reduce((sum, a) => sum + effectivePriceCents(a), 0),
      status: "demo",
      isDemo: true,
    },
  });

  return { kind: "demo", orderId: order.id, reason };
}
