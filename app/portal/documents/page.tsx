import Link from "next/link";
import { DocumentChecklist } from "@/components/portal/document-checklist";
import { getState } from "@/config/states";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const user = await requireUser("/portal/documents");

  const applications = await db.application.findMany({
    where: { userId: user.id },
    include: { documents: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  if (applications.length === 0) {
    return (
      <div className="card">
        <h1 className="text-xl font-bold">No application yet</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Your document checklist appears once you have a filing in progress.
        </p>
        <Link href="/portal" className="btn btn-secondary mt-4">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="mt-1" style={{ color: "var(--text-muted)" }}>
          Upload each item as you collect it. We review everything before it reaches the state —
          nothing is approved automatically.
        </p>
      </div>

      {applications.map((application) => {
        const state = getState(application.stateCode);
        if (!state) return null;

        return (
          <section key={application.id}>
            <h2 className="mb-4 text-lg font-bold">
              {state.name} — {state.licenseType}
            </h2>
            <DocumentChecklist
              applicationId={application.id}
              requirements={state.documents}
              documents={application.documents.map((doc) => ({
                id: doc.id,
                requirementId: doc.requirementId,
                filename: doc.filename,
                status: doc.status,
                sizeBytes: doc.sizeBytes,
                createdAt: doc.createdAt.toISOString(),
                reviewNote: doc.reviewNote,
                checkResult: doc.checkResult as {
                  findings?: { severity: string; message: string }[];
                } | null,
              }))}
            />
          </section>
        );
      })}
    </div>
  );
}
