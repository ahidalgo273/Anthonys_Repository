import { DeadlineForm, CompleteDeadlineButton } from "@/components/portal/deadline-forms";
import { getState } from "@/config/states";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  REMINDER_OFFSETS,
  describeDueDate,
  formatDeadline,
  nextRenewalForState,
  urgencyOf,
} from "@/lib/rules/deadlines";

export const metadata = { title: "Compliance calendar" };

const KIND_LABELS: Record<string, string> = {
  LICENSE_RENEWAL: "License renewal",
  BOND_EXPIRY: "Surety bond",
  INSURANCE_EXPIRY: "Insurance",
  OCCUPATION_TAX: "Occupation tax",
  OTHER: "Other",
};

export default async function CompliancePage() {
  const user = await requireUser("/portal/compliance");
  const today = new Date();

  const [deadlines, application, subscription] = await Promise.all([
    db.deadline.findMany({
      where: { userId: user.id },
      orderBy: [{ completedAt: "asc" }, { dueDate: "asc" }],
      include: { reminders: true },
    }),
    db.application.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.subscription.findFirst({
      where: { userId: user.id, status: { in: ["active", "trialing"] } },
    }),
  ]);

  const state = application ? getState(application.stateCode) : undefined;
  const suggestedRenewal =
    state && application?.licensedAt
      ? nextRenewalForState(state.code, application.licensedAt)
      : state
        ? nextRenewalForState(state.code, today)
        : null;

  const open = deadlines.filter((d) => !d.completedAt);
  const done = deadlines.filter((d) => d.completedAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compliance calendar</h1>
        <p className="mt-1" style={{ color: "var(--text-muted)" }}>
          Renewal, bond, insurance, and occupation-tax dates in one place. We email you at{" "}
          {REMINDER_OFFSETS.join(", ")} days before each one.
        </p>
      </div>

      {!subscription && (
        <div className="callout callout-info">
          <p>
            <strong>You are not on the Compliance Subscription.</strong> You can still track
            deadlines here, but automated reminder emails are part of the $59/month plan. Suite
            tenants have it included.
          </p>
        </div>
      )}

      {state && (
        <div className="callout callout-info">
          <p>
            <strong>{state.name} renewal schedule:</strong> {state.renewal.note}
            {suggestedRenewal && (
              <> Based on that, your next renewal falls on {formatDeadline(suggestedRenewal)}.</>
            )}
          </p>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-bold">Tracked deadlines</h2>

        {open.length === 0 ? (
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Nothing tracked yet. Add your bond and insurance expiry dates below — those are the two
            that catch people out.
          </p>
        ) : (
          <div className="mt-4 table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Deadline</th>
                  <th scope="col">Type</th>
                  <th scope="col">Due</th>
                  <th scope="col">Reminders sent</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {open.map((deadline) => {
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
                        {deadline.notes && (
                          <span className="block text-sm font-normal" style={{ color: "var(--text-muted)" }}>
                            {deadline.notes}
                          </span>
                        )}
                      </th>
                      <td style={{ color: "var(--text-muted)" }}>
                        {KIND_LABELS[deadline.kind] ?? deadline.kind}
                      </td>
                      <td>
                        <div className="whitespace-nowrap">{formatDeadline(deadline.dueDate)}</div>
                        <span className={`badge ${tone} mt-1`}>
                          {describeDueDate(deadline.dueDate, today)}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {deadline.reminders.length === 0
                          ? "None yet"
                          : deadline.reminders
                              .map((r) => `${r.offsetDays}-day`)
                              .sort()
                              .join(", ")}
                      </td>
                      <td>
                        <CompleteDeadlineButton deadlineId={deadline.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-bold">Add a deadline</h2>
        <div className="mt-4">
          <DeadlineForm />
        </div>
      </div>

      {done.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold">Completed</h2>
          <ul className="mt-3 space-y-2">
            {done.map((deadline) => (
              <li key={deadline.id} className="text-sm" style={{ color: "var(--text-muted)" }}>
                · {deadline.label} — was due {formatDeadline(deadline.dueDate)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
