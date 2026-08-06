"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Lead } from "@prisma/client";
import {
  addOns,
  effectivePriceCents,
  formatUsd,
  packages,
  priceLabel,
} from "@/config/pricing";
import { site } from "@/config/site";
import { stateList, type ScreeningQuestion, type StateRules } from "@/config/states";
import type { ActionState } from "@/lib/intake/actions";
import { GOALS, TIMELINES } from "@/lib/intake/schema";

/**
 * The intake step forms.
 *
 * Each is a small client component wrapping a server action with
 * `useActionState`, so validation errors come back from the server and the
 * forms still work with JavaScript disabled.
 */

const initialState: ActionState = { ok: true };

// ── Step 1: contact ──────────────────────────────────────────────────────────

export function ContactStep({
  action,
  lead,
  source,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  lead: Lead | null;
  source?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="card space-y-5">
      <input type="hidden" name="source" value={source ?? "direct"} />

      <Field
        id="name"
        label="Your name"
        error={state.fieldErrors?.name}
        defaultValue={lead?.name ?? ""}
        autoComplete="name"
        required
      />
      <Field
        id="email"
        label="Email"
        type="email"
        error={state.fieldErrors?.email}
        defaultValue={lead?.email ?? ""}
        autoComplete="email"
        hint="We send your portal sign-in link here. No password to remember."
        required
      />
      <Field
        id="phone"
        label="Phone (optional)"
        type="tel"
        error={state.fieldErrors?.phone}
        defaultValue={lead?.phone ?? ""}
        autoComplete="tel"
      />

      <FormError error={state.error} />

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Saving…" : "Continue"}
      </button>

      <p className="hint">
        We collect only what the application workflow needs.{" "}
        <Link href="/legal/privacy" className="underline underline-offset-4">
          How we handle your data
        </Link>
        .
      </p>
    </form>
  );
}

// ── Step 2: state ────────────────────────────────────────────────────────────

