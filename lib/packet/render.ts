import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { site } from "@/config/site";
import type { PacketDocument } from "./assemble";
import { toPdfSafeLine, truncate, wrapText } from "./text";

/**
 * Turning a packet model into a printable PDF.
 *
 * Uses the standard PDF fonts, so there are no font files to ship and the
 * output is small. Layout is deliberately plain — this is a document someone
 * prints, writes on, and hands to a government office.
 */

const PAGE_WIDTH = 612; // US Letter at 72 dpi
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const INK = rgb(0.08, 0.12, 0.18);
const MUTED = rgb(0.38, 0.43, 0.5);
const RULE = rgb(0.78, 0.81, 0.85);
const ACCENT = rgb(0.55, 0.28, 0.02);
const WARN_BG = rgb(0.996, 0.953, 0.78);

type Fonts = { regular: PDFFont; bold: PDFFont };

/** A cursor that adds pages as content overflows. */
class Layout {
  page: PDFPage;
  y: number;

  constructor(
    private doc: PDFDocument,
    private fonts: Fonts,
    private footerText: string,
  ) {
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
    this.drawFooter();
  }

  /** Ensure `needed` points of vertical space remain, starting a page if not. */
  ensure(needed: number): void {
    if (this.y - needed >= MARGIN + 28) return;
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
    this.drawFooter();
  }

  private drawFooter(): void {
    this.page.drawLine({
      start: { x: MARGIN, y: MARGIN + 18 },
      end: { x: PAGE_WIDTH - MARGIN, y: MARGIN + 18 },
      thickness: 0.5,
      color: RULE,
    });
    this.page.drawText(toPdfSafeLine(this.footerText), {
      x: MARGIN,
      y: MARGIN + 6,
      size: 7,
      font: this.fonts.regular,
      color: MUTED,
      maxWidth: CONTENT_WIDTH,
    });
  }

  text(
    content: string,
    {
      size = 10,
      bold = false,
      color = INK,
      indent = 0,
      lineGap = 3,
      maxWidth = CONTENT_WIDTH,
    }: {
      size?: number;
      bold?: boolean;
      color?: ReturnType<typeof rgb>;
      indent?: number;
      lineGap?: number;
      maxWidth?: number;
    } = {},
  ): void {
    const font = bold ? this.fonts.bold : this.fonts.regular;
    const lines = wrapText(content, font, size, maxWidth - indent);

    for (const line of lines) {
      this.ensure(size + lineGap);
      this.page.drawText(line, {
        x: MARGIN + indent,
        y: this.y - size,
        size,
        font,
        color,
      });
      this.y -= size + lineGap;
    }
  }

  gap(points: number): void {
    this.y -= points;
  }

  rule(): void {
    this.ensure(10);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.5,
      color: RULE,
    });
    this.y -= 10;
  }

  heading(text: string): void {
    this.ensure(40);
    this.gap(8);
    this.text(text, { size: 14, bold: true });
    this.rule();
  }

  /** A labeled value. When `blank`, draws a ruled line for the client to write on. */
  labeledValue(label: string, value: string | null, blank: boolean, hint?: string): void {
    const labelWidth = 190;
    this.ensure(blank ? 34 : 24);

    this.page.drawText(truncate(label, this.fonts.bold, 9, labelWidth - 8), {
      x: MARGIN,
      y: this.y - 9,
      size: 9,
      font: this.fonts.bold,
      color: MUTED,
    });

    if (blank) {
      // An empty ruled line: this is the field the client completes by hand.
      this.page.drawLine({
        start: { x: MARGIN + labelWidth, y: this.y - 11 },
        end: { x: PAGE_WIDTH - MARGIN, y: this.y - 11 },
        thickness: 0.75,
        color: INK,
      });
      this.y -= 16;
      if (hint) {
        this.text(hint, { size: 7.5, color: ACCENT, indent: labelWidth });
      }
      this.y -= 4;
      return;
    }

    const lines = wrapText(value ?? "—", this.fonts.regular, 10, CONTENT_WIDTH - labelWidth);
    let offset = 0;
    for (const line of lines) {
      this.page.drawText(line, {
        x: MARGIN + labelWidth,
        y: this.y - 9 - offset,
        size: 10,
        font: this.fonts.regular,
        color: INK,
      });
      offset += 13;
    }
    this.y -= Math.max(20, offset + 7);
  }

  /** A filled callout box, used for the draft notice and the disclaimer. */
  calloutBox(title: string, body: string): void {
    const bodyLines = wrapText(body, this.fonts.regular, 9, CONTENT_WIDTH - 24);
    const boxHeight = 26 + bodyLines.length * 12;
    this.ensure(boxHeight + 12);

    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - boxHeight,
      width: CONTENT_WIDTH,
      height: boxHeight,
      color: WARN_BG,
      borderColor: ACCENT,
      borderWidth: 1,
    });

    this.page.drawText(toPdfSafeLine(title), {
      x: MARGIN + 12,
      y: this.y - 18,
      size: 10,
      font: this.fonts.bold,
      color: ACCENT,
    });

    let offset = 32;
    for (const line of bodyLines) {
      this.page.drawText(line, {
        x: MARGIN + 12,
        y: this.y - offset,
        size: 9,
        font: this.fonts.regular,
        color: INK,
      });
      offset += 12;
    }

    this.y -= boxHeight + 12;
  }

  /** A checkbox line the client can tick with a pen. */
  checkbox(label: string, checked: boolean, detail?: string): void {
    this.ensure(detail ? 32 : 20);

    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - 11,
      width: 9,
      height: 9,
      borderColor: INK,
      borderWidth: 0.75,
    });

    if (checked) {
      this.page.drawText("X", {
        x: MARGIN + 2,
        y: this.y - 10,
        size: 8,
        font: this.fonts.bold,
        color: INK,
      });
    }

    const labelLines = wrapText(label, this.fonts.bold, 9.5, CONTENT_WIDTH - 18);
    let offset = 9;
    for (const line of labelLines) {
      this.page.drawText(line, {
        x: MARGIN + 16,
        y: this.y - offset,
        size: 9.5,
        font: this.fonts.bold,
        color: INK,
      });
      offset += 12;
    }

    if (detail) {
      for (const line of wrapText(detail, this.fonts.regular, 8.5, CONTENT_WIDTH - 18)) {
        this.page.drawText(line, {
          x: MARGIN + 16,
          y: this.y - offset,
          size: 8.5,
          font: this.fonts.regular,
          color: MUTED,
        });
        offset += 10.5;
      }
    }

    this.y -= offset + 5;
  }
}

