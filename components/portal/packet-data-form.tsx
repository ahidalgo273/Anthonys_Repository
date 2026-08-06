"use client";

import { useActionState } from "react";
import type { PacketFieldGroup } from "@/config/states";
import { savePacketData, type PortalActionState } from "@/lib/portal/actions";

const initialState: PortalActionState = { ok: true };

/**
 * Collects the data that goes into the packet.
 *
 * The fields are generated from the state config, so a state adding a required
 * field means editing config/states/*.ts — not this component.
 */
export function PacketDataForm({
  applicationId,
  groups,
  values,
}: {
  applicationId: string;
  groups: PacketFieldGroup[];
  values: Record<string, string>;
}) {
  const [state, action, pending] = useActionState(savePacketData, initialState);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="applicationId" value={applicationId} />

      {groups.map((group) => (
        <fieldset key={group.id} className="card">
          <legend className="text-lg font-bold">{group.title}</legend>
          {group.note && (
            <p className="mt-1 mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
              {group.note}
            </p>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => {
              // PRIVACY GUARDRAIL: never rendered as an input. It is shown as a
              // read-only note so the client knows it is coming, and printed as
              // a blank line in the packet.
              if (field.type === "blank_for_client") {
                return (
                  <div key={field.id} className="sm:col-span-2">
                    <p className="label">{field.label}</p>
                    <div
                      className="rounded-md border border-dashed px-3 py-2 text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Left blank on purpose — you complete this by hand on your signed copy.
                      {field.hint ? ` ${field.hint}` : ""}
                    </div>
                  </div>
                );
              }

              const wide = field.type === "address";

              return (
                <div key={field.id} className={wide ? "sm:col-span-2" : undefined}>
                  <label className="label" htmlFor={field.id}>
                    {field.label}
                  </label>
                  <input
                    className="input"
                    id={field.id}
                    name={field.id}
                    type={inputType(field.type)}
                    defaultValue={values[field.id] ?? ""}
                    aria-describedby={field.hint ? `${field.id}-hint` : undefined}
                  />
                  {field.hint && (
                    <p className="hint" id={`${field.id}-hint`}>
                      {field.hint}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}

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

      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save details"}
        </button>
      </div>
    </form>
  );
}

function inputType(fieldType: string): string {
  switch (fieldType) {
    case "date":
      return "date";
    case "email":
      return "email";
    case "phone":
      return "tel";
    case "money":
      return "number";
    default:
      return "text";
  }
}
