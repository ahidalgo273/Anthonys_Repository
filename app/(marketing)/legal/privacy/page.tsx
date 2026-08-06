import type { Metadata } from "next";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What DealerDesk collects, what we deliberately do not collect (including Social Security numbers), who we share it with, and how to request deletion.",
  alternates: { canonical: "/legal/privacy" },
};

/*
 * CONTENT: DRAFT POLICY — have an attorney review before launch, and re-check
 * it against the data the application actually stores at that time.
 */
export default function PrivacyPage() {
  return (
    <div className="py-14 sm:py-20">
      <div className="container-prose prose-page">
        <h1 className="text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Last updated: {new Date().getFullYear()}
        </p>

        <div className="callout callout-warning mt-6">
          <p>
            <strong>Draft.</strong> Have an attorney review this policy before launch, and confirm
            it matches what the software actually stores at that time.
          </p>
        </div>

        <h2>The principle we build on</h2>
        <p>
          We collect only what the workflow needs. Every field in our system exists because a state
          application, a document checklist, or a deadline reminder requires it. If we do not need
          it, we do not ask for it.
        </p>

        <h2>What we deliberately do not collect</h2>
        <p>
          <strong>We do not collect or store Social Security numbers or driver&apos;s license
          numbers.</strong> Several state applications require them. Rather than hold that data, the
          packet we generate prints a labeled blank line where each one belongs, and you complete it
          by hand on your own signed copy. This is a deliberate design decision: data we never hold
          is data that cannot be breached.
        </p>

        <h2>What we do collect</h2>
        <ul>
          <li>
            <strong>Contact information</strong> — name, email, phone, and mailing address.
          </li>
          <li>
            <strong>Intake answers</strong> — your state, license goal, timeline, and eligibility
            screening responses.
          </li>
          <li>
            <strong>Business information</strong> — entity name, type, formation date, EIN, and
            business location details.
          </li>
          <li>
            <strong>Documents you upload</strong> — bond certificates, insurance certificates,
            leases, entity registrations, course certificates, and photos of your location.
          </li>
          <li>
            <strong>Compliance dates</strong> — license, bond, insurance, and occupation-tax
            expiration dates.
          </li>
          <li>
            <strong>Account and activity records</strong> — sign-in events and a log of changes to
            your file, so we can tell you what happened and when.
          </li>
        </ul>

        <h2>Sensitive answers</h2>
        <p>
          Our intake asks a yes/no question about criminal history and offers a free-text box for
          legal questions. We do this only to route you to an attorney referral. We do not ask for
          details of any record, we do not evaluate one, and we do not share your answer with anyone
          other than an attorney you ask us to refer you to.
        </p>

        <h2>Who we share it with</h2>
        <p>We share the minimum necessary with:</p>
        <ul>
          <li>
            <strong>Stripe</strong> — for payment processing. We never see or store your full card
            number.
          </li>
          <li>
            <strong>Our email provider</strong> — to send you sign-in links, status updates, and
            deadline reminders.
          </li>
          <li>
            <strong>Anthropic</strong> — when our assistant helps answer a question or checks a
            document for completeness, the relevant content is sent to their API for processing.
          </li>
          <li>
            <strong>Bond, insurance, and course providers</strong> — only when you ask us to refer
            you, and only what the referral requires.
          </li>
          <li>
            <strong>An attorney</strong> — only if you request a referral.
          </li>
        </ul>
        <p>
          <strong>We do not sell your data, and we do not share it for advertising.</strong> We
          disclose information to a government agency only if legally compelled.
        </p>

        <h2>How long we keep it</h2>
        <p>
          For as long as you are a client, plus a retention period afterward for our records. You
          can ask us to delete your documents and personal information at any time and we will do
          so, except where we must retain something for tax or legal reasons.
        </p>

        <h2>Security</h2>
        <p>
          Documents are stored in access-controlled storage. Portal access is by emailed sign-in
          link with single-use, expiring tokens — there is no password to be stolen or reused. No
          system is perfectly secure, which is exactly why we do not hold Social Security numbers.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>Request a copy of your data.</li>
          <li>Correct anything inaccurate.</li>
          <li>Request deletion.</li>
          <li>Unsubscribe from marketing email. Deadline reminders and service messages continue while you are an active client, because they are the service.</li>
        </ul>

        <h2>Cookies</h2>
        <p>
          We use a single cookie to keep you signed in to your portal. We do not use advertising or
          cross-site tracking cookies.
        </p>

        <h2>Children</h2>
        <p>
          The service is for adults applying for dealer licenses. We do not knowingly collect
          information from anyone under 18.
        </p>

        <h2>Contact</h2>
        <p>
          Privacy requests and questions:{" "}
          <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>.
        </p>
      </div>
    </div>
  );
}
