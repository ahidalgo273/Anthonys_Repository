"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getState } from "@/config/states";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { checkDocumentWithAi } from "@/lib/ai/document-check";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  buildStorageKey,
  deleteObject,
  putObject,
  sanitizeFilename,
} from "@/lib/storage";

/**
 * Portal server actions.
 *
 * Every one of these re-checks that the record belongs to the signed-in user.
 * A page that renders only your own data is not access control — the action is.
 */

export type PortalActionState = { ok: boolean; error?: string; message?: string };

/** Load an application, or refuse if it is not this user's. */
async function requireOwnApplication(applicationId: string, userId: string) {
  const application = await db.application.findFirst({
    where: { id: applicationId, userId },
  });
  if (!application) throw new Error("Application not found.");
  return application;
}

// ── Uploads ──────────────────────────────────────────────────────────────────

export async function uploadDocument(
  _previous: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const user = await requireUser("/portal/documents");

  const applicationId = String(formData.get("applicationId") ?? "");
  const requirementId = String(formData.get("requirementId") ?? "");
  const file = formData.get("file");
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please choose a file to upload." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB — try a smaller scan or photo.`,
    };
  }
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return {
      ok: false,
      error: "Please upload a PDF or a photo (JPG, PNG, HEIC, or WebP).",
    };
  }

  let application;
  try {
    application = await requireOwnApplication(applicationId, user.id);
  } catch {
    return { ok: false, error: "We could not find that application." };
  }

  const state = getState(application.stateCode);
  const requirement = state?.documents.find((d) => d.id === requirementId);
  if (!requirement) {
    return { ok: false, error: "That document type is not on your checklist." };
  }

  const amountCents = amountRaw ? Math.round(Number(amountRaw) * 100) : null;
  if (amountRaw && (amountCents === null || Number.isNaN(amountCents))) {
    return { ok: false, error: "Please enter the amount as a number, e.g. 50000." };
  }

  const expiresAt = expiresRaw ? new Date(`${expiresRaw}T00:00:00Z`) : null;
  if (expiresRaw && Number.isNaN(expiresAt?.getTime())) {
    return { ok: false, error: "Please enter a valid expiration date." };
  }

  const key = buildStorageKey({ applicationId, requirementId, filename: file.name });
  const bytes = Buffer.from(await file.arrayBuffer());
  await putObject(key, bytes, file.type);

  // Completeness checks. Deterministic rules always run; an AI image review is
  // added when a key is configured and the upload is a photo. NEITHER can
  // approve anything — the result is advisory and the document always lands in
  // review below.
  const checkResult = await checkDocumentWithAi({
    requirement,
    amountCents,
    expiresAt,
    sizeBytes: file.size,
    mimeType: file.type,
    fileData: bytes,
    today: new Date(),
  });

  const document = await db.document.create({
    data: {
      applicationId,
      requirementId,
      label: requirement.label,
      filename: sanitizeFilename(file.name),
      storageKey: key,
      mimeType: file.type,
      sizeBytes: file.size,
      amountCents,
      expiresAt,
      // LEGAL/QUALITY GUARDRAIL: a person reviews every document.
      status: "NEEDS_REVIEW",
      checkResult: JSON.parse(JSON.stringify(checkResult)),
    },
  });

  await logActivity({
    actorType: "client",
    actorEmail: user.email,
    entityType: "document",
    entityId: document.id,
    action: "document_uploaded",
    meta: { requirementId, findings: checkResult.findings.length },
  });

  // Move an application out of INTAKE the moment real work starts.
  if (application.stage === "INTAKE") {
    await db.application.update({
      where: { id: applicationId },
      data: { stage: "DOCUMENTS" },
    });
  }

  revalidatePath("/portal/documents");
  revalidatePath("/portal");

  const blocking = checkResult.findings.filter((f) => f.severity === "error");
  return {
    ok: true,
    message:
      blocking.length > 0
        ? `Uploaded — but check this before we review it: ${blocking[0].message}`
        : "Uploaded. We will review it and let you know if anything needs changing.",
  };
}

