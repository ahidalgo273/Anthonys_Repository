import { describe, expect, it } from "vitest";
import { georgia, florida, northCarolina } from "@/config/states";
import { goalFitsState, questionsForState, screenApplicant } from "@/lib/rules/screening";

/**
 * The screening engine.
 *
 * The attorney-referral tests are the important ones. If any of them start
 * failing, the product is answering legal questions it must not answer — treat
 * that as a stop-everything bug, not a flaky test.
 */

const baseGeorgiaAnswers = {
  age_18: true,
  entity: "have_entity",
  bond: "yes",
  residency_state: "GA",
  criminal_history: false,
  ga_office_plan: "have_office",
  ga_seminar: "yes",
};

describe("screenApplicant", () => {
  it("passes a clean Georgia applicant with no blockers or warnings", () => {
    const result = screenApplicant("GA", baseGeorgiaAnswers);

    expect(result.eligible).toBe(true);
    expect(result.blockers).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.attorneyReferral).toBe(false);
    // The optional legal-question box is the only thing left unanswered, which
    // is correct — leaving it empty is the normal case.
    expect(result.unanswered).toEqual(["legal_question"]);
  });

  it("blocks an applicant under 18 and explains why", () => {
    const result = screenApplicant("GA", { ...baseGeorgiaAnswers, age_18: false });

    expect(result.eligible).toBe(false);
    expect(result.blockers).toHaveLength(1);
    expect(result.blockers[0].questionId).toBe("age_18");
    expect(result.blockers[0].message).toMatch(/at least 18/i);
  });

  it("rejects an unknown state rather than guessing", () => {
    const result = screenApplicant("TX", baseGeorgiaAnswers);

    expect(result.eligible).toBe(false);
    expect(result.blockers[0].message).toMatch(/Georgia, Florida, and North Carolina/);
  });

  it("reports which questions are unanswered", () => {
    const result = screenApplicant("GA", { age_18: true });
    expect(result.unanswered).toContain("entity");
    expect(result.unanswered).toContain("bond");
  });

  it("treats a whitespace-only text answer as unanswered", () => {
    const result = screenApplicant("GA", { ...baseGeorgiaAnswers, residency_state: "   " });
    expect(result.unanswered).toContain("residency_state");
  });

  it('accepts "true"/"false" strings from form posts, not just booleans', () => {
    const asStrings = screenApplicant("GA", {
      ...baseGeorgiaAnswers,
      age_18: "false",
      criminal_history: "false",
    });

    expect(asStrings.eligible).toBe(false);
    expect(asStrings.blockers[0].questionId).toBe("age_18");
    expect(asStrings.attorneyReferral).toBe(false);
  });

  it("warns without blocking when someone plans to work from home in Georgia", () => {
    const result = screenApplicant("GA", { ...baseGeorgiaAnswers, ga_office_plan: "home" });

    expect(result.eligible).toBe(true);
    expect(result.warnings.map((w) => w.questionId)).toContain("ga_office_plan");
  });
});

// ── LEGAL GUARDRAIL ──────────────────────────────────────────────────────────

