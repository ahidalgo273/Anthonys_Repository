import { describe, expect, it } from "vitest";
import {
  addOns,
  dueTodayCents,
  effectivePriceCents,
  formatPrice,
  formatUsd,
  getProduct,
  packages,
  priceLabel,
  products,
} from "@/config/pricing";
import { checkDocument } from "@/lib/documents/checks";
import { escapeCsvValue, toCsv } from "@/lib/csv";
import { georgia } from "@/config/states";

describe("pricing", () => {
  it("publishes the prices the business committed to", () => {
    // These are the figures on the website. If one changes, this test should
    // fail and make you confirm the change was deliberate.
    expect(getProduct("license_filing")?.priceCents).toBe(99500);
    expect(getProduct("license_filing")?.launchPriceCents).toBe(79500);
    expect(getProduct("compliance")?.priceCents).toBe(5900);
    expect(getProduct("suite_bundle")?.priceCents).toBe(54900);
    expect(getProduct("suite_bundle")?.setupFeeCents).toBe(99500);
    expect(getProduct("addon_llc_ein")?.priceCents).toBe(19900);
    expect(getProduct("addon_photo_review")?.priceCents).toBe(9900);
    expect(getProduct("addon_occupation_tax")?.priceCents).toBe(14900);
  });

  it("charges the launch price when one is running", () => {
    expect(effectivePriceCents(getProduct("license_filing")!)).toBe(79500);
    expect(effectivePriceCents(getProduct("compliance")!)).toBe(5900);
  });

  it("adds the setup fee to what is due today", () => {
    expect(dueTodayCents(getProduct("suite_bundle")!)).toBe(54900 + 99500);
    expect(dueTodayCents(getProduct("compliance")!)).toBe(5900);
    expect(dueTodayCents(getProduct("license_filing")!)).toBe(79500);
  });

  it("formats money without stray cents on whole dollars", () => {
    expect(formatUsd(99500)).toBe("$995");
    expect(formatUsd(5900)).toBe("$59");
    expect(formatUsd(50_000 * 100)).toBe("$50,000");
    expect(formatUsd(11550)).toBe("$115.50");
    expect(formatUsd(0)).toBe("$0");
  });

  it("formats a price with its billing period", () => {
    expect(formatPrice(5900, "monthly")).toBe("$59/month");
    expect(formatPrice(14900, "yearly")).toBe("$149/year");
    expect(formatPrice(99500, "one_time")).toBe("$995 one-time");
  });

  it("shows the setup fee in the bundle's price label", () => {
    expect(priceLabel(getProduct("suite_bundle")!)).toBe("$549/month + $995 setup");
    expect(priceLabel(getProduct("compliance")!)).toBe("$59/month");
  });

  it("splits products into packages and add-ons with no overlap", () => {
    expect(packages.length + addOns.length).toBe(products.length);
    expect(packages.some((p) => addOns.includes(p))).toBe(false);
  });

  it("gives every product a unique id and a Stripe price variable", () => {
    const ids = products.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const product of products) {
      expect(product.stripePriceEnv, `${product.id}`).toMatch(/^STRIPE_PRICE_/);
      expect(product.includes.length, `${product.id} needs bullet points`).toBeGreaterThan(0);
    }
  });

  it("gives a product with a setup fee a setup price variable too", () => {
    for (const product of products) {
      if (product.setupFeeCents) {
        expect(product.stripeSetupPriceEnv, `${product.id}`).toBeTruthy();
      }
    }
  });

  it("never sets a launch price above the regular price", () => {
    for (const product of products) {
      if (product.launchPriceCents !== undefined) {
        expect(product.launchPriceCents).toBeLessThan(product.priceCents);
      }
    }
  });

  it("returns undefined for an unknown product instead of throwing", () => {
    expect(getProduct("nope")).toBeUndefined();
  });
});

