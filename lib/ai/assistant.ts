import {
  JUDGE_SYSTEM_PROMPT,
  REFUSAL_MESSAGE,
  UNKNOWN_MESSAGE,
  aiConfig,
  buildSystemPrompt,
} from "@/config/ai";
import { site } from "@/config/site";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { attorneyReferralEmail } from "@/lib/email/templates";
import { complete, isAiConfigured, type ChatTurn } from "./client";
import {
  containsSensitiveData,
  postCheckDeterministic,
  preCheck,
  redactForLog,
  type GuardrailVerdict,
} from "./guardrails";
import { buildKnowledgeBase, searchFaq } from "./knowledge";

/**
 * The intake assistant.
 *
 * Order of operations, and none of it is optional:
 *
 *   1. Sensitive-data check — stop before anything else if they typed an SSN.
 *   2. preCheck() on the user's message. If it trips, NO model call happens.
 *   3. Model call with the guardrail system prompt.
 *   4. postCheckDeterministic() on the reply, then a model judge.
 *   5. Log the interaction; flag the lead if any layer fired.
 *
 * With no API key, step 3 becomes an FAQ search. Steps 1, 2, and 5 still run —
 * the guardrail is not an AI feature, it is the product's legal boundary.
 */

export type AssistantReply = {
  message: string;
  /** True when a guardrail replaced the answer. */
  blocked: boolean;
  /** True when the lead was flagged for an attorney referral. */
  referralCreated: boolean;
  /** False when the FAQ fallback answered instead of the model. */
  usedModel: boolean;
  /** FAQ entries backing a fallback answer, so the UI can show sources. */
  sources?: { question: string; answer: string }[];
};

export async function askAssistant({
  message,
  history = [],
  leadId,
  userId,
}: {
  message: string;
  history?: ChatTurn[];
  leadId?: string | null;
  userId?: string | null;
}): Promise<AssistantReply> {
  const trimmed = message.trim().slice(0, 2000);

  // ── Step 1: sensitive data ────────────────────────────────────────────────
  if (containsSensitiveData(trimmed)) {
    await recordInteraction({
      leadId,
      userId,
      // The message is NOT logged here: it contains the number we are telling
      // them not to send us.
      userMessage: "[withheld — message contained sensitive data]",
      blocked: true,
      blockedBy: "pre_check",
      blockReason: "Message appeared to contain an SSN or card number.",
      triggeredReferral: false,
      usedModel: false,
    });

    return {
      message: `Please do not send Social Security numbers, driver's license numbers, or card details here — we deliberately do not collect them, and I have not stored what you just sent.\n\nWhere a state form needs your Social Security number, your packet prints a blank line for you to complete by hand on the copy you sign. Ask me anything else and I am glad to help.`,
      blocked: true,
      referralCreated: false,
      usedModel: false,
    };
  }

  // ── Step 2: pre-check (no model call if this fires) ───────────────────────
  const pre = preCheck(trimmed);
  if (pre.blocked) {
    const referred = await flagAttorneyReferral(leadId, pre.reason ?? "Asked a legal question.");
    await recordInteraction({
      leadId,
      userId,
      userMessage: redactForLog(trimmed),
      blocked: true,
      blockedBy: "pre_check",
      blockReason: pre.reason,
      triggeredReferral: referred,
      usedModel: false,
    });

    return { message: REFUSAL_MESSAGE, blocked: true, referralCreated: referred, usedModel: false };
  }

  // ── Step 3: answer ────────────────────────────────────────────────────────
  if (!isAiConfigured()) {
    return fallbackAnswer(trimmed, leadId, userId);
  }

  const reply = await complete({
    system: buildSystemPrompt(buildKnowledgeBase()),
    messages: [...history.slice(-aiConfig.historyTurns), { role: "user", content: trimmed }],
  });

  // The API failed or returned nothing — fall back rather than error.
  if (!reply) {
    return fallbackAnswer(trimmed, leadId, userId);
  }

  // ── Step 4: post-check ────────────────────────────────────────────────────
  let post = postCheckDeterministic(reply);

  if (!post.blocked) {
    post = await judgeReply(trimmed, reply);
  }

  if (post.blocked) {
    const referred = await flagAttorneyReferral(
      leadId,
      post.reason ?? "Assistant reply was withheld by the safety check.",
    );
    await recordInteraction({
      leadId,
      userId,
      userMessage: redactForLog(trimmed),
      blocked: true,
      blockedBy: "post_check",
      blockReason: post.reason,
      triggeredReferral: referred,
      usedModel: true,
    });

    return { message: REFUSAL_MESSAGE, blocked: true, referralCreated: referred, usedModel: true };
  }

  await recordInteraction({
    leadId,
    userId,
    userMessage: redactForLog(trimmed),
    blocked: false,
    blockedBy: null,
    blockReason: null,
    triggeredReferral: false,
    usedModel: true,
  });

  return { message: reply, blocked: false, referralCreated: false, usedModel: true };
}

/**
 * LAYER 3b — a second model call that reviews the first one's reply.
 *
 * Fails CLOSED on a parse failure but OPEN on a transport failure: if the
 * judge cannot be reached at all we keep the reply (the deterministic scan
 * already passed it), but if the judge answers something we cannot parse we
 * treat that as a flag. Silently trusting an unparseable safety verdict is the
 * one behavior we cannot justify.
 */
