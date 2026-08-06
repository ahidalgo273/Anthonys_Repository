import type { DocumentRequirement } from "@/config/states";
import { formatUsd } from "@/config/pricing";
import { checkDocument, type CheckFinding, type CheckResult } from "@/lib/documents/checks";
import { completeWithImage, isAiConfigured } from "./client";

/**
 * Document completeness checks, with an optional AI pass.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUALITY GUARDRAIL: THIS NEVER APPROVES A DOCUMENT.
 *
 * The deterministic checks in lib/documents/checks.ts always run. When an API
 * key is present AND the upload is an image, we additionally ask the model
 * whether the photo is legible and looks like the right kind of document.
 *
 * The model's opinion is advisory only. `autoApproved` is hard-coded false, the
 * document always lands in NEEDS_REVIEW, and only an admin can accept it. The
 * AI is here to catch a blurry photo before a human wastes time on it — not to
 * make the decision.
 *
 * We do NOT ask the model to read values off the document and compare them to
 * legal minimums. Numbers the client typed in are checked deterministically,
 * because a hallucinated bond amount that says "looks fine" is worse than no
 * check at all.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const VISION_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type VisionMimeType = (typeof VISION_MIME_TYPES)[number];

const VISION_SYSTEM_PROMPT = `You review photographs of documents uploaded to a dealer-license paperwork service. You are checking IMAGE QUALITY and DOCUMENT TYPE only.

Report on:
- Is the whole document in frame, or are edges/corners cut off?
- Is the text legible, or is it blurry, glared, shadowed, or too small?
- Does it appear to be the type of document expected?
- Is anything obviously missing, such as a signature line left blank or a seal that is not visible?

Rules:
- Do NOT state whether the document is acceptable, approved, or sufficient. A person decides that.
- Do NOT give legal advice or say whether it satisfies a legal requirement.
- Do NOT read out or repeat any Social Security number, driver's license number, or account number you can see. If one is visible, just say that sensitive data is visible.
- If you cannot tell, say so.

Reply with ONLY a JSON object, no other text:
{"legible": true|false, "complete": true|false, "matchesExpectedType": true|false|null, "notes": ["short observation", ...]}`;

export async function checkDocumentWithAi({
  requirement,
  amountCents,
  expiresAt,
  sizeBytes,
  mimeType,
  fileData,
  today = new Date(),
}: {
  requirement: DocumentRequirement;
  amountCents: number | null;
  expiresAt: Date | null;
  sizeBytes: number;
  mimeType: string;
  fileData?: Buffer | null;
  today?: Date;
}): Promise<CheckResult> {
  // The deterministic pass always runs and is always the foundation.
  const base = checkDocument({
    requirement,
    amountCents,
    expiresAt,
    sizeBytes,
    mimeType,
    today,
  });

  const canUseVision =
    isAiConfigured() &&
    Boolean(fileData) &&
    (VISION_MIME_TYPES as readonly string[]).includes(mimeType);

  if (!canUseVision) {
    return base;
  }

  const prompt = [
    `Expected document: ${requirement.label}.`,
    `What it should be: ${requirement.description}`,
    requirement.checks?.minAmountCents
      ? `Note: this type of document usually shows an amount of at least ${formatUsd(requirement.checks.minAmountCents)}, but do NOT judge whether the amount is correct — just report whether an amount is legible.`
      : "",
    "Review the image quality and whether it appears to be this type of document.",
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await completeWithImage({
    system: VISION_SYSTEM_PROMPT,
    prompt,
    imageBase64: fileData!.toString("base64"),
    mediaType: mimeType as VisionMimeType,
  });

  if (!raw) {
    // AI unavailable — the deterministic result stands. Nothing is broken.
    return { ...base, method: "deterministic (AI check unavailable)" };
  }

  const aiFindings = parseVisionFindings(raw);

  return {
    ...base,
    findings: [...base.findings, ...aiFindings],
    // Still false. An AI pass changes nothing about who approves a document.
    autoApproved: false,
    method: "deterministic + AI image review",
  };
}

function parseVisionFindings(raw: string): CheckFinding[] {
  try {
    const match = /\{[\s\S]*\}/.exec(raw);
    if (!match) throw new Error("No JSON object in the reply.");

    const parsed = JSON.parse(match[0]) as {
      legible?: unknown;
      complete?: unknown;
      matchesExpectedType?: unknown;
      notes?: unknown;
    };

    const findings: CheckFinding[] = [];

    if (parsed.legible === false) {
      findings.push({
        severity: "warning",
        message:
          "The photo looks hard to read. Reviewers reject illegible documents, so it is worth retaking before we send it on.",
      });
    }

    if (parsed.complete === false) {
      findings.push({
        severity: "warning",
        message:
          "Part of the document appears to be cut off. Make sure all four corners are in frame.",
      });
    }

    if (parsed.matchesExpectedType === false) {
      findings.push({
        severity: "warning",
        message:
          "This may not be the document type we expected here. Worth double-checking you uploaded it against the right checklist item.",
      });
    }

    if (Array.isArray(parsed.notes)) {
      for (const note of parsed.notes.slice(0, 5)) {
        if (typeof note === "string" && note.trim().length > 0) {
          findings.push({ severity: "info", message: `Image review: ${note.trim().slice(0, 300)}` });
        }
      }
    }

    return findings;
  } catch (error) {
    console.error("[ai] Could not parse the document review reply:", error);
    return [
      {
        severity: "info",
        message: "An automated image review ran but returned nothing readable. A person will review this.",
      },
    ];
  }
}