describe("attorney referral routing (LEGAL GUARDRAIL)", () => {
  it("flags a criminal-history yes for referral WITHOUT blocking them", () => {
    const result = screenApplicant("GA", { ...baseGeorgiaAnswers, criminal_history: true });

    expect(result.attorneyReferral).toBe(true);
    expect(result.attorneyReferralReasons).toHaveLength(1);
    // Critical: a record is not a blocker. We do not decide eligibility.
    expect(result.eligible).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it('accepts the string "true" for criminal history as a referral trigger', () => {
    const result = screenApplicant("GA", { ...baseGeorgiaAnswers, criminal_history: "true" });
    expect(result.attorneyReferral).toBe(true);
  });

  it("never evaluates the record — the message defers instead of assessing", () => {
    const result = screenApplicant("GA", { ...baseGeorgiaAnswers, criminal_history: true });
    const message = result.referralMessages[0].message;

    expect(message).toMatch(/not a law firm|attorney/i);
    // It must not tell anyone what will happen to their application.
    expect(message).not.toMatch(/you will (be )?(approved|denied|qualify)/i);
    expect(message).not.toMatch(/disqualif/i);
  });

  it("flags ANY free text in the legal-question box", () => {
    const result = screenApplicant("GA", {
      ...baseGeorgiaAnswers,
      legal_question: "does my 2019 conviction matter?",
    });

    expect(result.attorneyReferral).toBe(true);
    expect(result.attorneyReferralReasons[0]).toMatch(/legal_question/);
  });

  it("does not flag an empty or whitespace-only legal-question box", () => {
    expect(screenApplicant("GA", { ...baseGeorgiaAnswers, legal_question: "" }).attorneyReferral).toBe(
      false,
    );
    expect(
      screenApplicant("GA", { ...baseGeorgiaAnswers, legal_question: "   " }).attorneyReferral,
    ).toBe(false);
  });

  it("records both reasons when criminal history and a legal question both fire", () => {
    const result = screenApplicant("GA", {
      ...baseGeorgiaAnswers,
      criminal_history: true,
      legal_question: "what about my record?",
    });

    expect(result.attorneyReferral).toBe(true);
    expect(result.attorneyReferralReasons).toHaveLength(2);
  });

  it("routes referrals identically in every state", () => {
    for (const state of ["GA", "FL", "NC"]) {
      const result = screenApplicant(state, { criminal_history: true });
      expect(result.attorneyReferral, `${state} must flag a criminal-history yes`).toBe(true);
    }
  });
});

describe("goalFitsState", () => {
  it("warns that a Florida wholesale license cannot do retail", () => {
    const fit = goalFitsState(florida, "retail");
    expect(fit.fits).toBe(false);
    expect(fit.message).toMatch(/does not allow retail sales/i);
  });

  it("warns that North Carolina wholesale cannot do retail", () => {
    expect(goalFitsState(northCarolina, "retail").fits).toBe(false);
  });

  it("allows retail in Georgia", () => {
    expect(goalFitsState(georgia, "retail").fits).toBe(true);
  });

  it("allows an Atlanta suite for Georgia only", () => {
    expect(goalFitsState(georgia, "suite_only").fits).toBe(true);
    expect(goalFitsState(florida, "suite_only").fits).toBe(false);
    expect(goalFitsState(northCarolina, "suite_only").fits).toBe(false);
  });

  it("allows auction access in all three states — that is the core offering", () => {
    for (const state of [georgia, florida, northCarolina]) {
      expect(goalFitsState(state, "auction_access").fits).toBe(true);
    }
  });
});

describe("state rule data integrity", () => {
  const states = [georgia, florida, northCarolina];

  it("gives every state the shared screening questions plus its own", () => {
    for (const state of states) {
      const ids = state.screening.map((q) => q.id);
      expect(ids, `${state.code} needs the age question`).toContain("age_18");
      expect(ids, `${state.code} needs the criminal-history question`).toContain("criminal_history");
      expect(ids, `${state.code} needs the legal-question box`).toContain("legal_question");
    }
  });

  it("uses unique question ids within each state", () => {
    for (const state of states) {
      const ids = state.screening.map((q) => q.id);
      expect(new Set(ids).size, `${state.code} has duplicate question ids`).toBe(ids.length);
    }
  });

  it("uses unique document ids within each state", () => {
    for (const state of states) {
      const ids = state.documents.map((d) => d.id);
      expect(new Set(ids).size, `${state.code} has duplicate document ids`).toBe(ids.length);
    }
  });

  it("gives every blocking or warning rule a message to show", () => {
    for (const state of states) {
      for (const question of state.screening) {
        if (question.blockIf || question.warnIf || question.referIf) {
          expect(question.message, `${state.code}/${question.id} needs a message`).toBeTruthy();
        }
      }
    }
  });

  it("gives choice questions their options", () => {
    for (const state of states) {
      for (const question of state.screening) {
        if (question.type === "choice") {
          expect(question.options?.length, `${state.code}/${question.id}`).toBeGreaterThan(1);
        }
      }
    }
  });

  it("keeps questionsForState in sync with the state config", () => {
    expect(questionsForState("GA")).toEqual(georgia.screening);
    expect(questionsForState("nc")).toEqual(northCarolina.screening);
    expect(questionsForState("XX")).toEqual([]);
  });

  it("states a bond amount and an office minimum for every state", () => {
    for (const state of states) {
      expect(state.bond.amountCents, `${state.code} bond`).toBeGreaterThan(0);
      expect(state.office.minSqFt, `${state.code} office`).toBeGreaterThan(0);
    }
  });

  it("gives every state at least one official source to re-verify against", () => {
    for (const state of states) {
      expect(state.citations.length, `${state.code} citations`).toBeGreaterThan(0);
    }
  });
});
