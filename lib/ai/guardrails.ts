/**
 * The legal guardrail.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THREE LAYERS, AND WHY THERE ARE THREE
 *
 *   1. The system prompt (config/ai.ts) tells the model the rules.
 *   2. `preCheck()` inspects the USER'S MESSAGE before any model call. If it
 *      is asking for legal advice, we never call the model at all.
 *   3. `postCheck()` inspects the MODEL'S REPLY. Deterministic tripwires run
 *      first, then a model judge. Either can replace the reply.
 *
 * A prompt is an instruction, not a control. Models can be argued out of
 * instructions, and this system talks to people with money and a licensing
 * problem — exactly the population motivated to push. Layers 2 and 3 are
 * ordinary code, so they hold regardless of what the model decides to do.
 *
 * Every layer that fires flags the lead for an attorney referral and writes an
 * AiInteraction row. That log is the evidence the guardrail worked.
 *
 * TESTS: lib/ai/guardrails covers the phrasings in tests/guardrails.test.ts.
 * If you add a pattern, add a test with it.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type GuardrailVerdict = {
  blocked: boolean;
  /** Which layer stopped it, for the audit log. */
  layer: "pre_check" | "post_check" | null;
  /** Why, in words the operator can read on the lead record. */
  reason: string | null;
};

/**
 * Questions that need a lawyer.
 *
 * Kept broad on purpose. A false positive means someone gets offered an
 * attorney referral when they only wanted a fee schedule — mildly annoying. A
 * false negative means a non-lawyer answered a legal question.
 */
const LEGAL_ADVICE_PATTERNS: { pattern: RegExp; reason: string }[] = [
  // Eligibility with a record — the single most common one.
  {
    pattern:
      /\b(felony|felonies|misdemeanor|conviction|convicted|criminal record|criminal history|arrest(ed)?|probation|parole|expunge[d]?|sealed record|background check)\b/i,
    reason: "Asked about criminal history affecting a license.",
  },
  // "Will I / can I / do I qualify" in any phrasing.
  {
    pattern:
      /\b(will|would|can|could|do|does|am|are)\s+(i|we|he|she|they|my|our)\b[^.?!]{0,80}\b(qualify|approved?|denied?|disqualif\w*|eligible|get\s+(the\s+)?licen[cs]e|pass)\b/i,
    reason: "Asked us to predict a licensing decision.",
  },
  {
    pattern: /\b(disqualif\w+|automatic(ally)? denied|bar(red)? from getting)\b/i,
    reason: "Asked whether something is disqualifying.",
  },
  // Structuring to avoid a requirement.
  {
    pattern:
      /\b(how (should|do|can) i|best way to|is there a way to|can i)\b[^.?!]{0,80}\b(structure|set ?up|avoid|get around|work around|bypass|circumvent|not have to|skip)\b/i,
    reason: "Asked how to structure something to avoid a requirement.",
  },
  {
    pattern:
      /\b(avoid|get around|work around|bypass|circumvent|skirt)\b[^.?!]{0,40}\b(bond|requirement|inspection|regulation|law|rule|tax|zoning|licen[cs]e)\b/i,
    reason: "Asked how to avoid a legal requirement.",
  },
  // Explicit requests for legal judgment.
  {
    pattern:
      /\b(is it legal|is that legal|am i allowed|are we allowed|legally (required|obligated|able)|against the law|violat\w+ (the )?(law|statute|regulation)|liable|liability|sue|lawsuit|court)\b/i,
    reason: "Asked for a legal opinion.",
  },
  {
    pattern: /\b(legal advice|talk to a lawyer|need an attorney|your legal opinion)\b/i,
    reason: "Asked for legal advice directly.",
  },
  // Statute interpretation for their situation.
  {
    pattern:
      /\b(what does|how does|does)\b[^.?!]{0,60}\b(statute|regulation|law|code|o\.?c\.?g\.?a|§|section \d)\b[^.?!]{0,60}\b(mean|apply|require)\b/i,
    reason: "Asked us to interpret a statute for their situation.",
  },
  // Immigration and residency status as an eligibility question.
  {
    pattern:
      /\b(green card|visa|undocumented|non[- ]?resident alien|citizenship|immigration status|work permit|itin)\b[^.?!]{0,60}\b(licen[cs]e|apply|eligible|qualify)\b/i,
    reason: "Asked whether immigration status affects eligibility.",
  },
  // Prior denials and revocations.
  {
    pattern: /\b(denied before|previous denial|revoked|suspended licen[cs]e|reinstat\w+)\b/i,
    reason: "Asked about a prior denial, revocation, or reinstatement.",
  },
  // Misrepresentation.
  {
    pattern:
      /\b(do i have to (disclose|report|tell|mention)|can i (leave (it )?(off|blank)|omit|not disclose|hide|lie))\b/i,
    reason: "Asked about withholding information from a state agency.",
  },
];

