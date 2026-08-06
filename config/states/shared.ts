/**
 * Screening questions and packet sections that are identical in every state.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NON-DEVELOPER NOTE
 * These are the questions we ask everyone, no matter which state they picked.
 * The last two are the legal guardrail: a criminal-history answer or a legal
 * question NEVER gets evaluated by us. It routes the person to an attorney
 * referral with a kind message. Do not change that behavior without an
 * attorney's sign-off.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { PacketFieldGroup, ScreeningQuestion } from "./types";

/** Asked in every state, before the state-specific questions. */
export const sharedScreeningQuestions: ScreeningQuestion[] = [
  {
    id: "age_18",
    question: "Are you at least 18 years old?",
    type: "boolean",
    blockIf: { equals: false },
    message:
      "Every state we serve requires the license applicant to be at least 18. If someone else in your business meets that requirement, they can apply as the licensee.",
  },
  {
    id: "entity",
    question: "Do you have a business entity, or are you willing to form one?",
    help: "Most applicants use an LLC. We offer LLC/EIN setup assistance as a $199 add-on if you have not formed one yet.",
    type: "choice",
    options: [
      { value: "have_entity", label: "I already have an LLC or corporation" },
      { value: "will_form", label: "Not yet, but I will form one" },
      { value: "sole_proprietor", label: "I plan to apply as a sole proprietor" },
      { value: "unsure", label: "I am not sure" },
    ],
    warnIf: { equals: "unsure" },
    message:
      "No problem — we will walk through entity options with you during onboarding. Choosing a structure is a business decision, and if you want legal guidance on it we will refer you to an attorney.",
  },
  {
    id: "bond",
    question: "Can you obtain a surety bond in your state's required amount?",
    help: "A surety bond is not money you pay up front. You pay an annual premium — often a few hundred dollars — and the bond company backs the full amount. We refer you to bond providers.",
    type: "choice",
    options: [
      { value: "yes", label: "Yes, or I expect to qualify" },
      { value: "need_referral", label: "I need a bond provider referral" },
      { value: "unsure", label: "I am not sure I will qualify" },
    ],
    warnIf: { equals: "unsure" },
    message:
      "Bond approval depends on the bond company's own underwriting, not on us. We will refer you to providers who work with new dealers so you can find out early — before you pay for anything else.",
  },
  {
    id: "residency_state",
    question: "Which state do you live in?",
    help: "You do not always have to live in the state where you get licensed, but it affects your paperwork and your office options.",
    type: "text",
  },
  {
    // ── LEGAL GUARDRAIL ──────────────────────────────────────────────────────
    // A "yes" here is a SOFT FLAG ONLY. We do not ask what the record is, we do
    // not evaluate it, and we never tell anyone whether they will be approved.
    id: "criminal_history",
    question:
      "Will your background check show any criminal history? (A yes does not disqualify you from working with us.)",
    help: "We ask only so we can connect you with an attorney if you want one. We do not ask for details, and we do not assess your background ourselves.",
    type: "boolean",
    referIf: { equals: true },
    message:
      "Thanks for telling us. Whether a specific record affects a license application is a legal question, and we are not a law firm — we would be guessing, which is not fair to you. We have flagged your file for an attorney referral so you can get a real answer. You can continue with your intake in the meantime.",
  },
  {
    // ── LEGAL GUARDRAIL ──────────────────────────────────────────────────────
    // Any free text here routes to attorney referral, unevaluated.
    id: "legal_question",
    question: "Is there a legal question you want answered before you start? (Optional)",
    help: "We will pass it to an attorney rather than answering it ourselves.",
    type: "text",
    referIf: { anyText: true },
    message:
      "We have noted your question and flagged your file for an attorney referral. We do not answer legal questions ourselves, because we are not a law firm and a wrong answer could cost you real money.",
  },
];

/**
 * Packet sections collected identically in every state.
 *
 * NOTE THE `blank_for_client` FIELDS. We do not collect or store Social
 * Security numbers. The packet prints an empty, labeled line that the client
 * completes by hand on their own signed copy.
 */
export const sharedPacketFieldGroups: PacketFieldGroup[] = [
  {
    id: "applicant",
    title: "Applicant Information",
    note: "The individual who will sign the application as the licensee.",
    fields: [
      { id: "applicant_first_name", label: "First name", type: "text" },
      { id: "applicant_last_name", label: "Last name", type: "text" },
      { id: "applicant_dob", label: "Date of birth", type: "date" },
      { id: "applicant_email", label: "Email", type: "email" },
      { id: "applicant_phone", label: "Mobile phone", type: "phone" },
      { id: "applicant_home_address", label: "Home address", type: "address" },
      {
        id: "applicant_ssn",
        label: "Social Security number",
        type: "blank_for_client",
        hint: "DealerDesk does not collect or store this. Write it on your signed copy only.",
      },
      {
        id: "applicant_dl_number",
        label: "Driver's license number",
        type: "blank_for_client",
        hint: "Complete this on your signed copy from your physical license.",
      },
    ],
  },
  {
    id: "entity",
    title: "Business Entity",
    fields: [
      { id: "entity_legal_name", label: "Legal entity name", type: "text" },
      { id: "entity_dba", label: "Trade name / DBA (if any)", type: "text" },
      {
        id: "entity_type",
        label: "Entity type",
        type: "text",
        hint: "LLC, corporation, or sole proprietorship.",
      },
      { id: "entity_formation_date", label: "Formation date", type: "date" },
      { id: "entity_ein", label: "EIN", type: "text" },
      { id: "entity_state_of_formation", label: "State of formation", type: "text" },
    ],
  },
  {
    id: "location",
    title: "Business Location",
    note: "The established place of business the state will inspect.",
    fields: [
      { id: "location_address", label: "Street address", type: "address" },
      { id: "location_sq_ft", label: "Office square footage", type: "text" },
      { id: "location_phone", label: "Business phone number", type: "phone" },
      {
        id: "location_ownership",
        label: "Owned or leased",
        type: "text",
        hint: "If leased, attach your lease. Our suite tenants receive a compliant lease from us.",
      },
      { id: "location_hours", label: "Posted business hours", type: "text" },
    ],
  },
];
