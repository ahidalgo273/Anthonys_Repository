import { getState, type ScreeningQuestion, type StateRules } from "@/config/states";

/**
 * The eligibility screening engine.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * This file contains NO state-specific knowledge. Every question, every
 * threshold, and every message comes from config/states/*.ts. To change what
 * we ask or how we respond, edit the state file — not this one.
 *
 * LEGAL GUARDRAIL: `referIf` rules route someone to an attorney referral. This
 * engine never decides whether an applicant will be approved, and there is
 * deliberately no code path that evaluates a criminal record or answers a legal
 * question. A referral is a routing decision, not an assessment.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type ScreeningAnswers = Record<string, string | boolean | undefined>;

export type ScreeningFinding = {
  /** The question that produced this finding. */
  questionId: string;
  question: string;
  message: string;
};

export type ScreeningResult = {
  /** False when at least one blocker fired. */
  eligible: boolean;
  /** Hard stops — the applicant cannot proceed in this state right now. */
  blockers: ScreeningFinding[];
  /** Things they should know, but which do not stop them. */
  warnings: ScreeningFinding[];
  /** LEGAL GUARDRAIL: true when the lead must be routed to an attorney. */
  attorneyReferral: boolean;
  /** Why the referral fired, for the lead record. Never contains our judgment. */
  attorneyReferralReasons: string[];
  /** Messages explaining the referral, shown to the applicant. */
  referralMessages: ScreeningFinding[];
  /** Questions that were never answered, so the funnel can ask again. */
  unanswered: string[];
};

/** The questions to ask for a state: shared questions first, then its own. */
export function questionsForState(stateCode: string): ScreeningQuestion[] {
  return getState(stateCode)?.screening ?? [];
}

/**
 * Evaluate a set of answers against a state's declarative rules.
 *
 * Pure function: same answers in, same result out, no database and no clock.
 * That is what makes it testable and what keeps the rules honest.
 */
export function screenApplicant(
  stateCode: string,
  answers: ScreeningAnswers,
): ScreeningResult {
  const state = getState(stateCode);

  if (!state) {
    return {
      eligible: false,
      blockers: [
        {
          questionId: "state",
          question: "Which state?",
          message:
            "We currently prepare applications for Georgia, Florida, and North Carolina only.",
        },
      ],
      warnings: [],
      attorneyReferral: false,
      attorneyReferralReasons: [],
      referralMessages: [],
      unanswered: [],
    };
  }

  const blockers: ScreeningFinding[] = [];
  const warnings: ScreeningFinding[] = [];
  const referralMessages: ScreeningFinding[] = [];
  const attorneyReferralReasons: string[] = [];
  const unanswered: string[] = [];

  for (const question of state.screening) {
    const answer = answers[question.id];

    if (!isAnswered(answer)) {
      unanswered.push(question.id);
      continue;
    }

    const finding = (): ScreeningFinding => ({
      questionId: question.id,
      question: question.question,
      message: question.message ?? "",
    });

    if (question.blockIf && matches(answer, question.blockIf.equals)) {
      blockers.push(finding());
    }

    if (question.warnIf && matches(answer, question.warnIf.equals)) {
      warnings.push(finding());
    }

    // ── LEGAL GUARDRAIL ────────────────────────────────────────────────────
    // A referral is triggered by the SHAPE of the answer (a "yes", or any text
    // at all), never by reading what the answer says.
    if (question.referIf) {
      const triggered =
        "anyText" in question.referIf
          ? typeof answer === "string" && answer.trim().length > 0
          : matches(answer, question.referIf.equals);

      if (triggered) {
        referralMessages.push(finding());
        attorneyReferralReasons.push(`Screening question "${question.id}" requested a referral.`);
      }
    }
  }

  return {
    eligible: blockers.length === 0,
    blockers,
    warnings,
    attorneyReferral: attorneyReferralReasons.length > 0,
    attorneyReferralReasons,
    referralMessages,
    unanswered,
  };
}

/**
 * Whether a state can serve a stated goal — used to warn people before they
 * buy the wrong license. This is the honesty check that stops someone paying
 * for a Florida wholesale license when they want to sell to the public.
 */
export type LicenseGoal = "auction_access" | "retail" | "wholesale" | "suite_only";

export function goalFitsState(
  state: StateRules,
  goal: LicenseGoal,
): { fits: boolean; message?: string } {
  switch (goal) {
    case "retail":
      return state.capabilities.retailSales
        ? { fits: true }
        : {
            fits: false,
            message: `${state.name}'s ${state.licenseType} does not allow retail sales to the public. Georgia's used dealer license does, and it works from an office suite — let us walk you through the difference before you spend anything.`,
          };

    case "auction_access":
      return state.capabilities.auctionAccess
        ? { fits: true }
        : {
            fits: false,
            message: `${state.name}'s ${state.licenseType} does not provide dealer auction access.`,
          };

    case "wholesale":
      return state.capabilities.wholesaleSales
        ? { fits: true }
        : {
            fits: false,
            message: `${state.name}'s ${state.licenseType} does not allow dealer-to-dealer sales.`,
          };

    case "suite_only":
      return state.office.suiteEligible
        ? { fits: true }
        : {
            fits: false,
            message: `Our suites are in Atlanta, so they cannot satisfy ${state.name}'s location requirement. You need a location inside ${state.name}. We will help you evaluate one.`,
          };
  }
}

function isAnswered(value: string | boolean | undefined): boolean {
  if (value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

/** Compares an answer to a rule's expected value, tolerating "true"/"false" strings from form posts. */
function matches(answer: string | boolean | undefined, expected: string | boolean): boolean {
  if (typeof expected === "boolean") {
    const normalized =
      typeof answer === "boolean" ? answer : answer === "true" ? true : answer === "false" ? false : undefined;
    return normalized === expected;
  }
  return answer === expected;
}
