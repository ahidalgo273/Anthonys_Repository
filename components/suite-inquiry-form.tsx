"use client";

import { useState } from "react";
import { site } from "@/config/site";

type Status = { kind: "idle" | "sending" } | { kind: "sent" | "error"; message: string };

export function SuiteInquiryForm() {
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
        body: JSON.stringify({ ...payload, topic: "suite" }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Something went wrong.");

      form.reset();
      setStatus({
        kind: "sent",
        message: "Thanks — we have your inquiry and will follow up with current availability.",
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
        <p className="font-semibold">Inquiry received</p>
        <p className="mt-2">{status.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-bold">Suite availability inquiry</h2>

      <div>
        <label className="label" htmlFor="inquiry-name">
          Your name
        </label>
        <input className="input" id="inquiry-name" name="name" required autoComplete="name" />
      </div>

      <div>
        <label className="label" htmlFor="inquiry-email">
          Email
        </label>
        <input
          className="input"
          id="inquiry-email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label className="label" htmlFor="inquiry-phone">
          Phone <span style={{ color: "var(--text-muted)" }}>(optional)</span>
        </label>
        <input className="input" id="inquiry-phone" name="phone" type="tel" autoComplete="tel" />
      </div>

      <div>
        <label className="label" htmlFor="inquiry-timing">
          When do you need the suite?
        </label>
        <select className="select" id="inquiry-timing" name="timing" defaultValue="1_3_months">
          <option value="asap">As soon as possible</option>
          <option value="1_3_months">In the next 1–3 months</option>
          <option value="3_plus_months">More than 3 months out</option>
          <option value="researching">Just researching</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="inquiry-message">
          Anything we should know? <span style={{ color: "var(--text-muted)" }}>(optional)</span>
        </label>
        <textarea className="textarea" id="inquiry-message" name="message" rows={4} />
        <p className="hint">
          Please do not include legal questions here — we are not a law firm and cannot answer them.
          Ask for an attorney referral instead and we will arrange one.
        </p>
      </div>

      {status.kind === "error" && (
        <p className="field-error" role="alert">
          {status.message}
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={status.kind === "sending"}>
        {status.kind === "sending" ? "Sending…" : "Send inquiry"}
      </button>

      <p className="hint">{site.disclaimerShort}</p>
    </form>
  );
}
