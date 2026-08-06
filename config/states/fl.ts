/**
 * Florida — VW (Independent Wholesale Motor Vehicle Dealer) license.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONTENT: verify against current state rules before launch.
 * Every fee, bond amount, square footage, and deadline in this file must be
 * re-checked against the current FLHSMV dealer licensing rules before the site
 * goes live. See `citations` at the bottom of this file.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { StateRules } from "./types";
import { sharedPacketFieldGroups, sharedScreeningQuestions } from "./shared";

export const florida: StateRules = {
  code: "FL",
  name: "Florida",
  slug: "florida",
  licenseType: "VW — Independent Wholesale Motor Vehicle Dealer License",
  agency: "Florida Department of Highway Safety and Motor Vehicles (FLHSMV)",
  summary:
    "Florida's VW license is a wholesale license: it gets you into dealer auctions and lets you buy and sell with other licensed dealers. It does not let you sell to the public, and it does not come with dealer plates. Florida is strict about the office — 100 square feet of exclusive interior space with its own entrance, a permanent sign, and a zoning approval letter — and it requires a 16-hour pre-license course and LiveScan fingerprints.",

  capabilities: {
    auctionAccess: true,
    retailSales: false,
    wholesaleSales: true,
    dealerPlates: {
      available: false,
      // CONTENT: verify against current state rules before launch.
      note: "A Florida wholesale (VW) license does not come with dealer plates. If you need plates to drive inventory on the road, a wholesale license is not the right license for you.",
    },
    honestCaveat:
      "We want to be blunt about this: a Florida VW license gives you auction access, not retail sales and not dealer plates. If somebody sold you on a Florida wholesale license as a way to get plates, they were wrong. If retail sales matter to you, look at Georgia instead.",
  },

  office: {
    // CONTENT: verify against current state rules before launch.
    minSqFt: 100,
    displayLotRequired: false,
    requirements: [
      "At least 100 square feet of interior office space",
      "Ceiling height of at least 7 feet",
      "Space used exclusively for the dealership — no sharing with another business",
      "A separate entrance and its own street address",
      "A permanent sign identifying the dealership",
      "A zoning approval letter from the local government",
      "Business records kept on site",
    ],
    suiteEligible: false,
    suiteNote:
      "Our suites are in Atlanta, so they cannot satisfy a Florida location requirement. You need a Florida address that passes a Florida inspection. We will tell you what to look for.",
  },

  bond: {
    // CONTENT: verify against current state rules before launch.
    amountCents: 25_000 * 100,
    note: "Florida requires a $25,000 surety bond. You pay an annual premium to a bond company, not the full amount. We refer you to providers who work with new dealers.",
  },

  prelicense: {
    required: true,
    hours: 16,
    note: "Florida requires a 16-hour pre-license course from an approved provider before your application is approved. Plan for two full days.",
  },

  fingerprints: {
    required: true,
    system: "LiveScan",
    note: "You schedule your own LiveScan appointment with an approved vendor. Results go directly to FLHSMV; we never see them.",
  },

  fees: [
    // CONTENT: verify against current state rules before launch.
    {
      label: "Application fee",
      amountCents: 300_00,
      cadence: "one_time",
      note: "Paid to FLHSMV with your application.",
    },
    {
      label: "Annual renewal",
      amountCents: 75_00,
      cadence: "annual",
      note: "Due by April 30 each year.",
    },
    {
      label: "16-hour pre-license course",
      amountCents: 0,
      cadence: "one_time",
      note: "Cost is set by the approved course provider, not the state.",
      approximate: true,
    },
    {
      label: "LiveScan fingerprinting",
      amountCents: 0,
      cadence: "one_time",
      note: "Paid directly to the LiveScan vendor at your appointment.",
      approximate: true,
    },
    {
      label: "Local zoning and business tax receipt",
      amountCents: 0,
      cadence: "annual",
      note: "Set by your county or city. Varies widely.",
      approximate: true,
    },
  ],

  renewal: {
    // CONTENT: verify against current state rules before launch.
    cadence: "annual",
    dueMonth: 4,
    dueDay: 30,
    feeCents: 75_00,
    note: "Florida dealer licenses expire April 30 each year, regardless of when yours was issued.",
  },

  timeline: {
    minWeeks: 6,
    maxWeeks: 14,
    note: "The 16-hour course and the zoning approval letter are the two slow steps. Zoning letters from some Florida counties take weeks on their own, so start that request early.",
  },

  documents: [
    {
      id: "entity_registration",
      label: "Entity registration",
      description:
        "Your Florida Division of Corporations (Sunbiz) registration, or your home-state registration plus Florida foreign qualification.",
      required: true,
      source: "Florida Division of Corporations (Sunbiz)",
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
      label: "$25,000 surety bond",
      description:
        "The executed bond certificate naming your entity exactly as it appears on your application.",
      required: true,
      source: "Surety bond provider (we refer you)",
      checks: { minAmountCents: 25_000 * 100, mustNotBeExpired: true },
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
        "Proof you control a Florida location with exclusive use, a separate entrance, and its own address.",
      required: true,
      source: "Your landlord",
    },
    {
      id: "zoning_letter",
      label: "Zoning approval letter",
      description:
        "A letter from the local government confirming your location is zoned for a motor vehicle dealership. Request this early.",
      required: true,
      source: "County or city zoning department",
    },
    {
      id: "course_certificate",
      label: "16-hour pre-license course certificate",
      description: "Proof you completed the required course from an approved Florida provider.",
      required: true,
      source: "Approved course provider",
    },
    {
      id: "location_photos",
      label: "Office photos",
      description:
        "Interior, exterior, sign, and entrance photos. Florida inspectors check the sign and the separate entrance closely.",
      required: true,
      source: "You",
    },
    {
      id: "sales_tax_registration",
      label: "Florida sales tax registration",
      description: "Your Florida Department of Revenue sales tax certificate.",
      required: true,
      source: "Florida Department of Revenue",
    },
  ],

  packetFieldGroups: [
    ...sharedPacketFieldGroups,
    {
      id: "fl_specific",
      title: "Florida-Specific Information",
      fields: [
        { id: "fl_course_completion_date", label: "16-hour course completion date", type: "date" },
        { id: "fl_course_provider", label: "Course provider name", type: "text" },
        { id: "fl_livescan_date", label: "LiveScan appointment date", type: "date" },
        { id: "fl_livescan_ori", label: "LiveScan ORI number", type: "text" },
        { id: "fl_bond_number", label: "Surety bond number", type: "text" },
        { id: "fl_bond_amount", label: "Surety bond amount", type: "money" },
        { id: "fl_sales_tax_number", label: "Florida sales tax number", type: "text" },
        { id: "fl_zoning_contact", label: "Zoning office contact", type: "text" },
        {
          id: "fl_office_dimensions",
          label: "Office dimensions and ceiling height",
          type: "text",
          hint: "Florida requires at least 100 sq ft of interior space and a 7-foot ceiling.",
        },
      ],
    },
  ],

  screening: [
    ...sharedScreeningQuestions,
    {
      id: "fl_understands_wholesale",
      question:
        "Florida's wholesale license does NOT allow retail sales to the public and does NOT include dealer plates. Does that work for you?",
      help: "We ask this up front because it is the most common misunderstanding in Florida, and we would rather lose the sale than sell you the wrong license.",
      type: "choice",
      options: [
        { value: "yes", label: "Yes — I want auction access and dealer-to-dealer sales" },
        { value: "need_retail", label: "No — I need to sell to the public" },
        { value: "need_plates", label: "No — I need dealer plates" },
      ],
      warnIf: { equals: "need_retail" },
      message:
        "A Florida VW license will not do what you need. Florida has a retail dealer license class, and Georgia's used dealer license allows retail from an office suite. Let us walk you through which fits before you spend anything.",
    },
    {
      id: "fl_location",
      question: "Do you have a Florida location that meets the office requirement?",
      help: "100 sq ft of exclusive interior space, 7-foot ceilings, a separate entrance, its own address, and a permanent sign.",
      type: "choice",
      options: [
        { value: "have_location", label: "Yes, I have a qualifying location" },
        { value: "looking", label: "I am still looking" },
        { value: "shared_space", label: "I was planning to share space with another business" },
        { value: "home", label: "I was hoping to use my home" },
      ],
      warnIf: { equals: "shared_space" },
      message:
        "Florida requires the office be used exclusively for the dealership, with its own entrance and address. Shared or co-working space almost never passes. We will tell you what to look for before you sign a lease.",
    },
    {
      id: "fl_zoning_started",
      question: "Have you requested a zoning approval letter for your location?",
      type: "boolean",
      warnIf: { equals: false },
      message:
        "Start this now. Zoning letters are the single slowest step in Florida and some counties take several weeks.",
    },
  ],

  filingSteps: [
    {
      title: "Form your entity and get your EIN",
      detail:
        "Register with Sunbiz (or foreign-qualify your out-of-state entity) and apply for an EIN. Your name must match everywhere.",
      timing: "Before you apply",
    },
    {
      title: "Enroll in the 16-hour pre-license course",
      detail: "Book with an approved Florida provider. Plan for two full days.",
      timing: "Week 1 — do this first",
    },
    {
      title: "Request your zoning approval letter",
      detail:
        "Contact your county or city zoning office as soon as you have an address. This is the slowest step in Florida.",
      timing: "Week 1 — do this first",
    },
    {
      title: "Secure your Florida office",
      detail:
        "100 sq ft exclusive interior space, 7-foot ceiling, separate entrance, own street address, permanent sign. Send us photos before you sign.",
      timing: "Weeks 1–4",
    },
    {
      title: "Schedule LiveScan fingerprinting",
      detail: "Book with an approved vendor. Results go directly to FLHSMV.",
      timing: "Weeks 2–3",
    },
    {
      title: "Obtain your $25,000 surety bond and garage liability insurance",
      detail: "Both must name your entity exactly as registered.",
      timing: "Weeks 2–4",
    },
    {
      title: "Register for Florida sales tax",
      detail: "Apply with the Florida Department of Revenue for your sales tax certificate.",
      timing: "Weeks 2–4",
    },
    {
      title: "Review and sign your prepared application",
      detail:
        "We hand you a complete data packet and instruction sheet. You review every field, complete the blanks we leave for you, sign, and submit with your $300 fee.",
      timing: "When your documents are complete",
    },
    {
      title: "Pass your FLHSMV inspection",
      detail: "Use the inspection-prep photo checklist in your packet before the inspector arrives.",
      timing: "After filing",
    },
  ],

  citations: [
    {
      label: "FLHSMV — Motor Vehicle Dealer Licenses",
      url: "https://www.flhsmv.gov/motor-vehicles-tags-titles/dealers-and-installers/",
    },
    {
      label: "Florida Division of Corporations (Sunbiz)",
      url: "https://dos.fl.gov/sunbiz/",
    },
    {
      label: "Florida Department of Revenue — sales tax registration",
      url: "https://floridarevenue.com/taxes/registration",
    },
  ],
};
