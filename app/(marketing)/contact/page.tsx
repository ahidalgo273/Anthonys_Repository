import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { Section, SectionHeading } from "@/components/section";
import { BreadcrumbJsonLd } from "@/components/structured-data";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Questions about dealer licensing in Georgia, Florida, or North Carolina? Email ${site.contact.email} or call ${site.contact.phone}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ]}
      />

      <Section>
        <SectionHeading
          title="Get in touch"
          description="Ask us anything about the process, the pricing, or the documents. We answer real questions — you do not have to sit through a pitch to find out what something costs, because the prices are already published."
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div>
            <div className="card">
              <h2 className="text-lg font-bold">Direct contact</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="font-semibold">Email</dt>
                  <dd>
                    <a
                      href={`mailto:${site.contact.email}`}
                      className="underline underline-offset-4"
                      style={{ color: "var(--info)" }}
                    >
                      {site.contact.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Phone</dt>
                  <dd>
                    <a
                      href={`tel:${site.contact.phoneHref}`}
                      className="underline underline-offset-4"
                      style={{ color: "var(--info)" }}
                    >
                      {site.contact.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Office</dt>
                  <dd style={{ color: "var(--text-muted)" }}>
                    <address className="not-italic">
                      {site.address.street}
                      <br />
                      {site.address.city}, {site.address.region} {site.address.postalCode}
                    </address>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Hours</dt>
                  <dd style={{ color: "var(--text-muted)" }}>
                    {site.hours.days}, {site.hours.opens}–{site.hours.closes} ET
                    <br />
                    {site.hours.note}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="callout callout-warning mt-6">
              <p className="font-semibold">Before you write</p>
              <p className="mt-2">
                If your question is a legal one — whether a past record affects your application,
                how to structure an entity, what a regulation means for your situation — we will
                refer you to a licensed attorney rather than answer it. Say so in your message and
                we will arrange the referral.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Already a client?{" "}
                <Link href="/portal" className="underline underline-offset-4">
                  Sign in to your portal
                </Link>
                . Ready to begin?{" "}
                <Link href="/intake" className="underline underline-offset-4">
                  Start your intake
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold">Send a message</h2>
            <div className="mt-4">
              <ContactForm />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
