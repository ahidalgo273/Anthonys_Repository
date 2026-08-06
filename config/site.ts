/**
 * Brand, contact, and legal copy for DealerDesk.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NON-DEVELOPER NOTE
 * This is the ONE file to edit when your business details change. Everything on
 * the website — page footers, the contact page, and the data search engines
 * read — comes from here.
 *
 * Every value marked PLACEHOLDER below must be replaced with real details
 * before launch. They are listed again in the README launch punch list.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const site = {
  name: "DealerDesk",
  /** Short tagline used in page titles and social previews. */
  tagline: "Dealer licensing, priced in the open",
  description:
    "We prepare used-car dealer license applications for Georgia, Florida, and North Carolina, track your compliance deadlines, and rent license-compliant office suites in Atlanta. Published prices. No hidden fees. You stay the applicant.",

  /** PLACEHOLDER — your real domain, with no trailing slash. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example-dealerdesk.com",

  contact: {
    /** PLACEHOLDER — the inbox you actually monitor. */
    email: "hello@example-dealerdesk.com",
    /** PLACEHOLDER — the inbox that receives lead and referral notifications. */
    adminEmail: "admin@example-dealerdesk.com",
    /** PLACEHOLDER — a real, answered phone number. */
    phone: "(404) 555-0100",
    /** Machine-readable version of the same number, for click-to-call links. */
    phoneHref: "+14045550100",
    /** PLACEHOLDER — where you book intro calls (Calendly, Cal.com, etc.). */
    bookingUrl: "https://example-dealerdesk.com/book",
  },

  /** PLACEHOLDER — the address of the suite building. Used in LocalBusiness structured data. */
  address: {
    street: "123 Example Industrial Blvd, Suite 100",
    city: "Atlanta",
    region: "GA",
    regionName: "Georgia",
    postalCode: "30301",
    country: "US",
    /** PLACEHOLDER — real coordinates of the building. */
    latitude: 33.749,
    longitude: -84.388,
  },

  /** Business hours shown on the contact page and in structured data. */
  hours: {
    days: "Monday – Friday",
    opens: "09:00",
    closes: "17:00",
    timezone: "America/New_York",
    note: "Suite tours by appointment.",
  },

  /** States we currently serve. Adding a fourth state means adding a config/states file. */
  servedStates: ["GA", "FL", "NC"] as const,

  /**
   * The not-a-law-firm disclaimer. This text appears in the footer of every
   * page, at checkout, at intake completion, and on the cover of every
   * generated packet. Have an attorney review it before launch.
   */
  disclaimer:
    "DealerDesk is not a law firm and does not provide legal advice. We prepare and organize license application paperwork based on the information you give us. You remain the applicant: you review, sign, and submit everything, and you are responsible for the accuracy of your application. For legal questions about your specific situation, consult a licensed attorney in your state.",

  /** Short version, used where space is tight (checkout, chat header). */
  disclaimerShort:
    "DealerDesk is not a law firm and does not give legal advice. You are the applicant and sign everything yourself.",

  /** The exact acknowledgment a client checks at checkout and at intake completion. */
  acknowledgment:
    "I understand that DealerDesk is not a law firm, does not provide legal advice, and does not sign or submit anything on my behalf. I am the applicant, and I will review and sign my own application.",

  /** What we tell someone whose question needs an attorney, not us. */
  attorneyDeferral:
    "That question needs a licensed attorney, not us — we prepare paperwork and we would be guessing, which is not fair to you. I have flagged your file for an attorney referral and someone will follow up with options. In the meantime I am glad to help with anything about our process, pricing, documents, or timelines.",
} as const;

/** Absolute URL helper for canonical links, sitemaps, and emails. */
export function absoluteUrl(path = "/"): string {
  const base = site.url.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
