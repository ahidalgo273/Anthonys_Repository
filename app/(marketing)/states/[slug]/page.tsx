import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section, SectionHeading } from "@/components/section";
import { BreadcrumbJsonLd } from "@/components/structured-data";
import { effectivePriceCents, formatUsd, getProduct } from "@/config/pricing";
import { getStateBySlug, stateList } from "@/config/states";

/**
 * One template renders all three state guides from config/states/*.ts.
 * Editing a state's facts there updates this page — there is no per-state
 * markup to keep in sync.
 */

export function generateStaticParams() {
  return stateList.map((state) => ({ slug: state.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) return {};

  const title = `${state.name} Dealer License Requirements`;
  const description = `${state.name} ${state.licenseType}: ${formatUsd(state.bond.amountCents)} surety bond, ${state.office.minSqFt} sq ft office minimum, ${state.timeline.minWeeks}–${state.timeline.maxWeeks} week timeline. Full requirements, costs, and office rules.`;

  return {
    title,
    description,
    alternates: { canonical: `/states/${state.slug}` },
    openGraph: { title: `${title} | DealerDesk`, description },
  };
}

export default async function StateGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) notFound();

  const filing = getProduct("license_filing")!;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "State Guides", path: "/states" },
          { name: state.name, path: `/states/${state.slug}` },
        ]}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="border-b" style={{ backgroundColor: "var(--bg-subtle)" }}>
        <div className="container-page py-14 sm:py-20">
          <div className="max-w-3xl">
            <span className="badge badge-info">{state.name}</span>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold">
              {state.name} Dealer License Requirements
            </h1>
            <p className="mt-2 text-lg font-medium" style={{ color: "var(--accent)" }}>
              {state.licenseType}
            </p>
            <p className="mt-5 text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {state.summary}
            </p>
            <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
              Issued by {state.agency}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/intake?state=${state.code}`} className="btn btn-primary">
                Start my {state.name} application
              </Link>
              <Link href="/pricing" className="btn btn-secondary">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── At a glance ──────────────────────────────────────────────────── */}
      <Section>
        <SectionHeading title="At a glance" />
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Surety bond" value={formatUsd(state.bond.amountCents)} />
          <Stat label="Office minimum" value={`${state.office.minSqFt} sq ft`} />
          <Stat
            label="Typical timeline"
            value={`${state.timeline.minWeeks}–${state.timeline.maxWeeks} weeks`}
          />
          <Stat
            label="Renewal"
            value={
              state.renewal.cadence === "annual"
                ? `${formatUsd(state.renewal.feeCents)}/year`
                : `${formatUsd(state.renewal.feeCents)}/2 years`
            }
          />
        </dl>

        {/* What the license does and does not allow — stated honestly. */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Capability label="Dealer auction access" allowed={state.capabilities.auctionAccess} />
          <Capability label="Retail sales to the public" allowed={state.capabilities.retailSales} />
          <Capability label="Dealer-to-dealer sales" allowed={state.capabilities.wholesaleSales} />
          <Capability
            label="Dealer plates"
            allowed={state.capabilities.dealerPlates.available}
            note={state.capabilities.dealerPlates.note}
          />
        </div>

        {state.capabilities.honestCaveat && (
          <div className="callout callout-warning mt-8">
            <p className="font-semibold">Read this before you spend anything</p>
            <p className="mt-2">{state.capabilities.honestCaveat}</p>
          </div>
        )}
      </Section>

      {/* ── Costs ────────────────────────────────────────────────────────── */}
      <Section subtle id="costs">
        <SectionHeading
          title="What it costs"
          description={`These are ${state.name}'s costs, paid by you directly. Our fee is separate and published on the pricing page.`}
        />
        <div className="mt-8 table-wrap">
          <table className="table">
            <caption>{state.name} costs paid to the state and third parties</caption>
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
                  {formatUsd(state.bond.amountCents)}
                </td>
                <td className="whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  Annual premium
                </td>
                <td style={{ color: "var(--text-muted)" }}>{state.bond.note}</td>
              </tr>
              <tr>
                <th scope="row" className="font-medium">
                  DealerDesk License Filing Package
                </th>
                <td className="whitespace-nowrap font-semibold">
                  {formatUsd(effectivePriceCents(filing))}
                </td>
                <td className="whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  One time
                </td>
                <td style={{ color: "var(--text-muted)" }}>
                  Our fee for preparing your application. Launch price — regularly{" "}
                  {formatUsd(filing.priceCents)}.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Office rules ─────────────────────────────────────────────────── */}
      <Section id="office">
        <SectionHeading
          title="Office and premises rules"
          description={`${state.name} requires an established place of business that an inspector visits. This is the step that stops most applicants.`}
        />
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <ul className="space-y-2">
              {state.office.requirements.map((requirement) => (
                <li
                  key={requirement}
                  className="flex gap-2 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span aria-hidden="true" style={{ color: "var(--accent)" }}>
                    ·
                  </span>
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
              A display lot is{" "}
              <strong style={{ color: "var(--text)" }}>
                {state.office.displayLotRequired ? "required" : "not required"}
              </strong>{" "}
              for this license type.
            </p>
          </div>

          <div className={`callout ${state.office.suiteEligible ? "callout-success" : "callout-info"}`}>
            <p className="font-semibold">
              {state.office.suiteEligible
                ? "Our Atlanta suites satisfy this requirement"
                : "Our Atlanta suites cannot be used for this state"}
            </p>
            <p className="mt-2">{state.office.suiteNote}</p>
            {state.office.suiteEligible && (
              <Link href="/suites" className="btn btn-secondary mt-4">
                See the suites
              </Link>
            )}
          </div>
        </div>
      </Section>

      {/* ── Requirements summary ─────────────────────────────────────────── */}
      <Section subtle id="requirements">
        <SectionHeading title="Requirements summary" />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="card">
            <h3 className="text-base font-bold">Pre-license education</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              {state.prelicense.required
                ? `Required${state.prelicense.hours ? ` — ${state.prelicense.hours} hours` : ""}. ${state.prelicense.note}`
                : state.prelicense.note}
            </p>
          </div>
          <div className="card">
            <h3 className="text-base font-bold">Background check</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              {state.fingerprints.required
                ? `Required via ${state.fingerprints.system}. ${state.fingerprints.note}`
                : "Not required for this license type."}
            </p>
          </div>
          <div className="card">
            <h3 className="text-base font-bold">Renewal</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              {state.renewal.note}
            </p>
          </div>
        </div>

        <h3 className="mt-10 text-lg font-bold">Documents you will need</h3>
        <div className="mt-4 table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Document</th>
                <th scope="col">What it is</th>
                <th scope="col">Where it comes from</th>
              </tr>
            </thead>
            <tbody>
              {state.documents.map((doc) => (
                <tr key={doc.id}>
                  <th scope="row" className="font-medium whitespace-nowrap">
                    {doc.label}
                    {!doc.required && (
                      <span className="badge badge-neutral ml-2">Optional</span>
                    )}
                  </th>
                  <td style={{ color: "var(--text-muted)" }}>{doc.description}</td>
                  <td className="whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {doc.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Timeline ─────────────────────────────────────────────────────── */}
      <Section id="timeline">
        <SectionHeading
          title="Timeline and the order to do things in"
          description={state.timeline.note}
        />
        <ol className="mt-8 space-y-4">
          {state.filingSteps.map((step, index) => (
            <li key={step.title} className="card flex gap-4">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent)" }}
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold">{step.title}</h3>
                  {step.timing && <span className="badge badge-neutral">{step.timing}</span>}
                </div>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <Section subtle>
        <div className="card">
          <h2 className="text-2xl font-bold">We handle the {state.name} paperwork.</h2>
          <p className="mt-3 max-w-2xl text-base" style={{ color: "var(--text-muted)" }}>
            The License Filing Package is {formatUsd(effectivePriceCents(filing))} — we prepare your
            complete application, build your document checklist, refer you for your bond and
            insurance, and hand you a filing instruction sheet. You review, sign, and submit as the
            applicant.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/intake?state=${state.code}`} className="btn btn-primary">
              Start my {state.name} application
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              Ask a question first
            </Link>
          </div>
        </div>

        {/* Source links, so the facts above can be re-verified. */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold">Official sources</h3>
          <ul className="mt-2 space-y-1">
            {state.citations.map((citation) => (
              <li key={citation.url}>
                <a
                  href={citation.url}
                  className="text-sm underline underline-offset-4"
                  style={{ color: "var(--info)" }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {citation.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            State requirements change. We re-verify these figures regularly, and we confirm current
            amounts with you during intake before you spend anything.
          </p>
        </div>
      </Section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <dt className="text-sm" style={{ color: "var(--text-muted)" }}>
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-bold">{value}</dd>
    </div>
  );
}

function Capability({
  label,
  allowed,
  note,
}: {
  label: string;
  allowed: boolean;
  note?: string;
}) {
  return (
    <div className="card">
      <span className={`badge ${allowed ? "badge-success" : "badge-danger"}`}>
        {allowed ? "Yes" : "No"}
      </span>
      <p className="mt-2 text-sm font-semibold">{label}</p>
      {note && (
        <p className="mt-1 text-[0.8125rem]" style={{ color: "var(--text-muted)" }}>
          {note}
        </p>
      )}
    </div>
  );
}
