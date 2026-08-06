"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getState } from "@/config/states";
import { logActivity } from "@/lib/activity";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { packetReadyEmail } from "@/lib/email/templates";

/**
 * Admin server actions.
 *
 * Every one starts with requireAdmin(). The admin layout also checks, but a
 * server action is directly callable — the layout is not the gate.
 */

export type AdminActionState = { ok: boolean; error?: string; message?: string };

// ── Documents ────────────────────────────────────────────────────────────────

export async function reviewDocument(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();

  const documentId = String(formData.get("documentId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("reviewNote") ?? "").trim();

  if (decision !== "ACCEPTED" && decision !== "REJECTED") {
    return { ok: false, error: "Choose accept or reject." };
  }
  if (decision === "REJECTED" && note.length === 0) {
    // A rejection with no reason is a support ticket waiting to happen.
    return { ok: false, error: "Please say why it was rejected — the client sees this note." };
  }

  const document = await db.document.findUnique({ where: { id: documentId } });
  if (!document) return { ok: false, error: "We could not find that document." };

  await db.document.update({
    where: { id: documentId },
    data: {
      status: decision,
      reviewNote: note || null,
      reviewedAt: new Date(),
      reviewedByEmail: admin.email,
    },
  });

  await logActivity({
    actorType: "admin",
    actorEmail: admin.email,
    entityType: "document",
    entityId: documentId,
    action: decision === "ACCEPTED" ? "document_accepted" : "document_rejected",
    meta: { note },
  });

  revalidatePath("/admin");
  return { ok: true, message: decision === "ACCEPTED" ? "Accepted." : "Rejected — the client will see your note." };
}

// ── Application stage ────────────────────────────────────────────────────────

const stageSchema = z.enum([
  "INTAKE",
  "DOCUMENTS",
  "PACKET_READY",
  "CLIENT_FILED",
  "INSPECTION",
  "LICENSED",
]);

export async function setApplicationStage(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();

  const applicationId = String(formData.get("applicationId") ?? "");
  const parsed = stageSchema.safeParse(formData.get("stage"));
  if (!parsed.success) return { ok: false, error: "That is not a valid stage." };

  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: { user: true },
  });
  if (!application) return { ok: false, error: "We could not find that application." };

  const stage = parsed.data;
  const licensedAt = stage === "LICENSED" ? (application.licensedAt ?? new Date()) : application.licensedAt;
  const filedAt = stage === "CLIENT_FILED" ? (application.filedAt ?? new Date()) : application.filedAt;

  await db.application.update({
    where: { id: applicationId },
    data: { stage, licensedAt, filedAt },
  });

  await logActivity({
    actorType: "admin",
    actorEmail: admin.email,
    entityType: "application",
    entityId: applicationId,
    action: "stage_changed",
    meta: { from: application.stage, to: stage },
  });

  // Tell the client when their packet becomes available — that is the moment
  // they have something to do.
  if (stage === "PACKET_READY" && application.stage !== "PACKET_READY") {
    const state = getState(application.stateCode);
    await sendEmail(
      packetReadyEmail({
        to: application.user.email,
        name: application.user.name,
        stateName: state?.name ?? application.stateCode,
      }),
    );
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${application.userId}`);
  return { ok: true, message: `Moved to ${stage.replace(/_/g, " ").toLowerCase()}.` };
}

// ── Notes and tasks ──────────────────────────────────────────────────────────

export async function addNote(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();

  const body = String(formData.get("body") ?? "").trim();
  const leadId = String(formData.get("leadId") ?? "") || null;
  const applicationId = String(formData.get("applicationId") ?? "") || null;

  if (!body) return { ok: false, error: "Write something first." };
  if (!leadId && !applicationId) return { ok: false, error: "Notes must attach to a lead or a filing." };

  await db.note.create({
    data: { body: body.slice(0, 5000), authorEmail: admin.email, leadId, applicationId },
  });

  revalidatePath("/admin");
  if (leadId) revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true, message: "Note added." };
}

export async function addTask(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const detail = String(formData.get("detail") ?? "").trim();
  const dueRaw = String(formData.get("dueDate") ?? "").trim();
  const audience = formData.get("audience") === "client" ? "client" : "admin";
  const leadId = String(formData.get("leadId") ?? "") || null;
  const applicationId = String(formData.get("applicationId") ?? "") || null;

  if (!title) return { ok: false, error: "Give the task a title." };

  const dueDate = dueRaw ? new Date(`${dueRaw}T00:00:00Z`) : null;
  if (dueRaw && Number.isNaN(dueDate?.getTime())) {
    return { ok: false, error: "That due date is not valid." };
  }

  await db.task.create({
    data: {
      title: title.slice(0, 200),
      detail: detail.slice(0, 2000) || null,
      dueDate,
      audience,
      leadId,
      applicationId,
    },
  });

  revalidatePath("/admin");
  if (applicationId) revalidatePath("/portal");
  return { ok: true, message: "Task added." };
}

export async function completeTask(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const taskId = String(formData.get("taskId") ?? "");

  await db.task.update({ where: { id: taskId }, data: { completedAt: new Date() } });

  revalidatePath("/admin");
  return { ok: true, message: "Done." };
}

// ── Leads ────────────────────────────────────────────────────────────────────

export async function setLeadStatus(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();

  const leadId = String(formData.get("leadId") ?? "");
  const parsed = z
    .enum(["NEW", "SCREENED", "ATTORNEY_REFERRAL", "CONVERTED", "LOST"])
    .safeParse(formData.get("status"));

  if (!parsed.success) return { ok: false, error: "That is not a valid status." };

  await db.lead.update({ where: { id: leadId }, data: { status: parsed.data } });

  await logActivity({
    actorType: "admin",
    actorEmail: admin.email,
    entityType: "lead",
    entityId: leadId,
    action: "lead_status_changed",
    meta: { to: parsed.data },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true, message: "Status updated." };
}

/**
 * Clear an attorney-referral flag once the referral has actually been made.
 *
 * The flag is not deleted quietly: the reason stays on the record and the
 * activity log keeps the history.
 */
export async function resolveAttorneyReferral(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const leadId = String(formData.get("leadId") ?? "");

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { ok: false, error: "We could not find that lead." };

  await db.lead.update({
    where: { id: leadId },
    data: {
      attorneyReferral: false,
      status: lead.status === "ATTORNEY_REFERRAL" ? "SCREENED" : lead.status,
    },
  });

  await logActivity({
    actorType: "admin",
    actorEmail: admin.email,
    entityType: "lead",
    entityId: leadId,
    action: "attorney_referral_resolved",
    meta: { originalReason: lead.attorneyReferralReason },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true, message: "Marked as referred." };
}

// ── Deadlines ────────────────────────────────────────────────────────────────

export async function overrideDeadline(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();

  const deadlineId = String(formData.get("deadlineId") ?? "");
  const dueRaw = String(formData.get("dueDate") ?? "").trim();

  const dueDate = dueRaw ? new Date(`${dueRaw}T00:00:00Z`) : null;
  if (!dueDate || Number.isNaN(dueDate.getTime())) {
    return { ok: false, error: "Please choose a valid date." };
  }

  const deadline = await db.deadline.findUnique({ where: { id: deadlineId } });
  if (!deadline) return { ok: false, error: "We could not find that deadline." };

  await db.deadline.update({
    where: { id: deadlineId },
    data: { dueDate, source: "manual" },
  });

  // Moving a deadline resets its reminders, so the client gets the 90/60/30
  // sequence against the new date instead of silence.
  await db.reminderLog.deleteMany({ where: { deadlineId } });

  await logActivity({
    actorType: "admin",
    actorEmail: admin.email,
    entityType: "deadline",
    entityId: deadlineId,
    action: "deadline_overridden",
    meta: { from: deadline.dueDate.toISOString(), to: dueDate.toISOString() },
  });

  revalidatePath("/admin/deadlines");
  return { ok: true, message: "Date updated and reminders reset." };
}

// ── Suites ───────────────────────────────────────────────────────────────────

const suiteSchema = z.object({
  name: z.string().trim().min(1, "Give the suite a name.").max(60),
  sqFt: z.coerce.number().int().min(1, "Square footage must be a positive number."),
  monthlyRent: z.coerce.number().min(0, "Rent cannot be negative."),
  status: z.enum(["VACANT", "RESERVED", "OCCUPIED"]),
  tenantEmail: z.string().trim().max(254).optional(),
  leaseStart: z.string().optional(),
  leaseEnd: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function saveSuite(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();

  const suiteId = String(formData.get("suiteId") ?? "");
  const parsed = suiteSchema.safeParse({
    name: formData.get("name"),
    sqFt: formData.get("sqFt"),
    monthlyRent: formData.get("monthlyRent"),
    status: formData.get("status"),
    tenantEmail: formData.get("tenantEmail") ?? undefined,
    leaseStart: formData.get("leaseStart") ?? undefined,
    leaseEnd: formData.get("leaseEnd") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the fields." };
  }

  const { name, sqFt, monthlyRent, status, tenantEmail, leaseStart, leaseEnd, notes } = parsed.data;

  let tenantUserId: string | null = null;
  if (tenantEmail) {
    const tenant = await db.user.findUnique({ where: { email: tenantEmail.toLowerCase() } });
    if (!tenant) {
      return {
        ok: false,
        error: `No client account for ${tenantEmail}. They need an account before you can link them to a suite.`,
      };
    }
    tenantUserId = tenant.id;
  }

  const data = {
    name,
    sqFt,
    monthlyRentCents: Math.round(monthlyRent * 100),
    status,
    tenantUserId,
    leaseStart: leaseStart ? new Date(`${leaseStart}T00:00:00Z`) : null,
    leaseEnd: leaseEnd ? new Date(`${leaseEnd}T00:00:00Z`) : null,
    notes: notes || null,
  };

  try {
    const suite = suiteId
      ? await db.suite.update({ where: { id: suiteId }, data })
      : await db.suite.create({ data });

    await logActivity({
      actorType: "admin",
      actorEmail: admin.email,
      entityType: "suite",
      entityId: suite.id,
      action: suiteId ? "suite_updated" : "suite_created",
    });
  } catch {
    return { ok: false, error: `A suite named "${name}" already exists.` };
  }

  revalidatePath("/admin/suites");
  return { ok: true, message: suiteId ? "Suite updated." : "Suite added." };
}
