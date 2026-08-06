import { getState, type RenewalRule } from "@/config/states";

/**
 * The deadline calculator.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure date arithmetic driven by each state's `renewal` rule in
 * config/states/*.ts. No database, no "now" unless it is passed in — so every
 * case here is testable, including the awkward ones:
 *
 *   - Georgia expires March 31 of EVEN years regardless of issue date. A
 *     license issued in 2027 still expires 2028-03-31.
 *   - Florida expires April 30 every year, whenever it was issued.
 *   - A license issued the day after its own expiry date rolls to the next
 *     cycle, not to a date already in the past.
 *
 * All dates are handled in UTC. A renewal deadline is a calendar date, not a
 * moment, and using UTC everywhere keeps it from shifting a day when the server
 * timezone changes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Days before a deadline that we send reminder emails. */
export const REMINDER_OFFSETS = [90, 60, 30] as const;
export type ReminderOffset = (typeof REMINDER_OFFSETS)[number];

/** Build a UTC date from calendar parts, with no timezone surprises. */
export function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/** Midnight UTC on the same calendar day, so comparisons ignore the clock. */
export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * The first renewal deadline on or after `from` for a given renewal rule.
 *
 * `from` is normally the date the license was issued. The result is always
 * strictly on or after that date.
 */
export function nextRenewalDate(rule: RenewalRule, from: Date): Date {
  const start = startOfUtcDay(from);
  let year = start.getUTCFullYear();

  if (rule.cadence === "biennial" && rule.evenYearsOnly) {
    // Georgia: only even years qualify. Step to the next even year that has not
    // already passed its due date.
    if (year % 2 !== 0) year += 1;
    let candidate = utcDate(year, rule.dueMonth, rule.dueDay);
    while (candidate < start) {
      year += 2;
      candidate = utcDate(year, rule.dueMonth, rule.dueDay);
    }
    return candidate;
  }

  const step = rule.cadence === "biennial" ? 2 : 1;
  let candidate = utcDate(year, rule.dueMonth, rule.dueDay);
  while (candidate < start) {
    year += step;
    candidate = utcDate(year, rule.dueMonth, rule.dueDay);
  }
  return candidate;
}

/** The renewal after a known one — used to roll a deadline forward once it is met. */
export function renewalAfter(rule: RenewalRule, current: Date): Date {
  const step = rule.cadence === "biennial" ? 2 : 1;
  const next = utcDate(current.getUTCFullYear() + step, rule.dueMonth, rule.dueDay);
  return next;
}

/** Convenience wrapper that looks the rule up by state code. */
export function nextRenewalForState(stateCode: string, from: Date): Date | null {
  const state = getState(stateCode);
  if (!state) return null;
  return nextRenewalDate(state.renewal, from);
}

/** Whole days from `today` until `dueDate`. Negative when overdue. */
export function daysUntil(dueDate: Date, today: Date): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round(
    (startOfUtcDay(dueDate).getTime() - startOfUtcDay(today).getTime()) / MS_PER_DAY,
  );
}

export type DeadlineUrgency = "overdue" | "critical" | "soon" | "upcoming" | "future" | "done";

/** How a deadline should be presented. Thresholds match the reminder offsets. */
export function urgencyOf(dueDate: Date, today: Date, completed = false): DeadlineUrgency {
  if (completed) return "done";
  const days = daysUntil(dueDate, today);
  if (days < 0) return "overdue";
  if (days <= 30) return "critical";
  if (days <= 60) return "soon";
  if (days <= 90) return "upcoming";
  return "future";
}

export type DueReminder<T> = {
  deadline: T;
  offsetDays: ReminderOffset;
  daysRemaining: number;
};

/**
 * Which reminders are due today.
 *
 * A deadline sits in exactly one milestone at a time: the smallest offset it
 * has already reached. At 26 days out that is the 30-day milestone, not the
 * 90-day one, so the client gets an email that states its urgency correctly.
 *
 * Only that milestone can fire, and only once — `alreadySent` (built from
 * ReminderLog) stops a repeat. If the job was down when an earlier milestone
 * passed, that milestone is skipped rather than sent late: one accurate email
 * beats three stale ones.
 */
export function remindersDue<T extends { id: string; dueDate: Date; completedAt?: Date | null }>(
  deadlines: T[],
  today: Date,
  alreadySent: ReadonlySet<string>,
): DueReminder<T>[] {
  // Nearest milestone first, so the smallest matching offset wins.
  const ascendingOffsets = [...REMINDER_OFFSETS].sort((a, b) => a - b);
  const due: DueReminder<T>[] = [];

  for (const deadline of deadlines) {
    if (deadline.completedAt) continue;

    const daysRemaining = daysUntil(deadline.dueDate, today);
    // Past due: an overdue notice is a separate concern, not a countdown.
    if (daysRemaining < 0) continue;

    const currentOffset = ascendingOffsets.find((offset) => daysRemaining <= offset);
    // Further out than the earliest reminder — nothing to send yet.
    if (currentOffset === undefined) continue;
    if (alreadySent.has(reminderKey(deadline.id, currentOffset))) continue;

    due.push({ deadline, offsetDays: currentOffset as ReminderOffset, daysRemaining });
  }

  return due;
}

/** Stable key for the ReminderLog uniqueness check. */
export function reminderKey(deadlineId: string, offsetDays: number): string {
  return `${deadlineId}:${offsetDays}`;
}

/** "March 31, 2028" */
export function formatDeadline(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** "in 45 days" / "today" / "12 days ago" */
export function describeDueDate(dueDate: Date, today: Date): string {
  const days = daysUntil(dueDate, today);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}
