/**
 * North Carolina — Wholesale Motor Vehicle Dealer license.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONTENT: verify against current state rules before launch.
 * Every fee, bond amount, square footage, and deadline in this file must be
 * re-checked against the current NCDMV License & Theft Bureau rules before the
 * site goes live. See `citations` at the bottom of this file.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { StateRules } from "./types";
import { sharedPacketFieldGroups, sharedScreeningQuestions } from "./shared";

export const northCarolina: StateRules = {
  code: "NC",
  name: "North Carolina",
  slug: "north-carolina",
  licenseType: "Wholesale Motor Vehicle Dealer License",
  agency: "NCDMV License & Theft Bureau",
  summary:
    "North Carolina is the least expensive and least demanding of the three states we serve: about $115.50 a year, a $50,000 bond, a 96-square-foot office in a permanent building, and no pre-license course for wholesalers. The distinctive part is that a local NCDMV inspector pre-approves your location before your license is issued, so the office has to be real before you file.",

  capabilities: {
    auctionAccess: true,
    retailSales: false,
    wholesaleSales: true,
    dealerPlates: {
      available: true,
      // CONTENT: verify against current state rules before launch — plate
      // eligibility and counts for wholesale dealers should be confirmed with
      // the License & Theft Bureau.
      note: "Dealer plate eligibility for wholesale dealers is limited and is handled separately from your license application. Confirm what you qualify for with the License & Theft Bureau before you count on plates.",
    },
    honestCaveat:
      "A North Carolina wholesale license is for dealer-to-dealer and auction business, not retail sales to the public. If you want to sell to retail customers, you need a different license class.",
  },

  office: {
    // CONTENT: verify against current state rules before launch.
    minSqFt: 96,
    displayLotRequired: false,
    requirements: [
      "At least 96 square feet of office space in a permanent building",
      "A sign with letters at least 3 inches tall identifying the dealership",
      "A telephone listed in the dealership's name",
      "Reasonable, posted business hours",
      "Compliance with local zoning",
      "Business records kept on site",
      "Location pre-approved by a local NCDMV inspector",
    ],
    suiteEligible: false,
    suiteNote:
      "Our suites are in Atlanta, so they cannot satisfy a North Carolina location requirement. You need a North Carolina address that your local NCDMV inspector approves.",
  },

  bond: {
    // CONTENT: verify against current state rules before launch.
    amountCents: 50_000 * 100,
    note: "North Carolina requires a $50,000 surety bond. You pay an annual premium to a bond company, not the full amount. We refer you to providers who work with new dealers.",
  },

  prelicense: {
    required: false,
    note: "North Carolina does not require a pre-license course for wholesale dealers. This is one of the main reasons NC is the fastest of the three states to enter.",
  },

  fingerprints: {
    required: true,
    system: "NCDMV background check",
    note: "North Carolina runs a criminal background check as part of the application. Requirements vary by applicant; your local inspector will tell you exactly what to bring.",
  },

  fees: [
    // CONTENT: verify against current state rules before launch.
    {
      label: "Annual license fee",
      amountCents: 115_50,
      cadence: "annual",
      note: "Paid to NCDMV. Among the lowest dealer license fees in the country.",
    },
    {
      label: "Local zoning / privilege license",
      amountCents: 0,
      cadence: "annual",
      note: "Set by your county or city. Varies widely.",
      approximate: true,
    },
  ],

  renewal: {
    // CONTENT: verify against current state rules before launch — confirm
    // whether NC renewal runs on a fixed date or on the license anniversary.
    cadence: "annual",
    dueMonth: 6,
    dueDay: 30,
    feeCents: 115_50,
    note: "North Carolina wholesale dealer licenses renew annually. Confirm your specific expiration date on your issued license — we track whatever date NCDMV printed on yours.",
  },

  timeline: {
    minWeeks: 4,
    maxWeeks: 10,
    note: "The local inspector's site visit sets the pace. With no pre-license course to sit through, North Carolina is usually the fastest of the three states.",
  },

  documents: [
    {
      id: "entity_registration",
      label: "Entity registration",
      description:
        "Your North Carolina Secretary of State registration, or your home-state registration plus NC foreign qualification.",
      required: true,
      source: "North Carolina Secretary of State",
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
      checks: { minAmountCents: 50_000 * 100, mustNotBeExpired: true },
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
        "Proof you control a North Carolina location of at least 96 sq ft in a permanent building.",
      required: true,
      source: "Your landlord",
    },
    {
      id: "zoning_compliance",
      label: "Zoning compliance confirmation",
      description: "Confirmation from your county or city that the location is properly zoned.",
      required: true,
      source: "County or city zoning department",
    },
    {
      id: "location_photos",
      label: "Office photos",
      description:
        "Interior, exterior, and sign photos. NC inspectors check the 3-inch sign lettering specifically — we measure it in your photo review.",
      required: true,
      source: "You",
    },
    {
      id: "phone_proof",
      label: "Business phone listing",
      description: "Proof of a telephone listed in the dealership's name.",
      required: true,
      source: "Your phone provider",
    },
  ],

  packetFieldGroups: [
    ...sharedPacketFieldGroups,
    {
      id: "nc_specific",
      title: "North Carolina-Specific Information",
      fields: [
        { id: "nc_bond_number", label: "Surety bond number", type: "text" },
        { id: "nc_bond_amount", label: "Surety bond amount", type: "money" },
        { id: "nc_inspector_contact", label: "Local NCDMV inspector contact", type: "text" },
        { id: "nc_inspection_date", label: "Scheduled location inspection date", type: "date" },
        {
          id: "nc_sign_description",
          label: "Sign description and letter height",
          type: "text",
          hint: "North Carolina requires letters at least 3 inches tall.",
        },
        { id: "nc_office_sq_ft", label: "Office square footage", type: "text" },
        { id: "nc_business_hours", label: "Posted business hours", type: "text" },
        { id: "nc_listed_phone", label: "Phone listed in dealership name", type: "phone" },
      ],
    },
  ],

  screening: [
    ...sharedScreeningQuestions,
    {
      id: "nc_understands_wholesale",
      question:
        "North Carolina's wholesale license does NOT allow retail sales to the public. Does that work for you?",
      type: "choice",
      options: [
        { value: "yes", label: "Yes — I want auction access and dealer-to-dealer sales" },
        { value: "need_retail", label: "No — I need to sell to the public" },
      ],
      warnIf: { equals: "need_retail" },
      message:
        "A North Carolina wholesale license will not cover retail sales. Georgia's used dealer license allows retail from an office suite — let us walk you through the difference before you spend anything.",
    },
    {
      id: "nc_location",
      question: "Do you have a North Carolina location that meets the office requirement?",
      help: "At least 96 sq ft in a permanent building, with a sign, a listed phone, and local zoning compliance.",
      type: "choice",
      options: [
        { value: "have_location", label: "Yes, I have a qualifying location" },
        { value: "looking", label: "I am still looking" },
        { value: "home", label: "I was hoping to use my home" },
      ],
      warnIf: { equals: "home" },
      message:
        "A local NCDMV inspector visits and pre-approves your location, so it has to be a real office in a permanent building. Some home-based setups with a qualifying separate office space do pass — your inspector decides. We will help you prepare either way.",
    },
  ],

  filingSteps: [
    {
      title: "Form your entity and get your EIN",
      detail:
        "Register with the NC Secretary of State (or foreign-qualify) and apply for an EIN. Your name must match everywhere.",
      timing: "Before you apply",
    },
    {
      title: "Secure your office and confirm zoning",
      detail:
        "96 sq ft minimum in a permanent building, with a sign using 3-inch letters and a phone listed in the dealership's name.",
      timing: "Weeks 1–3",
    },
    {
      title: "Obtain your $50,000 surety bond and garage liability insurance",
      detail: "Both must name your entity exactly as registered.",
      timing: "Weeks 1–3",
    },
    {
      title: "Contact your local License & Theft Bureau inspector",
      detail:
        "North Carolina's inspector pre-approves your location. Reach out early — they will tell you exactly what they want to see.",
      timing: "Week 2",
    },
    {
      title: "Review and sign your prepared application",
      detail:
        "We hand you a complete data packet and instruction sheet. You review every field, complete the blanks we leave for you, sign, and submit with your fee.",
      timing: "When your documents are complete",
    },
    {
      title: "Pass your location inspection",
      detail:
        "Use the inspection-prep photo checklist in your packet. Measure your sign lettering before the inspector does.",
      timing: "After filing",
    },
  ],

  citations: [
    {
      label: "NCDMV — License & Theft Bureau, dealer licensing",
      url: "https://www.ncdot.gov/dmv/offices-services/license-theft/Pages/dealer-regulations.aspx",
    },
    {
      label: "North Carolina Secretary of State — business registration",
      url: "https://www.sosnc.gov/divisions/business_registration",
    },
  ],
};
