import { describe, expect, it } from "vitest";
import { florida, georgia, northCarolina } from "@/config/states";
import {
  REMINDER_OFFSETS,
  daysUntil,
  describeDueDate,
  formatDeadline,
  nextRenewalDate,
  nextRenewalForState,
  remindersDue,
  reminderKey,
  renewalAfter,
  startOfUtcDay,
  urgencyOf,
  utcDate,
} from "@/lib/rules/deadlines";

/**
 * The deadline calculator.
 *
 * Georgia's rule is the interesting one: licenses expire March 31 of EVEN
 * years regardless of when they were issued, so a license issued in 2027 still
 * expires in 2028.
 */

describe("nextRenewalDate — Georgia (biennial, even years, March 31)", () => {
  it("rolls an odd-year issue date to the next even year", () => {
    expect(nextRenewalDate(georgia.renewal, utcDate(2027, 1, 15)).toISOString()).toBe(
      "2028-03-31T00:00:00.000Z",
    );
  });

  it("keeps an even-year issue date in the same year when the date has not passed", () => {
    expect(nextRenewalDate(georgia.renewal, utcDate(2026, 1, 5)).toISOString()).toBe(
      "2026-03-31T00:00:00.000Z",
    );
  });

  it("skips two years when the even-year deadline has already passed", () => {
    expect(nextRenewalDate(georgia.renewal, utcDate(2026, 5, 1)).toISOString()).toBe(
      "2028-03-31T00:00:00.000Z",
    );
  });

  it("treats the deadline day itself as still due that day, not next cycle", () => {
    expect(nextRenewalDate(georgia.renewal, utcDate(2028, 3, 31)).toISOString()).toBe(
      "2028-03-31T00:00:00.000Z",
    );
  });

  it("rolls to the next even year the day after the deadline", () => {
    expect(nextRenewalDate(georgia.renewal, utcDate(2028, 4, 1)).toISOString()).toBe(
      "2030-03-31T00:00:00.000Z",
    );
  });

  it("never returns an odd year", () => {
    for (let year = 2026; year <= 2036; year += 1) {
      for (const month of [1, 3, 4, 7, 12]) {
        const result = nextRenewalDate(georgia.renewal, utcDate(year, month, 15));
        expect(result.getUTCFullYear() % 2, `from ${year}-${month}`).toBe(0);
      }
    }
  });

  it("never returns a date before the date it was given", () => {
    for (let year = 2026; year <= 2032; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        const from = utcDate(year, month, 15);
        expect(nextRenewalDate(georgia.renewal, from).getTime()).toBeGreaterThanOrEqual(
          from.getTime(),
        );
      }
    }
  });
});

describe("nextRenewalDate — Florida (annual, April 30)", () => {
  it("uses this year when April 30 has not yet passed", () => {
    expect(nextRenewalDate(florida.renewal, utcDate(2026, 2, 1)).toISOString()).toBe(
      "2026-04-30T00:00:00.000Z",
    );
  });

  it("rolls to next year the day after", () => {
    expect(nextRenewalDate(florida.renewal, utcDate(2026, 5, 1)).toISOString()).toBe(
      "2027-04-30T00:00:00.000Z",
    );
  });

  it("includes the deadline day itself", () => {
    expect(nextRenewalDate(florida.renewal, utcDate(2026, 4, 30)).toISOString()).toBe(
      "2026-04-30T00:00:00.000Z",
    );
  });
});

describe("nextRenewalForState", () => {
  it("resolves each state by code, case-insensitively", () => {
    expect(nextRenewalForState("GA", utcDate(2027, 1, 1))?.getUTCFullYear()).toBe(2028);
    expect(nextRenewalForState("fl", utcDate(2026, 1, 1))?.getUTCMonth()).toBe(3); // April
    expect(nextRenewalForState("NC", utcDate(2026, 1, 1))).not.toBeNull();
  });

  it("returns null for a state we do not serve", () => {
    expect(nextRenewalForState("TX", utcDate(2026, 1, 1))).toBeNull();
  });
});

describe("renewalAfter", () => {
  it("advances two years for a biennial licence", () => {
    expect(renewalAfter(georgia.renewal, utcDate(2028, 3, 31)).getUTCFullYear()).toBe(2030);
  });

  it("advances one year for an annual licence", () => {
    expect(renewalAfter(northCarolina.renewal, utcDate(2026, 6, 30)).getUTCFullYear()).toBe(2027);
  });
});

