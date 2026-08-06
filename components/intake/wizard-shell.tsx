import Link from "next/link";
import { STEPS, STEP_LABELS, type Step } from "@/lib/intake/schema";

/** The progress rail shown above every intake step. */
export function WizardShell({
  current,
  children,
}: {
  current: Step;
  children: React.ReactNode;
}) {
  const currentIndex = STEPS.indexOf(current);

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Progress" className="mb-8">
          <p className="mb-3 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            Step {currentIndex + 1} of {STEPS.length}: {STEP_LABELS[current]}
          </p>
          <ol className="flex gap-1.5">
            {STEPS.map((step, index) => {
              const state =
                index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming";
              return (
                <li key={step} className="flex-1">
                  <span className="sr-only">
                    {STEP_LABELS[step]} — {state}
                  </span>
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        state === "upcoming" ? "var(--border)" : "var(--accent)",
                      opacity: state === "current" ? 1 : state === "complete" ? 0.55 : 1,
                    }}
                    aria-hidden="true"
                  />
                </li>
              );
            })}
          </ol>
        </nav>

        {children}

        <p className="mt-8 text-sm" style={{ color: "var(--text-muted)" }}>
          Questions before you continue?{" "}
          <Link href="/contact" className="underline underline-offset-4">
            Talk to us
          </Link>
          . Nothing is charged until you choose a package.
        </p>
      </div>
    </div>
  );
}

export function StepHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
      {description && (
        <p className="mt-2 text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      )}
    </div>
  );
}
