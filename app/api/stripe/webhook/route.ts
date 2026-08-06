import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { getProduct } from "@/config/pricing";
import { db } from "@/lib/db";
import { provisionFromOrder } from "@/lib/provisioning";
import { getStripe } from "@/lib/stripe/client";

/**
 * Stripe webhook.
 *
 * Two rules matter here:
 *
 *   1. Verify the signature. Without it, anyone who finds this URL could
 *      provision themselves a paid account.
 *   2. Be idempotent. Stripe retries deliveries and can send the same event
 *      more than once; every event id is recorded and repeats are skipped.
 *
 * Always return 200 for events we understood, even if we chose to ignore them,
 * so Stripe stops retrying. Return 4xx/5xx only when Stripe should retry.
 */

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    console.warn("[stripe] Webhook received but Stripe is not configured. Ignoring.");
    return NextResponse.json({ received: true, ignored: "stripe_not_configured" });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  // The raw body is required — any parsing or re-encoding breaks the signature.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe] Signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Idempotency: a duplicate delivery finds its id already recorded and stops.
  try {
    await db.processedWebhookEvent.create({ data: { id: event.id, type: event.type } });
  } catch {
    console.info(`[stripe] Event ${event.id} already processed. Skipping.`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(event.data.object);
        break;

      case "invoice.payment_failed":
        console.warn(`[stripe] Payment failed for invoice ${event.data.object.id}.`);
        break;

      default:
        // Not an error — we simply do not act on this event type.
        break;
    }
  } catch (error) {
    console.error(`[stripe] Handler for ${event.type} failed:`, error);
    // Roll back the idempotency record so Stripe's retry can try again.
    await db.processedWebhookEvent.delete({ where: { id: event.id } }).catch(() => {});
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const leadId = session.metadata?.leadId;
  const productId = session.metadata?.productId;

  if (!leadId || !productId) {
    console.error(`[stripe] Session ${session.id} has no leadId/productId metadata.`);
    return;
  }

  await db.order.updateMany({
    where: { stripeSessionId: session.id },
    data: { status: "paid" },
  });

  const customerId =
    typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null);

  await provisionFromOrder({ leadId, productId, stripeCustomerId: customerId });
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const user = await db.user.findUnique({ where: { stripeCustomerId: customerId } });
  if (!user) {
    console.warn(`[stripe] No user for customer ${customerId}; skipping subscription sync.`);
    return;
  }

  const productId = subscription.metadata?.productId ?? "compliance";
  const product = getProduct(productId);
  const item = subscription.items.data[0];

  // Stripe moved the period fields onto subscription items; read from the item
  // and fall back to the subscription for older API shapes.
  const periodEnd =
    item?.current_period_end ??
    (subscription as unknown as { current_period_end?: number }).current_period_end ??
    null;

  await db.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      productId,
      status: subscription.status,
      amountCents: item?.price?.unit_amount ?? product?.priceCents ?? 0,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      status: subscription.status,
      amountCents: item?.price?.unit_amount ?? product?.priceCents ?? 0,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}