describe("daysUntil and urgency", () => {
  const today = utcDate(2026, 8, 6);

  it("counts whole days in both directions", () => {
    expect(daysUntil(utcDate(2026, 8, 6), today)).toBe(0);
    expect(daysUntil(utcDate(2026, 8, 7), today)).toBe(1);
    expect(daysUntil(utcDate(2026, 8, 5), today)).toBe(-1);
    expect(daysUntil(utcDate(2026, 9, 5), today)).toBe(30);
  });

  it("ignores the time of day", () => {
    const laterToday = new Date(Date.UTC(2026, 7, 6, 23, 59, 59));
    expect(daysUntil(utcDate(2026, 8, 7), laterToday)).toBe(1);
  });

  it("bands urgency at the reminder thresholds", () => {
    expect(urgencyOf(utcDate(2026, 8, 5), today)).toBe("overdue");
    expect(urgencyOf(utcDate(2026, 8, 6), today)).toBe("critical");
    expect(urgencyOf(utcDate(2026, 9, 5), today)).toBe("critical"); // exactly 30
    expect(urgencyOf(utcDate(2026, 9, 6), today)).toBe("soon"); // 31
    expect(urgencyOf(utcDate(2026, 10, 5), today)).toBe("soon"); // 60
    expect(urgencyOf(utcDate(2026, 11, 4), today)).toBe("upcoming"); // 90
    expect(urgencyOf(utcDate(2027, 6, 1), today)).toBe("future");
  });

  it("reports a completed deadline as done regardless of date", () => {
    expect(urgencyOf(utcDate(2020, 1, 1), today, true)).toBe("done");
  });
});

describe("remindersDue", () => {
  const today = utcDate(2026, 8, 6);
  const at = (days: number) => new Date(today.getTime() + days * 86_400_000);

  it("picks the NEAREST milestone, not the largest match", () => {
    // Regression: a deadline 26 days out once sent the "90 days" email.
    const due = remindersDue([{ id: "a", dueDate: at(26) }], today, new Set());

    expect(due).toHaveLength(1);
    expect(due[0].offsetDays).toBe(30);
    expect(due[0].daysRemaining).toBe(26);
  });

  it("selects each band correctly", () => {
    const cases: [number, number][] = [
      [1, 30],
      [30, 30],
      [31, 60],
      [60, 60],
      [61, 90],
      [90, 90],
    ];

    for (const [daysOut, expected] of cases) {
      const due = remindersDue([{ id: "x", dueDate: at(daysOut) }], today, new Set());
      expect(due[0]?.offsetDays, `${daysOut} days out`).toBe(expected);
    }
  });

  it("sends nothing for a deadline further out than the first reminder", () => {
    expect(remindersDue([{ id: "x", dueDate: at(91) }], today, new Set())).toHaveLength(0);
  });

  it("sends nothing for an overdue deadline", () => {
    expect(remindersDue([{ id: "x", dueDate: at(-1) }], today, new Set())).toHaveLength(0);
  });

  it("skips a completed deadline", () => {
    const due = remindersDue(
      [{ id: "x", dueDate: at(10), completedAt: new Date() }],
      today,
      new Set(),
    );
    expect(due).toHaveLength(0);
  });

  it("does not resend a milestone already logged", () => {
    const deadlines = [{ id: "a", dueDate: at(26) }];
    expect(remindersDue(deadlines, today, new Set([reminderKey("a", 30)]))).toHaveLength(0);
  });

  it("does NOT cascade to a larger offset once the nearest one was sent", () => {
    // 26 days out sits in the 30-day band. If that already went, the client
    // should hear nothing more — not a stale "60 days" email.
    const due = remindersDue([{ id: "a", dueDate: at(26) }], today, new Set([reminderKey("a", 30)]));
    expect(due).toHaveLength(0);
  });

  it("skips missed milestones rather than sending them late", () => {
    // The job was down while this passed 90 and 60 days. It is now at 20 days:
    // one accurate email, not three stale ones.
    const due = remindersDue([{ id: "a", dueDate: at(20) }], today, new Set());
    expect(due).toHaveLength(1);
    expect(due[0].offsetDays).toBe(30);
  });

  it("handles a mixed set independently", () => {
    const due = remindersDue(
      [
        { id: "a", dueDate: at(26) },
        { id: "b", dueDate: at(75) },
        { id: "c", dueDate: at(300) },
        { id: "d", dueDate: at(-5) },
      ],
      today,
      new Set(),
    );

    expect(due.map((item) => [item.deadline.id, item.offsetDays])).toEqual([
      ["a", 30],
      ["b", 90],
    ]);
  });

  it("uses the documented reminder offsets", () => {
    expect([...REMINDER_OFFSETS].sort((a, b) => a - b)).toEqual([30, 60, 90]);
  });
});

describe("formatting", () => {
  it("formats a deadline in UTC so it never shifts a day", () => {
    expect(formatDeadline(utcDate(2028, 3, 31))).toBe("March 31, 2028");
  });

  it("describes relative dates in plain words", () => {
    const today = utcDate(2026, 8, 6);
    expect(describeDueDate(utcDate(2026, 8, 6), today)).toBe("today");
    expect(describeDueDate(utcDate(2026, 8, 7), today)).toBe("tomorrow");
    expect(describeDueDate(utcDate(2026, 8, 5), today)).toBe("yesterday");
    expect(describeDueDate(utcDate(2026, 9, 5), today)).toBe("in 30 days");
    expect(describeDueDate(utcDate(2026, 7, 27), today)).toBe("10 days ago");
  });

  it("normalizes a timestamp to the start of its UTC day", () => {
    const messy = new Date(Date.UTC(2026, 7, 6, 18, 45, 12, 500));
    expect(startOfUtcDay(messy).toISOString()).toBe("2026-08-06T00:00:00.000Z");
  });
});
