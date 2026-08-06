import { site } from "@/config/site";

/**
 * The not-a-law-firm disclaimer.
 *
 * LEGAL GUARDRAIL: this must appear on every page of the site. Every footer
 * (marketing, portal, and admin) renders it, so adding a new page section means
 * using one of those footers — do not build a page without one.
 */
export function LegalDisclaimer({ variant = "full" }: { variant?: "full" | "short" }) {
  return (
    <p
      className="text-[0.8125rem] leading-relaxed"
      style={{ color: "var(--text-muted)" }}
      data-testid="legal-disclaimer"
    >
      <strong style={{ color: "var(--text)" }}>Not a law firm. </strong>
      {variant === "full" ? site.disclaimer : site.disclaimerShort}
    </p>
  );
}
