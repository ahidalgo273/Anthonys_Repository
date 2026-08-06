import { describe, expect, it } from "vitest";
import { georgia, florida } from "@/config/states";
import { assemblePacket } from "@/lib/packet/assemble";
import { toPdfSafe, truncate, wrapText } from "@/lib/packet/text";

/**
 * Packet assembly.
 *
 * The privacy tests matter most: the product promises never to collect a
 * Social Security number, and the packet is where that promise is kept or
 * broken.
 */

const generatedAt = new Date(Date.UTC(2026, 7, 6));

function buildGeorgiaPacket(overrides: Partial<Parameters<typeof assemblePacket>[0]> = {}) {
  return assemblePacket({
    stateCode: "GA",
    applicantName: "Dana Client",
    businessName: "Peachtree Auto Wholesale LLC",
    packetData: {
      applicant_first_name: "Dana",
      applicant_last_name: "Client",
      entity_legal_name: "Peachtree Auto Wholesale LLC",
      ga_bond_amount: 50_000 * 100,
      ga_seminar_date: "2026-07-15",
    },
    documents: [],
    generatedAt,
    ...overrides,
  });
}

describe("assemblePacket", () => {
  it("builds a packet for every state we serve", () => {
    for (const code of ["GA", "FL", "NC"]) {
      const packet = assemblePacket({
        stateCode: code,
        packetData: null,
        documents: [],
        generatedAt,
      });
      expect(packet.sections.length, `${code} sections`).toBeGreaterThan(0);
      expect(packet.checklist.length, `${code} checklist`).toBeGreaterThan(0);
      expect(packet.filingInstructions.length, `${code} instructions`).toBeGreaterThan(0);
    }
  });

  it("throws rather than producing a wrong packet for an unknown state", () => {
    expect(() =>
      assemblePacket({ stateCode: "TX", packetData: null, documents: [], generatedAt }),
    ).toThrow(/unknown state/i);
  });

  it("names the state, license type, and issuing agency on the cover", () => {
    const packet = buildGeorgiaPacket();
    expect(packet.meta.stateName).toBe("Georgia");
    expect(packet.meta.licenseType).toBe(georgia.licenseType);
    expect(packet.meta.agency).toBe(georgia.agency);
    expect(packet.meta.generatedOn).toBe("August 6, 2026");
  });
});

// ── PRIVACY GUARDRAIL ────────────────────────────────────────────────────────

describe("blank-for-client fields (PRIVACY GUARDRAIL)", () => {
  it("leaves the Social Security number blank and lists it for the client", () => {
    const packet = buildGeorgiaPacket();
    const ssn = packet.sections
      .flatMap((section) => section.values)
      .find((value) => value.label.includes("Social Security"));

    expect(ssn).toBeDefined();
    expect(ssn!.blankForClient).toBe(true);
    expect(ssn!.value).toBeNull();
    expect(packet.blanksToComplete).toContain("Social Security number");
  });

  it("leaves the driver's license number blank too", () => {
    const packet = buildGeorgiaPacket();
    expect(packet.blanksToComplete).toContain("Driver's license number");
  });

  it("NEVER prints a value into a blank field, even if one is somehow stored", () => {
    // Defence in depth: the portal refuses to save these, the schema has no
    // column for them, and assembly ignores them anyway.
    const packet = buildGeorgiaPacket({
      packetData: {
        applicant_ssn: "123-45-6789",
        applicant_dl_number: "D1234567",
        applicant_first_name: "Dana",
      },
    });

    const blanks = packet.sections
      .flatMap((section) => section.values)
      .filter((value) => value.blankForClient);

    expect(blanks.length).toBeGreaterThan(0);
    for (const blank of blanks) {
      expect(blank.value, `${blank.label} must stay blank`).toBeNull();
    }

    const printed = JSON.stringify(packet);
    expect(printed).not.toContain("123-45-6789");
    expect(printed).not.toContain("D1234567");
  });

  it("keeps blank fields blank in every state", () => {
    for (const code of ["GA", "FL", "NC"]) {
      const packet = assemblePacket({
        stateCode: code,
        packetData: { applicant_ssn: "999-99-9999" },
        documents: [],
        generatedAt,
      });
      expect(JSON.stringify(packet), `${code} leaked an SSN`).not.toContain("999-99-9999");
      expect(packet.blanksToComplete.length, `${code} blanks`).toBeGreaterThan(0);
    }
  });
});

