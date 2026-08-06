import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CompleteTaskButton,
  LeadStatusForm,
  NoteForm,
  ResolveReferralButton,
  TaskForm,
} from "@/components/admin/admin-forms";
import { getState } from "@/config/states";
import { db } from "@/lib/db";
import { screenApplicant } from "@/lib/rules/screening";

export const metadata = { title: "Lead detail" };

export default async function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" } },
      aiInteractions: { orderBy: { createdAt: "desc" }, take: 25 },
      user: true,
    },
  });

  if (!lead) notFound();

  const state = lead.stateCode ? getState(lead.stateCode) : undefined;
  const answers = (lead.screeningAnswers as Record<string, string | boolean>) ?? {};

  // Recomputed from the saved answers rather than read from the stored result,
  // so the admin sees the verdict under today's rules.
  const result =
    lead.stateCode && Object.keys(answers).length > 0
      ? screenApplicant(lead.stateCode, answers)
      : null;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="text-sm underline underline-offset-4"
          style={{ color: "var(--text-muted)" }}
        >
          ← Pipeline
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{lead.name ?? lead.email}</h1>
        <p className="mt-1" style={{ color: "var(--text-muted)" }}>
          {lead.email}
          {lead.phone ? ` · ${lead.phone}` : ""} · from {lead.source} ·{" "}
          {lead.createdAt.toLocaleDateString("en-US")}
        </p>
        {lead.user && (
          <Link
            href={`/admin/clients/${lead.user.id}`}
            className="btn btn-secondary mt-3"
          >
            Open client account
          </Link>
        )}
      </div>

      {/* ── Attorney referral ─────────────────────────────────────────────── */}
      {lead.attorneyReferral && (
        <div
          className="rounded-xl border-2 p-5"
          style={{ borderColor: "var(--danger)", backgroundColor: "var(--danger-soft)" }}
        >
          <h2 className="text-lg font-bold">⚠ Attorney referral requested</h2>
          <p className="mt-1 text-sm">
            This person asked something we do not answer. Do not give an opinion — connect them with
            an attorney.
          </p>
          {lead.attorneyReferralReason && (
            <p className="mt-3 text-sm">
              <strong>Recorded reason:</strong> {lead.attorneyReferralReason}
            </p>
          )}
          {lead.attorneyReferralAt && (
            <p className="mt-1 text-sm">
              Flagged {lead.attorneyReferralAt.toLocaleString("en-US")}
            </p>
          )}
          <div className="mt-4">
            <ResolveReferralButton leadId={lead.id} />
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Intake summary ──────────────────────────────────────────────── */}
        <section className="card">
          <h2 className="text-lg font-bold">Intake</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="State" value={state ? `${state.name} — ${state.licenseType}` : "—"} />
            <Row label="Goal" value={lead.goal ?? "—"} />
            <Row label="Timeline" value={lead.timeline ?? "—"} />
            <Row label="Package selected" value={lead.selectedPackage ?? "—"} />
            <Row label="Last step completed" value={lead.lastStep ?? "—"} />
            <Row
              label="Acknowledged disclaimer"
              value={lead.acknowledgedAt ? lead.acknowledgedAt.toLocaleString("en-US") : "Not yet"}
            />
          </dl>

          <div className="mt-5">
            <LeadStatusForm leadId={lead.id} status={lead.status} />
          </div>
        </section>

        {/* ── Screening ───────────────────────────────────────────────────── */}
        <section className="card">
          <h2 className="text-lg font-bold">Screening</h2>

          {!result ? (
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Screening not completed.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm">
                <span className={`badge ${result.eligible ? "badge-success" : "badge-danger"}`}>
                  {result.eligible ? "No blockers" : `${result.blockers.length} blocker(s)`}
                </span>
                {result.warnings.length > 0 && (
                  <span className="badge badge-warning ml-2">
                    {result.warnings.length} warning(s)
                  </span>
                )}
              </p>

              {result.blockers.map((item) => (
                <p key={item.questionId} className="mt-3 text-sm" style={{ color: "var(--danger)" }}>
                  <strong>{item.question}</strong>
                  <span className="block">{item.message}</span>
                </p>
              ))}

              {result.warnings.map((item) => (
                <p key={item.questionId} className="mt-3 text-sm" style={{ color: "var(--warning)" }}>
                  <strong>{item.question}</strong>
                  <span className="block">{item.message}</span>
                </p>
              ))}

              <h3 className="mt-5 font-semibold text-sm">Raw answers</h3>
              <dl className="mt-2 space-y-1 text-sm">
                {state?.screening.map((question) => {
                  const answer = answers[question.id];
                  if (answer === undefined || answer === "") return null;
                  return (
                    <Row
                      key={question.id}
                      label={question.question}
                      value={typeof answer === "boolean" ? (answer ? "Yes" : "No") : String(answer)}
                    />
                  );
                })}
              </dl>
            </>
          )}
        </section>
      </div>

      {/* ── AI interactions ───────────────────────────────────────────────── */}
      {lead.aiInteractions.length > 0 && (
        <section className="card">
          <h2 className="text-lg font-bold">Assistant conversations</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Requests the guardrail refused are marked. They are the audit trail that we did not give
            legal advice.
          </p>
          <ul className="mt-3 space-y-2">
            {lead.aiInteractions.map((interaction) => (
              <li key={interaction.id} className="text-sm border-t pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge badge-neutral">{interaction.kind}</span>
                  {interaction.blocked && (
                    <span className="badge badge-danger">
                      refused by {interaction.blockedBy ?? "guardrail"}
                    </span>
                  )}
                  {interaction.triggeredReferral && (
                    <span className="badge badge-warning">created referral</span>
                  )}
                  {!interaction.usedModel && (
                    <span className="badge badge-neutral">fallback (no AI)</span>
                  )}
                  <span style={{ color: "var(--text-muted)" }}>
                    {interaction.createdAt.toLocaleString("en-US")}
                  </span>
                </div>
                {interaction.userMessage && (
                  <p className="mt-1" style={{ color: "var(--text-muted)" }}>
                    &ldquo;{interaction.userMessage}&rdquo;
                  </p>
                )}
                {interaction.blockReason && (
                  <p className="mt-1" style={{ color: "var(--danger)" }}>
                    {interaction.blockReason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Notes and tasks ───────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="text-lg font-bold">Notes</h2>
          {lead.notes.length > 0 && (
            <ul className="mt-3 mb-4 space-y-2">
              {lead.notes.map((note) => (
                <li key={note.id} className="text-sm">
                  {note.body}
                  <span className="block" style={{ color: "var(--text-muted)" }}>
                    {note.authorEmail} · {note.createdAt.toLocaleString("en-US")}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <NoteForm leadId={lead.id} />
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Tasks</h2>
          {lead.tasks.length > 0 && (
            <ul className="mt-3 mb-4 space-y-2">
              {lead.tasks.map((task) => (
                <li key={task.id} className="text-sm">
                  <span className={task.completedAt ? "line-through" : ""}>{task.title}</span>
                  {!task.completedAt && <CompleteTaskButton taskId={task.id} />}
                </li>
              ))}
            </ul>
          )}
          <TaskForm leadId={lead.id} />
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2">
      <dt style={{ color: "var(--text-muted)" }}>{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
