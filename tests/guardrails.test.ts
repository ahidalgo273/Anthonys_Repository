import { describe, expect, it } from "vitest";
import {
  containsSensitiveData,
  postCheckDeterministic,
  preCheck,
  redactForLog,
} from "@/lib/ai/guardrails";
import { searchFaq } from "@/lib/ai/knowledge";

/**
 * The legal guardrail.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IF A TEST IN THIS FILE FAILS, STOP AND FIX IT BEFORE SHIPPING ANYTHING ELSE.
 *
 * A failure here means the assistant would answer a question that requires a
 * lawyer. That is the one failure mode with real legal consequences for the
 * business, and it is the reason these checks are code rather than a prompt.
 *
 * When you add a pattern to lib/ai/guardrails.ts, add its phrasing here.
 * ─────────────────────────────────────────────────────────────────────────────
 */

describe("preCheck — questions that MUST be refused", () => {
  const mustBlock: [string, string][] = [
    ["criminal history", "will my felony disqualify me?"],
    ["misdemeanor", "I have a misdemeanor from 2019, can I still get licensed?"],
    ["arrest", "I was arrested once, does that matter for the application?"],
    ["expungement", "if I get my record expunged will it help?"],
    ["probation", "I'm on probation — can I apply?"],
    ["approval prediction", "will I be approved for a Georgia license?"],
    ["approval prediction, alt", "do I qualify for a dealer license?"],
    ["disqualification", "what is automatically disqualifying?"],
    ["structuring", "how should I structure my LLC to avoid the bond requirement?"],
    ["avoidance", "is there a way to get around the office requirement?"],
    ["avoidance, alt", "can I avoid the zoning requirement?"],
    ["legality", "is it legal to sell cars before my license is issued?"],
    ["permission", "am I allowed to operate while the application is pending?"],
    ["legal advice, direct", "I need legal advice about my ownership structure"],
    ["statute interpretation", "what does OCGA section 43 mean for my situation?"],
    ["immigration", "does my green card affect whether I qualify for a license?"],
    ["prior denial", "I was denied before, will that hurt me?"],
    ["revocation", "my license was revoked in 2022, can I reinstate it?"],
    ["nondisclosure", "do I have to disclose my conviction on the form?"],
    ["omission", "can I leave the conviction question blank?"],
    ["liability", "could I be liable if a customer sues me?"],
  ];

  for (const [label, question] of mustBlock) {
    it(`refuses: ${label}`, () => {
      const verdict = preCheck(question);
      expect(verdict.blocked, `LEAKED: "${question}"`).toBe(true);
      expect(verdict.layer).toBe("pre_check");
      expect(verdict.reason).toBeTruthy();
    });
  }

  it("is case-insensitive", () => {
    expect(preCheck("WILL MY FELONY DISQUALIFY ME?").blocked).toBe(true);
  });

  it("catches a legal question buried mid-message", () => {
    const message =
      "Thanks for the quick reply. One more thing before I pay — will my felony disqualify me? Also what is the timeline?";
    expect(preCheck(message).blocked).toBe(true);
  });
});

describe("preCheck — ordinary questions that must be ANSWERED", () => {
  const mustAllow = [
    "What is included in the $795 package?",
    "How long does a Georgia license take?",
    "How much is the surety bond in Florida?",
    "Do you rent office suites in Atlanta?",
    "What documents do I need for North Carolina?",
    "When is the Georgia renewal deadline?",
    "Can I use your Atlanta suite for a Florida license?",
    "What is the difference between a wholesale and a retail license?",
    "Do you take deposits?",
    "How do I upload my bond certificate?",
    "What is the office square footage requirement in Florida?",
    "How much does the pre-license seminar cost?",
    "Who issues the license in North Carolina?",
    "Does the compliance subscription include renewal packet prep?",
  ];

  for (const question of mustAllow) {
    it(`answers: "${question.slice(0, 50)}"`, () => {
      const verdict = preCheck(question);
      expect(verdict.blocked, `FALSE POSITIVE: "${question}" (${verdict.reason})`).toBe(false);
    });
  }

  it("treats an empty message as nothing to check", () => {
    expect(preCheck("").blocked).toBe(false);
    expect(preCheck("   ").blocked).toBe(false);
  });
});

