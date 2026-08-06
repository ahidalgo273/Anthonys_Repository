import { absoluteUrl, site } from "@/config/site";
import { getState } from "@/config/states";
import type { EmailMessage } from "./types";

/**
 * Email bodies.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NON-DEVELOPER NOTE
 * The wording of every email the system sends lives here. Edit the text
 * directly — it is plain English, not code, apart from the ${...} parts which
 * fill in names and dates.
 *
 * Every email ends with the not-a-law-firm line, the same as every web page.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SIGNATURE = [
  "",
  `— ${site.name}`,
  site.contact.email,
  site.contact.phone,
  "",
  site.disclaimerShort,
].join("\n");

export function magicLinkEmail({ to, url }: { to: string; url: string }): EmailMessage {
  return {
    to,
    subject: `Your ${site.name} sign-in link`,
    text: [
      "Here is your sign-in link:",
      "",
      url,
      "",
      "It works once and expires in 15 minutes. If you did not ask to sign in, you can ignore this email — nobody can get into your account without this link.",
      SIGNATURE,
    ].join("\n"),
  };
}

export function welcomeEmail({
  to,
  name,
  productName,
  stateCode,
  isDemo = false,
}: {
  to: string;
  name?: string | null;
  productName: string;
  stateCode?: string | null;
  isDemo?: boolean;
}): EmailMessage {
  const state = stateCode ? getState(stateCode) : undefined;

  const firstSteps = state
    ? [
        "",
        `Start these ${state.name} items now — they are the slow ones, and starting them today is what separates a ${state.timeline.minWeeks}-week filing from a ${state.timeline.maxWeeks}-week one:`,
        "",
        ...state.filingSteps
          .filter((step) => step.timing?.toLowerCase().includes("week 1") || step.timing?.toLowerCase().includes("before"))
          .map((step) => `  • ${step.title} — ${step.detail}`),
      ]
    : [];

  return {
    to,
    subject: `${isDemo ? "[DEMO] " : ""}Welcome to ${site.name} — here is what happens next`,
    text: [
      `${name ? `${name}, thanks` : "Thanks"} for choosing ${site.name}.`,
      "",
      `You purchased: ${productName}`,
      isDemo
        ? "\n(This was a demo checkout — no payment was taken and no card was charged.)"
        : "",
      "",
      "What happens next:",
      "",
      "  1. Sign in to your portal and complete your application details.",
      "  2. We build your document checklist and you upload as you collect.",
      "  3. We review every document and flag problems before the state sees them.",
      "  4. When your file is complete we generate your packet — you review, sign, and file.",
      ...firstSteps,
      "",
      `Your portal: ${absoluteUrl("/portal")}`,
      "",
      "Sign in with your email address — we send you a link, so there is no password to remember.",
      "",
      "Reply to this email with any question about the process, your documents, or your timeline. If your question is a legal one, tell us and we will arrange an attorney referral rather than guess at it.",
      SIGNATURE,
    ]
      .filter((line) => line !== "")
      .join("\n"),
  };
}

export function deadlineReminderEmail({
  to,
  name,
  label,
  dueDateText,
  daysRemaining,
}: {
  to: string;
  name?: string | null;
  label: string;
  dueDateText: string;
  daysRemaining: number;
}): EmailMessage {
  const urgency =
    daysRemaining <= 30
      ? "This one is close. If it lapses, you are operating without valid credentials."
      : daysRemaining <= 60
        ? "Worth handling this month rather than next."
        : "Plenty of time — but this is when it is easy to deal with.";

  return {
    to,
    subject: `Reminder: ${label} is due ${dueDateText} (${daysRemaining} days)`,
    text: [
      `${name ? `${name}, a` : "A"} deadline is coming up.`,
      "",
      `  ${label}`,
      `  Due: ${dueDateText} — ${daysRemaining} days from today`,
      "",
      urgency,
      "",
      `Your compliance calendar: ${absoluteUrl("/portal/compliance")}`,
      "",
      "If you have already taken care of this, mark it complete in your portal and we will stop reminding you.",
      SIGNATURE,
    ].join("\n"),
  };
}

export function attorneyReferralEmail({
  to,
  name,
}: {
  to: string;
  name?: string | null;
}): EmailMessage {
  return {
    to,
    subject: "About your legal question",
    text: [
      `${name ? `${name}, thanks` : "Thanks"} for asking.`,
      "",
      site.attorneyDeferral,
      "",
      "We have flagged your file, and we will follow up with attorney options. Nothing about your application is on hold in the meantime — we can keep working on the paperwork while you get a real answer.",
      SIGNATURE,
    ].join("\n"),
  };
}

export function packetReadyEmail({
  to,
  name,
  stateName,
}: {
  to: string;
  name?: string | null;
  stateName: string;
}): EmailMessage {
  return {
    to,
    subject: `Your ${stateName} application packet is ready to review`,
    text: [
      `${name ? `${name}, your` : "Your"} ${stateName} application packet is ready.`,
      "",
      `Download it here: ${absoluteUrl("/portal/packet")}`,
      "",
      "Please read every field before you sign. A few things to know:",
      "",
      "  • This is a prepared draft for your review. You are the applicant.",
      "  • Some lines are deliberately blank — your Social Security number and driver's",
      "    license number, which we do not collect or store. Complete those by hand on",
      "    your signed copy.",
      "  • The packet includes a filing instruction sheet and an inspection-prep photo",
      "    checklist. Use both.",
      "",
      "If anything looks wrong, tell us before you file and we will correct it.",
      SIGNATURE,
    ].join("\n"),
  };
}
