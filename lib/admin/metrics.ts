import { db } from "@/lib/db";
import { daysUntil } from "@/lib/rules/deadlines";
import { STAGES } from "@/components/stage-tracker";

/**
 * Business metrics for the admin dashboard.
 *
 * Demo orders (created when Stripe is not configured) are excluded from every
 * revenue figure. Fake money in a real dashboard is worse than no dashboard.
 */

export type Metrics = {
  leads: {
    total: number;
    byStatus: { status: string; count: number }[];
    byState: { state: string; count: number }[];
    bySource: { source: string; count: number }[];
    last30Days: number;
    attorneyReferrals: number;
  };
  conversion: {
    totalLeads: number;
    converted: number;
    rate: number;
  };
  revenue: {
    mrrCents: number;
    activeSubscriptions: number;
    oneTimeRevenueCents: number;
    demoOrders: number;
  };
  filings: {
    byStage: { stage: string; label: string; count: number }[];
    open: number;
    licensed: number;
  };
  deadlines: {
    overdue: number;
    within30: number;
    within90: number;
    upcoming: { id: string; label: string; dueDate: Date; email: string; daysRemaining: number }[];
  };
  suites: {
    total: number;
    occupied: number;
    vacant: number;
    reserved: number;
    monthlyRentCents: number;
    occupancyRate: number;
  };
};

export async function getMetrics(): Promise<Metrics> {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86_400_000);

  const [leads, subscriptions, orders, applications, deadlines, suites] = await Promise.all([
    db.lead.findMany({
      select: {
        status: true,
        stateCode: true,
        source: true,
        createdAt: true,
        attorneyReferral: true,
      },
    }),
    db.subscription.findMany({ where: { status: { in: ["active", "trialing"] } } }),
    db.order.findMany({ select: { amountCents: true, status: true, isDemo: true } }),
    db.application.findMany({ select: { stage: true } }),
    db.deadline.findMany({
      where: { completedAt: null },
      include: { user: { select: { email: true } } },
      orderBy: { dueDate: "asc" },
    }),
    db.suite.findMany(),
  ]);

  const converted = leads.filter((lead) => lead.status === "CONVERTED").length;

  const paidOrders = orders.filter((order) => order.status === "paid" && !order.isDemo);

  return {
    leads: {
      total: leads.length,
      byStatus: countBy(leads, (lead) => lead.status).map(([status, count]) => ({ status, count })),
      byState: countBy(leads, (lead) => lead.stateCode ?? "Not chosen").map(([state, count]) => ({
        state,
        count,
      })),
      bySource: countBy(leads, (lead) => lead.source).map(([source, count]) => ({ source, count })),
      last30Days: leads.filter((lead) => lead.createdAt >= thirtyDaysAgo).length,
      attorneyReferrals: leads.filter((lead) => lead.attorneyReferral).length,
    },

    conversion: {
      totalLeads: leads.length,
      converted,
      rate: leads.length === 0 ? 0 : converted / leads.length,
    },

    revenue: {
      // Monthly recurring revenue: yearly plans are divided by 12 so the number
      // means the same thing for every plan.
      mrrCents: subscriptions.reduce((sum, subscription) => sum + subscription.amountCents, 0),
      activeSubscriptions: subscriptions.length,
      oneTimeRevenueCents: paidOrders.reduce((sum, order) => sum + order.amountCents, 0),
      demoOrders: orders.filter((order) => order.isDemo).length,
    },

    filings: {
      byStage: STAGES.map((stage) => ({
        stage: stage.id,
        label: stage.label,
        count: applications.filter((application) => application.stage === stage.id).length,
      })),
      open: applications.filter((application) => application.stage !== "LICENSED").length,
      licensed: applications.filter((application) => application.stage === "LICENSED").length,
    },

    deadlines: {
      overdue: deadlines.filter((deadline) => daysUntil(deadline.dueDate, today) < 0).length,
      within30: deadlines.filter((deadline) => {
        const days = daysUntil(deadline.dueDate, today);
        return days >= 0 && days <= 30;
      }).length,
      within90: deadlines.filter((deadline) => {
        const days = daysUntil(deadline.dueDate, today);
        return days >= 0 && days <= 90;
      }).length,
      upcoming: deadlines.slice(0, 12).map((deadline) => ({
        id: deadline.id,
        label: deadline.label,
        dueDate: deadline.dueDate,
        email: deadline.user.email,
        daysRemaining: daysUntil(deadline.dueDate, today),
      })),
    },

    suites: {
      total: suites.length,
      occupied: suites.filter((suite) => suite.status === "OCCUPIED").length,
      vacant: suites.filter((suite) => suite.status === "VACANT").length,
      reserved: suites.filter((suite) => suite.status === "RESERVED").length,
      monthlyRentCents: suites
        .filter((suite) => suite.status === "OCCUPIED")
        .reduce((sum, suite) => sum + suite.monthlyRentCents, 0),
      occupancyRate:
        suites.length === 0
          ? 0
          : suites.filter((suite) => suite.status === "OCCUPIED").length / suites.length,
    },
  };
}

/** Count occurrences, returned highest-first. */
function countBy<T>(items: T[], key: (item: T) => string): [string, number][] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = key(item);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