async function judgeReply(userMessage: string, reply: string): Promise<GuardrailVerdict> {
  const verdict = await complete({
    system: JUDGE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `The person asked:\n"""${userMessage}"""\n\nThe assistant replied:\n"""${reply}"""\n\nIs the reply legal advice or an approval prediction?`,
      },
    ],
    maxTokens: aiConfig.judgeMaxTokens,
    model: aiConfig.judgeModel,
  });

  // Judge unreachable — the deterministic layer already passed this reply.
  if (verdict === null) {
    console.warn("[ai] Safety judge unavailable; relying on the deterministic post-check.");
    return { blocked: false, layer: null, reason: null };
  }

  try {
    const match = /\{[\s\S]*\}/.exec(verdict);
    if (!match) throw new Error("No JSON object in judge reply.");

    const parsed = JSON.parse(match[0]) as { flagged?: unknown; reason?: unknown };
    if (typeof parsed.flagged !== "boolean") throw new Error("Judge did not return a boolean.");

    return parsed.flagged
      ? {
          blocked: true,
          layer: "post_check",
          reason:
            typeof parsed.reason === "string" && parsed.reason.length > 0
              ? parsed.reason
              : "Safety judge flagged the reply.",
        }
      : { blocked: false, layer: null, reason: null };
  } catch (error) {
    console.error("[ai] Could not parse the safety judge's verdict; withholding the reply:", error);
    return {
      blocked: true,
      layer: "post_check",
      reason: "Safety check returned an unreadable verdict, so the reply was withheld.",
    };
  }
}

/**
 * The non-AI path: search our own FAQ.
 *
 * Used when there is no API key and when a model call fails. It only ever
 * returns text we wrote, so it cannot invent a fee or a deadline.
 */
async function fallbackAnswer(
  message: string,
  leadId: string | null | undefined,
  userId: string | null | undefined,
): Promise<AssistantReply> {
  const matches = searchFaq(message);

  await recordInteraction({
    leadId,
    userId,
    userMessage: redactForLog(message),
    blocked: false,
    blockedBy: null,
    blockReason: null,
    triggeredReferral: false,
    usedModel: false,
  });

  if (matches.length === 0) {
    return {
      message: `${UNKNOWN_MESSAGE}\n\nEmail ${site.contact.email} or call ${site.contact.phone} and we will answer properly.`,
      blocked: false,
      referralCreated: false,
      usedModel: false,
      sources: [],
    };
  }

  const body = matches
    .map((match) => `**${match.question}**\n${match.answer}`)
    .join("\n\n");

  return {
    message: `Here is what we publish on that:\n\n${body}\n\nIf that does not cover it, email ${site.contact.email} and a person will answer.`,
    blocked: false,
    referralCreated: false,
    usedModel: false,
    sources: matches,
  };
}

/**
 * Flag a lead for attorney referral.
 *
 * Idempotent: a lead already flagged is not re-flagged and the client is not
 * emailed twice. Returns true only when this call created the flag.
 */
async function flagAttorneyReferral(
  leadId: string | null | undefined,
  reason: string,
): Promise<boolean> {
  if (!leadId) return false;

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return false;
  if (lead.attorneyReferral) return false;

  await db.lead.update({
    where: { id: leadId },
    data: {
      attorneyReferral: true,
      attorneyReferralReason: `Assistant guardrail: ${reason}`,
      attorneyReferralAt: new Date(),
      status: lead.status === "CONVERTED" ? lead.status : "ATTORNEY_REFERRAL",
    },
  });

  await logActivity({
    actorType: "system",
    entityType: "lead",
    entityId: leadId,
    action: "attorney_referral_flagged_by_assistant",
    meta: { reason },
  });

  await sendEmail(attorneyReferralEmail({ to: lead.email, name: lead.name }));
  await sendEmail({
    to: site.contact.adminEmail,
    subject: `⚠ Attorney referral (assistant) — ${lead.name ?? lead.email}`,
    text: [
      "The intake assistant refused a question and flagged this lead for an attorney referral.",
      "",
      `Name:   ${lead.name ?? "—"}`,
      `Email:  ${lead.email}`,
      `State:  ${lead.stateCode ?? "—"}`,
      `Reason: ${reason}`,
      "",
      `Admin: ${site.url}/admin/leads/${lead.id}`,
    ].join("\n"),
  });

  return true;
}

/** The audit trail. Never throws — logging must not break the conversation. */
async function recordInteraction(input: {
  leadId?: string | null;
  userId?: string | null;
  userMessage: string;
  blocked: boolean;
  blockedBy: string | null;
  blockReason: string | null;
  triggeredReferral: boolean;
  usedModel: boolean;
}): Promise<void> {
  try {
    await db.aiInteraction.create({
      data: {
        leadId: input.leadId ?? null,
        userId: input.userId ?? null,
        kind: "chat",
        userMessage: input.userMessage,
        blocked: input.blocked,
        blockedBy: input.blockedBy,
        blockReason: input.blockReason,
        triggeredReferral: input.triggeredReferral,
        usedModel: input.usedModel,
        model: input.usedModel ? aiConfig.model : null,
      },
    });
  } catch (error) {
    console.error("[ai] Failed to record the interaction:", error);
  }
}