/** Phrasings that would be an approval prediction if the model produced them. */
const UNSAFE_RESPONSE_PATTERNS: { pattern: RegExp; reason: string }[] = [
  {
    pattern:
      /\b(you (will|would|should) (be )?(get|receive|be granted|be approved|qualify)|you'?ll (be )?(approved|qualify|get (the|your) licen[cs]e))\b/i,
    reason: "Reply predicted an approval.",
  },
  {
    pattern:
      /\b(you (probably|likely|most likely) (will|would|should|can)\b[^.?!]{0,40}\b(qualify|be approved|get (the|a|your) licen[cs]e))\b/i,
    reason: "Reply hedged an approval prediction.",
  },
  {
    pattern:
      /\b(guarantee[ds]?|i can assure you|you have nothing to worry about|you'?re fine|that (won'?t|will not) be a problem)\b/i,
    reason: "Reply guaranteed or minimized an outcome.",
  },
  {
    pattern:
      /\b(that (felony|misdemeanor|conviction|record)\b[^.?!]{0,60}\b(won'?t|will not|does not|doesn'?t|shouldn'?t)\b)/i,
    reason: "Reply assessed the effect of a criminal record.",
  },
  {
    pattern:
      /\b(i('| w)?ll (file|submit|sign|send it in) (it |this |that )?for you|we (will|can) (sign|file|submit) (it |this |that )?(on your behalf|for you))\b/i,
    reason: "Reply offered to sign or file on the client's behalf.",
  },
  {
    pattern: /\b(you (do not|don'?t) (need to|have to) (disclose|report|mention)|just leave (it|that) (blank|off))\b/i,
    reason: "Reply advised withholding information from a state agency.",
  },
];

/**
 * LAYER 2 — inspect the user's message before calling the model.
 *
 * Returning blocked:true means no model call happens at all. The cheapest and
 * most reliable protection is the request we never make.
 */
export function preCheck(message: string): GuardrailVerdict {
  const text = message.trim();
  if (text.length === 0) {
    return { blocked: false, layer: null, reason: null };
  }

  for (const { pattern, reason } of LEGAL_ADVICE_PATTERNS) {
    if (pattern.test(text)) {
      return { blocked: true, layer: "pre_check", reason };
    }
  }

  return { blocked: false, layer: null, reason: null };
}

/**
 * LAYER 3a — deterministic scan of the model's reply.
 *
 * Runs before the judge because it costs nothing and catches the clear cases
 * even if the judge call fails or times out.
 */
export function postCheckDeterministic(reply: string): GuardrailVerdict {
  for (const { pattern, reason } of UNSAFE_RESPONSE_PATTERNS) {
    if (pattern.test(reply)) {
      return { blocked: true, layer: "post_check", reason };
    }
  }
  return { blocked: false, layer: null, reason: null };
}

/**
 * Whether a message looks like someone volunteering data we refuse to hold.
 *
 * Used to stop the assistant echoing it back and to remind the person we do
 * not collect it. The value itself is never stored.
 */
export function containsSensitiveData(message: string): boolean {
  const patterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN with dashes
    /\bssn\b[^.?!]{0,20}\b\d{9}\b/i, // "ssn 123456789"
    /\b\d{13,19}\b/, // card-length digit run
  ];
  return patterns.some((pattern) => pattern.test(message));
}

/**
 * Redact anything sensitive before it is written to the audit log.
 *
 * We log the question so the operator can follow up. We do not log a Social
 * Security number just because someone typed one into a chat box.
 */
export function redactForLog(message: string): string {
  return message
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[redacted-ssn]")
    .replace(/\b\d{13,19}\b/g, "[redacted-number]")
    .slice(0, 1000);
}
