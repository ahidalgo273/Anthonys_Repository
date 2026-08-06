import type { Metadata } from "next";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Legal Disclaimer",
  description:
    "DealerDesk is not a law firm and does not provide legal advice. What we do, what we do not do, and what remains your responsibility as the applicant.",
  alternates: { canonical: "/legal/disclaimer" },
};

/*
 * CONTENT: have an attorney review this page before launch. It states the
 * boundaries of the service and is the page most likely to matter if a client
 * ever disputes what was promised.
 */
export default function DisclaimerPage() {
  return (
    <div className="py-14 sm:py-20">
      <div className="container-prose prose-page">
        <h1 className="text-3xl sm:text-4xl font-bold">Legal Disclaimer</h1>
        <p className="mt-4 text-lg" style={{ color: "var(--text-muted)" }}>
          The short version: we are not lawyers, we prepare paperwork, and you are the applicant.
        </p>

        <h2>We are not a law firm</h2>
        <p>{site.disclaimer}</p>

        <h2>What we do</h2>
        <ul>
          <li>
            Prepare and organize dealer license application paperwork based on information you
            provide to us.
          </li>
          <li>
            Produce a prepared application data packet, a filing instruction sheet, and an
            inspection-prep checklist for your review.
          </li>
          <li>
            Maintain a document checklist and a compliance calendar with reminders for renewal,
            bond, insurance, and occupation-tax deadlines.
          </li>
          <li>
            Refer you to third-party providers for surety bonds, insurance, and pre-license
            education. We do not underwrite, issue, or guarantee any of those products.
          </li>
          <li>Rent office suites in our Atlanta building under a separate written lease.</li>
        </ul>

        <h2>What we do not do</h2>
        <ul>
          <li>
            <strong>We do not provide legal advice.</strong> We do not interpret statutes or
            regulations for your situation, advise on entity structuring, or assess whether any fact
            about your history will affect a licensing decision.
          </li>
          <li>
            <strong>We do not sign, submit, file, or attest to anything on your behalf.</strong> You
            are the applicant and the signatory on every document. Every packet we produce is a
            draft for your review.
          </li>
          <li>
            <strong>We do not guarantee approval.</strong> Licensing decisions belong to the state.
            No one can promise you a license, and you should be skeptical of anyone who does.
          </li>
          <li>
            <strong>We do not represent you before any agency.</strong> We are not your agent,
            attorney, or authorized representative.
          </li>
        </ul>

        <h2>Legal questions get referred, not answered</h2>
        <p>
          If you ask us a question that calls for legal judgment — whether a criminal record affects
          your application, how to structure an entity to achieve a particular outcome, what a
          regulation requires in your specific circumstances — we will decline to answer it and flag
          your file for an attorney referral instead. This applies to our staff and to our automated
          assistant alike.
        </p>
        <p>
          This is not us being unhelpful. A confident wrong answer to a licensing question can cost
          you months and thousands of dollars, and we are not qualified to give a right one.
        </p>

        <h2>Information on this site</h2>
        <p>
          State requirements, fees, bond amounts, and deadlines published on this site are general
          information gathered from public sources. They change, sometimes with little notice. We
          re-verify them regularly and confirm current figures with you during intake, but you
          should not rely on this site as your sole source before spending money. Each state guide
          page links to the official sources.
        </p>

        <h2>Your responsibility</h2>
        <p>
          You are responsible for the accuracy and completeness of everything you submit to a state
          agency, including information you gave us that we transcribed into your packet. Review
          every field before you sign. That review is not a formality — it is the step where errors
          get caught.
        </p>

        <h2>Personal information</h2>
        <p>
          We collect only what the workflow requires. We do not collect or store Social Security
          numbers. Where a state form requires one, your packet prints a labeled blank line for you
          to complete by hand on your own signed copy. See our{" "}
          <a href="/legal/privacy">privacy policy</a> for details.
        </p>

        <h2>Questions</h2>
        <p>
          Email <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a> if anything here
          is unclear.
        </p>
      </div>
    </div>
  );
}
