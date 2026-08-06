"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getState } from "@/config/states";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { sendEmail } from "@/lib/email";
import { attorneyReferralEmail } from "@/lib/email/templates";
import { screenApplicant, type ScreeningAnswers } from "@/lib/rules/screening";
import { createCheckout } from "@/lib/stripe/checkout";
import { site } from "@/config/site";
import {
  contactSchema,
  goalSchema,
  packageSchema,
  stateSchema,
  timelineSchema,
} from "./schema";

/**
 * Server actions backing the intake wizard.
 *
 * Progress is saved after every step, keyed by a cookie holding the lead id, so
 * someone who closes the tab can pick up where they left off. Nothing here
 * trusts the browser: every value is re-validated server-side.
 */

const LEAD_COOKIE = "dd_lead";
const LEAD_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type ActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function readLeadId(): Promise<string | null> {
  const store = await cookies();
  return store.get(LEAD_COOKIE)?.value ?? null;
}

async function writeLeadId(leadId: string): Promise<void> {
  const store = await cookies();
  store.set(LEAD_COOKIE, leadId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LEAD_COOKIE_MAX_AGE,
  });
}

/** The in-progress lead for this browser, if there is one. */
export async function getCurrentLead() {
  const leadId = await readLeadId();
  if (!leadId) return null;
  return db.lead.findUnique({ where: { id: leadId } });
}

// ── Step 1: contact ──────────────────────────────────────────────────────────

export async function saveContact(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    source: formData.get("source") ?? "",
  });

  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  const { name, email, phone, source } = parsed.data;
  const existingId = await readLeadId();

  // A stale cookie (database reset, deleted lead) must not 500 the funnel.
  const existing = existingId
    ? await db.lead.findUnique({ where: { id: existingId } })
    : null;

  const lead = existing
    ? await db.lead.update({
        where: { id: existing.id },
        data: { name, email: email.toLowerCase(), phone: phone || null, lastStep: "contact" },
      })
    : await db.lead.create({
        data: {
          name,
          email: email.toLowerCase(),
          phone: phone || null,
          source: source || "direct",
          lastStep: "contact",
        },
      });

  await writeLeadId(lead.id);
  await logActivity({
    actorType: "client",
    actorEmail: lead.email,
    entityType: "lead",
    entityId: lead.id,
    action: "intake_contact_saved",
  });

  redirect("/intake?step=state");
}

// ── Step 2: state ────────────────────────────────────────────────────────────

export async function saveState(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const leadId = await requireLeadId();
  const parsed = stateSchema.safeParse({ stateCode: formData.get("stateCode") });
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  await db.lead.update({
    where: { id: leadId },
    data: { stateCode: parsed.data.stateCode, lastStep: "state" },
  });

  redirect("/intake?step=goal");
}

// ── Step 3: goal ─────────────────────────────────────────────────────────────

export async function saveGoal(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const leadId = await requireLeadId();
  const parsed = goalSchema.safeParse({
    goal: formData.get("goal"),
    needsSuite: formData.get("needsSuite") ?? undefined,
  });
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  await db.lead.update({
    where: { id: leadId },
    data: { goal: parsed.data.goal, lastStep: "goal" },
  });

  redirect("/intake?step=timeline");
}

// ── Step 4: timeline ─────────────────────────────────────────────────────────

export async function saveTimeline(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const leadId = await requireLeadId();
  const parsed = timelineSchema.safeParse({ timeline: formData.get("timeline") });
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  await db.lead.update({
    where: { id: leadId },
    data: { timeline: parsed.data.timeline, lastStep: "timeline" },
  });

  redirect("/intake?step=screening");
}

// ── Step 5: screening ────────────────────────────────────────────────────────

