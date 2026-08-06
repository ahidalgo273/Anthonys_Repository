import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/components/faq-list";
import { PriceSummaryTable } from "@/components/pricing-table";
import { Section, SectionHeading } from "@/components/section";
import { FaqJsonLd } from "@/components/structured-data";
import { formatUsd, getProduct } from "@/config/pricing";
import { site } from "@/config/site";
import { stateList } from "@/config/states";
import { featuredFaqs } from "@/content/faq";

export const metadata: Metadata = {
  // `absolute` stops the root layout's "%s | DealerDesk" template from
  // appending the brand name twice on the home page.
  title: { absolute: `${site.name} — ${site.tagline}` },
  description: site.description,
  alternates: { canonical: "/" },
};

const steps = [
  {
    number: "01",
    title: "Tell us what you want to do",
    body: "A five-minute intake tells us your state, whether you need auction access or retail sales, and whether you need an office. You see our screening results immediately — including the parts that are going to be hard.",
  },
  {
    number: "02",
    title: "We build your checklist and prepare the paperwork",
    body: "You get a document checklist specific to your state, referrals for your bond and insurance, and a portal to upload everything. We review each document and flag problems before the state sees them.",
  },
  {
    number: "03",
    title: "You review, sign, and file",
    body: "We hand you a complete application data packet and a step-by-step filing instruction sheet. You check every field, sign as the applicant, and submit. We never sign anything for you.",
  },
  {
    number: "04",
    title: "We keep you compliant",
    body: "Inspection prep, then renewal, bond, insurance, and occupation-tax dates tracked with reminders at 90, 60, and 30 days. Nobody loses a license to a missed calendar date on our watch.",
  },
];

const trustPoints = [
  {
    title: "Published prices",
    body: "Every price we charge is on the pricing page. You never have to give us a phone number to find out what something costs.",
  },
  {
    title: "No hidden fees",
    body: "No deposits, no application-review fees, no rush fees. State fees and bond premiums are paid by you, directly, and we tell you what to expect.",
  },
  {
    title: "You sign everything",
    body: "You are the applicant on every form. We prepare drafts for your review. Anyone offering to sign or file on your behalf is offering you a liability.",
  },
  {
    title: "Fast, because the paperwork is automated",
    body: "Your packet is generated the moment your documents are complete — not whenever someone gets to it. We tell you on day one which slow steps to start immediately.",
  },
];

