import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * The activity log — an append-only record of what happened to a file.
 *
 * Logging must never break the thing being logged, so failures are swallowed
 * with a console error rather than thrown.
 */
export async function logActivity({
  actorType,
  actorEmail,
  entityType,
  entityId,
  action,
  meta,
}: {
  actorType: "admin" | "client" | "system";
  actorEmail?: string | null;
  entityType: "lead" | "application" | "document" | "deadline" | "suite" | "user";
  entityId: string;
  action: string;
  meta?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        actorType,
        actorEmail: actorEmail ?? null,
        entityType,
        entityId,
        action,
        ...(meta === undefined ? {} : { meta }),
      },
    });
  } catch (error) {
    console.error("[activity] Failed to write log entry:", error);
  }
}
