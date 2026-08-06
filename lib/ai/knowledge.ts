import { addOns, formatUsd, packages, priceLabel } from "@/config/pricing";
import { site } from "@/config/site";
import { stateList } from "@/config/states";
import { faqs } from "@/content/faq";

/**
 * The knowledge base the assistant is allowed to answer from.
 *
 * Built entirely from our own config and FAQ, so it cannot drift from what the
 * website says. Change a fee in config/states/ga.ts and the assistant quotes
 * the new fee on the next request — there is no separate copy to update.
 *
 * The assistant is instructed to answer ONLY from this text and to say it does
 * not know otherwise, which is what stops it inventing a bond amount.
 */

export function buildKnowledgeBase(): string {
  return [
    companySection(),
    pricingSection(),
    ...stateList.map(stateSection),
    faqSection(),
    boundariesSection(),
  ].join("\n\n");
}

function companySection(): string {
  return `## About ${site.name}
${site.description}

We do two things:
1. Prepare used-car dealer license applications for Georgia, Florida, and North Carolina, and track compliance deadlines afterwards.
2. Rent license-compliant office suites in our Atlanta building, which satisfy Georgia's established-place-of-business requirement.

Contact: ${site.contact.email}, ${site.contact.phone}. Office at ${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}. Hours ${site.hours.days} ${site.hours.opens}–${site.hours.closes} Eastern.

How the process works, in order: intake and screening (about 5 minutes) → document collection → we prepare the packet → the client reviews, signs, and files → state inspection → ongoing compliance tracking with reminders at 90, 60, and 30 days before each deadline.`;
}

function pricingSection(): string {
  const lines: string[] = ["## Our prices (all published, no hidden fees, no deposits)"];

  for (const product of packages) {
    lines.push(
      `- **${product.name}** — ${priceLabel(product)}. ${product.summary} Includes: ${product.includes.join("; ")}.`,
    );
    if (product.launchPriceCents) {
      lines.push(
        `  (Launch price ${formatUsd(product.launchPriceCents)}; the regular price is ${formatUsd(product.priceCents)}.)`,
      );
    }
  }

  lines.push("", "Add-ons:");
  for (const addOn of addOns) {
    lines.push(`- **${addOn.name}** — ${priceLabel(addOn)}. ${addOn.summary}`);
  }

  lines.push(
    "",
    "What our price does NOT include: state application and license fees, surety bond premiums, insurance, pre-license course or seminar fees, fingerprinting, and county or city occupation tax. Those are paid by the client directly to those parties. Per-state amounts are listed below.",
    "",
    "We do not hold deposits. If an application is rejected, we correct the cause and prepare a revised packet at no additional charge from us; the client still owes the state any refiling fee.",
  );

  return lines.join("\n");
}

function stateSection(state: (typeof stateList)[number]): string {
  const lines: string[] = [
    `## ${state.name} — ${state.licenseType}`,
    `Issued by ${state.agency}.`,
    state.summary,
    "",
    `**What this license allows:** dealer auction access: ${yesNo(state.capabilities.auctionAccess)}; retail sales to the public: ${yesNo(state.capabilities.retailSales)}; dealer-to-dealer sales: ${yesNo(state.capabilities.wholesaleSales)}; dealer plates: ${yesNo(state.capabilities.dealerPlates.available)} — ${state.capabilities.dealerPlates.note}`,
  ];

  if (state.capabilities.honestCaveat) {
    lines.push(`**Important caveat to state plainly:** ${state.capabilities.honestCaveat}`);
  }

  lines.push(
    "",
    `**Surety bond:** ${formatUsd(state.bond.amountCents)}. ${state.bond.note}`,
    "",
    `**Office requirement:** minimum ${state.office.minSqFt} sq ft. Display lot required: ${yesNo(state.office.displayLotRequired)}. Requirements: ${state.office.requirements.join("; ")}.`,
    `Can our Atlanta suites satisfy this? ${state.office.suiteEligible ? "Yes" : "No"} — ${state.office.suiteNote}`,
    "",
    `**Pre-license education:** ${state.prelicense.required ? `Required${state.prelicense.hours ? ` (${state.prelicense.hours} hours)` : ""}.` : "Not required."} ${state.prelicense.note}`,
    `**Background check:** ${state.fingerprints.required ? `Required via ${state.fingerprints.system}.` : "Not required."} ${state.fingerprints.note}`,
    "",
    "**Costs paid to the state and third parties:**",
    ...state.fees.map(
      (fee) =>
        `- ${fee.label}: ${fee.amountCents > 0 ? `${fee.approximate ? "approximately " : ""}${formatUsd(fee.amountCents)}` : "varies"} (${cadence(fee.cadence)}). ${fee.note ?? ""}`,
    ),
    "",
    `**Renewal:** ${state.renewal.note} Fee ${formatUsd(state.renewal.feeCents)}.`,
    `**Typical timeline:** ${state.timeline.minWeeks}–${state.timeline.maxWeeks} weeks. ${state.timeline.note}`,
    "",
    "**Documents required:**",
    ...state.documents.map(
      (doc) => `- ${doc.label}${doc.required ? "" : " (optional)"}: ${doc.description} Source: ${doc.source}.`,
    ),
    "",
    "**Order to do things in:**",
    ...state.filingSteps.map(
      (step, index) => `${index + 1}. ${step.title}${step.timing ? ` (${step.timing})` : ""} — ${step.detail}`,
    ),
  );

  return lines.join("\n");
}

function faqSection(): string {
  return [
    "## Frequently asked questions",
    ...faqs.map((faq) => `**Q: ${faq.question}**\nA: ${faq.answer}`),
  ].join("\n\n");
}

function boundariesSection(): string {
  return `## Our boundaries, restated
${site.disclaimer}

We do not collect Social Security numbers or driver's license numbers. Where a state form requires one, the packet prints a labeled blank line for the client to complete by hand on their signed copy.

The client is always the applicant and the signatory. We never sign, file, submit, or attest to anything on their behalf, and no one can guarantee that a state will approve an application.`;
}

function yesNo(value: boolean): string {
  return value ? "yes" : "no";
}

function cadence(value: "one_time" | "annual" | "biennial"): string {
  return value === "one_time" ? "one time" : value === "annual" ? "yearly" : "every two years";
}

/**
 * The non-AI fallback: keyword search over the FAQ.
 *
 * Used when ANTHROPIC_API_KEY is not set. Deliberately simple — it scores by
 * how many of the asker's words appear in each entry. It is not clever, but it
 * is predictable and it never invents anything, which is the property that
 * matters for this content.
 */
export function searchFaq(query: string, limit = 3): { question: string; answer: string }[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "do", "does", "did", "i", "we", "you", "my", "our", "to", "for",
    "of", "in", "on", "and", "or", "it", "that", "this", "what", "how", "can", "will", "would",
    "with", "have", "has", "be", "get", "need", "want", "about", "if", "at", "from", "me",
  ]);

  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9$]+/)
    .filter((term) => term.length > 2 && !stopWords.has(term));

  if (terms.length === 0) return [];

  const scored = faqs.map((faq) => {
    const haystack = `${faq.question} ${faq.answer}`.toLowerCase();
    // Question matches count double: matching the question is a stronger signal
    // than a word appearing somewhere in a long answer.
    const score = terms.reduce((total, term) => {
      const inQuestion = faq.question.toLowerCase().includes(term) ? 2 : 0;
      const inAnswer = haystack.includes(term) ? 1 : 0;
      return total + inQuestion + inAnswer;
    }, 0);
    return { faq, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => ({ question: item.faq.question, answer: item.faq.answer }));
}
