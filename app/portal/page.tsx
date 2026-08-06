import Link from "next/link";
import { StageTracker } from "@/components/stage-tracker";
import { getState } from "@/config/states";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { describeDueDate, formatDeadline, urgencyOf } from "@/lib/rules/deadlines";

export default async function PortalDashboard() {
  const user = await requireUser("/portal");
  const today = new Date();

  const [applications, openTasks, deadlines] = await Promise.all([
    db.application.findMany({
      where: { userId: user.id },
      include: { documents: true },
      orderBy: { createdAt: "desc" },
    }),
    db.task.findMany({
      where: {
        audience: "client",
        completedAt: null,
        application: { userId: user.id },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      take: 10,
    }),
    db.deadline.findMany({
      where: { userId: user.id, completedAt: null },
      orderBy: { dueDate: "asc" },
      take: 6,
    }),
  ]);

  const firstName = user.name?.split(" ")[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
        </h1>
        <p className="mt-1" style={{ color: "var(--text-muted)" }}>
          Everything about your filing lives here.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="card">
          <h2 className="text-lg font-bold">No application yet</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            If you subscribed to compliance tracking only, use the Compliance tab to add your
            renewal, bond, and insurance dates. If you expected a filing here, contact us and we
            will sort it out.
          </p>
          <Link href="/portal/compliance" className="btn btn-primary mt-4">
            Set up my compliance calendar
          </Link>
        </div>
      ) : (
        applications.map((application) => {
          const state = getState(application.stateCode);
          const required = state?.documents.filter((d) => d.required) ?? [];
          const accepted = application.documents.filter((d) => d.status === "ACCEPTED");
          const acceptedIds = new Set(accepted.map((d) => d.requirementId));
          const outstanding = required.filter((d) => !acceptedIds.has(d.id));

          return (
            <div key={application.id} className="card">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-lg font-bold">
                  {state?.name} — {state?.licenseType}
                </h2>
                <Link href="/portal/documents" className="btn btn-secondary">
                  Manage documents
                </Link>
              </div>

              <div className="mt-6">
                <StageTracker stage={application.stage} />
              </div>

              <dl className="mt-6 grid gap-4 sm:grid-cols-3 text-sm">
                <div>
                  <dt style={{ color: "var(--text-muted)" }}>Documents accepted</dt>
                  <dd className="text-xl font-bold">
                    {accepted.length} / {required.length}
                  </dd>
                </div>
                <div>
                  <dt style={{ color: "var(--text-muted)" }}>Still needed</dt>
                  <dd className="text-xl font-bold">{outstanding.length}</dd>
                </div>
                <div>
                  <dt style={{ color: "var(--text-muted)" }}>Packet</dt>
                  <dd className="text-xl font-bold">
                    {application.packetGeneratedAt ? "Ready" : "Not yet"}
                  </dd>
                </div>
              </dl>

              {outstanding.length > 0 && (
                <div className="callout callout-info mt-6">
                  <p className="font-semibold">Next up</p>
                  <ul className="mt-2 space-y-1">
                    {outstanding.slice(0, 4).map((doc) => (
                      <li key={doc.id} className="text-sm">
                        · <strong>{doc.label}</strong> — from {doc.source}
                      </li>
                    ))}
                  </ul>
                  <Link href="/portal/documents" className="btn btn-secondary mt-3">
                    Upload documents
                  </Link>
                </div>
              )}

              {application.packetGeneratedAt && (
                <div className="callout callout-success mt-6">
                  <p className="font-semibold">Your packet is ready to review</p>
                  <p className="mt-1">
                    Read every field, complete the blanks marked for you, sign, and file. We do not
                    sign or submit for you.
                  </p>
                  <Link href="/portal/packet" className="btn btn-primary mt-3">
                    Open my packet
                  </Link>
                </div>
              )}
            </div>
          );
        })
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-bold">Your tasks</h2>
          {openTasks.length === 0 ? (
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Nothing outstanding from us right now.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {openTasks.map((task) => (
                <li key={task.id} className="text-sm">
                  <strong>{task.title}</strong>
                  {task.detail && (
                    <span className="block" style={{ color: "var(--text-muted)" }}>
                      {task.detail}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="badge badge-neutral mt-1">
                      Due {describeDueDate(task.dueDate, today)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold">Upcoming deadlines</h2>
            <Link href="/portal/compliance" className="text-sm underline underline-offset-4">
              View all
            </Link>
          </div>
          {deadlines.length === 0 ? (
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              No deadlines tracked yet. They are added automatically once you are licensed, or you
              can add them yourself.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {deadlines.map((deadline) => {
                const urgency = urgencyOf(deadline.dueDate, today);
                const tone =
                  urgency === "overdue"
                    ? "badge-danger"
                    : urgency === "critical"
                      ? "badge-warning"
                      : "badge-neutral";
                return (
                  <li key={deadline.id} className="text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{deadline.label}</strong>
                      <span className={`badge ${tone}`}>
                        {describeDueDate(deadline.dueDate, today)}
                      </span>
                    </div>
                    <span style={{ color: "var(--text-muted)" }}>
                      {formatDeadline(deadline.dueDate)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
