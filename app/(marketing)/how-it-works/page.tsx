import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/section";
import { BreadcrumbJsonLd } from "@/components/structured-data";
import { effectivePriceCents, formatUsd, getProduct } from "@/config/pricing";
import { stateList } from "@/config/states";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "The full DealerDesk process: intake and screening, document checklist, application packet preparation, your review and signature, inspection prep, and ongoing compliance tracking.",
  alternates: { canonical: "/how-it-works" },
};

const phases = [
  {
    number: "01",
    title: "Intake and screening",
    duration: "About 5 minutes",
    body: "You answer questions about your state, what you want to do with the license, your timeline, and basic eligibility. Our screening runs your answers against that state's actual requirements and shows you the results — including anything that is going to be a problem — before you pay.",
    details: [
      "Structured eligibility screen, not a sales call",
      "State-specific warnings (for example: a Florida wholesale license includes no dealer plates)",
      "If you have a legal question or a background concern, we flag your file for an attorney referral rather than guessing",
      "You see exactly what the package costs before checkout",
    ],
  },
  {
    number: "02",
    title: "Document collection",
    duration: "Weeks 1–4, mostly waiting on third parties",
    body: "You get a checklist built from your state's requirements and a portal to upload to. We review each document as it arrives and tell you when something will not work — a bond written for the wrong amount, an entity name that does not match, a photo that shows a sign an inspector will reject.",
    details: [
      "Personalized checklist per state",
      "Bond and insurance provider referrals",
      "Every upload reviewed by a human before it counts as complete",
      "Nothing is auto-approved — a machine may flag an issue, a person decides",
    ],
  },
  {
    number: "03",
    title: "Packet preparation",
    duration: "Generated as soon as your file is complete",
    body: "We assemble a prepared application data packet: all of your information organized the way your state's application asks for it, a filing instruction sheet, and an inspection-prep photo checklist. It is a draft for your review — that is the whole point.",
    details: [
      "Your data organized per your state's application requirements",
      "Step-by-step filing instructions specific to your state",
      "Blank, labeled lines for anything we deliberately do not collect (your Social Security number, your driver's license number)",
      "Inspection-prep photo checklist so you know what the inspector looks at",
    ],
  },
  {
    number: "04",
    title: "You review, sign, and file",
    duration: "Your call",
    body: "You read every field, complete the blanks we left for you, sign as the applicant, and submit to the state with your fees. We do not sign for you, submit for you, or attest to anything on your behalf. Nobody legitimate does.",
    details: [
      "You are the applicant and the signatory on every form",
      "You pay state fees directly to the state",
      "We stay available while your application is pending",
      "If it comes back rejected, we correct the cause and re-prepare at no charge from us",
    ],
  },
  {
    number: "05",
    title: "Inspection",
    duration: "After filing",
    body: "Your state sends an inspector to your business location. You already have the photo checklist. If you bought the pre-inspection photo review add-on, we go through your photos first and give you a punch list of what to fix.",
    details: [
      "Photo checklist included with every packet",
      "Optional $99 pre-inspection photo review",
      "Suite tenants get a space already configured for this",
    ],
  },
  {
    number: "06",
    title: "Ongoing compliance",
    duration: "For as long as you are licensed",
    body: "Once you are licensed, the risk shifts from getting approved to staying approved. Your renewal date, bond expiration, insurance expiration, and occupation tax renewal all go on a calendar with automatic email reminders at 90, 60, and 30 days.",
    details: [
      "Renewal calendar specific to your state's schedule",
      "Bond and insurance expiry monitoring",
      "Occupation-tax reminders",
      "Renewal packet prepared when it is time",
      "Document vault so your paperwork is where you left it",
    ],
  },
];

export default function HowItWorksPage() {
  const filing = getProduct("license_filing")!;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "How It Works", path: "/how-it-works" },
        ]}
      />

      <section className="border-b" style={{ backgroundColor: "var(--bg-subtle)" }}>
        <div className="container-page py-14 sm:py-20">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-bold">How it works</h1>
            <p className="mt-5 text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Six phases, and you know what happens in each one. The short version: we do the
              paperwork and the tracking, you do the signing and the filing, and neither of us
              pretends otherwise.
            </p>
          </div>
        </div>
      </section>

      <Section>
        <ol className="space-y-6">
          {phases.map((phase) => (
            <li key={phase.number} className="card">
              <div className="flex flex-wrap items-baseline gap-3">
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: "var(--accent)" }}
                  aria-hidden="true"
                >
                  {phase.number}
                </span>
                <h2 className="text-xl font-bold">{phase.title}</h2>
                <span className="badge badge-neutral">{phase.duration}</span>
              </div>
              <p className="mt-3 text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {phase.body}
              </p>
              <ul className="mt-4 space-y-1.5">
                {phase.details.map((detail) => (
                  <li
                    key={detail}
                    className="flex gap-2 text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <span aria-hidden="true" style={{ color: "var(--accent)" }}>
                      ·
                    </span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      <Section subtle>
        <SectionHeading
          title="How long it takes, by state"
          description="The range depends almost entirely on how quickly you start the slow items — courses, zoning letters, and inspections."
        />
        <div className="mt-8 table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">State</th>
                <th scope="col">Typical timeline</th>
                <th scope="col">What sets the pace</th>
              </tr>
            </thead>
            <tbody>
              {stateList.map((state) => (
                <tr key={state.code}>
                  <th scope="row" className="font-medium whitespace-nowrap">
                    <Link
                      href={`/states/${state.slug}`}
                      className="underline underline-offset-4"
                      style={{ color: "var(--info)" }}
                    >
                      {state.name}
                    </Link>
                  </th>
                  <td className="whitespace-nowrap font-semibold">
                    {state.timeline.minWeeks}–{state.timeline.maxWeeks} weeks
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{state.timeline.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <div className="card">
          <h2 className="text-2xl font-bold">Start with the intake.</h2>
          <p className="mt-3 max-w-2xl" style={{ color: "var(--text-muted)" }}>
            It takes about five minutes, it is free, and it ends with a screening result rather than
            a sales call. The License Filing Package is{" "}
            {formatUsd(effectivePriceCents(filing))} if you decide to proceed.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/intake" className="btn btn-primary">
              Start my application
            </Link>
            <Link href="/faq" className="btn btn-secondary">
              Read the FAQ
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
