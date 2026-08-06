/**
 * Every price DealerDesk publishes.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NON-DEVELOPER NOTE
 * Change a price here and it updates the home page, the pricing page, the
 * intake funnel, and Stripe checkout together. Prices are in CENTS so there is
 * never a rounding bug: $995 is 99500.
 *
 * `stripePriceEnv` is the name of the environment variable that holds the
 * matching Stripe price ID (see .env.example). If those variables are not set,
 * the site still shows prices correctly and checkout runs in a clearly-labeled
 * demo mode.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type BillingPeriod = "one_time" | "monthly" | "yearly";

export type Product = {
  id: string;
  name: string;
  /** One-line description used on cards and in checkout. */
  summary: string;
  priceCents: number;
  /** Set when we are running an introductory price. `priceCents` stays as the "regular" price. */
  launchPriceCents?: number;
  period: BillingPeriod;
  /** Additional one-time charge billed alongside a subscription (e.g. suite setup). */
  setupFeeCents?: number;
  /** Bullet points shown on the pricing page. */
  includes: string[];
  /** Env var holding the Stripe price ID for the recurring/one-time amount. */
  stripePriceEnv: string;
  /** Env var holding the Stripe price ID for the setup fee, when there is one. */
  stripeSetupPriceEnv?: string;
  /** Shown in the funnel as a selectable package (vs. an add-on). */
  isPackage: boolean;
  /** Highlighted as the recommended choice on the pricing page. */
  featured?: boolean;
};

export const products: Product[] = [
  {
    id: "license_filing",
    name: "License Filing Package",
    summary:
      "We prepare your complete used-car dealer license application for Georgia, Florida, or North Carolina.",
    priceCents: 99500,
    launchPriceCents: 79500,
    period: "one_time",
    isPackage: true,
    featured: true,
    includes: [
      "Application preparation for GA, FL, or NC",
      "Personalized document checklist",
      "Surety bond and insurance referrals",
      "Inspection-prep guidance and photo checklist",
      "Filing logistics and a step-by-step instruction sheet",
      "You review, sign, and submit as the applicant",
    ],
    stripePriceEnv: "STRIPE_PRICE_LICENSE_FILING",
  },
  {
    id: "compliance",
    name: "Compliance Subscription",
    summary:
      "Keeps your license, bond, insurance, and occupation tax from lapsing after you are licensed.",
    priceCents: 5900,
    period: "monthly",
    isPackage: true,
    includes: [
      "Renewal calendar for your state",
      "Bond and insurance expiration monitoring",
      "Occupation-tax reminders",
      "Document vault",
      "Renewal packet preparation",
      "Email reminders at 90, 60, and 30 days",
    ],
    stripePriceEnv: "STRIPE_PRICE_COMPLIANCE",
  },
  {
    id: "suite_bundle",
    name: "Suite + Compliance Bundle",
    summary:
      "A 250 sq ft Atlanta office suite that meets Georgia's established-place-of-business rule, with compliance included.",
    priceCents: 54900,
    period: "monthly",
    setupFeeCents: 99500,
    isPackage: true,
    includes: [
      "250 sq ft private suite in our Atlanta building",
      "State-compliant office space and signage",
      "Compliance Subscription included",
      "Lease documentation for your application",
      "Inspection-ready setup",
    ],
    stripePriceEnv: "STRIPE_PRICE_SUITE_BUNDLE",
    stripeSetupPriceEnv: "STRIPE_PRICE_SUITE_SETUP",
  },
  {
    id: "addon_llc_ein",
    name: "LLC / EIN Setup Assistance",
    summary: "We prepare your entity formation and EIN paperwork for you to review and file.",
    priceCents: 19900,
    period: "one_time",
    isPackage: false,
    includes: [
      "Entity formation paperwork prepared",
      "EIN application prepared",
      "You sign and file as the owner",
    ],
    stripePriceEnv: "STRIPE_PRICE_ADDON_LLC_EIN",
  },
  {
    id: "addon_photo_review",
    name: "Pre-Inspection Photo Review",
    summary: "Send us photos of your office before the inspector visits and we flag what will fail.",
    priceCents: 9900,
    period: "one_time",
    isPackage: false,
    includes: [
      "Photo-by-photo review against your state's rules",
      "Written punch list of what to fix",
      "One re-review after you make changes",
    ],
    stripePriceEnv: "STRIPE_PRICE_ADDON_PHOTO_REVIEW",
  },
  {
    id: "addon_occupation_tax",
    name: "Occupation Tax Certificate Handling",
    summary: "We prepare your county/city occupation tax certificate paperwork each year.",
    priceCents: 14900,
    period: "yearly",
    isPackage: false,
    includes: [
      "County or city occupation tax paperwork prepared",
      "Renewal tracked on your compliance calendar",
      "You sign and submit to your local office",
    ],
    stripePriceEnv: "STRIPE_PRICE_ADDON_OCCUPATION_TAX",
  },
];

export const packages = products.filter((p) => p.isPackage);
export const addOns = products.filter((p) => !p.isPackage);

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

/** The price a customer actually pays today (launch price when one is running). */
export function effectivePriceCents(product: Product): number {
  return product.launchPriceCents ?? product.priceCents;
}

/** "$995" / "$59" — no cents shown when the amount is whole dollars. */
export function formatUsd(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toLocaleString("en-US")}`
    : `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "$59/month", "$149/year", "$995 one-time" */
export function formatPrice(cents: number, period: BillingPeriod): string {
  const amount = formatUsd(cents);
  if (period === "monthly") return `${amount}/month`;
  if (period === "yearly") return `${amount}/year`;
  return `${amount} one-time`;
}

/** Full price line for a product, including any setup fee and launch pricing. */
export function priceLabel(product: Product): string {
  const base = formatPrice(effectivePriceCents(product), product.period);
  return product.setupFeeCents ? `${base} + ${formatUsd(product.setupFeeCents)} setup` : base;
}

/** What the customer is charged today, including any setup fee. Used at checkout. */
export function dueTodayCents(product: Product): number {
  return effectivePriceCents(product) + (product.setupFeeCents ?? 0);
}
