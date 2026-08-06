import Link from "next/link";
import { DeadlineOverrideForm } from "@/components/admin/admin-forms";
import { db } from "@/lib/db";
import { describeDueDate, formatDeadline, urgencyOf } from "@/lib/rules/deadlines";

export const metadata = { title: "Deadlines" };

export default async function AdminDeadlinesPage() {
  const today = new Date();

  const deadlines = await db.deadline.findMany({
    where: { completedAt: null },
    include: { user: true, reminders: true },
    orderBy: { dueDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Deadlines</h1>
          <p className="mt-1" style={{ color: "var(--text-muted)" }}>
            Every open deadline across all clients. Overriding a date resets its reminders so the
            client gets the full 90/60/30 sequence against the new date.
          </p>
        </div>
        <a href="/api/export/deadlines" className="btn btn-secondary">
          Export deadlines (CSV)
        </a>
      </div>

      {deadlines.length === 0 ? (
        <div className="card">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No open deadlines.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Deadline</th>
                <th scope="col">Client</th>
                <th scope="col">Due</th>
                <th scope="col">Reminders sent</th>
                <th scope="col">Override date</th>
              </tr>
            </thead>
            <tbody>
              {deadlines.map((deadline) => {
                const urgency = urgencyOf(deadline.dueDate, today);
                const tone =
                  urgency === "overdue"
                    ? "badge-danger"
                    : urgency === "critical"
                      ? "badge-warning"
                      : "badge-neutral";

                return (
                  <tr key={deadline.id}>
                    <th scope="row" className="font-medium">
                      {deadline.label}
                      <span
                        className="block text-sm font-normal"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {deadline.kind.replace(/_/g, " ").toLowerCase()} · {deadline.source}
                      </span>
                    </th>
                    <td>
                      <Link
                        href={`/admin/clients/${deadline.userId}`}
                        className="underline underline-offset-4"
                      >
                        {deadline.user.name ?? deadline.user.email}
                      </Link>
                    </td>
                    <td>
                      <div className="whitespace-nowrap">{formatDeadline(deadline.dueDate)}</div>
                      <span className={`badge ${tone} mt-1`}>
                        {describeDueDate(deadline.dueDate, today)}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {deadline.reminders.length === 0
                        ? "None"
                        : deadline.reminders
                            .map((reminder) => `${reminder.offsetDays}d`)
                            .sort()
                            .join(", ")}
                    </td>
                    <td>
                      <DeadlineOverrideForm
                        deadlineId={deadline.id}
                        currentDate={deadline.dueDate.toISOString().slice(0, 10)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
