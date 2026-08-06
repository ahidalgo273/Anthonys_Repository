import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/section";
import { formatUsd } from "@/config/pricing";
import { stateList } from "@/config/states";

export const metadata: Metadata = {
  title: "State Guides",
  description:
    "Dealer license requirements, costs, office rules, and timelines for Georgia, Florida, and North Carolina — including what each license does not let you do.",
  alternates: { canonical: "/states" },
};

export default function StatesIndexPage() {
  return (
    <Section>
      <SectionHeading
        eyebrow="State guides"
        title="Pick your state."
        description="Each guide covers requirements, every cost, the office rules, and the realistic timeline — plus what the license does not allow, which is usually the part nobody tells you."
      />
      <div className="mt-10 space-y-6">
        {stateList.map((state) => (
          <div key={state.code} className="card">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{state.name}</h2>
                <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                  {state.licenseType}
                </p>
              </div>
              <Link href={`/states/${state.slug}`} className="btn btn-secondary">
                Read the {state.name} guide
              </Link>
            </div>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {state.summary}
            </p>
            <dl className="mt-5 grid gap-4 sm:grid-cols-4 text-sm">
              <div>
                <dt style={{ color: "var(--text-muted)" }}>Surety bond</dt>
                <dd className="font-semibold">{formatUsd(state.bond.amountCents)}</dd>
              </div>
              <div>
                <dt style={{ color: "var(--text-muted)" }}>Office minimum</dt>
                <dd className="font-semibold">{state.office.minSqFt} sq ft</dd>
              </div>
              <div>
                <dt style={{ color: "var(--text-muted)" }}>Timeline</dt>
                <dd className="font-semibold">
                  {state.timeline.minWeeks}–{state.timeline.maxWeeks} weeks
                </dd>
              </div>
              <div>
                <dt style={{ color: "var(--text-muted)" }}>Retail sales</dt>
                <dd className="font-semibold">
                  {state.capabilities.retailSales ? "Allowed" : "Not allowed"}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </Section>
  );
}
