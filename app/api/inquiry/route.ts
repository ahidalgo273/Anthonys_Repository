import { NextResponse } from "next/server";
import { z } from "zod";
import { site } from "@/config/site";
import { isStateCode } from "@/config/states";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

/**
 * Contact and suite-availability inquiries.
 *
 * Saves a Lead so an inquiry lands in the same pipeline as an intake, and
 * notifies the operator. A person who writes in and a person who completes the
 * funnel are the same person from the business's point of view.
 */

const inquirySchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(200),
  email: z
    .string()
    .trim()
    .max(254)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address."),
  phone: z.string().trim().max(40).optional().default(""),
  timing: z.string().trim().max(60).optional().default(""),
  state: z.string().trim().max(4).optional().default(""),
  message: z.string().trim().max(4000).optional().default(""),
  topic: z.enum(["suite", "general"]).optional().default("general"),
});

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." },
      { status: 400 },
    );
  }

  const { name, email, phone, timing, state, message, topic } = parsed.data;

  const lead = await db.lead.create({
    data: {
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      stateCode: isStateCode(state) ? state.toUpperCase() : null,
      timeline: timing || null,
      goal: topic === "suite" ? "suite_only" : null,
      source: topic === "suite" ? "suite_inquiry" : "contact_form",
      status: "NEW",
    },
  });

  await logActivity({
    actorType: "client",
    actorEmail: lead.email,
    entityType: "lead",
    entityId: lead.id,
    action: topic === "suite" ? "suite_inquiry_received" : "contact_inquiry_received",
  });

  await sendEmail({
    to: site.contact.adminEmail,
    replyTo: email,
    subject:
      topic === "suite"
        ? `Suite inquiry — ${name}${timing ? ` (${timing})` : ""}`
        : `Contact form — ${name}`,
    text: [
      `Name:  ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "—"}`,
      state ? `State: ${state}` : null,
      timing ? `Timing: ${timing}` : null,
      "",
      message || "(no message)",
      "",
      `Admin: ${site.url}/admin/leads/${lead.id}`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
  });

  return NextResponse.json({ ok: true });
}
