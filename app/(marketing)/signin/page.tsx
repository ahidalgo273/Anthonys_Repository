import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/signin-form";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your DealerDesk client portal.",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "That sign-in link is not valid. Request a new one below.",
  expired: "That sign-in link expired. They last 15 minutes — request a fresh one below.",
  used: "That sign-in link has already been used. Links work once. Request a new one below.",
  no_user: "We could not find an account for that link. Please contact us.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold">Sign in</h1>
        <p className="mt-3" style={{ color: "var(--text-muted)" }}>
          Enter your email and we will send you a sign-in link. There is no password to remember,
          and nothing to be stolen.
        </p>

        {error && (
          <div className="callout callout-warning mt-6" role="alert">
            <p>{ERROR_MESSAGES[error] ?? "Something went wrong with that link. Try again below."}</p>
          </div>
        )}

        <div className="card mt-6">
          <SignInForm next={next} />
        </div>

        <p className="mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
          Not a client yet?{" "}
          <Link href="/intake" className="underline underline-offset-4">
            Start an application
          </Link>
          . Trouble signing in? Email{" "}
          <a href={`mailto:${site.contact.email}`} className="underline underline-offset-4">
            {site.contact.email}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
