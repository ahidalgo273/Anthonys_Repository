import { getProduct } from "@/config/pricing";
import { site } from "@/config/site";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email/templates";
import { logActivity } from "@/lib/activity";

/**
 * Turning a paid order into a working client account.
 *
 * Both the Stripe webhook and the demo checkout path call this, so a demo run
 * exercises exactly the same code a real payment does. It is idempotent:
 * running it twice for the same lead does not create two accounts or two
 * applications, which matters because Stripe re-delivers webhooks.
 */

export type ProvisionResult = {
  userId: string;
  applicationId: string | null;
  created: boolean;
};

export async function provisionFromOrder({
  leadId,
  productId,
  stripeCustomerId,
  isDemo = false,
}: {
  leadId: string;
  productId: string;
  stripeCustomerId?: string | null;
  isDemo?: boolean;
}): Promise<ProvisionResult | null> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    console.error(`[provision] No lead ${leadId}; cannot provision.`);
    return null;
  }

  const email = lead.email.toLowerCase().trim();

  // An existing user keeps their role — never demote an admin who buys
  // something, and never re-create an account for a returning client.
  const user = await db.user.upsert({
    where: { email },
    create: {
      email,
      name: lead.name,
      phone: lead.phone,
      role: "CLIENT",
      ...(stripeCustomerId ? { stripeCustomerId } : {}),
    },
    update: {
      ...(lead.name ? { name: lead.name } : {}),
      ...(lead.phone ? { phone: lead.phone } : {}),
      ...(stripeCustomerId ? { stripeCustomerId } : {}),
    },
  });

  const product = getProduct(productId);
  let applicationId: string | null = null;
  let created = false;

  // The compliance-only subscription has no filing to track, so it gets no
  // application record. Everything else does.
  const needsApplication = productId !== "compliance" && Boolean(lead.stateCode);

  if (needsApplication) {
    const existing = await db.application.findFirst({
      where: { userId: user.id, stateCode: lead.stateCode!, packageId: productId },
    });

    if (existing) {
      applicationId = existing.id;
    } else {
      const application = await db.application.create({
        data: {
          userId: user.id,
          leadId: lead.id,
          stateCode: lead.stateCode!,
          packageId: productId,
          stage: "DOCUMENTS",
        },
      });
      applicationId = application.id;
      created = true;
    }
  }

  await db.lead.update({
    where: { id: lead.id },
    data: { status: "CONVERTED", userId: user.id },
  });

  await logActivity({
    actorType: "system",
    entityType: "lead",
    entityId: lead.id,
    action: isDemo ? "demo_checkout_completed" : "checkout_completed",
    meta: { productId, userId: user.id, applicationId },
  });

  if (created) {
    const message = welcomeEmail({
      to: email,
      name: lead.name,
      productName: product?.name ?? productId,
      stateCode: lead.stateCode,
      isDemo,
    });
    await sendEmail(message);
  }

  // Notify the operator that there is work to do.
  await sendEmail({
    to: site.contact.adminEmail,
    subject: `${isDemo ? "[DEMO] " : ""}New client: ${lead.name ?? email} (${lead.stateCode ?? "no state"})`,
    text: [
      `${product?.name ?? productId} purchased.`,
      "",
      `Name:  ${lead.name ?? "—"}`,
      `Email: ${email}`,
      `Phone: ${lead.phone ?? "—"}`,
      `State: ${lead.stateCode ?? "—"}`,
      lead.attorneyReferral ? "\n⚠  ATTORNEY REFERRAL REQUESTED on this lead." : "",
      "",
      `Admin: ${site.url}/admin/clients/${user.id}`,
    ].join("\n"),
  });

  return { userId: user.id, applicationId, created };
}
