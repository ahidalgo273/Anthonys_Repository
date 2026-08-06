import { NextResponse } from "next/server";
import { purgeExpiredTokens } from "@/lib/auth/magic-link";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { deadlineReminderEmail } from "@/lib/email/templates";
import { formatDeadline, remindersDue, reminderKey } from "@/lib/rules/deadlines";

/**
 * The daily job: send deadline reminders and clean up expired tokens.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NON-DEVELOPER NOTE
 * Run this once a day. On Vercel, vercel.json already schedules it. Anywhere
 * else, point a scheduler at:
 *
 *     curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
 *          https://yourdomain.com/api/cron/reminders
 *
 * It is safe to run more than once a day — the ReminderLog stops anyone
 * receiving the same reminder twice.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authorized = isAuthorized(request);
  if (!authorized.ok) {
    return NextResponse.json({ error: authorized.reason }, { status: 401 });
  }

  const today = new Date();

  const deadlines = await db.deadline.findMany({
    where: { completedAt: null },
    include: { user: true, reminders: true },
  });

  // One set of every reminder already sent, so the calculator stays pure.
  const alreadySent = new Set(
    deadlines.flatMap((deadline) =>
      deadline.reminders.map((reminder) => reminderKey(deadline.id, reminder.offsetDays)),
    ),
  );

  const due = remindersDue(deadlines, today, alreadySent);

  let sent = 0;
  const failures: string[] = [];

  for (const item of due) {
    const deadline = item.deadline;

    const result = await sendEmail(
      deadlineReminderEmail({
        to: deadline.user.email,
        name: deadline.user.name,
        label: deadline.label,
        // Just the date — the template adds the "in N days" phrasing itself,
        // so passing a relative phrase here would duplicate it.
        dueDateText: formatDeadline(deadline.dueDate),
        daysRemaining: item.daysRemaining,
      }),
    );

    if (!result.ok) {
      // Do NOT record a send that failed — tomorrow's run should retry it.
      failures.push(`${deadline.id}: ${result.error ?? "unknown error"}`);
      continue;
    }

    try {
      await db.reminderLog.create({
        data: { deadlineId: deadline.id, offsetDays: item.offsetDays },
      });
      sent += 1;
    } catch {
      // The unique constraint fired — another run beat us to it. Not an error.
      console.info(`[cron] Reminder ${deadline.id}@${item.offsetDays} was already logged.`);
    }
  }

  const purged = await purgeExpiredTokens();

  const summary = {
    ok: true,
    ranAt: today.toISOString(),
    deadlinesChecked: deadlines.length,
    remindersDue: due.length,
    remindersSent: sent,
    failures,
    expiredTokensPurged: purged,
  };

  console.info("[cron] Reminder run complete:", summary);
  return NextResponse.json(summary);
}

/**
 * Only our scheduler may run this.
 *
 * Accepts Vercel Cron's own header as well as a bearer token, so the same
 * route works on Vercel and on any other scheduler.
 */
function isAuthorized(request: Request): { ok: true } | { ok: false; reason: string } {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    // In development, an unset secret should not block testing. In production
    // it must be set, or anyone could trigger client emails.
    if (process.env.NODE_ENV !== "production") return { ok: true };
    return { ok: false, reason: "CRON_SECRET is not set on the server." };
  }

  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return { ok: true };

  return { ok: false, reason: "Unauthorized." };
}
