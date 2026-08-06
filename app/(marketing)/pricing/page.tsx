import type { Metadata } from "next";
import Link from "next/link";
import { AddOnTable, PackageCards } from "@/components/pricing-table";
import { Section, SectionHeading } from "@/components/section";
import { BreadcrumbJsonLd } from "@/components/structured-data";
import { formatUsd } from "@/config/pricing";
import { stateList } from "@/config/states";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Every DealerDesk price, published: $795 launch price for license filing (regularly $995), $59/month compliance, $549/month + $995 setup for an Atlanta suite bundle, and add-ons from $99.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing | DealerDesk",
    description:
      "Every price published. License filing, compliance subscription, Atlanta suite bundle, and add-ons — plus what each state charges you directly.",
  },
};

export default function PricingPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ]}
      />

      <Section>
        <SectionHeading
          eyebrow="Transparent pricing"
          title="All of it, on one page."
          description="We publish our prices because the alternative — making you call to find out — is a sales tactic that wastes your time. Nothing below has a hidden tier, a deposit, or a fee that shows up later."
        />
        <div className="mt-10">
          <PackageCards />
        </div>
      </Section>

      <Section subtle>
        <SectionHeading title="Add-ons" description="Buy these with a package or any time after." />
        <div className="mt-8">
          <AddOnTable />
        </div>
      </Section>

      {/* ── Third-party costs ─────────────────────────────────────────────── */}
      <Section>
        <SectionHeading
          title="What you pay to everyone else"
          description="These are not our fees and we do not mark them up. You pay them directly to the state, the bond company, the insurer, and your local government. We list them so you can budget the whole project."
        />
        <div className="mt-8 space-y-8">
          {stateList.map((state) => (
            <div key={state.code}>
              <h3 className="mb-3 text-lg font-bold">
                {state.name} — {state.licenseType}
              </h3>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Cost</th>
                      <th scope="col">Amount</th>
                      <th scope="col">How often</th>
                      <th scope="col">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.fees.map((fee) => (
                      <tr key={fee.label}>
                        <th scope="row" className="font-medium">
                          {fee.label}
                        </th>
                        <td className="whitespace-nowrap font-semibold">
                          {fee.amountCents > 0
                            ? `${fee.approximate ? "~" : ""}${formatUsd(fee.amountCents)}`
                            : "Varies"}
                        </td>
                        <td className="whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                          {fee.cadence === "one_time"
                            ? "One time"
                            : fee.cadence === "annual"
                              ? "Yearly"
                              : "Every 2 years"}
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>{fee.note}</td>
                      </tr>
                    ))}
                    <tr>
                      <th scope="row" className="font-medium">
                        Surety bond
                      </th>
                      <td className="whitespace-nowrap font-semibold">
                        {formatUsd(state.bond.amountCents)} bond
                      </td>
                      <td className="whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        Annual premium
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{state.bond.note}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        <div className="callout callout-info mt-8">
          <p>
            <strong>Amounts marked &ldquo;~&rdquo; are approximate</strong> and amounts marked
            &ldquo;Varies&rdquo; are set by a third party, not the state. We confirm current figures
            with you during intake before you spend anything.
          </p>
        </div>
      </Section>

      {/* ── Refunds / commitments ─────────────────────────────────────────── */}
      <Section subtle>
        <SectionHeading title="Our commitments" />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="card">
            <h3 className="text-base font-bold">No deposits, ever</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              You pay for a package when you buy it and we start work. We do not hold your money
              against future work.
            </p>
          </div>
          <div className="card">
            <h3 className="text-base font-bold">Rejections are re-prepared free</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              If your application is rejected, we correct the cause and prepare a new packet at no
              additional charge from us. State refiling fees are still yours.
            </p>
          </div>
          <div className="card">
            <h3 className="text-base font-bold">Cancel a subscription any time</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              The Compliance Subscription is month to month through the Stripe billing portal. Suite
              leases have their own term, stated in the lease.
            </p>
          </div>
          <div className="card">
            <h3 className="text-base font-bold">We will tell you not to buy</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              If your goal does not match what a license actually does — the Florida wholesale
              license is the usual case — our intake says so before checkout.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <Link href="/intake" className="btn btn-primary">
            Start my application
          </Link>
        </div>
      </Section>
    </>
  );
}