export async function deleteDocument(
  _previous: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const user = await requireUser("/portal/documents");
  const documentId = String(formData.get("documentId") ?? "");

  const document = await db.document.findFirst({
    where: { id: documentId, application: { userId: user.id } },
  });
  if (!document) return { ok: false, error: "We could not find that document." };

  // An accepted document is part of a reviewed file — removing it silently
  // would leave our records and the client's out of step.
  if (document.status === "ACCEPTED") {
    return {
      ok: false,
      error: "That document has already been accepted. Contact us if it needs to be replaced.",
    };
  }

  await deleteObject(document.storageKey);
  await db.document.delete({ where: { id: document.id } });

  await logActivity({
    actorType: "client",
    actorEmail: user.email,
    entityType: "document",
    entityId: document.id,
    action: "document_deleted",
  });

  revalidatePath("/portal/documents");
  return { ok: true, message: "Removed." };
}

// ── Application details ──────────────────────────────────────────────────────

export async function savePacketData(
  _previous: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const user = await requireUser("/portal/application");
  const applicationId = String(formData.get("applicationId") ?? "");

  let application;
  try {
    application = await requireOwnApplication(applicationId, user.id);
  } catch {
    return { ok: false, error: "We could not find that application." };
  }

  const state = getState(application.stateCode);
  if (!state) return { ok: false, error: "That state is not one we serve." };

  const data: Record<string, string> = {
    ...((application.packetData as Record<string, string>) ?? {}),
  };

  for (const group of state.packetFieldGroups) {
    for (const field of group.fields) {
      // PRIVACY GUARDRAIL: `blank_for_client` fields are never stored, even if
      // a value somehow arrives in the form post.
      if (field.type === "blank_for_client") continue;

      const raw = formData.get(field.id);
      if (raw === null) continue;
      data[field.id] = String(raw).trim().slice(0, 500);
    }
  }

  const businessName =
    typeof data.entity_legal_name === "string" && data.entity_legal_name.length > 0
      ? data.entity_legal_name
      : application.businessName;

  await db.application.update({
    where: { id: applicationId },
    data: { packetData: data, businessName },
  });

  await logActivity({
    actorType: "client",
    actorEmail: user.email,
    entityType: "application",
    entityId: applicationId,
    action: "packet_data_saved",
  });

  revalidatePath("/portal/application");
  revalidatePath("/portal/packet");
  return { ok: true, message: "Saved." };
}

// ── Compliance deadlines ─────────────────────────────────────────────────────

const deadlineSchema = z.object({
  kind: z.enum(["LICENSE_RENEWAL", "BOND_EXPIRY", "INSURANCE_EXPIRY", "OCCUPATION_TAX", "OTHER"]),
  label: z.string().trim().min(1, "Please give this deadline a name.").max(200),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date."),
  notes: z.string().trim().max(1000).optional(),
});

export async function saveDeadline(
  _previous: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const user = await requireUser("/portal/compliance");

  const parsed = deadlineSchema.safeParse({
    kind: formData.get("kind"),
    label: formData.get("label"),
    dueDate: formData.get("dueDate"),
    notes: formData.get("notes") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the fields." };
  }

  const application = await db.application.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const deadline = await db.deadline.create({
    data: {
      userId: user.id,
      applicationId: application?.id ?? null,
      kind: parsed.data.kind,
      label: parsed.data.label,
      dueDate: new Date(`${parsed.data.dueDate}T00:00:00Z`),
      notes: parsed.data.notes || null,
      source: "manual",
    },
  });

  await logActivity({
    actorType: "client",
    actorEmail: user.email,
    entityType: "deadline",
    entityId: deadline.id,
    action: "deadline_added",
  });

  revalidatePath("/portal/compliance");
  revalidatePath("/portal");
  return { ok: true, message: "Added to your calendar." };
}

export async function completeDeadline(
  _previous: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const user = await requireUser("/portal/compliance");
  const deadlineId = String(formData.get("deadlineId") ?? "");

  const updated = await db.deadline.updateMany({
    where: { id: deadlineId, userId: user.id },
    data: { completedAt: new Date() },
  });

  if (updated.count === 0) return { ok: false, error: "We could not find that deadline." };

  revalidatePath("/portal/compliance");
  revalidatePath("/portal");
  return { ok: true, message: "Marked complete. We will stop reminding you about it." };
}
