import type { ApplicationStage } from "@prisma/client";

/**
 * The application status tracker.
 *
 * Stage order and labels live here so the portal and the admin pipeline agree
 * on what each stage means.
 */

export const STAGES: { id: ApplicationStage; label: string; description: string }[] = [
  {
    id: "INTAKE",
    label: "Intake",
    description: "Telling us about you, your business, and your location.",
  },
  {
    id: "DOCUMENTS",
    label: "Documents",
    description: "Collecting your bond, insurance, lease, and everything else on your checklist.",
  },
  {
    id: "PACKET_READY",
    label: "Packet ready",
    description: "Your application packet is prepared and waiting for your review and signature.",
  },
  {
    id: "CLIENT_FILED",
    label: "Filed",
    description: "You have signed and submitted your application to the state.",
  },
  {
    id: "INSPECTION",
    label: "Inspection",
    description: "The state is scheduling or conducting your location inspection.",
  },
  {
    id: "LICENSED",
    label: "Licensed",
    description: "Approved. Now it is about staying compliant.",
  },
];

export function stageIndex(stage: ApplicationStage): number {
  return STAGES.findIndex((s) => s.id === stage);
}

export function StageTracker({ stage }: { stage: ApplicationStage }) {
  const current = stageIndex(stage);

  return (
    <div>
      <ol className="flex gap-1.5" aria-label="Application progress">
        {STAGES.map((item, index) => {
          const state = index < current ? "complete" : index === current ? "current" : "upcoming";
          return (
            <li key={item.id} className="flex-1">
              <div
                className="h-2 rounded-full"
                style={{
                  backgroundColor: state === "upcoming" ? "var(--border)" : "var(--success)",
                  opacity: state === "complete" ? 0.5 : 1,
                }}
                aria-hidden="true"
              />
              <span className="sr-only">
                {item.label} — {state}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-4">
        <p className="text-sm font-semibold">
          Stage {current + 1} of {STAGES.length}: {STAGES[current]?.label}
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {STAGES[current]?.description}
        </p>
      </div>
    </div>
  );
}

export function StageBadge({ stage }: { stage: ApplicationStage }) {
  const item = STAGES.find((s) => s.id === stage);
  const tone =
    stage === "LICENSED" ? "badge-success" : stage === "INTAKE" ? "badge-neutral" : "badge-info";
  return <span className={`badge ${tone}`}>{item?.label ?? stage}</span>;
}
