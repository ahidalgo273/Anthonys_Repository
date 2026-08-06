"use client";

import { useActionState, useState } from "react";
import type { DocumentRequirement } from "@/config/states";
import { formatUsd } from "@/config/pricing";
import { deleteDocument, uploadDocument, type PortalActionState } from "@/lib/portal/actions";

type PortalDocument = {
  id: string;
  requirementId: string;
  filename: string;
  status: string;
  sizeBytes: number;
  createdAt: string;
  reviewNote: string | null;
  checkResult: { findings?: { severity: string; message: string }[] } | null;
};

const initialState: PortalActionState = { ok: true };

export function DocumentChecklist({
  applicationId,
  requirements,
  documents,
}: {
  applicationId: string;
  requirements: DocumentRequirement[];
  documents: PortalDocument[];
}) {
  return (
    <div className="space-y-4">
      {requirements.map((requirement) => (
        <RequirementCard
          key={requirement.id}
          applicationId={applicationId}
          requirement={requirement}
          documents={documents.filter((d) => d.requirementId === requirement.id)}
        />
      ))}
    </div>
  );
}

function RequirementCard({
  applicationId,
  requirement,
  documents,
}: {
  applicationId: string;
  requirement: DocumentRequirement;
  documents: PortalDocument[];
}) {
  const [uploadState, uploadAction, uploading] = useActionState(uploadDocument, initialState);
  const [expanded, setExpanded] = useState(documents.length === 0);

  const accepted = documents.find((d) => d.status === "ACCEPTED");
  const latest = documents[0];

  const badge = accepted
    ? { className: "badge-success", label: "Accepted" }
    : latest?.status === "REJECTED"
      ? { className: "badge-danger", label: "Needs a new copy" }
      : latest
        ? { className: "badge-info", label: "In review" }
        : { className: "badge-neutral", label: requirement.required ? "Needed" : "Optional" };

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-[16rem]">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold">{requirement.label}</h3>
            <span className={`badge ${badge.className}`}>{badge.label}</span>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {requirement.description}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Comes from: <strong>{requirement.source}</strong>
            {requirement.checks?.minAmountCents !== undefined && (
              <> · Minimum amount: {formatUsd(requirement.checks.minAmountCents)}</>
            )}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded ? "Close" : documents.length > 0 ? "Upload another" : "Upload"}
        </button>
      </div>

      {documents.length > 0 && (
        <ul className="mt-4 space-y-3 border-t pt-4">
          {documents.map((document) => (
            <li key={document.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <a
                    href={`/api/documents/${document.id}`}
                    className="font-medium underline underline-offset-4"
                    style={{ color: "var(--info)" }}
                  >
                    {document.filename}
                  </a>
                  <span style={{ color: "var(--text-muted)" }}>
                    {(document.sizeBytes / 1024).toFixed(0)} KB ·{" "}
                    {new Date(document.createdAt).toLocaleDateString("en-US")}
                  </span>
                  <span className={`badge ${statusTone(document.status)}`}>
                    {statusLabel(document.status)}
                  </span>
                </div>

                {document.status !== "ACCEPTED" && <DeleteButton documentId={document.id} />}
              </div>

              {document.reviewNote && (
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  <strong>Reviewer note:</strong> {document.reviewNote}
                </p>
              )}

              {(document.checkResult?.findings ?? [])
                .filter((finding) => finding.severity !== "info")
                .map((finding, index) => (
                  <p
                    key={index}
                    className="mt-1 text-sm"
                    style={{
                      color: finding.severity === "error" ? "var(--danger)" : "var(--warning)",
                    }}
                  >
                    {finding.severity === "error" ? "⚠ " : "· "}
                    {finding.message}
                  </p>
                ))}
            </li>
          ))}
        </ul>
      )}

      {expanded && (
        <form action={uploadAction} className="mt-4 space-y-3 border-t pt-4">
          <input type="hidden" name="applicationId" value={applicationId} />
          <input type="hidden" name="requirementId" value={requirement.id} />

          <div>
            <label className="label" htmlFor={`file-${requirement.id}`}>
              Choose a file
            </label>
            <input
              className="input"
              id={`file-${requirement.id}`}
              name="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
              required
            />
            <p className="hint">PDF or photo, up to 15 MB. Make sure every corner is readable.</p>
          </div>

          {requirement.checks?.minAmountCents !== undefined && (
            <div>
              <label className="label" htmlFor={`amount-${requirement.id}`}>
                Amount shown on this document
              </label>
              <input
                className="input"
                id={`amount-${requirement.id}`}
                name="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder={String(requirement.checks.minAmountCents / 100)}
              />
              <p className="hint">
                In dollars. We check it against the {formatUsd(requirement.checks.minAmountCents)}{" "}
                state minimum.
              </p>
            </div>
          )}

          {requirement.checks?.mustNotBeExpired && (
            <div>
              <label className="label" htmlFor={`expires-${requirement.id}`}>
                Expiration date
              </label>
              <input
                className="input"
                id={`expires-${requirement.id}`}
                name="expiresAt"
                type="date"
              />
              <p className="hint">We add this to your compliance calendar and remind you before it lapses.</p>
            </div>
          )}

          {uploadState.error && (
            <p className="field-error" role="alert">
              {uploadState.error}
            </p>
          )}
          {uploadState.message && (
            <p className="text-sm" role="status" style={{ color: "var(--success)" }}>
              {uploadState.message}
            </p>
          )}

          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? "Uploading…" : "Upload document"}
          </button>
        </form>
      )}
    </div>
  );
}

function DeleteButton({ documentId }: { documentId: string }) {
  const [state, action, pending] = useActionState(deleteDocument, initialState);

  return (
    <form action={action}>
      <input type="hidden" name="documentId" value={documentId} />
      <button type="submit" className="btn btn-ghost" disabled={pending}>
        {pending ? "Removing…" : "Remove"}
      </button>
      {state.error && (
        <span className="field-error" role="alert">
          {state.error}
        </span>
      )}
    </form>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "ACCEPTED":
      return "Accepted";
    case "REJECTED":
      return "Rejected";
    case "NEEDS_REVIEW":
      return "In review";
    default:
      return "Uploaded";
  }
}

function statusTone(status: string): string {
  switch (status) {
    case "ACCEPTED":
      return "badge-success";
    case "REJECTED":
      return "badge-danger";
    default:
      return "badge-info";
  }
}
