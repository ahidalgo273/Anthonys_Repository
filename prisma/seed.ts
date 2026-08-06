/**
 * Demo data.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NON-DEVELOPER NOTE
 * Run `npm run seed` to fill an empty database with realistic example clients
 * so you can click around the portal and the admin dashboard.
 *
 * It DELETES everything first, so never run it against a database with real
 * clients in it. It refuses to run when NODE_ENV is "production".
 *
 * Sign in afterwards as admin@example-dealerdesk.com (or any seeded client) —
 * with the console email driver, the sign-in link prints in your terminal.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient, type ApplicationStage, type Prisma } from "@prisma/client";
import { georgia, florida, northCarolina } from "../config/states";
import { nextRenewalDate } from "../lib/rules/deadlines";

const db = new PrismaClient();

const DAY = 86_400_000;
const today = new Date();
const daysFromNow = (days: number) => new Date(today.getTime() + days * DAY);
const daysAgo = (days: number) => new Date(today.getTime() - days * DAY);

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed a production database. This script deletes all data.");
  }

  console.info("Clearing existing data…");
  // Order matters: children before parents.
  await db.reminderLog.deleteMany();
  await db.deadline.deleteMany();
  await db.document.deleteMany();
  await db.note.deleteMany();
  await db.task.deleteMany();
  await db.aiInteraction.deleteMany();
  await db.application.deleteMany();
  await db.order.deleteMany();
  await db.subscription.deleteMany();
  await db.suite.deleteMany();
  await db.lead.deleteMany();
  await db.session.deleteMany();
  await db.magicLinkToken.deleteMany();
  await db.activityLog.deleteMany();
  await db.processedWebhookEvent.deleteMany();
  await db.user.deleteMany();

  // ── The operator ───────────────────────────────────────────────────────────
  const admin = await db.user.create({
    data: {
      email: "admin@example-dealerdesk.com",
      name: "Anthony (Owner)",
      role: "ADMIN",
    },
  });
  console.info(`Admin account: ${admin.email}`);

  // ── Clients across every stage ─────────────────────────────────────────────
  const clients: {
    name: string;
    email: string;
    phone: string;
    state: "GA" | "FL" | "NC";
    stage: ApplicationStage;
    goal: string;
    source: string;
    business: string;
    subscribed?: boolean;
    attorneyReferral?: boolean;
    daysAgoStarted: number;
  }[] = [
    {
      name: "Marcus Webb",
      email: "marcus.webb@example.com",
      phone: "(404) 555-0111",
      state: "GA",
      stage: "LICENSED",
      goal: "retail",
      source: "organic",
      business: "Webb Motors LLC",
      subscribed: true,
      daysAgoStarted: 180,
    },
    {
      name: "Priya Raman",
      email: "priya.raman@example.com",
      phone: "(770) 555-0122",
      state: "GA",
      stage: "INSPECTION",
      goal: "auction_access",
      source: "referral",
      business: "Peachtree Auto Wholesale LLC",
      subscribed: true,
      daysAgoStarted: 95,
    },
    {
      name: "Devon Carter",
      email: "devon.carter@example.com",
      phone: "(678) 555-0133",
      state: "GA",
      stage: "CLIENT_FILED",
      goal: "suite_only",
      source: "organic",
      business: "Carter Fleet Sales LLC",
      subscribed: true,
      daysAgoStarted: 60,
    },
    {
      name: "Alicia Brooks",
      email: "alicia.brooks@example.com",
      phone: "(305) 555-0144",
      state: "FL",
      stage: "PACKET_READY",
      goal: "wholesale",
      source: "paid_search",
      business: "Brooks Wholesale Auto Inc",
      daysAgoStarted: 45,
    },
    {
      name: "Tomas Herrera",
      email: "tomas.herrera@example.com",
      phone: "(813) 555-0155",
      state: "FL",
      stage: "DOCUMENTS",
      goal: "auction_access",
      source: "referral",
      business: "Herrera Export Motors LLC",
      daysAgoStarted: 30,
    },
    {
      name: "Janelle Ford",
      email: "janelle.ford@example.com",
      phone: "(919) 555-0166",
      state: "NC",
      stage: "DOCUMENTS",
      goal: "wholesale",
      source: "organic",
      business: "Ford Auto Traders LLC",
      daysAgoStarted: 21,
    },
    {
      name: "Ray Okafor",
      email: "ray.okafor@example.com",
      phone: "(704) 555-0177",
      state: "NC",
      stage: "INTAKE",
      goal: "auction_access",
      source: "organic",
      business: "Okafor Motors LLC",
      attorneyReferral: true,
      daysAgoStarted: 10,
    },
    {
      name: "Sofia Klein",
      email: "sofia.klein@example.com",
      phone: "(470) 555-0188",
      state: "GA",
      stage: "INTAKE",
      goal: "retail",
      source: "social",
      business: "Klein Auto Group LLC",
      daysAgoStarted: 4,
    },
  ];

  const stateRules = { GA: georgia, FL: florida, NC: northCarolina };
  const createdUsers: { id: string; email: string; state: "GA" | "FL" | "NC"; stage: string }[] = [];

  for (const client of clients) {
    const rules = stateRules[client.state];

    const lead = await db.lead.create({
      data: {
        name: client.name,
        email: client.email,
        phone: client.phone,
        stateCode: client.state,
        goal: client.goal,
        timeline: "1_3_months",
        source: client.source,
        status: client.attorneyReferral ? "ATTORNEY_REFERRAL" : "CONVERTED",
        lastStep: "package",
        selectedPackage: client.subscribed ? "suite_bundle" : "license_filing",
        acknowledgedAt: daysAgo(client.daysAgoStarted),
        createdAt: daysAgo(client.daysAgoStarted),
        ...(client.attorneyReferral
          ? {
              attorneyReferral: true,
              attorneyReferralReason:
                'Screening question "criminal_history" requested a referral.',
              attorneyReferralAt: daysAgo(client.daysAgoStarted),
            }
          : {}),
        screeningAnswers: {
          age_18: true,
          entity: "have_entity",
          bond: client.attorneyReferral ? "need_referral" : "yes",
          residency_state: client.state,
          criminal_history: Boolean(client.attorneyReferral),
        } as Prisma.InputJsonValue,
      },
    });

    const user = await db.user.create({
      data: {
        email: client.email,
        name: client.name,
        phone: client.phone,
        role: "CLIENT",
        createdAt: daysAgo(client.daysAgoStarted),
      },
    });

    await db.lead.update({ where: { id: lead.id }, data: { userId: user.id } });

    const application = await db.application.create({
      data: {
        userId: user.id,
        leadId: lead.id,
        stateCode: client.state,
        stage: client.stage,
        packageId: client.subscribed ? "suite_bundle" : "license_filing",
        businessName: client.business,
        createdAt: daysAgo(client.daysAgoStarted),
        packetData: {
          applicant_first_name: client.name.split(" ")[0],
          applicant_last_name: client.name.split(" ")[1] ?? "",
          applicant_email: client.email,
          applicant_phone: client.phone,
          entity_legal_name: client.business,
          entity_type: "LLC",
          entity_state_of_formation: client.state,
          location_sq_ft: String(rules.office.minSqFt),
          location_phone: client.phone,
        } as Prisma.InputJsonValue,
        ...(["PACKET_READY", "CLIENT_FILED", "INSPECTION", "LICENSED"].includes(client.stage)
          ? { packetGeneratedAt: daysAgo(Math.max(1, client.daysAgoStarted - 30)) }
          : {}),
        ...(["CLIENT_FILED", "INSPECTION", "LICENSED"].includes(client.stage)
          ? { filedAt: daysAgo(Math.max(1, client.daysAgoStarted - 40)) }
          : {}),
        ...(client.stage === "LICENSED"
          ? {
              licensedAt: daysAgo(Math.max(1, client.daysAgoStarted - 120)),
              licenseNumber: `${client.state}-UD-${10000 + createdUsers.length}`,
            }
          : {}),
      },
    });

    // Documents: further along the pipeline, more of them accepted.
    const documentCount =
      client.stage === "INTAKE"
        ? 0
        : client.stage === "DOCUMENTS"
          ? 3
          : rules.documents.length;

    for (const [index, requirement] of rules.documents.slice(0, documentCount).entries()) {
      const accepted = client.stage !== "DOCUMENTS" || index < 2;
      await db.document.create({
        data: {
          applicationId: application.id,
          requirementId: requirement.id,
          label: requirement.label,
          filename: `${requirement.id}.pdf`,
          // A placeholder key: no file exists on disk for seeded documents, so
          // downloading one returns a clean "no longer available" rather than
          // crashing.
          storageKey: `seed/${application.id}/${requirement.id}.pdf`,
          mimeType: "application/pdf",
          sizeBytes: 180_000 + index * 12_000,
          status: accepted ? "ACCEPTED" : "NEEDS_REVIEW",
          ...(requirement.checks?.minAmountCents
            ? { amountCents: requirement.checks.minAmountCents }
            : {}),
          ...(requirement.checks?.mustNotBeExpired ? { expiresAt: daysFromNow(300) } : {}),
          ...(accepted
            ? { reviewedAt: daysAgo(5), reviewedByEmail: admin.email }
            : {}),
          checkResult: {
            findings: [],
            autoApproved: false,
            checkedAt: daysAgo(6).toISOString(),
            method: "deterministic",
          } as Prisma.InputJsonValue,
        },
      });
    }

    // Deadlines for anyone licensed or close to it.
    if (["INSPECTION", "LICENSED"].includes(client.stage)) {
      const licensedAt = daysAgo(Math.max(1, client.daysAgoStarted - 120));

      await db.deadline.create({
        data: {
          userId: user.id,
          applicationId: application.id,
          kind: "LICENSE_RENEWAL",
          label: `${rules.name} license renewal`,
          dueDate: nextRenewalDate(rules.renewal, licensedAt),
          source: "computed",
        },
      });
      await db.deadline.create({
        data: {
          userId: user.id,
          applicationId: application.id,
          kind: "BOND_EXPIRY",
          label: `Surety bond renewal (${client.business})`,
          // Deliberately close, so the reminder job has something to send.
          dueDate: daysFromNow(client.stage === "LICENSED" ? 26 : 75),
          source: "manual",
        },
      });
      await db.deadline.create({
        data: {
          userId: user.id,
          applicationId: application.id,
          kind: "INSURANCE_EXPIRY",
          label: "Garage liability insurance renewal",
          dueDate: daysFromNow(140),
          source: "manual",
        },
      });
    }

    // Money.
    await db.order.create({
      data: {
        userId: user.id,
        leadId: lead.id,
        productId: client.subscribed ? "suite_bundle" : "license_filing",
        amountCents: client.subscribed ? 54900 + 99500 : 79500,
        status: "paid",
        createdAt: daysAgo(client.daysAgoStarted),
      },
    });

    if (client.subscribed) {
      await db.subscription.create({
        data: {
          userId: user.id,
          stripeSubscriptionId: `sub_seed_${user.id.slice(-8)}`,
          productId: "suite_bundle",
          status: "active",
          amountCents: 54900,
          currentPeriodEnd: daysFromNow(21),
          createdAt: daysAgo(client.daysAgoStarted),
        },
      });
    }

    // A couple of open client tasks, so the portal is not empty.
    if (client.stage === "DOCUMENTS") {
      await db.task.create({
        data: {
          applicationId: application.id,
          title: `Send us your ${rules.documents[3]?.label ?? "remaining documents"}`,
          detail: `From ${rules.documents[3]?.source ?? "your provider"}.`,
          dueDate: daysFromNow(10),
          audience: "client",
        },
      });
    }

    if (client.attorneyReferral) {
      await db.task.create({
        data: {
          leadId: lead.id,
          title: "Send attorney referral options",
          detail: "Do not advise. Connect them with counsel and log the introduction.",
          dueDate: daysFromNow(1),
          audience: "admin",
        },
      });
      await db.note.create({
        data: {
          leadId: lead.id,
          authorEmail: admin.email,
          body: "Flagged during screening. Referral list sent request — awaiting attorney availability.",
        },
      });
    }

    createdUsers.push({ id: user.id, email: user.email, state: client.state, stage: client.stage });
  }

  // ── Unconverted leads ──────────────────────────────────────────────────────
  await db.lead.createMany({
    data: [
      {
        name: "Kenji Watanabe",
        email: "kenji.watanabe@example.com",
        phone: "(404) 555-0199",
        stateCode: "GA",
        goal: "auction_access",
        timeline: "asap",
        source: "organic",
        status: "SCREENED",
        lastStep: "screening",
        createdAt: daysAgo(3),
      },
      {
        name: "Bianca Rossi",
        email: "bianca.rossi@example.com",
        stateCode: "FL",
        goal: "retail",
        timeline: "researching",
        source: "paid_search",
        status: "SCREENED",
        lastStep: "screening",
        createdAt: daysAgo(6),
      },
      {
        name: "Curtis Hale",
        email: "curtis.hale@example.com",
        stateCode: null,
        source: "contact_form",
        status: "NEW",
        createdAt: daysAgo(1),
      },
      {
        name: "Nadia Mansour",
        email: "nadia.mansour@example.com",
        stateCode: "GA",
        goal: "suite_only",
        timeline: "1_3_months",
        source: "suite_inquiry",
        status: "NEW",
        createdAt: daysAgo(2),
      },
    ],
  });

  // ── Suites ─────────────────────────────────────────────────────────────────
  const suiteTenants = createdUsers.filter((u) => u.state === "GA").slice(0, 3);

  const suites = [
    { name: "Suite 101", status: "OCCUPIED" as const, tenant: suiteTenants[0] },
    { name: "Suite 102", status: "OCCUPIED" as const, tenant: suiteTenants[1] },
    { name: "Suite 103", status: "OCCUPIED" as const, tenant: suiteTenants[2] },
    { name: "Suite 104", status: "RESERVED" as const, tenant: undefined },
    { name: "Suite 105", status: "VACANT" as const, tenant: undefined },
    { name: "Suite 106", status: "VACANT" as const, tenant: undefined },
  ];

  for (const suite of suites) {
    await db.suite.create({
      data: {
        name: suite.name,
        sqFt: 250,
        monthlyRentCents: 54900,
        status: suite.status,
        tenantUserId: suite.tenant?.id ?? null,
        leaseStart: suite.tenant ? daysAgo(120) : null,
        leaseEnd: suite.tenant ? daysFromNow(245) : null,
        notes:
          suite.status === "RESERVED"
            ? "Held pending signed lease — follow up this week."
            : null,
      },
    });
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const counts = {
    users: await db.user.count(),
    leads: await db.lead.count(),
    applications: await db.application.count(),
    documents: await db.document.count(),
    deadlines: await db.deadline.count(),
    suites: await db.suite.count(),
  };

  console.info("\nSeeded:", counts);
  console.info("\nSign in as any of these (the link prints in this terminal):");
  console.info(`  ${admin.email}  ← admin`);
  for (const user of createdUsers.slice(0, 3)) {
    console.info(`  ${user.email}  (${user.state}, ${user.stage})`);
  }
  console.info("\nGo to http://localhost:3000/signin\n");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