export function StateStep({
  action,
  lead,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  lead: Lead | null;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <fieldset>
        <legend className="sr-only">Which state do you want to be licensed in?</legend>
        <div className="space-y-3">
          {stateList.map((option) => (
            <label key={option.code} className="card block cursor-pointer">
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="stateCode"
                  value={option.code}
                  defaultChecked={lead?.stateCode === option.code}
                  required
                  className="mt-1.5"
                />
                <div>
                  <span className="font-bold">{option.name}</span>
                  <span className="ml-2 text-sm" style={{ color: "var(--accent)" }}>
                    {option.licenseType}
                  </span>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                    {formatUsd(option.bond.amountCents)} bond · {option.office.minSqFt} sq ft office
                    · {option.timeline.minWeeks}–{option.timeline.maxWeeks} weeks ·{" "}
                    {option.capabilities.retailSales ? "retail allowed" : "no retail sales"}
                  </p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <FormError error={state.error ?? state.fieldErrors?.stateCode} />

      <div className="flex gap-3">
        <Link href="/intake?step=contact" className="btn btn-secondary">
          Back
        </Link>
        <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
          {pending ? "Saving…" : "Continue"}
        </button>
      </div>

      <p className="hint">
        Not sure which state?{" "}
        <Link href="/states" className="underline underline-offset-4">
          Compare all three
        </Link>{" "}
        — the differences matter more than the price does.
      </p>
    </form>
  );
}

// ── Step 3: goal ─────────────────────────────────────────────────────────────

export function GoalStep({
  action,
  lead,
  state: stateRules,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  lead: Lead | null;
  state: StateRules | undefined;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <fieldset>
        <legend className="sr-only">What do you want the license for?</legend>
        <div className="space-y-3">
          {GOALS.map((goal) => {
            // Warn immediately when a goal does not match the chosen state,
            // rather than after they have paid.
            const mismatch =
              stateRules &&
              ((goal.value === "retail" && !stateRules.capabilities.retailSales) ||
                (goal.value === "suite_only" && !stateRules.office.suiteEligible));

            return (
              <label key={goal.value} className="card block cursor-pointer">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="goal"
                    value={goal.value}
                    defaultChecked={lead?.goal === goal.value}
                    required
                    className="mt-1.5"
                  />
                  <div>
                    <span className="font-bold">{goal.label}</span>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                      {goal.description}
                    </p>
                    {mismatch && (
                      <p className="mt-2 text-sm font-medium" style={{ color: "var(--warning)" }}>
                        Heads up: {stateRules!.name}&apos;s {stateRules!.licenseType}{" "}
                        {goal.value === "retail"
                          ? "does not allow retail sales to the public."
                          : "cannot use our Atlanta suites — that state needs a location inside it."}{" "}
                        Pick this anyway and we will show you the alternatives.
                      </p>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      <FormError error={state.error ?? state.fieldErrors?.goal} />

      <div className="flex gap-3">
        <Link href="/intake?step=state" className="btn btn-secondary">
          Back
        </Link>
        <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
          {pending ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}

// ── Step 4: timeline ─────────────────────────────────────────────────────────

export function TimelineStep({
  action,
  lead,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  lead: Lead | null;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <fieldset>
        <legend className="sr-only">When do you want to be licensed?</legend>
        <div className="space-y-3">
          {TIMELINES.map((option) => (
            <label key={option.value} className="card block cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="timeline"
                  value={option.value}
                  defaultChecked={lead?.timeline === option.value}
                  required
                />
                <span className="font-medium">{option.label}</span>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <FormError error={state.error ?? state.fieldErrors?.timeline} />

      <div className="flex gap-3">
        <Link href="/intake?step=goal" className="btn btn-secondary">
          Back
        </Link>
        <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
          {pending ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}

// ── Step 5: screening ────────────────────────────────────────────────────────

export function ScreeningStep({
  action,
  questions,
  savedAnswers,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  questions: ScreeningQuestion[];
  savedAnswers: Record<string, string | boolean>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {questions.map((question) => (
        <ScreeningQuestionField
          key={question.id}
          question={question}
          saved={savedAnswers[question.id]}
          error={state.fieldErrors?.[question.id]}
        />
      ))}

      <FormError error={state.error} />

      <div className="flex gap-3">
        <Link href="/intake?step=timeline" className="btn btn-secondary">
          Back
        </Link>
        <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
          {pending ? "Checking…" : "See my results"}
        </button>
      </div>
    </form>
  );
}

function ScreeningQuestionField({
  question,
  saved,
  error,
}: {
  question: ScreeningQuestion;
  saved: string | boolean | undefined;
  error?: string;
}) {
  const name = `q_${question.id}`;

  return (
    <fieldset className="card">
      <legend className="label mb-0">{question.question}</legend>
      {question.help && <p className="hint mb-3">{question.help}</p>}

      {question.type === "boolean" && (
        <div className="mt-2 flex gap-4">
          {[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={name}
                value={option.value}
                defaultChecked={String(saved) === option.value}
                required
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === "choice" && (
        <div className="mt-2 space-y-2">
          {question.options?.map((option) => (
            <label key={option.value} className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name={name}
                value={option.value}
                defaultChecked={saved === option.value}
                required
                className="mt-1"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === "text" && (
        <input
          className="input mt-2"
          type="text"
          name={name}
          id={name}
          defaultValue={typeof saved === "string" ? saved : ""}
          aria-label={question.question}
        />
      )}

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

// ── Step 6: package ──────────────────────────────────────────────────────────

export function PackageStep({
  action,
  lead,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  lead: Lead | null;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <fieldset>
        <legend className="sr-only">Choose a package</legend>
        <div className="space-y-3">
          {packages.map((product) => (
            <label key={product.id} className="card block cursor-pointer">
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="packageId"
                  value={product.id}
                  defaultChecked={
                    lead?.selectedPackage === product.id ||
                    (!lead?.selectedPackage && product.featured)
                  }
                  required
                  className="mt-1.5"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-bold">{product.name}</span>
                    <span className="font-bold">{priceLabel(product)}</span>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                    {product.summary}
                  </p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="card">
        <legend className="label mb-0">Add-ons (optional)</legend>
        <div className="mt-3 space-y-2">
          {addOns.map((addOn) => (
            <label key={addOn.id} className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" name="addOnIds" value={addOn.id} className="mt-1" />
              <span className="text-sm">
                <span className="font-medium">{addOn.name}</span> —{" "}
                {formatUsd(effectivePriceCents(addOn))}
                {addOn.period === "yearly" ? "/year" : ""}
                <span className="block" style={{ color: "var(--text-muted)" }}>
                  {addOn.summary}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* LEGAL GUARDRAIL: checkout is blocked without this acknowledgment. */}
      <div className="callout callout-warning">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="acknowledged" required className="mt-1" />
          <span className="text-sm">{site.acknowledgment}</span>
        </label>
        {state.fieldErrors?.acknowledged && (
          <p className="field-error" role="alert">
            {state.fieldErrors.acknowledged}
          </p>
        )}
      </div>

      <FormError error={state.error} />

      <div className="flex gap-3">
        <Link href="/intake?step=screening" className="btn btn-secondary">
          Back
        </Link>
        <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
          {pending ? "Starting checkout…" : "Continue to checkout"}
        </button>
      </div>

      <p className="hint">
        Secure payment through Stripe. No deposit is held. You can cancel a subscription any time.
      </p>
    </form>
  );
}

// ── Shared bits ──────────────────────────────────────────────────────────────

function Field({
  id,
  label,
  type = "text",
  error,
  hint,
  ...rest
}: {
  id: string;
  label: string;
  type?: string;
  error?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        className="input"
        id={id}
        name={id}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
      {hint && !error && (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <div className="callout callout-danger" role="alert">
      <p>{error}</p>
    </div>
  );
}
