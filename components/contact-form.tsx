"use client";

import { useState } from "react";
import { site } from "@/config/site";
import { stateList } from "@/config/states";

type Status = { kind: "idle" | "sending" } | { kind: "sent" | "error"; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    setStatus({ kind: "sending" });

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, topic: "general" }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Something went wrong.");

      form.reset();
      setStatus({
        kind: "sent",
        message: "Thanks — we have your message and will get back to you.",
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : `Something went wrong. Please email ${site.contact.email}.`,
      });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="callout callout-success" role="status">
        <p className="font-semibold">Message sent</p>
        <p className="mt-2">{status.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="contact-name">
          Your name
        </label>
        <input className="input" id="contact-name" name="name" required autoComplete="name" />
      </div>

      <div>
        <label className="label" htmlFor="contact-email">
          Email
        </label>
        <input
          className="input"
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label className="label" htmlFor="contact-phone">
          Phone <span style={{ color: "var(--text-muted)" }}>(optional)</span>
        </label>
        <input className="input" id="contact-phone" name="phone" type="tel" autoComplete="tel" />
      </div>

      <div>
        <label className="label" htmlFor="contact-state">
          Which state are you asking about?
        </label>
        <select className="select" id="contact-state" name="state" defaultValue="">
          <option value="">Not sure yet</option>
          {stateList.map((state) => (
            <option key={state.code} value={state.code}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="contact-message">
          How can we help?
        </label>
        <textarea className="textarea" id="contact-message" name="message" rows={5} required />
        <p className="hint">
          We answer questions about our process, pricing, documents, and timelines. We are not a law
          firm, so we cannot answer legal questions — if you have one, say so and we will arrange an
          attorney referral.
        </p>
      </div>

      {status.kind === "error" && (
        <p className="field-error" role="alert">
          {status.message}
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={status.kind === "sending"}>
        {status.kind === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
