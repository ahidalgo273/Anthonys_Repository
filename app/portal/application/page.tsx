import Link from "next/link";
import { PacketDataForm } from "@/components/portal/packet-data-form";
import { getState } from "@/config/states";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata = { title: "Application details" };

export default async function ApplicationDetailsPage() {
  const user = await requireUser("/portal/application");

  const application = await db.application.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!application) {
    return (
      <div className="card">
        <h1 className="text-xl font-bold">No application yet</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          This is where you fill in the information that goes into your packet.
        </p>
        <Link href="/portal" className="btn btn-secondary mt-4">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const state = getState(application.stateCode);
  if (!state) {
    return (
      <div className="callout callout-danger">
        <p>We do not have rules configured for that state. Please contact us.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Application details</h1>
        <p className="mt-1" style={{ color: "var(--text-muted)" }}>
          Everything here goes into your {state.name} packet. Save as you go — you do not have to
          finish in one sitting.
        </p>
      </div>

      <div className="callout callout-info">
        <p>
          <strong>We do not ask for your Social Security number or driver&apos;s license number.</strong>{" "}
          Your state&apos;s form needs them, so your packet prints a labeled blank line for each one.
          You write those in by hand on the copy you sign. Data we never hold cannot be leaked.
        </p>
      </div>

      <PacketDataForm
        applicationId={application.id}
        groups={state.packetFieldGroups}
        values={(application.packetData as Record<string, string>) ?? {}}
      />
    </div>
  );
}
