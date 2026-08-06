import Link from "next/link";
import { formatUsd } from "@/config/pricing";
import { getMetrics } from "@/lib/admin/metrics";
import { formatDeadline } from "@/lib/rules/deadlines";

export const metadata = { title: "Metrics" };

export default async function AdminMetricsPage() {
  const metrics = await getMetrics();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Metrics</h1>
        <p className="mt-1" style={{ color: "var(--text-muted)" }}>
          Demo orders are excluded from every revenue figure.
        </p>
      </div>

      {/* ── Headline numbers ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Monthly recurring revenue"
          value={formatUsd(metrics.revenue.mrrCents)}
          detail={`${metrics.revenue.activeSubscriptions} active subscription${metrics.revenue.activeSubscriptions === 1 ? "" : "s"}`}
        />
        <Stat
          label="One-time revenue"
          value={formatUsd(metrics.revenue.oneTimeRevenueCents)}
          detail="All paid one-time orders"
        />
        <Stat
          label="Leads"
          value={String(metrics.leads.total)}
          detail={`${metrics.leads.last30Days} in the last 30 days`}
        />
        <Stat
          label="Conversion"
          value={`${(metrics.conversion.rate * 100).toFixed(0)}%`}
          detail={`${metrics.conversion.converted} of ${metrics.conversion.totalLeads} leads`}
        />
      </div>

      {metrics.revenue.demoOrders > 0 && (
        <div className="callout callout-warning">
          <p>
            <strong>{metrics.revenue.demoOrders} demo order(s) in the database.</strong> These were
            created while Stripe was not configured. No money changed hands and they are excluded
            from the revenue figures above.
          </p>
        </div>
      )}

      {metrics.leads.attorneyReferrals > 0 && (
        <div className="callout callout-danger">
          <p>
            <strong>{metrics.leads.attorneyReferrals} lead(s) have requested an attorney referral.</strong>{" "}
            <Link href="/admin" className="underline underline-offset-4">
              See them on the pipeline
            </Link>
            .
          </p>
        </div>
      )}

      {/* ── Breakdowns ────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Breakdown
          title="Leads by state"
          rows={metrics.leads.byState.map((row) => ({ label: row.state, count: row.count }))}
          total={metrics.leads.total}
        />
        <Breakdown
          title="Leads by source"
          rows={metrics.leads.bySource.map((row) => ({ label: row.source, count: row.count }))}
          total={metrics.leads.total}
        />
        <Breakdown
          title="Leads by status"
          rows={metrics.leads.byStatus.map((row) => ({
            label: row.status.replace(/_/g, " ").toLowerCase(),
            count: row.count,
          }))}
          total={metrics.leads.total}
        />
      </div>

      {/* ── Filings ───────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-bold">
          Open filings by stage ({metrics.filings.open} open, {metrics.filings.licensed} licensed)
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {metrics.filings.byStage.map((stage) => (
            <div key={stage.stage} className="card">
              <p className="text-2xl font-bold">{stage.count}</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {stage.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Deadlines ─────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-bold">Deadlines across all clients</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            label="Overdue"
            value={String(metrics.deadlines.overdue)}
            detail="Needs attention now"
            tone={metrics.deadlines.overdue > 0 ? "danger" : undefined}
          />
          <Stat label="Due within 30 days" value={String(metrics.deadlines.within30)} />
          <Stat label="Due within 90 days" value={String(metrics.deadlines.within90)} />
        </div>

        {metrics.deadlines.upcoming.length > 0 && (
          <div className="mt-4 table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Deadline</th>
                  <th scope="col">Client</th>
                  <th scope="col">Due</th>
                  <th scope="col">Days</th>
                </tr>
              </thead>
              <tbody>
                {metrics.deadlines.upcoming.map((deadline) => (
                  <tr key={deadline.id}>
                    <th scope="row" className="font-medium">
                      {deadline.label}
                    </th>
                    <td style={{ color: "var(--text-muted)" }}>{deadline.email}</td>
                    <td className="whitespace-nowrap">{formatDeadline(deadline.dueDate)}</td>
                    <td>
                      <span
                        className={`badge ${
                          deadline.daysRemaining < 0
                            ? "badge-danger"
                            : deadline.daysRemaining <= 30
                              ? "badge-warning"
                              : "badge-neutral"
                        }`}
                      >
                        {deadline.daysRemaining < 0
                          ? `${Math.abs(deadline.daysRemaining)} overdue`
                          : deadline.daysRemaining}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Suites ────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-bold">Suites</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat
            label="Occupancy"
            value={`${(metrics.suites.occupancyRate * 100).toFixed(0)}%`}
            detail={`${metrics.suites.occupied} of ${metrics.suites.total} occupied`}
          />
          <Stat label="Vacant" value={String(metrics.suites.vacant)} />
          <Stat label="Reserved" value={String(metrics.suites.reserved)} />
          <Stat
            label="Suite rent per month"
            value={formatUsd(metrics.suites.monthlyRentCents)}
            detail="Occupied suites only"
          />
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "danger";
}) {
  return (
    <div className="card">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-bold"
        style={tone === "danger" ? { color: "var(--danger)" } : undefined}
      >
        {value}
      </p>
      {detail && (
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {detail}
        </p>
      )}
    </div>
  );
}

function Breakdown({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { label: string; count: number }[];
  total: number;
}) {
  return (
    <div className="card">
      <h3 className="font-bold">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          No data yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="flex justify-between text-sm">
                <span>{row.label}</span>
                <span className="font-semibold">
                  {row.count}
                  <span style={{ color: "var(--text-muted)" }}>
                    {" "}
                    ({total === 0 ? 0 : Math.round((row.count / total) * 100)}%)
                  </span>
                </span>
              </div>
              <div
                className="mt-1 h-1.5 rounded-full"
                style={{ backgroundColor: "var(--border)" }}
                aria-hidden="true"
              >
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${total === 0 ? 0 : ((row.count / total) * 100).toFixed(1)}%`,
                    backgroundColor: "var(--accent)",
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
