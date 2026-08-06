import type { DocumentRequirement } from "@/config/states";
import { formatUsd } from "@/config/pricing";

/**
 * Deterministic document completeness checks.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUALITY GUARDRAIL: NOTHING HERE APPROVES A DOCUMENT.
 *
 * These checks produce findings for a human to act on. Every upload lands in
 * NEEDS_REVIEW regardless of what this returns — a clean result means "nothing
 * obviously wrong", not "accepted". Only an admin marks a document accepted.
 *
 * Phase 5 adds an AI pass on top of this. This layer stays the fallback that
 * runs when there is no API key, so document review never depends on an
 * external service being up.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type CheckSeverity = "error" | "warning" | "info";

export type CheckFinding = {
  severity: CheckSeverity;
  message: string;
};

export type CheckResult = {
  findings: CheckFinding[];
  /** Always false. Present so callers cannot mistake a clean result for approval. */
  autoApproved: false;
  checkedAt: string;
  /** "deterministic" here; Phase 5 adds "deterministic+ai". */
  method: string;
};

export function checkDocument({
  requirement,
  amountCents,
  expiresAt,
  sizeBytes,
  mimeType,
  today,
}: {
  requirement: DocumentRequirement;
  amountCents: number | null;
  expiresAt: Date | null;
  sizeBytes: number;
  mimeType: string;
  today: Date;
}): CheckResult {
  const findings: CheckFinding[] = [];
  const checks = requirement.checks;

  // Amount, e.g. a bond written below the state minimum.
  if (checks?.minAmountCents !== undefined) {
    if (amountCents === null) {
      findings.push({
        severity: "warning",
        message: `Tell us the amount on this document so we can check it against the ${formatUsd(checks.minAmountCents)} minimum.`,
      });
    } else if (amountCents < checks.minAmountCents) {
      findings.push({
        severity: "error",
        message: `This shows ${formatUsd(amountCents)}, but the state requires at least ${formatUsd(checks.minAmountCents)}. A bond written for the wrong amount is one of the most common rejection causes — check with your provider before filing.`,
      });
    } else {
      findings.push({
        severity: "info",
        message: `Amount meets the ${formatUsd(checks.minAmountCents)} minimum.`,
      });
    }
  }

  // Expiry.
  if (checks?.mustNotBeExpired) {
    if (expiresAt === null) {
      findings.push({
        severity: "warning",
        message: "Tell us the expiration date so we can track it on your compliance calendar.",
      });
    } else if (expiresAt.getTime() <= today.getTime()) {
      findings.push({
        severity: "error",
        message: "This document has already expired. The state will reject an expired certificate.",
      });
    } else {
      const daysLeft = Math.round(
        (expiresAt.getTime() - today.getTime()) / 86_400_000,
      );
      if (daysLeft < 60) {
        findings.push({
          severity: "warning",
          message: `This expires in ${daysLeft} days. If your application is still pending then, you will need a renewed copy.`,
        });
      } else {
        findings.push({ severity: "info", message: "Expiration date is comfortably in the future." });
      }
    }
  }

  // A file too small to be a real scan is almost always a mistake.
  if (sizeBytes < 10 * 1024) {
    findings.push({
      severity: "warning",
      message: "This file is very small. Please check it is the full document and is readable.",
    });
  }

  if (mimeType.startsWith("image/")) {
    findings.push({
      severity: "info",
      message:
        "Photo received. Make sure every corner of the document is in frame and the text is legible — reviewers reject blurry scans.",
    });
  }

  return {
    findings,
    autoApproved: false,
    checkedAt: today.toISOString(),
    method: "deterministic",
  };
}

/** Findings that should stop a document being accepted without a conversation. */
export function blockingFindings(result: CheckResult | null | undefined): CheckFinding[] {
  return (result?.findings ?? []).filter((f) => f.severity === "error");
}
