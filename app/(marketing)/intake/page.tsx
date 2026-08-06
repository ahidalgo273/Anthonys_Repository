import type { Metadata } from "next";
import Link from "next/link";
import { AssistantChat } from "@/components/intake/assistant-chat";
import {
  ContactStep,
  GoalStep,
  PackageStep,
  ScreeningStep,
  StateStep,
  TimelineStep,
} from "@/components/intake/steps";
import { StepHeading, WizardShell } from "@/components/intake/wizard-shell";
import { getState } from "@/config/states";
import {
  getCurrentLead,
  saveContact,
  saveGoal,
  saveScreening,
  saveState,
  saveTimeline,
  startCheckout,
} from "@/lib/intake/actions";
import { STEPS, type Step } from "@/lib/intake/schema";
import { screenApplicant, goalFitsState, type LicenseGoal } from "@/lib/rules/screening";

export const metadata: Metadata = {
  title: "Start Your Application",
  description:
    "Free eligibility screening for a used-car dealer license in Georgia, Florida, or North Carolina. Five minutes, published pricing, no deposit.",
  alternates: { canonical: "/intake" },
};

// Reads a cookie for the in-progress lead, so it cannot be statically rendered.
export const dynamic = "force-dynamic";

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; state?: string; package?: string; canceled?: string }>;
}) {
  const params = await searchParams;
  const lead = await getCurrentLead();

  const step = resolveStep(params.step, lead?.lastStep);
  const stateRules = getState(lead?.stateCode ?? params.state ?? "");

  return (
    <WizardShell current={step}>
      {params.canceled && (
        <div className="callout callout-info mb-6" role="status">
          <p>
            Checkout was cancelled and nothing was charged. Your answers are saved — pick a package
            whenever you are ready.
          </p>
        </div>
      )}

      {step === "contact" && (
        <>
          <StepHeading
            title="Let's start your application"
            description="Five minutes, and it ends with a real screening result rather than a sales call. Nothing is charged until you choose a package."
          />
          <ContactStep action={saveContact} lead={lead} source={params.state ? "state_page" : undefined} />
        </>
      )}

      {step === "state" && (
        <>
          <StepHeading
            title="Which state?"
            description="This determines everything else — the requirements, the costs, and what the license actually lets you do."
          />
          <StateStep action={saveState} lead={lead} />
        </>
      )}

      {step === "goal" && (
        <>
          <StepHeading
            title="What do you want the license for?"
            description="We ask because the wrong license class is the most expensive mistake in this business, and it is entirely avoidable."
          />
          <GoalStep action={saveGoal} lead={lead} state={stateRules} />
        </>
      )}

      {step === "timeline" && (
        <>
          <StepHeading
            title="When do you want to be licensed?"
            description={
              stateRules
                ? `${stateRules.name} typically takes ${stateRules.timeline.minWeeks}–${stateRules.timeline.maxWeeks} weeks. ${stateRules.timeline.note}`
                : undefined
            }
          />
          <TimelineStep action={saveTimeline} lead={lead} />
        </>
      )}

      {step === "screening" && stateRules && (
        <>
          <StepHeading
            title="A few eligibility questions"
            description="Honest answers get you an honest screening. Nothing here disqualifies you from working with us, and we never assess a legal question ourselves."
          />
          <ScreeningStep
            action={saveScreening}
            questions={stateRules.screening}
            savedAnswers={(lead?.screeningAnswers as Record<string, string | boolean>) ?? {}}
          />
        </>
      )}

      {step === "screening" && !stateRules && <MissingStateNotice />}

      {step === "package" && (
        <>
          {lead && stateRules && <ScreeningResults lead={lead} stateSlug={stateRules.slug} />}
          <StepHeading
            title="Choose your package"
            description="These are the published prices — the same ones on our pricing page. State fees, bond premiums, and course costs are paid by you directly to those parties."
          />
          <PackageStep action={startCheckout} lead={lead} />
        </>
      )}

      {/*
        The assistant is available from the state step onward — by then we know
        enough about what they are asking about for the answers to be useful,
        and the contact step should stay a single focused form.
      */}
      {step !== "contact" && (
        <div className="mt-10">
          <AssistantChat />
        </div>
      )}
    </WizardShell>
  );
}

/**
 * Shows the screening verdict before the client picks a package — including
 * the parts that are bad news. Recomputed from the saved answers rather than
 * read from the stored result, so it always reflects the current rules.
 */
function ScreeningResults({
  lead,
  stateSlug,
}: {
  lead: NonNullable<Awaited<ReturnType<typeof getCurrentLead>>>;
  stateSlug: string;
}) {
  const answers = (lead.screeningAnswers as Record<string, string | boolean>) ?? {};
  if (Object.keys(answers).length === 0) return null;

  const result = screenApplicant(lead.stateCode ?? "", answers);
  const stateRules = getState(lead.stateCode ?? "");
  const goalFit =
    stateRules && lead.goal ? goalFitsState(stateRules, lead.goal as LicenseGoal) : { fits: true };

  return (
    <div className="mb-8 space-y-4">
      <h2 className="text-xl font-bold">Your screening results</h2>

      {result.eligible && result.blockers.length === 0 && (
        <div className="callout callout-success">
          <p>
            <strong>Nothing is stopping you.</strong> Based on your answers, you meet{" "}
            {stateRules?.name}&apos;s baseline requirements. Read anything below carefully before
            you buy.
          </p>
        </div>
      )}

      {result.blockers.map((blocker) => (
        <div key={blocker.questionId} className="callout callout-danger">
          <p className="font-semibold">This will stop your application</p>
          <p className="mt-1">{blocker.message}</p>
        </div>
      ))}

      {!goalFit.fits && (
        <div className="callout callout-warning">
          <p className="font-semibold">This license may not do what you want</p>
          <p className="mt-1">{goalFit.message}</p>
          <Link href={`/states/${stateSlug}`} className="btn btn-secondary mt-3">
            Re-read the requirements
          </Link>
        </div>
      )}

      {result.warnings.map((warning) => (
        <div key={warning.questionId} className="callout callout-warning">
          <p className="font-semibold">Worth knowing</p>
          <p className="mt-1">{warning.message}</p>
        </div>
      ))}

      {/* LEGAL GUARDRAIL: the referral message, never an assessment. */}
      {result.referralMessages.map((referral) => (
        <div key={referral.questionId} className="callout callout-info">
          <p className="font-semibold">We have flagged an attorney referral for you</p>
          <p className="mt-1">{referral.message}</p>
        </div>
      ))}
    </div>
  );
}

function MissingStateNotice() {
  return (
    <div className="card">
      <h1 className="text-xl font-bold">We need your state first</h1>
      <p className="mt-2" style={{ color: "var(--text-muted)" }}>
        The eligibility questions depend on which state you are applying in.
      </p>
      <Link href="/intake?step=state" className="btn btn-primary mt-4">
        Choose my state
      </Link>
    </div>
  );
}

/**
 * Which step to show. An explicit `?step=` wins; otherwise resume just past
 * whatever they last completed.
 */
function resolveStep(requested: string | undefined, lastCompleted: string | null | undefined): Step {
  if (requested && (STEPS as readonly string[]).includes(requested)) return requested as Step;

  if (lastCompleted && (STEPS as readonly string[]).includes(lastCompleted)) {
    const nextIndex = STEPS.indexOf(lastCompleted as Step) + 1;
    return STEPS[Math.min(nextIndex, STEPS.length - 1)];
  }

  return "contact";
}
