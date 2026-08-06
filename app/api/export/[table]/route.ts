import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { csvResponse, toCsv, type CsvColumn } from "@/lib/csv";
import { db } from "@/lib/db";

/**
 * CSV export for any admin table.
 *
 * One route, one column definition per table. Adding an export means adding an
 * entry to EXPORTS below — the escaping, the auth check, and the download
 * headers are already handled.
 */

export const dynamic = "force-dynamic";

type Exporter = {
  filename: string;
  run: () => Promise<string>;
};

const EXPORTS: Record<string, Exporter> = {
  leads: {
    filename: "leads",
    run: async () => {
      const rows = await db.lead.findMany({ orderBy: { createdAt: "desc" } });
      const columns: CsvColumn<(typeof rows)[number]>[] = [
        { header: "Created", value: (r) => r.createdAt },
        { header: "Name", value: (r) => r.name },
        { header: "Email", value: (r) => r.email },
        { header: "Phone", value: (r) => r.phone },
        { header: "State", value: (r) => r.stateCode },
        { header: "Goal", value: (r) => r.goal },
        { header: "Timeline", value: (r) => r.timeline },
        { header: "Source", value: (r) => r.source },
        { header: "Status", value: (r) => r.status },
        { header: "Attorney referral", value: (r) => r.attorneyReferral },
        { header: "Referral reason", value: (r) => r.attorneyReferralReason },
        { header: "Package selected", value: (r) => r.selectedPackage },
        { header: "Last step", value: (r) => r.lastStep },
        { header: "Acknowledged disclaimer", value: (r) => r.acknowledgedAt },
      ];
      return toCsv(rows, columns);
    },
  },

  applications: {
    filename: "filings",
    run: async () => {
      const rows = await db.application.findMany({
        include: { user: true, documents: true },
        orderBy: { createdAt: "desc" },
      });
      const columns: CsvColumn<(typeof rows)[number]>[] = [
        { header: "Created", value: (r) => r.createdAt },
        { header: "Client", value: (r) => r.user.name },
        { header: "Email", value: (r) => r.user.email },
        { header: "State", value: (r) => r.stateCode },
        { header: "Business", value: (r) => r.businessName },
        { header: "Stage", value: (r) => r.stage },
        { header: "Package", value: (r) => r.packageId },
        { header: "Documents uploaded", value: (r) => r.documents.length },
        {
          header: "Documents accepted",
          value: (r) => r.documents.filter((d) => d.status === "ACCEPTED").length,
        },
        { header: "Packet generated", value: (r) => r.packetGeneratedAt },
        { header: "Filed", value: (r) => r.filedAt },
        { header: "Licensed", value: (r) => r.licensedAt },
        { header: "License number", value: (r) => r.licenseNumber },
      ];
      return toCsv(rows, columns);
    },
  },

  clients: {
    filename: "clients",
    run: async () => {
      const rows = await db.user.findMany({
        where: { role: "CLIENT" },
        include: { applications: true, subscriptions: true, orders: true },
        orderBy: { createdAt: "desc" },
      });
      const columns: CsvColumn<(typeof rows)[number]>[] = [
        { header: "Joined", value: (r) => r.createdAt },
        { header: "Name", value: (r) => r.name },
        { header: "Email", value: (r) => r.email },
        { header: "Phone", value: (r) => r.phone },
        { header: "Filings", value: (r) => r.applications.length },
        { header: "States", value: (r) => r.applications.map((a) => a.stateCode).join(" ") },
        {
          header: "Active subscriptions",
          value: (r) => r.subscriptions.filter((s) => ["active", "trialing"].includes(s.status)).length,
        },
        {
          header: "Total paid (USD)",
          value: (r) =>
            (
              r.orders
                .filter((o) => o.status === "paid" && !o.isDemo)
                .reduce((sum, o) => sum + o.amountCents, 0) / 100
            ).toFixed(2),
        },
      ];
      return toCsv(rows, columns);
    },
  },

  deadlines: {
    filename: "deadlines",
    run: async () => {
      const rows = await db.deadline.findMany({
        include: { user: true, reminders: true },
        orderBy: { dueDate: "asc" },
      });
      const columns: CsvColumn<(typeof rows)[number]>[] = [
        { header: "Due", value: (r) => r.dueDate },
        { header: "Label", value: (r) => r.label },
        { header: "Kind", value: (r) => r.kind },
        { header: "Client", value: (r) => r.user.name },
        { header: "Email", value: (r) => r.user.email },
        { header: "Source", value: (r) => r.source },
        { header: "Completed", value: (r) => r.completedAt },
        {
          header: "Reminders sent",
          value: (r) => r.reminders.map((reminder) => `${reminder.offsetDays}d`).join(" "),
        },
        { header: "Notes", value: (r) => r.notes },
      ];
      return toCsv(rows, columns);
    },
  },

  suites: {
    filename: "suites",
    run: async () => {
      const rows = await db.suite.findMany({ include: { tenant: true }, orderBy: { name: "asc" } });
      const columns: CsvColumn<(typeof rows)[number]>[] = [
        { header: "Suite", value: (r) => r.name },
        { header: "Square feet", value: (r) => r.sqFt },
        { header: "Monthly rent (USD)", value: (r) => (r.monthlyRentCents / 100).toFixed(2) },
        { header: "Status", value: (r) => r.status },
        { header: "Tenant", value: (r) => r.tenant?.name ?? "" },
        { header: "Tenant email", value: (r) => r.tenant?.email ?? "" },
        { header: "Lease start", value: (r) => r.leaseStart },
        { header: "Lease end", value: (r) => r.leaseEnd },
        { header: "Notes", value: (r) => r.notes },
      ];
      return toCsv(rows, columns);
    },
  },

  orders: {
    filename: "orders",
    run: async () => {
      const rows = await db.order.findMany({
        include: { user: true, lead: true },
        orderBy: { createdAt: "desc" },
      });
      const columns: CsvColumn<(typeof rows)[number]>[] = [
        { header: "Date", value: (r) => r.createdAt },
        { header: "Product", value: (r) => r.productId },
        { header: "Amount (USD)", value: (r) => (r.amountCents / 100).toFixed(2) },
        { header: "Status", value: (r) => r.status },
        { header: "Demo (not charged)", value: (r) => r.isDemo },
        { header: "Client", value: (r) => r.user?.email ?? r.lead?.email ?? "" },
        { header: "Stripe session", value: (r) => r.stripeSessionId },
      ];
      return toCsv(rows, columns);
    },
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return new NextResponse("Not found.", { status: 404 });
  }

  const { table } = await params;
  const exporter = EXPORTS[table];

  if (!exporter) {
    return NextResponse.json(
      { error: `Unknown export "${table}".`, available: Object.keys(EXPORTS) },
      { status: 404 },
    );
  }

  const csv = await exporter.run();
  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `dealerdesk-${exporter.filename}-${stamp}.csv`);
}
