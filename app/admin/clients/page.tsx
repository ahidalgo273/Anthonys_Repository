import Link from "next/link";
import { StageBadge } from "@/components/stage-tracker";
import { db } from "@/lib/db";

export const metadata = { title: "Clients" };

export default async function AdminClientsPage() {
  const clients = await db.user.findMany({
    where: { role: "CLIENT" },
    include: {
      applications: true,
      subscriptions: { where: { status: { in: ["active", "trialing"] } } },
      deadlines: { where: { completedAt: null } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="mt-1" style={{ color: "var(--text-muted)" }}>
            {clients.length} client account{clients.length === 1 ? "" : "s"}.
          </p>
        </div>
        <a href="/api/export/clients" className="btn btn-secondary">
          Export clients (CSV)
        </a>
      </div>

      {clients.length === 0 ? (
        <div className="card">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No clients yet. They are created automatically when someone completes checkout.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Client</th>
                <th scope="col">Email</th>
                <th scope="col">Filings</th>
                <th scope="col">Subscription</th>
                <th scope="col">Open deadlines</th>
                <th scope="col">Joined</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <th scope="row" className="font-medium whitespace-nowrap">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="underline underline-offset-4"
                    >
                      {client.name ?? "—"}
                    </Link>
                  </th>
                  <td>{client.email}</td>
                  <td>
                    {client.applications.length === 0 ? (
                      <span style={{ color: "var(--text-muted)" }}>None</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {client.applications.map((application) => (
                          <span key={application.id} className="whitespace-nowrap">
                            <span className="badge badge-neutral mr-1">
                              {application.stateCode}
                            </span>
                            <StageBadge stage={application.stage} />
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    {client.subscriptions.length > 0 ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td>{client.deadlines.length}</td>
                  <td className="whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {client.createdAt.toLocaleDateString("en-US")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
