import type { Metadata } from "next";
import Link from "next/link";
import { getProduct } from "@/config/pricing";
import { site } from "@/config/site";
import { getState } from "@/config/states";
import { db } from "@/lib/db";
import { getCurrentLead } from "@/lib/intake/actions";
import { provisionFromOrder } from "@/lib/provisioning";

export const metadata: Metadata = {
  title: "You're all set",
  description: "Your DealerDesk application has started.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Where Stripe (or the demo path) returns the client after checkout.
 *
 * On the demo path this page provisions the account directly, since there is
 * no webhook to do it. On the real path the webhook is authoritative — this
 * page only reports what happened, so a client closing the tab early still
 * gets their account.
 */
export default async function IntakeCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string; order?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  const lead = await getCurrentLead();
  const isDemo = params.demo === "1";

  if (isDemo && params.order && lead) {
    const order = await db.order.findUnique({ where: { id: params.order } });
    if (order?.isDemo) {
      await provisionFromOrder({
        leadId: lead.id,
        productId: order.productId,
        isDemo: true,
      });
    }
  }

  const product = lead?.selectedPackage ? getProduct(lead.selectedPackage) : undefined;
  const state = lead?.stateCode ? getState(lead.stateCode) : undefined;

  const firstSteps =
    state?.filingSteps.filter(
      (step) =>
        step.timing?.toLowerCase().includes("week 1") ||
        step.timing?.toLowerCase().includes("before"),
    ) ?? [];

  return (
    <div className="container-page py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        {isDemo && (
          <div className="callout callout-warning mb-6" role="status">
            <p>
              <strong>Demo checkout.</strong> Stripe is not configured on this installation, so no
              payment was taken and no card was charged. Everything else — your lead record, your
              application, and your portal account — was created exactly as it would be in a real
              purchase.
            </p>
          </div>
        )}

        <span className="badge badge-success">Application started</span>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold">
          {lead?.name ? `You're all set, ${lead.name.split(" ")[0]}.` : "You're all set."}
        </h1>
        <p className="mt-4 text-lg" style={{ color: "var(--text-muted)" }}>
          {product ? `${product.name} confirmed.` : "Your order is confirmed."} We have emailed you
          a receipt and a link to your client portal.
        </p>

        <div className="card mt-8">
          <h2 className="text-lg font-bold">What happens next</h2>
          <ol className="mt-4 space-y-3 text-sm" style={{ color: "var(--text-muted)" }}>
            <li>
              <strong style={{ color: "var(--text)" }}>1. Sign in to your portal.</strong> We email
              you a link — there is no password to set up.
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>2. Complete your application details.</strong>{" "}
              This is what we turn into your packet.
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>3. Upload documents as you collect them.</strong>{" "}
              We review each one and flag problems before the state sees them.
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>4. Review, sign, and file.</strong> You are
              the applicant — we never sign or submit for you.
            </li>
          </ol>
        </div>

        {state && firstSteps.length > 0 && (
          <div className="callout callout-info mt-6">
            <p className="font-semibold">Start these {state.name} items today</p>
            <p className="mt-1">
              These are the slow steps, and starting them now is the difference between a{" "}
              {state.timeline.minWeeks}-week filing and a {state.timeline.maxWeeks}-week one.
            </p>
            <ul className="mt-3 space-y-1.5">
              {firstSteps.map((step) => (
                <li key={step.title} className="text-sm">
                  · <strong>{step.title}</strong> — {step.detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        {lead?.attorneyReferral && (
          <div className="callout callout-info mt-6">
            <p className="font-semibold">About your attorney referral</p>
            <p className="mt-1">
              We flagged your file during screening and will follow up with attorney options.
              Nothing about your application is on hold — we keep working on the paperwork while you
              get a real answer.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/portal" className="btn btn-primary">
            Go to my portal
          </Link>
          {state && (
            <Link href={`/states/${state.slug}`} className="btn btn-secondary">
              Re-read the {state.name} guide
            </Link>
          )}
        </div>

        <p className="mt-8 text-sm" style={{ color: "var(--text-muted)" }}>
          Questions? Email{" "}
          <a href={`mailto:${site.contact.email}`} className="underline underline-offset-4">
            {site.contact.email}
          </a>{" "}
          or call{" "}
          <a href={`tel:${site.contact.phoneHref}`} className="underline underline-offset-4">
            {site.contact.phone}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
