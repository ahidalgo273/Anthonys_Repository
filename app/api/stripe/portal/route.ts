import { NextResponse } from "next/server";
import { absoluteUrl } from "@/config/site";
import { getCurrentUser } from "@/lib/auth/session";
import { getStripe } from "@/lib/stripe/client";

/**
 * Opens Stripe's billing portal for the signed-in customer.
 *
 * POST rather than GET so a link crawler or prefetch cannot create sessions.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(absoluteUrl("/signin?next=/portal/billing"));

  const stripe = getStripe();
  if (!stripe || !user.stripeCustomerId) {
    return NextResponse.redirect(absoluteUrl("/portal/billing?error=unavailable"));
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: absoluteUrl("/portal/billing"),
  });

  return NextResponse.redirect(session.url, { status: 303 });
}
