"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { site } from "@/config/site";

/**
 * The intake assistant widget.
 *
 * Two honesty points built into the UI:
 *   - It says whether you are talking to an assistant or reading FAQ matches,
 *     depending on whether the server has an API key.
 *   - When the guardrail refuses, the refusal is shown as-is and the attorney
 *     referral is stated plainly rather than hidden.
 */

type Turn = {
  role: "user" | "assistant";
  content: string;
  blocked?: boolean;
  referralCreated?: boolean;
};

const SUGGESTIONS = [
  "What is included in the $795 package?",
  "How long does a Georgia license take?",
  "Do I need an office, or can I use my home address?",
  "What does a Florida wholesale license let me do?",
];

export function AssistantChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ai/chat")
      .then((response) => response.json())
      .then((data: { aiEnabled?: boolean }) => setAiEnabled(Boolean(data.aiEnabled)))
      .catch(() => setAiEnabled(false));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns, pending]);

  async function send(message: string) {
    const text = message.trim();
    if (!text || pending) return;

    setError(null);
    setInput("");
    const nextTurns: Turn[] = [...turns, { role: "user", content: text }];
    setTurns(nextTurns);
    setPending(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: turns.map((turn) => ({ role: turn.role, content: turn.content })),
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        blocked?: boolean;
        referralCreated?: boolean;
        error?: string;
      };

      if (data.message) {
        setTurns([
          ...nextTurns,
          {
            role: "assistant",
            content: data.message,
            blocked: data.blocked,
            referralCreated: data.referralCreated,
          },
        ]);
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError(`Something went wrong. Email ${site.contact.email} and a person will help.`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Questions while you fill this in?</h2>
        {aiEnabled !== null && (
          <span className="badge badge-neutral">
            {aiEnabled ? "AI assistant" : "FAQ search"}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
        {aiEnabled === false
          ? "Search our published answers about process, pricing, documents, and timelines."
          : "Ask about our process, pricing, documents, or timelines."}{" "}
        <strong>We are not a law firm</strong> — legal questions get you an attorney referral, not a
        guess.
      </p>

      {turns.length === 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => send(suggestion)}
                disabled={pending}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}

      {turns.length > 0 && (
        <div
          className="mt-4 max-h-96 space-y-3 overflow-y-auto"
          role="log"
          aria-live="polite"
          aria-label="Conversation"
        >
          {turns.map((turn, index) => (
            <div
              key={index}
              className={
                turn.role === "user"
                  ? "rounded-lg px-3 py-2 text-sm"
                  : `rounded-lg px-3 py-2 text-sm ${turn.blocked ? "callout callout-warning" : ""}`
              }
              style={
                turn.role === "user"
                  ? { backgroundColor: "var(--bg-subtle)" }
                  : turn.blocked
                    ? undefined
                    : { border: "1px solid var(--border)" }
              }
            >
              <span
                className="mb-1 block text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                {turn.role === "user" ? "You" : aiEnabled ? "Assistant" : "From our FAQ"}
              </span>

              {turn.content.split("\n").map((line, lineIndex) => (
                <p key={lineIndex} className={lineIndex > 0 ? "mt-2" : undefined}>
                  {renderBold(line)}
                </p>
              ))}

              {turn.referralCreated && (
                <p className="mt-2 text-sm font-semibold">
                  ✓ Your file is flagged for an attorney referral. Someone will follow up.
                </p>
              )}
            </div>
          ))}

          {pending && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }} role="status">
              Thinking…
            </p>
          )}
          <div ref={endRef} />
        </div>
      )}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
      >
        <label className="sr-only" htmlFor="assistant-input">
          Your question
        </label>
        <input
          className="input"
          id="assistant-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about pricing, documents, or timelines…"
          maxLength={2000}
          disabled={pending}
        />
        <button type="submit" className="btn btn-primary" disabled={pending || !input.trim()}>
          Ask
        </button>
      </form>

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      <p className="hint mt-3">
        Do not send Social Security numbers or card details here — we do not collect them. Prefer a
        person?{" "}
        <Link href="/contact" className="underline underline-offset-4">
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}

/** Minimal **bold** rendering, since answers come back as plain text. */
function renderBold(line: string): React.ReactNode[] {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}
