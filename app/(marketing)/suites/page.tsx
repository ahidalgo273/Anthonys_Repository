import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/section";
import { BreadcrumbJsonLd } from "@/components/structured-data";
import { SuiteInquiryForm } from "@/components/suite-inquiry-form";
import { formatUsd, getProduct } from "@/config/pricing";
import { site } from "@/config/site";
import { georgia } from "@/config/states";

export const metadata: Metadata = {
  title: "Atlanta Dealer Suites",
  description:
    "License-compliant 250 sq ft office suites in Atlanta for used-car dealers. Meets Georgia's established-place-of-business requirement. $549/month plus $995 setup, compliance included.",
  alternates: { canonical: "/suites" },
  openGraph: {
    title: "Atlanta Dealer Suites | DealerDesk",
    description:
      "250 sq ft license-compliant office suites in Atlanta, built for Georgia's dealer location requirement. $549/month + $995 setup.",
  },
};

const included = [
  {
    title: "250 sq ft private office",
    body: "A real, lockable office — not a desk in a shared room and not a mailbox. Georgia's 2026 rules call for roughly this size.",
  },
  {
    title: "Compliant signage",
    body: "Your dealership name on permanent signage at the suite, installed to meet the state's identification requirement.",
  },
  {
    title: "A lease you can file",
    body: "A written lease naming your entity, in the format inspectors expect to see attached to an application.",
  },
  {
    title: "Compliance Subscription included",
    body: "Renewal calendar, bond and insurance monitoring, occupation-tax reminders, document vault, and renewal packet prep — the $59/month plan, at no extra charge.",
  },
  {
    title: "Inspection-ready setup",
    body: "The space is already configured for what an inspector looks for. We walk you through the rest with a photo checklist.",
  },
  {
    title: "Business hours you can post",
    body: "The building is accessible during posted business hours so you can meet the reachability requirement honestly.",
  },
];

export default function SuitesPage() {
  const bundle = getProduct("suite_bundle")!;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Atlanta Suites", path: "/suites" },
        ]}
      />

      <section className="border-b" style={{ backgroundColor: "var(--bg-subtle)" }}>
        <div className="container-page py-14 sm:py-20">
          <div className="max-w-3xl">
            <span className="badge badge-info">Atlanta, Georgia</span>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold">
              A dealer office that passes inspection.
            </h1>
            <p className="mt-5 text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Georgia requires an established place of business — a real office an inspector can
              walk into, with a sign and a business landline. That single requirement is where most
              would-be dealers stall. We rent {georgia.office.minSqFt} sq ft suites in our Atlanta
              building built specifically to satisfy it.
            </p>
            <p className="mt-6 text-2xl font-bold">
              {formatUsd(bundle.priceCents)}/month + {formatUsd(bundle.setupFeeCents!)} setup
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Compliance Subscription included. No deposit held.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#inquiry" className="btn btn-primary">
                Check availability
              </Link>
              <Link href="/states/georgia#office" className="btn btn-secondary">
                Georgia office rules
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Photos ───────────────────────────────────────────────────────── */}
      <Section>
        <SectionHeading title="The space" description="Photos of the actual building and suites." />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Building exterior with street signage",
            "Typical 250 sq ft suite, unfurnished",
            "Suite door with dealership signage",
            "Shared entrance and common corridor",
            "Suite configured as a working dealer office",
            "Parking and building access",
          ].map((caption) => (
            <figure key={caption} className="card-flush">
              {/*
                PLACEHOLDER: replace with real photographs before launch.
                See the README launch punch list.
              */}
              <div
                className="flex aspect-[4/3] items-center justify-center border-b text-sm"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)" }}
                role="img"
                aria-label={`Placeholder image: ${caption}`}
              >
                Photo coming soon
              </div>
              <figcaption className="p-3 text-sm" style={{ color: "var(--text-muted)" }}>
                {caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ── What's included ──────────────────────────────────────────────── */}
      <Section subtle>
        <SectionHeading title="What the bundle includes" />
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {included.map((item) => (
            <div key={item.title} className="card">
              <h3 className="text-base font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Honesty section ──────────────────────────────────────────────── */}
      <Section>
        <SectionHeading title="What a suite is not" />
        <div className="mt-8 space-y-4">
          <div className="callout callout-warning">
            <p>
              <strong>It is not a Florida or North Carolina solution.</strong> Those states require a
              location inside the state. An Atlanta suite cannot satisfy an FL or NC application. If
              that is your state, we will help you evaluate a local space instead — send us photos
              before you sign a lease.
            </p>
          </div>
          <div className="callout callout-warning">
            <p>
              <strong>It is not a mailbox or a virtual office.</strong> Those do not pass a dealer
              inspection anywhere, and using one is a reliable way to get denied. These are real,
              private offices.
            </p>
          </div>
          <div className="callout callout-info">
            <p>
              <strong>It is not a guarantee of approval.</strong> The suite satisfies the location
              requirement. Your bond, your background check, your seminar, and your paperwork are
              still yours to complete — we help with all of it, but no one can promise a state will
              approve an application.
            </p>
          </div>
        </div>
      </Section>

      {/* ── Inquiry ──────────────────────────────────────────────────────── */}
      <Section subtle id="inquiry">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              title="Check availability"
              description="Tell us your timing and we will confirm what is open. Suite tours are by appointment."
            />
            <address className="mt-6 text-sm not-italic" style={{ color: "var(--text-muted)" }}>
              {site.address.street}
              <br />
              {site.address.city}, {site.address.region} {site.address.postalCode}
              <br />
              <br />
              <a href={`tel:${site.contact.phoneHref}`} className="hover:underline">
                {site.contact.phone}
              </a>
              <br />
              <a href={`mailto:${site.contact.email}`} className="hover:underline">
                {site.contact.email}
              </a>
              <br />
              <br />
              {site.hours.days}, {site.hours.opens}–{site.hours.closes} ET. {site.hours.note}
            </address>
          </div>
          <div className="card">
            <SuiteInquiryForm />
          </div>
        </div>
      </Section>
    </>
  );
}
