import { site } from "@/config/site";
import { consoleDriver } from "./drivers/console";
import { resendDriver } from "./drivers/resend";
import type { EmailDriver, EmailMessage, SendResult } from "./types";

/**
 * Sending email.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NON-DEVELOPER NOTE
 * Set EMAIL_DRIVER in your .env file:
 *
 *   console  (default) — prints the email to your terminal. Nothing is sent.
 *                        Sign-in links appear here, which is how you log in
 *                        while developing.
 *   resend             — actually sends. Needs RESEND_API_KEY and EMAIL_FROM.
 *
 * Adding a different provider later means writing one file in drivers/ and
 * adding it to the switch below. Nothing that sends email needs to change.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type { EmailMessage, SendResult } from "./types";

function resolveDriver(): EmailDriver {
  const configured = (process.env.EMAIL_DRIVER ?? "console").toLowerCase();

  switch (configured) {
    case "resend":
      if (!process.env.RESEND_API_KEY) {
        // Falling back rather than throwing: a missing key should not take the
        // whole site down, and the warning says exactly what to fix.
        console.warn(
          "[email] EMAIL_DRIVER=resend but RESEND_API_KEY is not set. Falling back to the console driver — no email will actually be sent.",
        );
        return consoleDriver;
      }
      return resendDriver;

    case "console":
      return consoleDriver;

    default:
      console.warn(
        `[email] Unknown EMAIL_DRIVER "${configured}". Using the console driver. Valid values: console, resend.`,
      );
      return consoleDriver;
  }
}

/**
 * Send one email. Never throws — a failed send must not break the request that
 * triggered it (a client should still get their portal page even if the
 * confirmation email bounces). Check `result.ok` when the outcome matters.
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const driver = resolveDriver();
  const from = message.from ?? process.env.EMAIL_FROM ?? `${site.name} <${site.contact.email}>`;

  try {
    return await driver.send({ ...message, from });
  } catch (error) {
    console.error("[email] Send failed:", error);
    return {
      ok: false,
      driver: driver.name,
      error: error instanceof Error ? error.message : "Unknown email error",
    };
  }
}

/** Which driver is active, for the admin settings screen and the README. */
export function activeEmailDriver(): string {
  return resolveDriver().name;
}
