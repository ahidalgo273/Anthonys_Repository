"use client";

import { useActionState } from "react";
import { STAGES } from "@/components/stage-tracker";
import {
  addNote,
  addTask,
  completeTask,
  overrideDeadline,
  resolveAttorneyReferral,
  reviewDocument,
  saveSuite,
  setApplicationStage,
  setLeadStatus,
  type AdminActionState,
} from "@/lib/admin/actions";

const initial: AdminActionState = { ok: true };

function Feedback({ state }: { state: AdminActionState }) {
  if (state.error)
    return (
      <p className="field-error" role="alert">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p className="text-sm" role="status" style={{ color: "var(--success)" }}>
        {state.message}
      </p>
    );
  return null;
}

export function ReviewDocumentForm({ documentId }: { documentId: string }) {
  const [state, action, pending] = useActionState(reviewDocument, initial);

  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="documentId" value={documentId} />
      <label className="sr-only" htmlFor={`note-${documentId}`}>
        Review note
      </label>
      <input
        className="input"
        id={`note-${documentId}`}
        name="reviewNote"
        placeholder="Note to the client (required when rejecting)"
        maxLength={1000}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          name="decision"
          value="ACCEPTED"
          className="btn btn-primary"
          disabled={pending}
        >
          Accept
        </button>
        <button
          type="submit"
          name="decision"
          value="REJECTED"
          className="btn btn-danger"
          disabled={pending}
        >
          Reject
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function StageForm({
  applicationId,
  currentStage,
}: {
  applicationId: string;
  currentStage: string;
}) {
  const [state, action, pending] = useActionState(setApplicationStage, initial);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <div>
        <label className="label" htmlFor={`stage-${applicationId}`}>
          Stage
        </label>
        <select
          className="select"
          id={`stage-${applicationId}`}
          name="stage"
          defaultValue={currentStage}
        >
          {STAGES.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-secondary" disabled={pending}>
        {pending ? "Saving…" : "Update"}
      </button>
      <div className="w-full">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function NoteForm({
  leadId,
  applicationId,
}: {
  leadId?: string;
  applicationId?: string;
}) {
  const [state, action, pending] = useActionState(addNote, initial);

  return (
    <form action={action} className="space-y-2">
      {leadId && <input type="hidden" name="leadId" value={leadId} />}
      {applicationId && <input type="hidden" name="applicationId" value={applicationId} />}
      <label className="label" htmlFor="note-body">
        Add a note
      </label>
      <textarea className="textarea" id="note-body" name="body" rows={3} maxLength={5000} />
      <button type="submit" className="btn btn-secondary" disabled={pending}>
        {pending ? "Saving…" : "Save note"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function TaskForm({
  leadId,
  applicationId,
}: {
  leadId?: string;
  applicationId?: string;
}) {
  const [state, action, pending] = useActionState(addTask, initial);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {leadId && <input type="hidden" name="leadId" value={leadId} />}
      {applicationId && <input type="hidden" name="applicationId" value={applicationId} />}

      <div className="sm:col-span-2">
        <label className="label" htmlFor="task-title">
          Task
        </label>
        <input className="input" id="task-title" name="title" required maxLength={200} />
      </div>

      <div className="sm:col-span-2">
        <label className="label" htmlFor="task-detail">
          Detail (optional)
        </label>
        <input className="input" id="task-detail" name="detail" maxLength={2000} />
      </div>

      <div>
        <label className="label" htmlFor="task-due">
          Due date
        </label>
        <input className="input" id="task-due" name="dueDate" type="date" />
      </div>

      <div>
        <label className="label" htmlFor="task-audience">
          Who is it for?
        </label>
        <select className="select" id="task-audience" name="audience" defaultValue="admin">
          <option value="admin">Me</option>
          <option value="client">The client (shows in their portal)</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <button type="submit" className="btn btn-secondary" disabled={pending}>
          {pending ? "Adding…" : "Add task"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function CompleteTaskButton({ taskId }: { taskId: string }) {
  const [state, action, pending] = useActionState(completeTask, initial);
  return (
    <form action={action} className="inline">
      <input type="hidden" name="taskId" value={taskId} />
      <button type="submit" className="btn btn-ghost" disabled={pending}>
        {pending ? "…" : "Done"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function LeadStatusForm({ leadId, status }: { leadId: string; status: string }) {
  const [state, action, pending] = useActionState(setLeadStatus, initial);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="leadId" value={leadId} />
      <div>
        <label className="label" htmlFor={`status-${leadId}`}>
          Lead status
        </label>
        <select className="select" id={`status-${leadId}`} name="status" defaultValue={status}>
          {["NEW", "SCREENED", "ATTORNEY_REFERRAL", "CONVERTED", "LOST"].map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, " ").toLowerCase()}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-secondary" disabled={pending}>
        {pending ? "Saving…" : "Update"}
      </button>
      <div className="w-full">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function ResolveReferralButton({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(resolveAttorneyReferral, initial);

  return (
    <form action={action}>
      <input type="hidden" name="leadId" value={leadId} />
      <button type="submit" className="btn btn-secondary" disabled={pending}>
        {pending ? "Saving…" : "Mark as referred"}
      </button>
      <p className="hint mt-1">
        Clears the flag once you have actually made the referral. The reason stays on the record.
      </p>
      <Feedback state={state} />
    </form>
  );
}

export function DeadlineOverrideForm({
  deadlineId,
  currentDate,
}: {
  deadlineId: string;
  currentDate: string;
}) {
  const [state, action, pending] = useActionState(overrideDeadline, initial);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="deadlineId" value={deadlineId} />
      <label className="sr-only" htmlFor={`due-${deadlineId}`}>
        New due date
      </label>
      <input
        className="input w-auto"
        id={`due-${deadlineId}`}
        name="dueDate"
        type="date"
        defaultValue={currentDate}
      />
      <button type="submit" className="btn btn-ghost whitespace-nowrap" disabled={pending}>
        {pending ? "…" : "Override"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function SuiteForm({
  suite,
}: {
  suite?: {
    id: string;
    name: string;
    sqFt: number;
    monthlyRentCents: number;
    status: string;
    tenantEmail: string | null;
    leaseStart: string | null;
    leaseEnd: string | null;
    notes: string | null;
  };
}) {
  const [state, action, pending] = useActionState(saveSuite, initial);
  const id = suite?.id ?? "new";

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {suite && <input type="hidden" name="suiteId" value={suite.id} />}

      <div>
        <label className="label" htmlFor={`name-${id}`}>
          Suite name
        </label>
        <input
          className="input"
          id={`name-${id}`}
          name="name"
          required
          maxLength={60}
          defaultValue={suite?.name ?? ""}
          placeholder="Suite 210"
        />
      </div>

      <div>
        <label className="label" htmlFor={`sqft-${id}`}>
          Square feet
        </label>
        <input
          className="input"
          id={`sqft-${id}`}
          name="sqFt"
          type="number"
          min="1"
          required
          defaultValue={suite?.sqFt ?? 250}
        />
      </div>

      <div>
        <label className="label" htmlFor={`rent-${id}`}>
          Monthly rent (dollars)
        </label>
        <input
          className="input"
          id={`rent-${id}`}
          name="monthlyRent"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={suite ? suite.monthlyRentCents / 100 : 549}
        />
      </div>

      <div>
        <label className="label" htmlFor={`status-${id}`}>
          Status
        </label>
        <select
          className="select"
          id={`status-${id}`}
          name="status"
          defaultValue={suite?.status ?? "VACANT"}
        >
          <option value="VACANT">Vacant</option>
          <option value="RESERVED">Reserved</option>
          <option value="OCCUPIED">Occupied</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="label" htmlFor={`tenant-${id}`}>
          Tenant email (optional)
        </label>
        <input
          className="input"
          id={`tenant-${id}`}
          name="tenantEmail"
          type="email"
          defaultValue={suite?.tenantEmail ?? ""}
        />
        <p className="hint">Must match an existing client account.</p>
      </div>

      <div>
        <label className="label" htmlFor={`start-${id}`}>
          Lease start
        </label>
        <input
          className="input"
          id={`start-${id}`}
          name="leaseStart"
          type="date"
          defaultValue={suite?.leaseStart ?? ""}
        />
      </div>

      <div>
        <label className="label" htmlFor={`end-${id}`}>
          Lease end
        </label>
        <input
          className="input"
          id={`end-${id}`}
          name="leaseEnd"
          type="date"
          defaultValue={suite?.leaseEnd ?? ""}
        />
      </div>

      <div className="sm:col-span-2">
        <label className="label" htmlFor={`notes-${id}`}>
          Notes
        </label>
        <textarea
          className="textarea"
          id={`notes-${id}`}
          name="notes"
          rows={2}
          maxLength={1000}
          defaultValue={suite?.notes ?? ""}
        />
      </div>

      <div className="sm:col-span-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : suite ? "Update suite" : "Add suite"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}