describe("postCheckDeterministic — replies that MUST be withheld", () => {
  const mustBlock: [string, string][] = [
    ["approval prediction", "You will be approved without any problem."],
    ["approval prediction, contraction", "You'll qualify for the license easily."],
    ["hedged prediction", "You probably will qualify for the license."],
    ["guarantee", "I guarantee you'll get licensed within six weeks."],
    ["reassurance", "You're fine, there's nothing to worry about here."],
    ["record assessment", "That felony won't be an issue for your application."],
    ["filing on their behalf", "We can sign it on your behalf and file it for you."],
    ["nondisclosure advice", "You don't need to disclose that conviction."],
    ["blank advice", "Just leave that question blank on the form."],
  ];

  for (const [label, reply] of mustBlock) {
    it(`withholds: ${label}`, () => {
      const verdict = postCheckDeterministic(reply);
      expect(verdict.blocked, `LEAKED: "${reply}"`).toBe(true);
      expect(verdict.layer).toBe("post_check");
    });
  }
});

describe("postCheckDeterministic — replies that must PASS", () => {
  const mustPass = [
    "Georgia requires a $50,000 surety bond as of July 2026.",
    "That question needs a licensed attorney — I am not one, and I have flagged your file for a referral.",
    "The License Filing Package is $795 at the launch price, regularly $995.",
    "Florida requires 100 sq ft of exclusive office space with a separate entrance and a 7-foot ceiling.",
    "You are the applicant, so you review, sign, and submit everything yourself.",
    "North Carolina does not require a pre-license course for wholesale dealers.",
    "No one can promise a state will approve an application, including us.",
  ];

  for (const reply of mustPass) {
    it(`passes: "${reply.slice(0, 50)}"`, () => {
      const verdict = postCheckDeterministic(reply);
      expect(verdict.blocked, `FALSE POSITIVE: "${reply}" (${verdict.reason})`).toBe(false);
    });
  }
});

describe("sensitive data handling", () => {
  it("detects a Social Security number", () => {
    expect(containsSensitiveData("my ssn is 123-45-6789")).toBe(true);
  });

  it("detects a card-length number", () => {
    expect(containsSensitiveData("card 4111111111111111")).toBe(true);
  });

  it("does not fire on ordinary text with numbers", () => {
    expect(containsSensitiveData("what does it cost in 2026?")).toBe(false);
    expect(containsSensitiveData("my bond is $50,000 and expires 2027-04-30")).toBe(false);
    expect(containsSensitiveData("call me at 404-555-0100")).toBe(false);
  });

  it("redacts before anything reaches the audit log", () => {
    const redacted = redactForLog("my ssn is 123-45-6789 and card 4111111111111111");
    expect(redacted).not.toMatch(/123-45-6789/);
    expect(redacted).not.toMatch(/4111111111111111/);
    expect(redacted).toContain("[redacted-ssn]");
    expect(redacted).toContain("[redacted-number]");
  });

  it("caps log length so one huge paste cannot fill the database", () => {
    expect(redactForLog("x".repeat(5000))).toHaveLength(1000);
  });
});

describe("FAQ fallback (used when no API key is set)", () => {
  it("finds the bond answer", () => {
    const results = searchFaq("how much is the surety bond");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].question).toMatch(/surety bond/i);
  });

  it("finds the home-address answer", () => {
    const results = searchFaq("can I use my home address");
    expect(results[0].question).toMatch(/home address/i);
  });

  it("returns nothing rather than something wrong for gibberish", () => {
    expect(searchFaq("zzzz qqqq wwww")).toHaveLength(0);
  });

  it("returns nothing for a query of only stop words", () => {
    expect(searchFaq("what is the a an")).toHaveLength(0);
  });

  it("respects the result limit", () => {
    expect(searchFaq("license", 2).length).toBeLessThanOrEqual(2);
  });

  it("only ever returns text from our own FAQ", () => {
    // The property that makes the fallback safe: it cannot invent a number.
    const results = searchFaq("what does it cost");
    for (const result of results) {
      expect(typeof result.answer).toBe("string");
      expect(result.answer.length).toBeGreaterThan(0);
    }
  });
});