// ── LEGAL GUARDRAIL ──────────────────────────────────────────────────────────

describe("cover page (LEGAL GUARDRAIL)", () => {
  it("states that this is a draft and the client is the applicant", () => {
    const packet = buildGeorgiaPacket();
    expect(packet.meta.draftNotice).toMatch(/draft/i);
    expect(packet.meta.draftNotice).toMatch(/you are the applicant/i);
    expect(packet.meta.draftNotice).toMatch(/has not been filed/i);
  });

  it("carries the not-a-law-firm disclaimer", () => {
    const packet = buildGeorgiaPacket();
    expect(packet.meta.disclaimer).toMatch(/not a law firm/i);
    expect(packet.meta.disclaimer).toMatch(/legal advice/i);
  });

  it("never claims the packet was filed or approved", () => {
    const packet = buildGeorgiaPacket();
    const cover = `${packet.meta.draftNotice} ${packet.meta.disclaimer}`;
    expect(cover).not.toMatch(/we (have )?(filed|submitted)/i);
    expect(cover).not.toMatch(/approved/i);
  });
});

describe("document checklist", () => {
  it("marks nothing accepted when nothing has been uploaded", () => {
    const packet = buildGeorgiaPacket();
    expect(packet.checklist.every((item) => item.status === "missing")).toBe(true);
  });

  it("maps upload statuses to checklist statuses", () => {
    const packet = buildGeorgiaPacket({
      documents: [
        { requirementId: "surety_bond", status: "ACCEPTED" },
        { requirementId: "ein_letter", status: "NEEDS_REVIEW" },
        { requirementId: "garage_liability", status: "UPLOADED" },
        { requirementId: "lease_or_deed", status: "REJECTED" },
      ],
    });

    const byId = (id: string) =>
      packet.checklist.find((item) => item.label === georgia.documents.find((d) => d.id === id)!.label)!;

    expect(byId("surety_bond").status).toBe("accepted");
    expect(byId("ein_letter").status).toBe("in_review");
    expect(byId("garage_liability").status).toBe("in_review");
    // A rejected document is not "done" — it still needs a new copy.
    expect(byId("lease_or_deed").status).toBe("missing");
  });

  it("includes every required document from the state config", () => {
    const packet = buildGeorgiaPacket();
    for (const requirement of georgia.documents) {
      expect(packet.checklist.some((item) => item.label === requirement.label)).toBe(true);
    }
  });
});

