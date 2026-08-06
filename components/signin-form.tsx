"use client";

import { useActionState } from "react";
import { requestSignInLink, type SignInState } from "@/lib/auth/actions";

const initialState: SignInState = { sent: false };

export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(requestSignInLink, initialState);

  if (state.sent) {
    return (
      <div role="status">
        <div className="callout callout-success">
          <p className="font-semibold">Check your email</p>
          <p className="mt-2">
            If {state.email ? <strong>{state.email}</strong> : "that address"} has an account, a
            sign-in link is on its way. It works once and expires in 15 minutes.
          </p>
        </div>
        <p className="hint mt-4">
          Running this yourself in development? The link is printed in your terminal — the console
          email driver does not actually send anything.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      <div>
        <label className="label" htmlFor="signin-email">
          Email address
        </label>
        <input
          className="input"
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          aria-describedby={state.error ? "signin-error" : undefined}
        />
      </div>

      {state.error && (
        <p className="field-error" id="signin-error" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
