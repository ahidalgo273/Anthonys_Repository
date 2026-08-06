import { NextResponse } from "next/server";

/**
 * Contact and suite-availability inquiries.
 *
 * Phase 1: validates and logs. Phase 2 replaces the logging with a saved Lead
 * record and an email through lib/email, so the shape of the payload here is
 * intentionally the same as the intake funnel's contact step.
 */

type InquiryPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  timing?: unknown;
  message?: unknown;
  topic?: unknown;
};

const MAX_MESSAGE_LENGTH = 4000;

export async function POST(request: Request) {
  let body: InquiryPayload;
  try {
    body = (await request.json()) as InquiryPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const timing = typeof body.timing === "string" ? body.timing.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const topic = body.topic === "suite" ? "suite" : "general";

  if (!name || name.length > 200) {
    return NextResponse.json({ ok: false, error: "Please enter your name." }, { status: 400 });
  }
  if (!isPlausibleEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ ok: false, error: "That message is too long." }, { status: 400 });
  }

  // Phase 2 swaps this for `saveLead()` + `sendEmail()`.
  console.info("[inquiry]", { topic, name, email, phone, timing, message });

  return NextResponse.json({ ok: true });
}

/**
 * Deliberately permissive. Real addresses fail strict regexes far more often
 * than fake ones pass a loose one, and we confirm by replying anyway.
 */
function isPlausibleEmail(value: string): boolean {
  return value.length > 3 && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
