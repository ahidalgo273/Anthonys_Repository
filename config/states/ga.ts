/**
 * Georgia — Used Motor Vehicle Dealer license.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONTENT: verify against current state rules before launch.
 * Every fee, bond amount, square footage, and deadline in this file must be
 * re-checked against the Georgia Board of Used Motor Vehicle Dealers and the
 * Secretary of State's current published rules before the site goes live, and
 * re-checked whenever the Board updates its requirements. See `citations` at
 * the bottom of this file for where to look.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { StateRules } from "./types";
import { sharedPacketFieldGroups, sharedScreeningQuestions } from "./shared";

export const georgia: StateRules = {
  code: "GA",
  name: "Georgia",
  slug: "georgia",
  licenseType: "Used Motor Vehicle Dealer License",
  agency: "Georgia Board of Used Motor Vehicle Dealers (State Board under the Secretary of State)",
  summary:
    "Georgia licenses used-car dealers through a State Board under the Secretary of State. You can run a broker-style operation out of an office suite — you do not need a display lot — which makes Georgia the most practical state for buyers who mainly want dealer-auction access. Expect a pre-license seminar, a fingerprint background check, a $50,000 surety bond, and an office that passes inspection.",

  capabilities: {
    auctionAccess: true,
    retailSales: true,
    wholesaleSales: true,
    dealerPlates: {
      available: true,
      // CONTENT: verify against current state rules before launch.
      note: "Dealer plates are available through the Georgia Department of Revenue using Form MV-6 once your license is issued. They are a separate application from your dealer license.",
    },
    honestCaveat:
      "A Georgia used dealer license lets you buy at dealer auctions and sell, but you still have to run a real, inspectable office. There is no version of this that works from a home kitchen table.",
  },

  office: {
    // CONTENT: verify against current state rules before launch — the 250 sq ft
    // minimum reflects the 2026 rules and the Board has revised this figure before.
    minSqFt: 250,
    displayLotRequired: false,
    requirements: [
      "A dedicated office of approximately 250 square feet or more (2026 rules)",
      "A display lot is NOT required for a broker-style operation",
      "A dedicated business landline listed in the dealer's name",
      "A permanent sign identifying the dealership, visible from outside",
      "A county or city occupation tax certificate for the location",
      "Business records kept on site and available for inspection",
      "Posted business hours, with someone reachable during them",
    ],
    suiteEligible: true,
    suiteNote:
      "Our Atlanta suites are 250 sq ft and are set up specifically for this requirement — signage, landline, and a lease you can attach to your application.",
  },

  bond: {
    // CONTENT: verify against current state rules before launch — increased to
    // $50,000 as of July 2026.
    amountCents: 5_000_000_00,
    note: "Georgia requires a $50,000 surety bond as of July 2026. You do not pay $50,000 — you pay an annual premium to a bond company, often a few hundred dollars for applicants with good credit. We refer you to providers who work with new dealers.",
  },

  prelicense: {
    required: true,
    note: "Georgia requires a pre-license seminar before your application is approved. Register early — seminar seats are the single most common reason a Georgia application sits waiting.",
  },

  fingerprints: {
    required: true,
    system: "GAPS (Georgia Applicant Processing Service)",
    note: "You schedule and attend your own GAPS fingerprint appointment. Results go directly to the Board; we never see them.",
  },

  fees: [
    // CONTENT: verify against current state rules before launch.
    {
      label: "Application fee",
      amountCents: 170_00,
      cadence: "one_time",
      note: "Paid to the Board with your application.",
      approximate: true,
    },
    {
      label: "License fee",
      amountCents: 170_00,
      cadence: "one_time",
      note: "Paid when your license is issued.",
      approximate: true,
    },
    {
      label: "Biennial renewal",
      amountCents: 150_00,
      cadence: "biennial",
      note: "Due by March 31 of even-numbered years.",
      approximate: true,
    },
    {
      label: "Pre-license seminar",
      amountCents: 0,
      cadence: "one_time",
      note: "Cost is set by the seminar provider, not the state. Budget for it separately.",
      approximate: true,
    },
    {
      label: "GAPS fingerprinting",
      amountCents: 0,
      cadence: "one_time",
      note: "Paid directly to the fingerprint vendor at your appointment.",
      approximate: true,
    },
    {
      label: "County/city occupation tax certificate",
      amountCents: 0,
      cadence: "annual",
      note: "Set by your county or city, not the state. Varies widely.",
      approximate: true,
    },
  ],

  renewal: {
    // CONTENT: verify against current state rules before launch.
    cadence: "biennial",
    dueMonth: 3,
    dueDay: 31,
    evenYearsOnly: true,
    feeCents: 150_00,
    note: "Georgia used dealer licenses expire March 31 of even-numbered years, regardless of when yours was issued. A license issued in 2027 still expires March 31, 2028.",
  },

  timeline: {
    minWeeks: 6,
    maxWeeks: 12,
    note: "The seminar and the fingerprint background check drive the timeline more than the paperwork does. Applicants who book both in week one typically finish fastest.",
  },

  documents: [
    {
      id: "entity_registration",
      label: "Entity registration",
      description:
        "Your Articles of Organization or Incorporation from the Georgia Secretary of State (or your home state, plus Georgia foreign registration).",
      required: true,
      source: "Georgia Secretary of State",
    },
    {
      id: "ein_letter",
      label: "EIN confirmation letter",
      description: "The IRS letter (CP 575 or 147C) showing your federal EIN.",
      required: true,
      source: "IRS",
    },
    {
      id: "surety_bond",
      label: "$50,000 surety bond",
      description:
        "The executed bond certificate naming your entity exactly as it appears on your application.",
      required: true,
      source: "Surety bond provider (we refer you)",
      checks: { minAmountCents: 5_000_000_00, mustNotBeExpired: true },
    },
    {
      id: "garage_liability",
      label: "Garage liability insurance",
      description: "Certificate of insurance for your dealership operation.",
      required: true,
      source: "Insurance agent (we refer you)",
      checks: { mustNotBeExpired: true },
    },
    {
      id: "lease_or_deed",
      label: "Lease or deed for your office",
      description:
        "Proof you control the business location. Suite tenants receive a compliant lease from us.",
      required: true,
      source: "Your landlord (or DealerDesk, for suite tenants)",
    },
    {
      id: "occupation_tax",
      label: "Occupation tax certificate",
      description: "Your county or city business license for the dealership location.",
      required: true,
      source: "County or city business license office",
      checks: { mustNotBeExpired: true },
    },
    {
      id: "seminar_certificate",
      label: "Pre-license seminar certificate",
      description: "Proof you completed the required Georgia pre-license seminar.",
      required: true,
      source: "Approved seminar provider",
    },
    {
      id: "location_photos",
      label: "Office photos",
      description:
        "Photos of your office interior, exterior, and sign. We review these before your inspection.",
      required: true,
      source: "You",
    },
    {
      id: "phone_proof",
      label: "Business phone listing",
      description:
        "Proof of a dedicated business landline in the dealer's name, as required by the Board.",
      required: true,
      source: "Your phone provider",
    },
  ],

  packetFieldGroups: [
    ...sharedPacketFieldGroups,
    {
      id: "ga_specific",
      title: "Georgia-Specific Information",
      fields: [
        { id: "ga_seminar_date", label: "Pre-license seminar completion date", type: "date" },
        { id: "ga_gaps_appointment", label: "GAPS fingerprint appointment date", type: "date" },
        { id: "ga_bond_number", label: "Surety bond number", type: "text" },
        { id: "ga_bond_amount", label: "Surety bond amount", type: "money" },
        { id: "ga_occupation_tax_county", label: "Occupation tax county/city", type: "text" },
        { id: "ga_business_landline", label: "Dedicated business landline", type: "phone" },
        {
          id: "ga_sign_description",
          label: "Description of your permanent sign",
          type: "text",
          hint: "Size, wording, and where it is mounted.",
        },
      ],
    },
  ],

  screening: [
    ...sharedScreeningQuestions,
    {
      id: "ga_office_plan",
      question: "How will you meet Georgia's office requirement?",
      help: "Georgia expects a dedicated office of roughly 250 sq ft with a sign and a business landline.",
      type: "choice",
      options: [
        { value: "have_office", label: "I already have a qualifying office" },
        { value: "need_suite", label: "I want to rent a DealerDesk suite in Atlanta" },
        { value: "looking", label: "I am still looking for space" },
        { value: "home", label: "I was hoping to use my home" },
      ],
      warnIf: { equals: "home" },
      message:
        "Georgia requires a dedicated, inspectable office with a sign and a business landline, so a home address does not usually qualify. Our Atlanta suites exist for exactly this — or we can help you evaluate a space you find.",
    },
    {
      id: "ga_seminar",
      question: "Have you completed Georgia's pre-license seminar?",
      type: "choice",
      options: [
        { value: "yes", label: "Yes, completed" },
        { value: "registered", label: "Registered, not attended yet" },
        { value: "no", label: "Not yet" },
      ],
      warnIf: { equals: "no" },
      message:
        "Seminar seats book up, and this is the most common reason a Georgia application waits. We will send you the registration list on day one.",
    },
  ],

  filingSteps: [
    {
      title: "Form your entity and get your EIN",
      detail:
        "Register with the Georgia Secretary of State and apply for an EIN with the IRS. Your entity name must match everywhere — on the bond, the lease, and the application.",
      timing: "Before you apply",
    },
    {
      title: "Register for the pre-license seminar",
      detail:
        "Book the earliest available seat. Bring your certificate of completion into your application file.",
      timing: "Week 1 — do this first",
    },
    {
      title: "Schedule your GAPS fingerprint appointment",
      detail:
        "Schedule through the Georgia Applicant Processing Service. Results go directly to the Board.",
      timing: "Week 1",
    },
    {
      title: "Secure your office and occupation tax certificate",
      detail:
        "Sign your lease, install your sign, set up your dedicated business landline, and apply for your county or city occupation tax certificate.",
      timing: "Weeks 1–3",
    },
    {
      title: "Obtain your $50,000 surety bond and garage liability insurance",
      detail:
        "Both must name your entity exactly as registered. Send us the certificates for review.",
      timing: "Weeks 2–4",
    },
    {
      title: "Review and sign your prepared application",
      detail:
        "We hand you a complete data packet and instruction sheet. You review every field, complete the blanks we leave for you (such as your Social Security number), sign, and submit with your fees.",
      timing: "When your documents are complete",
    },
    {
      title: "Pass your office inspection",
      detail:
        "Use the inspection-prep photo checklist in your packet before the inspector arrives.",
      timing: "After filing",
    },
    {
      title: "Receive your license, then apply for dealer plates",
      detail:
        "Once licensed, apply to the Georgia Department of Revenue with Form MV-6 if you want dealer plates.",
      timing: "After approval",
    },
  ],

  citations: [
    {
      label: "Georgia Board of Used Motor Vehicle Dealers (Secretary of State)",
      url: "https://sos.ga.gov/georgia-board-used-motor-vehicle-dealers",
    },
    {
      label: "Georgia Applicant Processing Service (GAPS) fingerprinting",
      url: "https://www.aps.gemalto.com/ga/index.htm",
    },
    {
      label: "Georgia Department of Revenue — dealer plates (Form MV-6)",
      url: "https://dor.georgia.gov/documents/mv-6-dealer-tag-application",
    },
  ],
};
