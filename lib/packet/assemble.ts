import { site } from "@/config/site";
import { getState, type StateRules } from "@/config/states";
import { formatUsd } from "@/config/pricing";

/**
 * Building the packet's content model.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * This step is pure: application data in, a structured document out. No PDF
 * library, no database, no clock beyond what is passed in. The renderer turns
 * this model into pages, which means the interesting logic — what goes in the
 * packet, which fields stay blank, what the instructions say — is testable
 * without parsing a PDF.
 *
 * LEGAL GUARDRAIL: this produces a DRAFT for the client to review and sign.
 * `blank_for_client` fields are printed as empty labeled lines. We never fill
 * in a Social Security number or driver's license number because we never
 * collect one.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type PacketValue = {
  label: string;
  /** The value we have, or null when the client must write it in by hand. */
  value: string | null;
  /** True for fields we deliberately leave blank. Rendered as a ruled line. */
  blankForClient: boolean;
  hint?: string;
};

export type PacketSection = {
  title: string;
  note?: string;
  values: PacketValue[];
};

export type PacketChecklistItem = {
  label: string;
  description: string;
  required: boolean;
  source: string;
  /** Whether the client has uploaded and we have accepted it. */
  status: "accepted" | "in_review" | "missing";
};

export type PacketDocument = {
  /** Cover page details. */
  meta: {
    title: string;
    stateName: string;
    licenseType: string;
    agency: string;
    applicantName: string;
    businessName: string | null;
    generatedOn: string;
    disclaimer: string;
    /** The one-line summary of what this document is and is not. */
    draftNotice: string;
  };
  sections: PacketSection[];
  checklist: PacketChecklistItem[];
  filingInstructions: { step: number; title: string; detail: string; timing?: string }[];
  inspectionChecklist: string[];
  costSummary: { label: string; amount: string; note?: string }[];
  /** Fields the client still has to complete by hand, summarized on the cover. */
  blanksToComplete: string[];
};

export type AssembleInput = {
  stateCode: string;
  packetData: Record<string, unknown> | null;
  applicantName?: string | null;
  businessName?: string | null;
  documents: { requirementId: string; status: string }[];
  /** Passed in rather than read from the clock, so output is reproducible in tests. */
  generatedAt: Date;
};

export function assemblePacket(input: AssembleInput): PacketDocument {
  const state = getState(input.stateCode);
  if (!state) throw new Error(`Cannot build a packet for unknown state "${input.stateCode}".`);

  const data = input.packetData ?? {};
  const blanksToComplete: string[] = [];

  const sections: PacketSection[] = state.packetFieldGroups.map((group) => ({
    title: group.title,
    note: group.note,
    values: group.fields.map((field) => {
      if (field.type === "blank_for_client") {
        blanksToComplete.push(field.label);
        return {
          label: field.label,
          value: null,
          blankForClient: true,
          hint: field.hint,
        };
      }

      const raw = data[field.id];
      return {
        label: field.label,
        value: formatValue(raw, field.type),
        blankForClient: false,
        hint: field.hint,
      };
    }),
  }));

  const documentStatuses = new Map(input.documents.map((doc) => [doc.requirementId, doc.status]));

  const checklist: PacketChecklistItem[] = state.documents.map((requirement) => ({
    label: requirement.label,
    description: requirement.description,
    required: requirement.required,
    source: requirement.source,
    status: mapDocumentStatus(documentStatuses.get(requirement.id)),
  }));

  return {
    meta: {
      title: `${state.name} ${state.licenseType} — Prepared Application Data Packet`,
      stateName: state.name,
      licenseType: state.licenseType,
      agency: state.agency,
      applicantName: input.applicantName?.trim() || "—",
      businessName: input.businessName?.trim() || null,
      generatedOn: formatDate(input.generatedAt),
      disclaimer: site.disclaimer,
      draftNotice:
        "This is a prepared DRAFT for your review. It is not an application, and it has not been filed. You are the applicant: review every field, complete the blanks marked for you, sign, and submit it yourself.",
    },
    sections,
    checklist,
    filingInstructions: state.filingSteps.map((step, index) => ({
      step: index + 1,
      title: step.title,
      detail: step.detail,
      timing: step.timing,
    })),
    inspectionChecklist: buildInspectionChecklist(state),
    costSummary: buildCostSummary(state),
    blanksToComplete,
  };
}

/**
 * What an inspector looks at, drawn from the state's own office rules so it
 * stays accurate when those rules change.
 */
function buildInspectionChecklist(state: StateRules): string[] {
  return [
    ...state.office.requirements.map(
      (requirement) => `${requirement} — photograph this and check it before the inspection.`,
    ),
    "Photograph the exterior of the building, including the street number.",
    "Photograph your sign straight on, close enough to read every letter.",
    "Photograph the office interior from the doorway, showing the whole room.",
    "Photograph your desk, filing storage, and business records on site.",
    "Have your posted business hours visible in at least one photo.",
    `Confirm your office measures at least ${state.office.minSqFt} sq ft and keep the measurements handy.`,
  ];
}

function buildCostSummary(state: StateRules): { label: string; amount: string; note?: string }[] {
  return [
    ...state.fees.map((fee) => ({
      label: fee.label,
      amount:
        fee.amountCents > 0
          ? `${fee.approximate ? "~" : ""}${formatUsd(fee.amountCents)}`
          : "Varies",
      note: fee.note,
    })),
    {
      label: "Surety bond",
      amount: formatUsd(state.bond.amountCents),
      note: "Bond amount, not your premium. You pay an annual premium to the bond company.",
    },
  ];
}

function mapDocumentStatus(status: string | undefined): PacketChecklistItem["status"] {
  if (status === "ACCEPTED") return "accepted";
  if (status === "UPLOADED" || status === "NEEDS_REVIEW") return "in_review";
  return "missing";
}

/** Present a stored value for print. Missing values become an em dash, never "undefined". */
function formatValue(raw: unknown, type: string): string | null {
  if (raw === null || raw === undefined || raw === "") return "—";

  if (type === "money" && typeof raw === "number") return formatUsd(raw);

  if (type === "date") {
    const date = new Date(String(raw));
    if (!Number.isNaN(date.getTime())) return formatDate(date);
  }

  return String(raw);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
