import type { EmailDriver } from "../types";

/**
 * Sends through Resend (https://resend.com).
 *
 * Uses Resend's REST API directly rather than their SDK. It is one HTTP POST,
 * and skipping the SDK means one less dependency to keep updated.
 *
 * Requires RESEND_API_KEY. EMAIL_FROM must use a domain you have verified in
 * the Resend dashboard, or Resend rejects the send.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const TIMEOUT_MS = 10_000;

export const resendDriver: EmailDriver = {
  name: "resend",

  async send(message) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { ok: false, driver: "resend", error: "RESEND_API_KEY is not set." };
    }

    // Without a timeout a hung provider would hold the request open until the
    // platform's own limit, which is far too long for a background send.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: message.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          ...(message.html ? { html: message.html } : {}),
          ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        }),
        signal: controller.signal,
      });

      const body = (await response.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
        name?: string;
      };

      if (!response.ok) {
        return {
          ok: false,
          driver: "resend",
          error: body.message ?? `Resend returned ${response.status}.`,
        };
      }

      return { ok: true, driver: "resend", id: body.id };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { ok: false, driver: "resend", error: "Resend timed out after 10 seconds." };
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  },
};
