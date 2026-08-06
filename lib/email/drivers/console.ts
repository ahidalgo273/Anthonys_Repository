import type { EmailDriver } from "../types";

/**
 * Prints emails to the terminal instead of sending them.
 *
 * This is the default, and it is how you sign in during development: request a
 * magic link, then copy the URL out of your terminal.
 */
export const consoleDriver: EmailDriver = {
  name: "console",

  async send(message) {
    const divider = "─".repeat(72);
    console.info(
      [
        "",
        divider,
        "📧  EMAIL (console driver — not actually sent)",
        divider,
        `To:      ${message.to}`,
        `From:    ${message.from}`,
        message.replyTo ? `Reply-to: ${message.replyTo}` : null,
        `Subject: ${message.subject}`,
        divider,
        message.text,
        divider,
        "",
      ]
        .filter((line) => line !== null)
        .join("\n"),
    );

    return { ok: true, driver: "console" };
  },
};
