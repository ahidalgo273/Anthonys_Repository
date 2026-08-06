import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/config/site";

/*
 * PHASE 1 PLACEHOLDER.
 * Phase 3 replaces this with the magic-link sign-in page and moves the portal
 * out of the marketing route group into its own authenticated layout.
 */

export const metadata: Metadata = {
  title: "Client Portal",
  description: "Sign in to your DealerDesk client portal.",
  alternates: { canonical: "/portal" },
  robots: { index: false, follow: false },
};

export default function PortalPlaceholderPage() {
  return (
    <Section>
      <div className="container-prose px-0">
        <SectionHeading
          title="Client portal"
          description="Your document checklist, application status, packet downloads, and compliance calendar will live here."
        />

        <div className="callout callout-info mt-8">
          <p>
            <strong>The portal is being finished.</strong> If you are already a client and need a
            document or a status update, email{" "}
            <a
              href={`mailto:${site.contact.email}`}
              className="underline underline-offset-4"
              style={{ color: "var(--info)" }}
            >
              {site.contact.email}
            </a>{" "}
            and we will send it straight over.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/contact" className="btn btn-primary">
            Contact us
          </Link>
          <Link href="/" className="btn btn-secondary">
            Back to home
          </Link>
        </div>
      </div>
    </Section>
  );
}
