"use client";

import { useActionState } from "react";
import { completeDeadline, saveDeadline, type PortalActionState } from "@/lib/portal/actions";

const initialState: PortalActionState = { ok: true };

const KINDS = [
  { value: "LICENSE_RENEWAL", label: "License renewal" },
  { value: "BOND_EXPIRY", label: "Surety bond expiration" },
  { value: "INSURANCE_EXPIRY", label: "Insurance expiration" },
  { value: "OCCUPATION_TAX", label: "Occupation tax renewal" },
  { value: "OTHER", label: "Something else" },
];

export function DeadlineForm() {
  const [state, action, pending] = useActionState(saveDeadline, initialState);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="deadline-kind">
          Type
        </label>
        <select className="select" id="deadline-kind" name="kind" defaultValue="BOND_EXPIRY">
          {KINDS.map((kind) => (
            <option key={kind.value} value={kind.value}>
              {kind.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="deadline-date">
          Due date
        </label>
        <input className="input" id="deadline-date" name="dueDate" type="date" required />
      </div>

      <div className="sm:col-span-2">
        <label className="label" htmlFor="deadline-label">
          What is it?
        </label>
        <input
          className="input"
          id="deadline-label"
          name="label"
          required
          maxLength={200}
          placeholder="e.g. Surety bond renewal — Acme Surety #GA-12345"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="label" htmlFor="deadline-notes">
          Notes (optional)
        </label>
        <textarea className="textarea" id="deadline-notes" name="notes" rows={2} maxLength={1000} />
      </div>

      <div className="sm:col-span-2">
        {state.error && (
          <p className="field-error" role="alert">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="text-sm" role="status" style={{ color: "var(--success)" }}>
            {state.message}
          </p>
        )}
        <button type="submit" className="btn btn-primary mt-2" disabled={pending}>
          {pending ? "Adding…" : "Add to my calendar"}
        </button>
      </div>
    </form>
  );
}

export function CompleteDeadlineButton({ deadlineId }: { deadlineId: string }) {
  const [state, action, pending] = useActionState(completeDeadline, initialState);

  return (
    <form action={action}>
      <input type="hidden" name="deadlineId" value={deadlineId} />
      <button type="submit" className="btn btn-ghost whitespace-nowrap" disabled={pending}>
        {pending ? "Saving…" : "Mark done"}
      </button>
      {state.error && (
        <span className="field-error" role="alert">
          {state.error}
        </span>
      )}
    </form>
  );
}