export async function saveScreening(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const leadId = await requireLeadId();
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead?.stateCode) return { ok: false, error: "Please choose your state first." };

  const state = getState(lead.stateCode);
  if (!state) return { ok: false, error: "That state is not one we serve." };

  // Answers are collected by question id, so adding a question to a state
  // config needs no change here.
  const answers: ScreeningAnswers = {};
  for (const question of state.screening) {
    const raw = formData.get(`q_${question.id}`);
    if (raw === null) continue;
    const value = String(raw);
    answers[question.id] = question.type === "boolean" ? value === "true" : value.trim();
  }

  const result = screenApplicant(lead.stateCode, answers);

  if (result.unanswered.length > 0) {
    // Free-text questions are optional; everything else must be answered.
    const required = result.unanswered.filter((id) => {
      const question = state.screening.find((q) => q.id === id);
      return question && question.type !== "text";
    });
    if (required.length > 0) {
      return {
        ok: false,
        error: "Please answer every question so we can screen you accurately.",
        fieldErrors: Object.fromEntries(required.map((id) => [id, "Required"])),
      };
    }
  }

  // ── LEGAL GUARDRAIL ────────────────────────────────────────────────────────
  // The referral is recorded and the client is told kindly. We never evaluate
  // the underlying question, and the flag does not stop them proceeding.
  const becameReferral = result.attorneyReferral && !lead.attorneyReferral;

  await db.lead.update({
    where: { id: leadId },
    data: {
      screeningAnswers: answers,
      // Round-tripping through JSON drops undefined values, which Prisma's
      // Json column rejects.
      screeningResult: JSON.parse(JSON.stringify(result)),
      status: result.attorneyReferral ? "ATTORNEY_REFERRAL" : "SCREENED",
      lastStep: "screening",
      ...(result.attorneyReferral
        ? {
            attorneyReferral: true,
            attorneyReferralReason: result.attorneyReferralReasons.join(" "),
            attorneyReferralAt: lead.attorneyReferralAt ?? new Date(),
          }
        : {}),
    },
  });

  await logActivity({
    actorType: "client",
    actorEmail: lead.email,
    entityType: "lead",
    entityId: leadId,
    action: "intake_screening_completed",
    meta: {
      eligible: result.eligible,
      blockers: result.blockers.length,
      warnings: result.warnings.length,
      attorneyReferral: result.attorneyReferral,
    },
  });

  if (becameReferral) {
    await sendEmail(attorneyReferralEmail({ to: lead.email, name: lead.name }));
    await sendEmail({
      to: site.contact.adminEmail,
      subject: `⚠ Attorney referral requested — ${lead.name ?? lead.email}`,
      text: [
        "A lead asked for something we do not answer, and has been flagged for an attorney referral.",
        "",
        `Name:  ${lead.name ?? "—"}`,
        `Email: ${lead.email}`,
        `State: ${lead.stateCode ?? "—"}`,
        "",
        "Reason(s) recorded:",
        ...result.attorneyReferralReasons.map((reason) => `  • ${reason}`),
        "",
        `Admin: ${site.url}/admin/leads/${lead.id}`,
      ].join("\n"),
    });
  }

  redirect("/intake?step=package");
}

// ── Step 6: package and checkout ─────────────────────────────────────────────

export async function startCheckout(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const leadId = await requireLeadId();
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { ok: false, error: "We lost track of your intake. Please start again." };

  const parsed = packageSchema.safeParse({
    packageId: formData.get("packageId"),
    addOnIds: formData.getAll("addOnIds").map(String),
    acknowledged: formData.get("acknowledged") === "on" || formData.get("acknowledged") === "true",
  });
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  await db.lead.update({
    where: { id: leadId },
    data: {
      selectedPackage: parsed.data.packageId,
      acknowledgedAt: new Date(),
      lastStep: "package",
    },
  });

  let destination: string;
  try {
    const outcome = await createCheckout({
      productId: parsed.data.packageId,
      leadId,
      email: lead.email,
      addOnIds: parsed.data.addOnIds ?? [],
    });
    destination =
      outcome.kind === "stripe"
        ? outcome.url
        : `/intake/complete?demo=1&order=${outcome.orderId}`;
  } catch (error) {
    console.error("[intake] Checkout failed:", error);
    return {
      ok: false,
      error: `We could not start checkout. Please try again, or email ${site.contact.email} and we will take it from here.`,
    };
  }

  redirect(destination);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireLeadId(): Promise<string> {
  const leadId = await readLeadId();
  if (!leadId) redirect("/intake?step=contact");
  return leadId;
}

function fieldErrorsFrom(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
}
