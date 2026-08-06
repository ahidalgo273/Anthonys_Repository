import Stripe from "stripe";
import { products, type Product } from "@/config/pricing";

/**
 * Stripe access, and the demo path used when Stripe is not configured.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NON-DEVELOPER NOTE
 * You can run and demo the entire intake funnel with no Stripe account at all.
 * When STRIPE_SECRET_KEY is missing, checkout takes a clearly-labeled demo
 * path: the lead and application records are created exactly as they would be,
 * but no money moves and the order is marked `isDemo` so it never shows up in
 * your revenue numbers.
 *
 * The README walks through creating the products and prices in Stripe's test
 * mode when you are ready.
 * ─────────────────────────────────────────────────────────────────────────────
 */

let cached: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** The Stripe client, or null when Stripe is not configured. Callers must handle null. */
export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) return null;
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      // Pinning the API version means a Stripe-side upgrade cannot silently
      // change behavior underneath us. This must match the version the
      // installed SDK was generated against (node_modules/stripe apiVersion).
      apiVersion: "2026-07-29.dahlia",
      typescript: true,
      appInfo: { name: "DealerDesk" },
    });
  }
  return cached;
}

/** The Stripe price ID configured for a product, or null if it is not set. */
export function priceIdFor(product: Product): string | null {
  return process.env[product.stripePriceEnv] ?? null;
}

export function setupPriceIdFor(product: Product): string | null {
  if (!product.stripeSetupPriceEnv) return null;
  return process.env[product.stripeSetupPriceEnv] ?? null;
}

/**
 * Which products can actually be sold right now.
 *
 * Surfaced in the admin dashboard so a missing price ID is visible rather than
 * discovered by a customer at checkout.
 */
export function checkoutReadiness(): {
  stripeConfigured: boolean;
  ready: string[];
  missingPriceIds: string[];
} {
  const ready: string[] = [];
  const missingPriceIds: string[] = [];

  for (const product of products) {
    const hasPrice = Boolean(priceIdFor(product));
    const needsSetup = Boolean(product.stripeSetupPriceEnv);
    const hasSetup = !needsSetup || Boolean(setupPriceIdFor(product));

    if (hasPrice && hasSetup) ready.push(product.id);
    else missingPriceIds.push(product.id);
  }

  return { stripeConfigured: isStripeConfigured(), ready, missingPriceIds };
}