describe("values and formatting", () => {
  it("shows an em dash for a missing value rather than 'undefined'", () => {
    const packet = buildGeorgiaPacket({ packetData: {} });
    const values = packet.sections.flatMap((section) => section.values);

    expect(values.filter((v) => !v.blankForClient && v.value === "—").length).toBeGreaterThan(0);
    expect(JSON.stringify(packet)).not.toContain("undefined");

    // A null value is only ever legitimate on a blank-for-client field.
    for (const value of values) {
      if (value.value === null) {
        expect(value.blankForClient, `${value.label} is null but not a blank field`).toBe(true);
      }
    }
  });

  it("formats a money field from cents", () => {
    const packet = buildGeorgiaPacket();
    const bond = packet.sections
      .flatMap((section) => section.values)
      .find((value) => value.label === "Surety bond amount");
    expect(bond?.value).toBe("$50,000");
  });

  it("formats a date field as a readable date", () => {
    const packet = buildGeorgiaPacket();
    const seminar = packet.sections
      .flatMap((section) => section.values)
      .find((value) => value.label.includes("seminar"));
    expect(seminar?.value).toBe("July 15, 2026");
  });

  it("includes the bond in the cost summary at the state's amount", () => {
    const packet = buildGeorgiaPacket();
    const bond = packet.costSummary.find((cost) => cost.label === "Surety bond");
    expect(bond?.amount).toBe("$50,000");

    const flPacket = assemblePacket({
      stateCode: "FL",
      packetData: null,
      documents: [],
      generatedAt,
    });
    expect(flPacket.costSummary.find((c) => c.label === "Surety bond")?.amount).toBe("$25,000");
  });

  it("builds the inspection checklist from the state's own office rules", () => {
    const packet = assemblePacket({
      stateCode: "FL",
      packetData: null,
      documents: [],
      generatedAt,
    });

    for (const requirement of florida.office.requirements) {
      expect(packet.inspectionChecklist.some((item) => item.includes(requirement))).toBe(true);
    }
    expect(packet.inspectionChecklist.some((item) => item.includes("100 sq ft"))).toBe(true);
  });

  it("numbers the filing instructions from one, in order", () => {
    const packet = buildGeorgiaPacket();
    expect(packet.filingInstructions.map((step) => step.step)).toEqual(
      georgia.filingSteps.map((_, index) => index + 1),
    );
  });

  it("produces identical output for identical input", () => {
    // Determinism is what lets us regenerate a packet without surprising anyone.
    expect(JSON.stringify(buildGeorgiaPacket())).toBe(JSON.stringify(buildGeorgiaPacket()));
  });
});

describe("PDF text safety", () => {
  it("replaces characters the PDF fonts cannot encode instead of throwing", () => {
    // pdf-lib's standard fonts throw on non-WinAnsi input, which would mean a
    // business name with an emoji crashes packet generation.
    expect(toPdfSafe("Ace Motors 🚗 LLC")).toBe("Ace Motors ? LLC");
    expect(toPdfSafe("日本語")).toBe("???");
  });

  it("keeps accented Latin characters, which are perfectly printable", () => {
    expect(toPdfSafe("María Ángeles O'Brien")).toContain("María Ángeles");
  });

  it("normalizes smart quotes and dashes pasted from a word processor", () => {
    expect(toPdfSafe("“quoted” and ‘single’")).toBe('"quoted" and \'single\'');
    expect(toPdfSafe("range 1–2")).toBe("range 1-2");
    expect(toPdfSafe("wait…")).toBe("wait...");
  });

  it("wraps text to a width", () => {
    const font = fakeFont();
    const lines = wrapText("one two three four five six", font, 10, 100);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(font.widthOfTextAtSize(line, 10)).toBeLessThanOrEqual(100);
    }
  });

  it("breaks a single unbroken word rather than running off the page", () => {
    const font = fakeFont();
    const lines = wrapText("A".repeat(60), font, 10, 100);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(font.widthOfTextAtSize(line, 10)).toBeLessThanOrEqual(100);
    }
  });

  it("preserves explicit line breaks", () => {
    expect(wrapText("line one\nline two", fakeFont(), 10, 1000)).toEqual(["line one", "line two"]);
  });

  it("returns a single empty line for empty input", () => {
    expect(wrapText("", fakeFont(), 10, 100)).toEqual([""]);
  });

  it("truncates with an ellipsis when text does not fit", () => {
    const font = fakeFont();
    const result = truncate("a very long label that will not fit", font, 10, 50);
    expect(result.endsWith("...")).toBe(true);
    expect(font.widthOfTextAtSize(result, 10)).toBeLessThanOrEqual(50);
  });

  it("leaves short text alone", () => {
    expect(truncate("short", fakeFont(), 10, 1000)).toBe("short");
  });
});

/** A stand-in for a PDF font: 5 points per character at size 10. */
function fakeFont() {
  return {
    widthOfTextAtSize: (text: string, size: number) => text.length * size * 0.5,
  } as unknown as Parameters<typeof wrapText>[1];
}
