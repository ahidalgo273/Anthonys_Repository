import type { Metadata } from "next";
import Link from "next/link";
import { PackageCards } from "@/components/pricing-table";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/config/site";

/*
 * PHASE 1 PLACEHOLDER.
 * Phase 2 replaces this file with the multi-step intake wizard (contact →
 * state → goal → timeline → eligibility screening → package → Stripe
 * checkout). It exists now so the site has no dead links and can be deployed
 * as-is.
 */

export const metadata: Metadata = {
  title: "Start Your Application",
  description:
    "Begin your used-car dealer license application for Georgia, Florida, or North Carolina. Free screening, published pricing, no deposit.",
  alternates: { canonical: "/intake" },
};

export default function IntakePage() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Get started"
        title="Start your application"
        description="The online intake is being finished. In the meantime, tell us what you need and we will walk you through the same screening by email or phone — same published pricing, still no deposit."
      />

      <div className="callout callout-info mt-8">
        <p>
          <strong>Online intake opens shortly.</strong> Email{" "}
          <a
            href={`mailto:${site.contact.email}`}
            className="underline underline-offset-4"
            style={{ color: "var(--info)" }}
          >
            {site.contact.email}
          </a>{" "}
          or call{" "}
          <a
            href={`tel:${site.contact.phoneHref}`}
            className="underline underline-offset-4"
            style={{ color: "var(--info)" }}
          >
            {site.contact.phone}
          </a>{" "}
          and we will start your file today.
        </p>
      </div>

      <div className="mt-10">
        <h2 className="mb-6 text-xl font-bold">What you would be buying</h2>
        <PackageCards showCta={false} />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/contact" className="btn btn-primary">
          Contact us to begin
        </Link>
        <Link href="/states" className="btn btn-secondary">
          Read your state guide first
        </Link>
      </div>
    </Section>
  );
}
