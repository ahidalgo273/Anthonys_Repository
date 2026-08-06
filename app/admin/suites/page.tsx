import { SuiteForm } from "@/components/admin/admin-forms";
import { formatUsd } from "@/config/pricing";
import { db } from "@/lib/db";

export const metadata = { title: "Suites" };

const STATUS_TONE: Record<string, string> = {
  VACANT: "badge-warning",
  RESERVED: "badge-info",
  OCCUPIED: "badge-success",
};

export default async function AdminSuitesPage() {
  const suites = await db.suite.findMany({
    include: { tenant: true },
    orderBy: { name: "asc" },
  });

  const occupied = suites.filter((suite) => suite.status === "OCCUPIED");
  const monthlyRent = occupied.reduce((sum, suite) => sum + suite.monthlyRentCents, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Suites</h1>
          <p className="mt-1" style={{ color: "var(--text-muted)" }}>
            Lightweight occupancy tracking. Full property accounting belongs in dedicated PM
            software — this is here so you know who is in which suite.
          </p>
        </div>
        <a href="/api/export/suites" className="btn btn-secondary">
          Export suites (CSV)
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Total suites" value={String(suites.length)} />
        <Stat label="Occupied" value={String(occupied.length)} />
        <Stat
          label="Vacant"
          value={String(suites.filter((suite) => suite.status === "VACANT").length)}
        />
        <Stat label="Monthly rent" value={formatUsd(monthlyRent)} />
      </div>

      {suites.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Suite</th>
                <th scope="col">Size</th>
                <th scope="col">Rent</th>
                <th scope="col">Status</th>
                <th scope="col">Tenant</th>
                <th scope="col">Lease</th>
              </tr>
            </thead>
            <tbody>
              {suites.map((suite) => (
                <tr key={suite.id}>
                  <th scope="row" className="font-medium">
                    {suite.name}
                    {suite.notes && (
                      <span
                        className="block text-sm font-normal"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {suite.notes}
                      </span>
                    )}
                  </th>
                  <td className="whitespace-nowrap">{suite.sqFt} sq ft</td>
                  <td className="whitespace-nowrap font-semibold">
                    {formatUsd(suite.monthlyRentCents)}/mo
                  </td>
                  <td>
                    <span className={`badge ${STATUS_TONE[suite.status] ?? "badge-neutral"}`}>
                      {suite.status.toLowerCase()}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {suite.tenant ? (suite.tenant.name ?? suite.tenant.email) : "—"}
                  </td>
                  <td className="whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {suite.leaseStart
                      ? `${suite.leaseStart.toLocaleDateString("en-US")} – ${
                          suite.leaseEnd ? suite.leaseEnd.toLocaleDateString("en-US") : "open"
                        }`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-bold">Add a suite</h2>
        <div className="mt-4">
          <SuiteForm />
        </div>
      </div>

      {suites.map((suite) => (
        <details key={suite.id} className="card-flush">
          <summary className="cursor-pointer p-4 font-semibold">Edit {suite.name}</summary>
          <div className="border-t p-4">
            <SuiteForm
              suite={{
                id: suite.id,
                name: suite.name,
                sqFt: suite.sqFt,
                monthlyRentCents: suite.monthlyRentCents,
                status: suite.status,
                tenantEmail: suite.tenant?.email ?? null,
                leaseStart: suite.leaseStart?.toISOString().slice(0, 10) ?? null,
                leaseEnd: suite.leaseEnd?.toISOString().slice(0, 10) ?? null,
                notes: suite.notes,
              }}
            />
          </div>
        </details>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
