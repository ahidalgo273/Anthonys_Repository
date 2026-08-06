/**
 * The FAQ.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NON-DEVELOPER NOTE
 * This one list feeds three things: the FAQ section on the home page, the full
 * FAQ page, and the knowledge base the AI assistant is allowed to answer from.
 * The assistant may only use this content plus the state rule files — it is not
 * allowed to improvise, and it is never allowed to answer a legal question.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type FaqItem = {
  question: string;
  answer: string;
  /** Groups the FAQ page into sections. */
  category: "pricing" | "process" | "requirements" | "suites" | "legal";
  /** Shown in the condensed FAQ on the home page. */
  featured?: boolean;
};

export const faqs: FaqItem[] = [
  {
    category: "pricing",
    featured: true,
    question: "Why do you publish your prices when nobody else does?",
    answer:
      "Because hiding them is a sales tactic, not a business necessity. Our competitors quote you after they have your phone number, take a deposit, and add fees as they go. Our prices are on the pricing page, they are the prices you pay, and there are no application-review fees, rush fees, or document fees layered on later. State fees, bond premiums, and course costs are paid by you directly to those parties, and we tell you what to expect for each.",
  },
  {
    category: "pricing",
    featured: true,
    question: "What is not included in your price?",
    answer:
      "Anything you pay to someone other than us. That means state application and license fees, your surety bond premium, garage liability insurance, pre-license course or seminar fees, fingerprinting fees, and your county or city occupation tax certificate. Each state guide page lists these with current amounts so you can budget the whole project, not just our part of it.",
  },
  {
    category: "pricing",
    question: "Do you take a deposit or hold my money?",
    answer:
      "No. You pay for the package when you buy it, through Stripe, and we start work. We do not hold deposits and we do not require a retainer.",
  },
  {
    category: "process",
    featured: true,
    question: "Do you file the application for me?",
    answer:
      "No, and no legitimate service should claim to. You are the applicant. We prepare a complete, organized data packet and a step-by-step filing instruction sheet, you review every field, you sign, and you submit. That is not us being cautious — it is how dealer licensing works. Anyone who offers to sign or submit on your behalf is offering you a problem.",
  },
  {
    category: "process",
    featured: true,
    question: "How long does the whole thing take?",
    answer:
      "It depends on the state and on how fast you move on the two or three slow steps. North Carolina is typically 4 to 10 weeks, Georgia 6 to 12 weeks, and Florida 6 to 14 weeks. The paperwork is rarely the bottleneck. Seminar seats, fingerprint appointments, and zoning letters are. We tell you on day one which items to start immediately.",
  },
  {
    category: "process",
    question: "What happens after I buy?",
    answer:
      "You complete an intake questionnaire, we build your personalized document checklist, and you upload documents to your client portal as you collect them. We review each one and flag problems before they reach the state. When your file is complete we generate your application packet, you review and sign it, and you file. After that we track your inspection and your renewal dates.",
  },
  {
    category: "process",
    question: "What if my application gets rejected?",
    answer:
      "We review the rejection with you, correct what caused it, and prepare a corrected packet at no additional charge from us. You will owe the state whatever refiling fee it charges. We cannot guarantee approval — no one can, and anyone who does is lying — but we can make sure a preventable paperwork error is not the reason.",
  },
  {
    category: "requirements",
    featured: true,
    question: "Can I get a dealer license using my home address?",
    answer:
      "Usually not. All three states require a real office that an inspector visits: roughly 250 sq ft in Georgia, 100 sq ft with a separate entrance in Florida, and 96 sq ft in a permanent building in North Carolina. Some North Carolina home setups with a qualifying separate office space do pass, at the inspector's discretion. Georgia and Florida are far stricter. That is exactly why we rent suites.",
  },
  {
    category: "requirements",
    question: "Do I need a lot to park cars on?",
    answer:
      "Not for the license types we handle. Georgia allows a broker-style operation from an office suite with no display lot, and Florida and North Carolina wholesale licenses are dealer-to-dealer, so there is nothing to display. If you want to run a retail lot, you have a different and larger project, and we will tell you so.",
  },
  {
    category: "requirements",
    question: "What is a surety bond, and do I have to pay $50,000?",
    answer:
      "No. A surety bond is a guarantee issued by a bond company, not cash you put up. You pay an annual premium — often a few hundred dollars if your credit is reasonable, more if it is not — and the bond company stands behind the full amount. Georgia and North Carolina require $50,000 bonds; Florida requires $25,000. We refer you to providers who work with new dealers.",
  },
  {
    category: "requirements",
    question: "Which state should I get licensed in?",
    answer:
      "It depends on what you want to do. If you want to sell to the public, Georgia is the practical choice of the three, and it works from an office suite. If you only want dealer-auction access and dealer-to-dealer sales, North Carolina is the cheapest and usually the fastest, and Florida works if you are already there. Note that a Florida wholesale license includes no dealer plates and no retail sales — we say that up front because it is the most common misunderstanding in the industry.",
  },
  {
    category: "requirements",
    question: "Do I need to live in the state where I get licensed?",
    answer:
      "Not necessarily, but you do need a qualifying business location in that state, and you need to be reachable during posted business hours. Out-of-state ownership is common. The location requirement is the real constraint, not your home address.",
  },
  {
    category: "suites",
    featured: true,
    question: "What exactly do I get with a suite?",
    answer:
      "A 250 sq ft private office in our Atlanta building, set up specifically to satisfy Georgia's established-place-of-business requirement: compliant signage, a lease you can attach to your application, and an inspection-ready space. The Compliance Subscription is included. It is $549 a month plus a $995 setup fee.",
  },
  {
    category: "suites",
    question: "Can I use an Atlanta suite for a Florida or North Carolina license?",
    answer:
      "No. Each state requires a location inside that state. Our suites satisfy Georgia's requirement only. If you are pursuing Florida or North Carolina, we help you evaluate a local space against that state's rules instead — send us photos before you sign a lease.",
  },
  {
    category: "suites",
    question: "Is the suite a mailbox or a virtual office?",
    answer:
      "No. Mailbox and virtual-office addresses do not pass a dealer inspection anywhere, and using one is a good way to get denied. These are real, private, lockable offices with your signage on them.",
  },
  {
    category: "legal",
    featured: true,
    question: "Are you attorneys?",
    answer:
      "No. DealerDesk is not a law firm and does not provide legal advice. We prepare and organize paperwork based on what you tell us. If your question is a legal one — whether a past record affects your application, how to structure an entity, what a regulation means for your particular situation — we will refer you to a licensed attorney rather than guess. Guessing on those questions costs people real money.",
  },
  {
    category: "legal",
    question: "I have something in my background. Can you tell me if I will be approved?",
    answer:
      "We cannot, and we will not try. Whether a specific record affects a license application is a legal question that depends on details we are not qualified to weigh. Tell us during intake that you would like an attorney referral and we will arrange one. It does not stop you from working with us in the meantime.",
  },
  {
    category: "legal",
    question: "What do you do with my personal information?",
    answer:
      "We collect only what the workflow needs. We do not collect or store Social Security numbers — where a state form requires one, your packet prints a labeled blank line for you to complete by hand on your signed copy. Your documents live in your client portal and we do not sell or share your data. See our privacy policy for the full detail.",
  },
];

export const featuredFaqs = faqs.filter((f) => f.featured);

export const faqCategories = [
  { id: "pricing", label: "Pricing and fees" },
  { id: "process", label: "How the process works" },
  { id: "requirements", label: "Requirements and eligibility" },
  { id: "suites", label: "Atlanta suites" },
  { id: "legal", label: "Legal and privacy" },
] as const;
