/**
 * The shape of a state's dealer-licensing rules.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NON-DEVELOPER NOTE
 * This file describes WHAT a state rule can say. The actual facts live in
 * ga.ts, fl.ts, and nc.ts next to it. When a state changes a fee, a bond
 * amount, or an office requirement, you edit that state's file only — the
 * website guide page, the intake screening questions, the document checklist,
 * the packet PDF, and the renewal reminders all read from it.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type StateCode = "GA" | "FL" | "NC";

/** A fee the applicant pays to the state (not to us). */
export type Fee = {
  label: string;
  amountCents: number;
  cadence: "one_time" | "annual" | "biennial";
  /** Who it is paid to, and anything the applicant should know. */
  note?: string;
  /** Set when the amount varies or we are quoting an approximate figure. */
  approximate?: boolean;
};

/** A document the applicant must produce. Drives the portal checklist and the packet. */
export type DocumentRequirement = {
  /** Stable key — used as the database value, so do not rename casually. */
  id: string;
  label: string;
  description: string;
  required: boolean;
  /** Who issues or provides it, so the client knows where to go. */
  source: string;
  /**
   * Deterministic checks we can run without AI once the client uploads it.
   * `minAmountCents` compares against a client-entered amount (e.g. bond value).
   * `mustNotBeExpired` requires a client-entered expiration date in the future.
   */
  checks?: {
    minAmountCents?: number;
    mustNotBeExpired?: boolean;
  };
};

/** A field we collect and print into the prepared application data packet. */
export type PacketField = {
  id: string;
  label: string;
  /**
   * `blank_for_client` means we deliberately print an empty line for the client
   * to complete and initial on their signed copy. We use this for anything we
   * refuse to store, such as Social Security numbers.
   */
  type: "text" | "date" | "money" | "phone" | "email" | "address" | "blank_for_client";
  hint?: string;
};

export type PacketFieldGroup = {
  id: string;
  title: string;
  /** Printed under the group heading on the packet page. */
  note?: string;
  fields: PacketField[];
};

/**
 * A declarative eligibility question.
 *
 * The screening engine (lib/rules/screening.ts) evaluates these — no state
 * logic lives in the funnel code.
 *
 * - `blockIf` means the applicant cannot proceed with this state right now.
 * - `warnIf` means they can proceed but need to know something.
 * - `referIf` means the answer routes them to an attorney referral. We never
 *   evaluate the underlying question ourselves.
 */
export type ScreeningQuestion = {
  id: string;
  question: string;
  help?: string;
  type: "boolean" | "choice" | "text";
  /** Options for `choice` questions. */
  options?: { value: string; label: string }[];
  /** Applies to every state when listed in the shared set. */
  blockIf?: { equals: string | boolean };
  warnIf?: { equals: string | boolean };
  referIf?: { equals: string | boolean } | { anyText: true };
  /** Message shown when the condition fires. Must never evaluate the applicant's situation. */
  message?: string;
};

/** One step on the filing instruction sheet printed in the packet. */
export type FilingStep = {
  title: string;
  detail: string;
  /** Approximate elapsed time or ordering hint, e.g. "Before you apply". */
  timing?: string;
};

/** How a license expires, so the deadline calculator can compute renewal dates. */
export type RenewalRule = {
  cadence: "annual" | "biennial";
  /** 1-12. */
  dueMonth: number;
  /** Day of month. */
  dueDay: number;
  /**
   * Biennial licenses in Georgia expire on March 31 of EVEN years, so a
   * license issued in 2027 still expires 2028-03-31. Set true for that pattern.
   */
  evenYearsOnly?: boolean;
  feeCents: number;
  note?: string;
};

export type StateRules = {
  code: StateCode;
  name: string;
  /** URL segment: /states/georgia */
  slug: string;
  /** The specific license we help clients obtain in this state. */
  licenseType: string;
  /** The agency that issues it. */
  agency: string;
  /** One-paragraph plain-English summary for the guide page and the AI knowledge base. */
  summary: string;

  /** What this license does and does not let you do. Written honestly. */
  capabilities: {
    auctionAccess: boolean;
    retailSales: boolean;
    wholesaleSales: boolean;
    dealerPlates: { available: boolean; note: string };
    /** Called out prominently on the guide page when there is a common misconception. */
    honestCaveat?: string;
  };

  office: {
    minSqFt: number;
    /** True when a display lot is NOT required — i.e. a broker/wholesale operation from a suite works. */
    displayLotRequired: boolean;
    requirements: string[];
    /** Whether our Atlanta suites can satisfy this state's requirement. */
    suiteEligible: boolean;
    suiteNote: string;
  };

  bond: {
    amountCents: number;
    note: string;
  };

  prelicense: {
    required: boolean;
    hours?: number;
    note: string;
  };

  fingerprints: {
    required: boolean;
    system: string;
    note: string;
  };

  fees: Fee[];
  renewal: RenewalRule;

  timeline: {
    minWeeks: number;
    maxWeeks: number;
    note: string;
  };

  documents: DocumentRequirement[];
  packetFieldGroups: PacketFieldGroup[];
  screening: ScreeningQuestion[];
  filingSteps: FilingStep[];

  /** Where the facts above came from, so they can be re-verified before launch. */
  citations: { label: string; url: string }[];
};
