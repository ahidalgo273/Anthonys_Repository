import type { Metadata } from "next";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "DealerDesk terms of service: what the service includes, payment and refund terms, your responsibilities as the applicant, and limits of liability.",
  alternates: { canonical: "/legal/terms" },
};

/*
 * CONTENT: DRAFT TERMS — have an attorney review and revise before launch.
 * These are written to describe the business honestly, not to be legally
 * sufficient on their own. Do not publish without review.
 */
export default function TermsPage() {
  return (
    <div className="py-14 sm:py-20">
      <div className="container-prose prose-page">
        <h1 className="text-3xl sm:text-4xl font-bold">Terms of Service</h1>
        <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Last updated: {new Date().getFullYear()}
        </p>

        <div className="callout callout-warning mt-6">
          <p>
            <strong>Draft.</strong> These terms describe how the service works and must be reviewed
            by an attorney before {site.name} begins operating.
          </p>
        </div>

        <h2>1. Who we are</h2>
        <p>
          {site.name} prepares dealer license application paperwork and rents office suites. We are
          not a law firm and do not provide legal advice. See our{" "}
          <a href="/legal/disclaimer">legal disclaimer</a>, which is part of these terms.
        </p>

        <h2>2. What you are buying</h2>
        <p>
          Each product is described on our <a href="/pricing">pricing page</a>. In summary:
        </p>
        <ul>
          <li>
            <strong>License Filing Package</strong> — preparation of a complete application data
            packet and filing instructions for one state, one applicant, one license type. It does
            not include state fees, bond premiums, insurance, course fees, or fingerprinting costs.
          </li>
          <li>
            <strong>Compliance Subscription</strong> — ongoing deadline tracking, reminders,
            document storage, and renewal packet preparation, billed monthly until cancelled.
          </li>
          <li>
            <strong>Suite + Compliance Bundle</strong> — an office suite under a separate written
            lease, with the Compliance Subscription included. The lease governs the tenancy; these
            terms govern the service.
          </li>
          <li>
            <strong>Add-ons</strong> — as described at the time of purchase.
          </li>
        </ul>

        <h2>3. You are the applicant</h2>
        <p>
          You review, sign, and submit every document. We do not sign, file, submit, or attest to
          anything on your behalf, and we do not act as your representative before any agency. You
          are responsible for the accuracy of everything you submit, including information you
          provided to us that appears in your packet.
        </p>

        <h2>4. What you agree to provide</h2>
        <p>
          Accurate, complete, and current information, and the documents on your checklist. We
          cannot prepare a correct packet from incorrect inputs, and delays caused by missing
          documents are not delays we can fix.
        </p>

        <h2>5. Payment</h2>
        <p>
          Payments are processed by Stripe. One-time fees are charged at purchase. Subscriptions are
          charged monthly (or annually, where stated) until cancelled through the billing portal.
          Prices are those published at the time of purchase. We do not hold deposits.
        </p>

        <h2>6. Refunds</h2>
        <ul>
          <li>
            Before we begin preparation work, a one-time package fee is refundable in full on
            request.
          </li>
          <li>
            After preparation work has begun, refunds are prorated at our discretion based on work
            completed.
          </li>
          <li>
            If your application is rejected, we correct the cause and prepare a revised packet at no
            additional charge from us. State refiling fees remain yours.
          </li>
          <li>
            Subscriptions may be cancelled at any time and stop at the end of the paid period. We do
            not prorate partial months.
          </li>
          <li>Fees paid to third parties — states, bond companies, insurers, course providers, fingerprint vendors — are governed by those parties, not by us.</li>
        </ul>

        <h2>7. No guarantee of approval</h2>
        <p>
          Licensing decisions belong to the state. We do not guarantee that any application will be
          approved, or approved within any particular timeframe.
        </p>

        <h2>8. Legal questions</h2>
        <p>
          We do not answer questions calling for legal judgment. If you ask one — of a person or of
          our automated assistant — we will decline and offer an attorney referral. Referral does
          not create an attorney-client relationship with us, and we are not responsible for the
          advice of any attorney we refer you to.
        </p>

        <h2>9. Your account and documents</h2>
        <p>
          You are responsible for the security of the email address used to access your portal,
          since portal sign-in is by emailed link. Tell us immediately if you believe your email
          account has been compromised. Documents you upload remain yours; you may request deletion
          at any time, subject to any records we must retain.
        </p>

        <h2>10. Acceptable use</h2>
        <p>
          Do not use the service to submit false information to a government agency, to impersonate
          another person, or to apply on behalf of someone who is not you without proper authority.
          We will terminate service for any of these.
        </p>

        <h2>11. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, our total liability for any claim arising from the
          service is limited to the amount you paid us for the product giving rise to the claim. We
          are not liable for lost profits, lost business opportunity, or consequential damages,
          including those arising from a denied or delayed license application.
        </p>

        <h2>12. Changes</h2>
        <p>
          We may update these terms. Material changes will be communicated to active clients by
          email. Continuing to use the service after a change means you accept the updated terms.
        </p>

        <h2>13. Contact</h2>
        <p>
          Questions about these terms: <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>.
        </p>
      </div>
    </div>
  );
}