describe("CSV export", () => {
  it("quotes fields containing a comma, quote, or newline", () => {
    expect(escapeCsvValue("Smith, John")).toBe('"Smith, John"');
    expect(escapeCsvValue('He said "hi"')).toBe('"He said ""hi"""');
    expect(escapeCsvValue("line1\nline2")).toBe('"line1\nline2"');
  });

  it("leaves plain values alone", () => {
    expect(escapeCsvValue("simple")).toBe("simple");
    expect(escapeCsvValue(42)).toBe("42");
  });

  it("neutralizes formula injection", () => {
    // Excel and Sheets execute a leading =, +, -, or @ as a formula.
    expect(escapeCsvValue("=SUM(A1:A9)")).toBe("\t=SUM(A1:A9)");
    expect(escapeCsvValue("+1234")).toBe("\t+1234");
    expect(escapeCsvValue("-cmd")).toBe("\t-cmd");
    expect(escapeCsvValue("@import")).toBe("\t@import");
  });

  it("quotes a value that is both a formula and contains a comma", () => {
    expect(escapeCsvValue("=A1,B2")).toBe('"\t=A1,B2"');
  });

  it("renders empty for null and undefined, not the words", () => {
    expect(escapeCsvValue(null)).toBe("");
    expect(escapeCsvValue(undefined)).toBe("");
  });

  it("renders booleans as yes/no and dates as ISO", () => {
    expect(escapeCsvValue(true)).toBe("yes");
    expect(escapeCsvValue(false)).toBe("no");
    expect(escapeCsvValue(new Date(Date.UTC(2026, 7, 6)))).toBe("2026-08-06T00:00:00.000Z");
  });

  it("builds a full CSV with a BOM and CRLF line endings", () => {
    const csv = toCsv(
      [
        { name: "Ann", state: "GA" },
        { name: "Bo, Jr", state: "FL" },
      ],
      [
        { header: "Name", value: (r) => r.name },
        { header: "State", value: (r) => r.state },
      ],
    );

    expect(csv.startsWith("﻿")).toBe(true); // Excel reads UTF-8 correctly
    expect(csv).toContain("\r\n");
    expect(csv).toContain('"Bo, Jr"');
  });

  it("emits just a header row for an empty table", () => {
    const csv = toCsv([], [{ header: "Name", value: () => "" }]);
    expect(csv).toBe("﻿Name\r\n");
  });
});

// ── QUALITY GUARDRAIL ────────────────────────────────────────────────────────

describe("document checks (QUALITY GUARDRAIL)", () => {
  const bond = georgia.documents.find((d) => d.id === "surety_bond")!;
  const today = new Date(Date.UTC(2026, 7, 6));

  it("NEVER auto-approves, even when every check passes", () => {
    const result = checkDocument({
      requirement: bond,
      amountCents: 50_000 * 100,
      expiresAt: new Date(Date.UTC(2027, 7, 6)),
      sizeBytes: 500_000,
      mimeType: "application/pdf",
      today,
    });

    expect(result.autoApproved).toBe(false);
    expect(result.findings.every((f) => f.severity !== "error")).toBe(true);
  });

  it("flags a bond written below the state minimum as an error", () => {
    const result = checkDocument({
      requirement: bond,
      amountCents: 25_000 * 100, // Florida's amount, in a Georgia file
      expiresAt: new Date(Date.UTC(2027, 7, 6)),
      sizeBytes: 500_000,
      mimeType: "application/pdf",
      today,
    });

    const errors = result.findings.filter((f) => f.severity === "error");
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/\$50,000/);
  });

  it("flags an already-expired document", () => {
    const result = checkDocument({
      requirement: bond,
      amountCents: 50_000 * 100,
      expiresAt: new Date(Date.UTC(2026, 0, 1)),
      sizeBytes: 500_000,
      mimeType: "application/pdf",
      today,
    });

    expect(result.findings.some((f) => f.severity === "error" && /expired/i.test(f.message))).toBe(
      true,
    );
  });

  it("warns when a document expires during a pending application", () => {
    const result = checkDocument({
      requirement: bond,
      amountCents: 50_000 * 100,
      expiresAt: new Date(Date.UTC(2026, 8, 15)), // ~40 days
      sizeBytes: 500_000,
      mimeType: "application/pdf",
      today,
    });

    expect(result.findings.some((f) => f.severity === "warning" && /expires in/i.test(f.message))).toBe(
      true,
    );
  });

  it("asks for the amount when the client did not enter one", () => {
    const result = checkDocument({
      requirement: bond,
      amountCents: null,
      expiresAt: null,
      sizeBytes: 500_000,
      mimeType: "application/pdf",
      today,
    });

    expect(result.findings.filter((f) => f.severity === "warning").length).toBeGreaterThanOrEqual(2);
  });

  it("warns about a suspiciously small file", () => {
    const result = checkDocument({
      requirement: bond,
      amountCents: 50_000 * 100,
      expiresAt: new Date(Date.UTC(2027, 7, 6)),
      sizeBytes: 2_000,
      mimeType: "application/pdf",
      today,
    });

    expect(result.findings.some((f) => /very small/i.test(f.message))).toBe(true);
  });

  it("skips amount checks for documents that have no amount rule", () => {
    const photos = georgia.documents.find((d) => d.id === "location_photos")!;
    const result = checkDocument({
      requirement: photos,
      amountCents: null,
      expiresAt: null,
      sizeBytes: 500_000,
      mimeType: "image/jpeg",
      today,
    });

    expect(result.findings.some((f) => /minimum/i.test(f.message))).toBe(false);
    expect(result.autoApproved).toBe(false);
  });
});