export default function HomePage() {
  const filing = getProduct("license_filing")!;
  const compliance = getProduct("compliance")!;
  const bundle = getProduct("suite_bundle")!;

  return (
    <>
      <FaqJsonLd items={featuredFaqs.map((f) => ({ question: f.question, answer: f.answer }))} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="border-b" style={{ backgroundColor: "var(--bg-subtle)" }}>
        <div className="container-page py-16 sm:py-24">
          <div className="max-w-3xl">
            <span className="badge badge-info">Georgia · Florida · North Carolina</span>
            <h1 className="mt-4 text-4xl sm:text-5xl font-bold">
              Get your dealer license without the runaround.
            </h1>
            <p className="mt-5 text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
              We prepare used-car dealer license applications for Georgia, Florida, and North
              Carolina, and we rent license-compliant office suites in Atlanta. Our prices are
              published. Our fees are the ones you see. You stay the applicant on every form.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/intake" className="btn btn-primary">
                Start my application — {formatUsd(filing.launchPriceCents ?? filing.priceCents)}
              </Link>
              <Link href="/pricing" className="btn btn-secondary">
                See all prices
              </Link>
            </div>
            <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
              Launch price {formatUsd(filing.launchPriceCents!)} — regularly{" "}
              {formatUsd(filing.priceCents)}. No deposit required.
            </p>
          </div>
        </div>
      </section>

      {/* ── Why us ───────────────────────────────────────────────────────── */}
      <Section>
        <SectionHeading
          eyebrow="Why DealerDesk"
          title="The dealer-licensing business has a transparency problem. We are the fix."
          description="Most services in this space hide their pricing until they have you on the phone, take a deposit before they tell you what you actually need, and add fees as the file drags on. We decided to just publish everything."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {trustPoints.map((point) => (
            <div key={point.title} className="card">
              <h3 className="text-base font-bold">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {point.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <Section subtle id="how-it-works">
        <SectionHeading
          eyebrow="How it works"
          title="Four steps, and you know what happens at each one."
        />
        <ol className="mt-10 grid gap-6 md:grid-cols-2">
          {steps.map((step) => (
            <li key={step.number} className="card">
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: "var(--accent)" }}
                aria-hidden="true"
              >
                {step.number}
              </span>
              <h3 className="mt-1 text-base font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {step.body}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <Link href="/how-it-works" className="btn btn-secondary">
            See the full process
          </Link>
        </div>
      </Section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <Section id="pricing">
        <SectionHeading
          eyebrow="Transparent pricing"
          title="Here is what everything costs."
          description="These are our fees. State fees, bond premiums, insurance, and course costs are paid by you directly to those parties — each state guide lists what to expect."
        />
        <div className="mt-10">
          <PriceSummaryTable />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/pricing" className="btn btn-primary">
            Full pricing details
          </Link>
          <Link href="/suites" className="btn btn-secondary">
            About the Atlanta suites
          </Link>
        </div>
      </Section>

      {/* ── States ───────────────────────────────────────────────────────── */}
      <Section subtle>
        <SectionHeading
          eyebrow="State guides"
          title="What each state actually requires."
          description="Requirements, costs, timelines, and office rules — including the parts that disqualify people. If a license will not do what you want, we would rather tell you now."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {stateList.map((state) => (
            <Link
              key={state.code}
              href={`/states/${state.slug}`}
              className="card transition-colors hover:border-[var(--border-strong)]"
            >
              <h3 className="text-lg font-bold">{state.name}</h3>
              <p className="mt-1 text-sm font-medium" style={{ color: "var(--accent)" }}>
                {state.licenseType}
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt style={{ color: "var(--text-muted)" }}>Surety bond</dt>
                  <dd className="font-semibold">{formatUsd(state.bond.amountCents)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt style={{ color: "var(--text-muted)" }}>Office minimum</dt>
                  <dd className="font-semibold">{state.office.minSqFt} sq ft</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt style={{ color: "var(--text-muted)" }}>Typical timeline</dt>
                  <dd className="font-semibold">
                    {state.timeline.minWeeks}–{state.timeline.maxWeeks} weeks
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt style={{ color: "var(--text-muted)" }}>Retail sales</dt>
                  <dd className="font-semibold">
                    {state.capabilities.retailSales ? "Allowed" : "Not allowed"}
                  </dd>
                </div>
              </dl>
              <span
                className="mt-4 inline-block text-sm font-semibold underline underline-offset-4"
                style={{ color: "var(--info)" }}
              >
                Read the {state.name} guide
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* ── Suites ───────────────────────────────────────────────────────── */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Atlanta suites"
              title="The office problem, solved."
              description="Georgia wants a real office an inspector can walk into — roughly 250 square feet, a sign, a business landline. That stops most people. We rent suites in our Atlanta building built for exactly this requirement."
            />
            <ul className="mt-6 space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <li>· 250 sq ft private, lockable office</li>
              <li>· Compliant signage installed</li>
              <li>· A lease you can attach to your application</li>
              <li>· Compliance Subscription included</li>
            </ul>
            <p className="mt-6 text-lg font-bold">
              {formatUsd(bundle.priceCents)}/month + {formatUsd(bundle.setupFeeCents!)} setup
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/suites" className="btn btn-primary">
                See the suites
              </Link>
              <Link href="/suites#inquiry" className="btn btn-secondary">
                Check availability
              </Link>
            </div>
          </div>
          <div className="callout callout-warning">
            <p className="font-semibold">Worth saying plainly:</p>
            <p className="mt-2">
              Our suites satisfy <strong>Georgia&apos;s</strong> location requirement. They cannot
              be used for a Florida or North Carolina license — those states require a location
              inside the state. If you are applying in FL or NC, we help you evaluate a local space
              instead, before you sign a lease.
            </p>
          </div>
        </div>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <Section subtle id="faq">
        <SectionHeading eyebrow="FAQ" title="The questions people actually ask." />
        <div className="mt-10">
          <FaqList items={featuredFaqs} />
        </div>
        <div className="mt-6">
          <Link href="/faq" className="btn btn-secondary">
            Read all FAQs
          </Link>
        </div>
      </Section>

      {/* ── Closing CTA ──────────────────────────────────────────────────── */}
      <Section>
        <div className="card text-center">
          <h2 className="text-2xl font-bold">Ready to start?</h2>
          <p
            className="mx-auto mt-3 max-w-2xl text-base leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            The intake takes about five minutes and shows you our screening results before you pay
            anything. If we think a license will not do what you want, we will say so on that
            screen.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/intake" className="btn btn-primary">
              Start my application
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              Ask a question first
            </Link>
          </div>
          <p className="mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Compliance-only clients: the {formatUsd(compliance.priceCents)}/month subscription is
            available on its own if you are already licensed.
          </p>
        </div>
      </Section>
    </>
  );
}
