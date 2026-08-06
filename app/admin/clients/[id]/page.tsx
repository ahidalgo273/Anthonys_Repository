import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CompleteTaskButton,
  NoteForm,
  ReviewDocumentForm,
  StageForm,
  TaskForm,
} from "@/components/admin/admin-forms";
import { formatUsd } from "@/config/pricing";
import { getState } from "@/config/states";
import { db } from "@/lib/db";
import { describeDueDate, formatDeadline } from "@/lib/rules/deadlines";

export const metadata = { title: "Client detail" };

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const today = new Date();

  const client = await db.user.findUnique({
    where: { id },
    include: {
      applications: {
        include: {
          documents: { orderBy: { createdAt: "desc" } },
          notes: { orderBy: { createdAt: "desc" } },
          tasks: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      deadlines: { orderBy: { dueDate: "asc" } },
      subscriptions: { orderBy: { createdAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" } },
      leads: true,
      suites: true,
    },
  });

  if (!client) notFound();

  const activity = await db.activityLog.findMany({
    where: {
      OR: [
        { entityType: "user", entityId: client.id },
        { entityType: "application", entityId: { in: client.applications.map((a) => a.id) } },
        {
          entityType: "document",
          entityId: {
            in: client.applications.flatMap((a) => a.documents.map((d) => d.id)),
          },
        },
        { entityType: "lead", entityId: { in: client.leads.map((l) => l.id) } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const referralLead = client.leads.find((lead) => lead.attorneyReferral);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/clients"
          className="text-sm underline underline-offset-4"
          style={{ color: "var(--text-muted)" }}
        >
          ← All clients
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{client.name ?? client.email}</h1>
        <p className="mt-1" style={{ color: "var(--text-muted)" }}>
          {client.email}
          {client.phone ? ` · ${client.phone}` : ""} · joined{" "}
          {client.createdAt.toLocaleDateString("en-US")}
        </p>
      </div>

      {referralLead && (
        <div className="callout callout-danger">
          <p className="font-semibold">⚠ Attorney referral requested</p>
          <p className="mt-1">{referralLead.attorneyReferralReason}</p>
          <Link href={`/admin/leads/${referralLead.id}`} className="btn btn-secondary mt-3">
            Open the lead record
          </Link>
        </div>
      )}

      {/* ── Filings ───────────────────────────────────────────────────────── */}
      {client.applications.map((application) => {
        const state = getState(application.stateCode);
        const pendingReview = application.documents.filter((d) => d.status === "NEEDS_REVIEW");

        return (
          <section key={application.id} className="card">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold">
                {state?.name ?? application.stateCode} — {state?.licenseType}
              </h2>
              <a
                href={`/api/packet/${application.id}`}
                className="btn btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Regenerate packet (PDF)
              </a>
            </div>

            <div className="mt-4">
              <StageForm applicationId={application.id} currentStage={application.stage} />
            </div>

            <div className="mt-6">
              <h3 className="font-semibold">
                Documents ({application.documents.length})
                {pendingReview.length > 0 && (
                  <span className="badge badge-warning ml-2">
                    {pendingReview.length} awaiting review
                  </span>
                )}
              </h3>

              {application.documents.length === 0 ? (
                <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  Nothing uploaded yet.
                </p>
              ) : (
                <ul className="mt-3 space-y-4">
                  {application.documents.map((document) => {
                    const findings =
                      (document.checkResult as { findings?: { severity: string; message: string }[] } | null)
                        ?.findings ?? [];

                    return (
                      <li key={document.id} className="border-t pt-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={`/api/documents/${document.id}`}
                            className="font-medium underline underline-offset-4"
                            style={{ color: "var(--info)" }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {document.label}
                          </a>
                          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                            {document.filename} · {(document.sizeBytes / 1024).toFixed(0)} KB
                          </span>
                          <span
                            className={`badge ${
                              document.status === "ACCEPTED"
                                ? "badge-success"
                                : document.status === "REJECTED"
                                  ? "badge-danger"
                                  : "badge-warning"
                            }`}
                          >
                            {document.status.replace(/_/g, " ").toLowerCase()}
                          </span>
                        </div>

                        {document.amountCents !== null && (
                          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                            Client-entered amount: {formatUsd(document.amountCents)}
                            {document.expiresAt &&
                              ` · expires ${formatDeadline(document.expiresAt)}`}
                          </p>
                        )}

                        {findings.map((finding, index) => (
                          <p
                            key={index}
                            className="mt-1 text-sm"
                            style={{
                              color:
                                finding.severity === "error"
                                  ? "var(--danger)"
                                  : finding.severity === "warning"
                                    ? "var(--warning)"
                                    : "var(--text-muted)",
                            }}
                          >
                            {finding.severity === "error" ? "⚠ " : "· "}
                            {finding.message}
                          </p>
                        ))}

                        {document.reviewedAt ? (
                          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                            Reviewed by {document.reviewedByEmail} on{" "}
                            {document.reviewedAt.toLocaleDateString("en-US")}
                            {document.reviewNote ? ` — "${document.reviewNote}"` : ""}
                          </p>
                        ) : (
                          <ReviewDocumentForm documentId={document.id} />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Notes and tasks */}
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="font-semibold">Notes</h3>
                {application.notes.length > 0 && (
                  <ul className="mt-2 mb-4 space-y-2">
                    {application.notes.map((note) => (
                      <li key={note.id} className="text-sm">
                        {note.body}
                        <span className="block" style={{ color: "var(--text-muted)" }}>
                          {note.authorEmail} · {note.createdAt.toLocaleDateString("en-US")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <NoteForm applicationId={application.id} />
              </div>

              <div>
                <h3 className="font-semibold">Tasks</h3>
                {application.tasks.length > 0 && (
                  <ul className="mt-2 mb-4 space-y-2">
                    {application.tasks.map((task) => (
                      <li key={task.id} className="text-sm">
                        <span className={task.completedAt ? "line-through" : ""}>{task.title}</span>
                        <span className="badge badge-neutral ml-2">{task.audience}</span>
                        {!task.completedAt && <CompleteTaskButton taskId={task.id} />}
                      </li>
                    ))}
                  </ul>
                )}
                <TaskForm applicationId={application.id} />
              </div>
            </div>
          </section>
        );
      })}

      {/* ── Deadlines, billing, suites ────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="text-lg font-bold">Deadlines</h2>
          {client.deadlines.length === 0 ? (
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              None tracked.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {client.deadlines.map((deadline) => (
                <li key={deadline.id} className="text-sm">
                  <strong>{deadline.label}</strong>
                  <span className="block" style={{ color: "var(--text-muted)" }}>
                    {formatDeadline(deadline.dueDate)} ·{" "}
                    {deadline.completedAt
                      ? "completed"
                      : describeDueDate(deadline.dueDate, today)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/deadlines" className="btn btn-secondary mt-4">
            Manage all deadlines
          </Link>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Billing</h2>
          {client.subscriptions.length === 0 && client.orders.length === 0 ? (
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              No payments recorded.
            </p>
          ) : (
            <>
              {client.subscriptions.map((subscription) => (
                <p key={subscription.id} className="mt-2 text-sm">
                  <strong>{subscription.productId}</strong> —{" "}
                  {formatUsd(subscription.amountCents)}/month ·{" "}
                  <span className="badge badge-neutral">{subscription.status}</span>
                </p>
              ))}
              <ul className="mt-3 space-y-1">
                {client.orders.map((order) => (
                  <li key={order.id} className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {order.createdAt.toLocaleDateString("en-US")} · {order.productId} ·{" "}
                    {formatUsd(order.amountCents)} · {order.isDemo ? "demo (not charged)" : order.status}
                  </li>
                ))}
              </ul>
            </>
          )}

          {client.suites.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h3 className="font-semibold">Suites</h3>
              {client.suites.map((suite) => (
                <p key={suite.id} className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  {suite.name} · {suite.sqFt} sq ft · {formatUsd(suite.monthlyRentCents)}/month ·{" "}
                  {suite.status.toLowerCase()}
                </p>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Activity log ──────────────────────────────────────────────────── */}
      <section className="card">
        <h2 className="text-lg font-bold">Activity log</h2>
        {activity.length === 0 ? (
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Nothing recorded yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {activity.map((entry) => (
              <li key={entry.id} className="text-sm" style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--text)" }}>
                  {entry.action.replace(/_/g, " ")}
                </span>{" "}
                · {entry.entityType} · {entry.actorEmail ?? entry.actorType} ·{" "}
                {entry.createdAt.toLocaleString("en-US")}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