export async function renderPacketPdf(packet: PacketDocument): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(packet.meta.title);
  doc.setAuthor(site.name);
  doc.setSubject(`Prepared application data packet — ${packet.meta.stateName}`);
  doc.setCreator(site.name);

  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  const layout = new Layout(
    doc,
    fonts,
    `${site.name} — not a law firm, not legal advice. Draft for client review and signature. Generated ${packet.meta.generatedOn}.`,
  );

  // ── Cover ──────────────────────────────────────────────────────────────────
  layout.text(site.name, { size: 11, bold: true, color: ACCENT });
  layout.gap(4);
  layout.text(packet.meta.title, { size: 20, bold: true, lineGap: 6 });
  layout.gap(10);

  layout.labeledValue("Applicant", packet.meta.applicantName, false);
  layout.labeledValue("Business", packet.meta.businessName ?? "—", false);
  layout.labeledValue("License type", packet.meta.licenseType, false);
  layout.labeledValue("Filed with", packet.meta.agency, false);
  layout.labeledValue("Prepared on", packet.meta.generatedOn, false);

  layout.gap(8);
  layout.calloutBox("THIS IS A DRAFT — YOU ARE THE APPLICANT", packet.meta.draftNotice);
  layout.calloutBox("NOT LEGAL ADVICE", packet.meta.disclaimer);

  if (packet.blanksToComplete.length > 0) {
    layout.gap(4);
    layout.text("You must complete these by hand on your signed copy:", {
      size: 10,
      bold: true,
    });
    layout.gap(4);
    for (const blank of packet.blanksToComplete) {
      layout.text(`•  ${blank}`, { size: 9.5, color: INK, indent: 8 });
    }
    layout.gap(4);
    layout.text(
      `${site.name} does not collect or store these. They appear as blank ruled lines in the pages that follow.`,
      { size: 8.5, color: MUTED },
    );
  }

  // ── Application data ───────────────────────────────────────────────────────
  for (const section of packet.sections) {
    layout.heading(section.title);
    if (section.note) {
      layout.text(section.note, { size: 9, color: MUTED });
      layout.gap(6);
    }
    for (const value of section.values) {
      layout.labeledValue(value.label, value.value, value.blankForClient, value.hint);
    }
  }

  // ── Document checklist ─────────────────────────────────────────────────────
  layout.heading("Document Checklist");
  layout.text(
    "Everything your state expects to see. Ticked boxes are documents we have received and accepted.",
    { size: 9, color: MUTED },
  );
  layout.gap(8);
  for (const item of packet.checklist) {
    const statusNote =
      item.status === "accepted"
        ? "Received and accepted."
        : item.status === "in_review"
          ? "Received — under review."
          : "Still needed.";
    layout.checkbox(
      `${item.label}${item.required ? "" : " (optional)"}`,
      item.status === "accepted",
      `${item.description} Source: ${item.source}. ${statusNote}`,
    );
  }

  // ── Filing instructions ────────────────────────────────────────────────────
  layout.heading("Filing Instructions");
  layout.text(
    "Follow these in order. The early steps are the slow ones — starting them first is what keeps a filing on the fast end of the range.",
    { size: 9, color: MUTED },
  );
  layout.gap(8);
  for (const step of packet.filingInstructions) {
    layout.text(`${step.step}. ${step.title}${step.timing ? `  —  ${step.timing}` : ""}`, {
      size: 10,
      bold: true,
    });
    layout.text(step.detail, { size: 9, color: MUTED, indent: 14 });
    layout.gap(6);
  }

  // ── Costs ──────────────────────────────────────────────────────────────────
  layout.heading("What You Pay, and to Whom");
  layout.text(
    `These are paid by you directly to the state and to third parties. They are separate from ${site.name}'s fee.`,
    { size: 9, color: MUTED },
  );
  layout.gap(8);
  for (const cost of packet.costSummary) {
    layout.labeledValue(cost.label, `${cost.amount}${cost.note ? ` — ${cost.note}` : ""}`, false);
  }

  // ── Inspection prep ────────────────────────────────────────────────────────
  layout.heading("Inspection Preparation Photo Checklist");
  layout.text(
    "Work through this before your inspector arrives. Photograph each item — problems are far cheaper to fix now than after a failed inspection.",
    { size: 9, color: MUTED },
  );
  layout.gap(8);
  for (const item of packet.inspectionChecklist) {
    layout.checkbox(item, false);
  }

  // ── Signature ──────────────────────────────────────────────────────────────
  layout.heading("Your Review and Signature");
  layout.text(
    "By signing your application, you attest that the information in it is true and complete. Read every field above before you do. If anything is wrong or out of date, tell us and we will correct the packet — do not file something you have not verified.",
    { size: 9.5, color: INK },
  );
  layout.gap(16);
  layout.labeledValue("Applicant signature", null, true);
  layout.labeledValue("Printed name", null, true);
  layout.labeledValue("Date", null, true);

  return doc.save();
}
