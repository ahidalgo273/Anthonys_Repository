import Link from "next/link";
import { StageBadge, STAGES } from "@/components/stage-tracker";
import { getState } from "@/config/states";
import { db } from "@/lib/db";

export const metadata = { title: "Pipeline" };

const LEAD_STATUS_TONE: Record<string, string> = {
  NEW: "badge-neutral",
  SCREENED: "badge-info",
  ATTORNEY_REFERRAL: "badge-danger",
  CONVERTED: "badge-success",
  LOST: "badge-neutral",
};

export default async function AdminPipelinePage() {
  const [referrals, applications, openLeads] = await Promise.all([
    // Attorney referrals are surfaced first and loudly — this is the one thing
    // on the board that must never be missed.
    db.lead.findMany({
      where: { attorneyReferral: true, status: { not: "LOST" } },
      orderBy: { attorneyReferralAt: "desc" },
    }),
    db.application.findMany({
      include: { user: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.lead.findMany({
      where: { status: { in: ["NEW", "SCREENED"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="mt-1" style={{ color: "var(--text-muted)" }}>
            Every open lead and filing, by stage.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/leads" className="btn btn-secondary">
            Export leads (CSV)
          </a>
          <a href="/api/export/applications" className="btn btn-secondary">
            Export filings (CSV)
          </a>
        </div>
      </div>

      {/* ── Attorney referrals ────────────────────────────────────────────── */}
      {referrals.length > 0 && (
        <section
          className="rounded-xl border-2 p-5"
          style={{ borderColor: "var(--danger)", backgroundColor: "var(--danger-soft)" }}
        >
          <h2 className="text-lg font-bold">
            ⚠ {referrals.length} attorney referral{referrals.length === 1 ? "" : "s"} waiting
          </h2>
          <p className="mt-1 text-sm">
            These people asked something we do not answer. They need an attorney referral, not our
            opinion. Follow up personally.
          </p>
          <ul className="mt-4 space-y-3">
            {referrals.map((lead) => (
              <li key={lead.id} className="border-t pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="font-semibold underline underline-offset-4"
                    >
                      {lead.name ?? lead.email}
                    </Link>
                    <span className="ml-2 text-sm">{lead.email}</span>
                    {lead.stateCode && <span className="badge badge-neutral ml-2">{lead.stateCode}</span>}
                  </div>
                  <span className="text-sm">
                    Flagged{" "}
                    {lead.attorneyReferralAt?.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {lead.attorneyReferralReason && (
                  <p className="mt-1 text-sm">{lead.attorneyReferralReason}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Filings by stage ──────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-bold">Filings by stage</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {STAGES.map((stage) => {
            const items = applications.filter((application) => application.stage === stage.id);
            return (
              <div key={stage.id} className="card">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-bold">{stage.label}</h3>
                  <span className="badge badge-neutral">{items.length}</span>
                </div>

                {items.length === 0 ? (
                  <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
                    Nothing here.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {items.map((application) => (
                      <li key={application.id} className="text-sm">
                        <Link
                          href={`/admin/clients/${application.userId}`}
                          className="font-medium underline underline-offset-4"
                        >
                          {application.user.name ?? application.user.email}
                        </Link>
                        <span className="block" style={{ color: "var(--text-muted)" }}>
                          {getState(application.stateCode)?.name ?? application.stateCode}
                          {application.businessName ? ` · ${application.businessName}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Leads not yet converted ───────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-bold">Leads not yet converted ({openLeads.length})</h2>
        {openLeads.length === 0 ? (
          <div className="card">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No open leads.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">State</th>
                  <th scope="col">Goal</th>
                  <th scope="col">Source</th>
                  <th scope="col">Status</th>
                  <th scope="col">Started</th>
                </tr>
              </thead>
              <tbody>
                {openLeads.map((lead) => (
                  <tr key={lead.id}>
                    <th scope="row" className="font-medium whitespace-nowrap">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="underline underline-offset-4"
                      >
                        {lead.name ?? "—"}
                      </Link>
                    </th>
                    <td>{lead.email}</td>
                    <td>{lead.stateCode ?? "—"}</td>
                    <td style={{ color: "var(--text-muted)" }}>{lead.goal ?? "—"}</td>
                    <td style={{ color: "var(--text-muted)" }}>{lead.source}</td>
                    <td>
                      <span className={`badge ${LEAD_STATUS_TONE[lead.status] ?? "badge-neutral"}`}>
                        {lead.status.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </td>
                    <td className="whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {lead.createdAt.toLocaleDateString("en-US")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── All filings ───────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-bold">All filings ({applications.length})</h2>
        {applications.length === 0 ? (
          <div className="card">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No filings yet.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Client</th>
                  <th scope="col">State</th>
                  <th scope="col">Business</th>
                  <th scope="col">Stage</th>
                  <th scope="col">Packet</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <th scope="row" className="font-medium whitespace-nowrap">
                      <Link
                        href={`/admin/clients/${application.userId}`}
                        className="underline underline-offset-4"
                      >
                        {application.user.name ?? application.user.email}
                      </Link>
                    </th>
                    <td>{application.stateCode}</td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {application.businessName ?? "—"}
                    </td>
                    <td>
                      <StageBadge stage={application.stage} />
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {application.packetGeneratedAt ? "Generated" : "—"}
                    </td>
                    <td className="whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {application.updatedAt.toLocaleDateString("en-US")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
