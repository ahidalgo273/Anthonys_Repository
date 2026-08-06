import Link from "next/link";
import { getState } from "@/config/states";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { assemblePacket } from "@/lib/packet/assemble";

export const metadata = { title: "Application packet" };

export default async function PacketPage() {
  const user = await requireUser("/portal/packet");

  const application = await db.application.findFirst({
    where: { userId: user.id },
    include: { documents: true },
    orderBy: { createdAt: "desc" },
  });

  if (!application) {
    return (
      <div className="card">
        <h1 className="text-xl font-bold">No application yet</h1>
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

  // Built here too, so the page can show what is still missing without
  // downloading the PDF first.
  const packet = assemblePacket({
    stateCode: application.stateCode,
    packetData: application.packetData as Record<string, unknown> | null,
    applicantName: user.name,
    businessName: application.businessName,
    documents: application.documents.map((doc) => ({
      requirementId: doc.requirementId,
      status: doc.status,
    })),
    generatedAt: new Date(),
  });

  const missingDocuments = packet.checklist.filter((c) => c.required && c.status !== "accepted");
  const emptyFields = packet.sections
    .flatMap((section) => section.values)
    .filter((value) => !value.blankForClient && (value.value === "—" || value.value === null));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your application packet</h1>
        <p className="mt-1" style={{ color: "var(--text-muted)" }}>
          A prepared draft of your {state.name} application, a filing instruction sheet, and an
          inspection-prep photo checklist — in one printable PDF.
        </p>
      </div>

      <div className="callout callout-warning">
        <p className="font-semibold">Read this before you file</p>
        <p className="mt-2">{packet.meta.draftNotice}</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold">Download</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          The packet is generated fresh each time, so it always reflects your current details and
          the current state requirements.
        </p>
        <a
          href={`/api/packet/${application.id}`}
          className="btn btn-primary mt-4"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open my packet (PDF)
        </a>
        {application.packetGeneratedAt && (
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            First generated{" "}
            {application.packetGeneratedAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            .
          </p>
        )}
      </div>

      {(missingDocuments.length > 0 || emptyFields.length > 0) && (
        <div className="card">
          <h2 className="text-lg font-bold">Before you file, finish these</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            You can download the packet now, but these gaps will show as blanks or missing
            attachments.
          </p>

          {missingDocuments.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Documents still needed</h3>
              <ul className="mt-2 space-y-1">
                {missingDocuments.map((doc) => (
                  <li key={doc.label} className="text-sm" style={{ color: "var(--text-muted)" }}>
                    · {doc.label} — {doc.status === "in_review" ? "received, under review" : `from ${doc.source}`}
                  </li>
                ))}
              </ul>
              <Link href="/portal/documents" className="btn btn-secondary mt-3">
                Upload documents
              </Link>
            </div>
          )}

          {emptyFields.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold">
                Application fields not filled in ({emptyFields.length})
              </h3>
              <ul className="mt-2 space-y-1">
                {emptyFields.slice(0, 8).map((field) => (
                  <li key={field.label} className="text-sm" style={{ color: "var(--text-muted)" }}>
                    · {field.label}
                  </li>
                ))}
                {emptyFields.length > 8 && (
                  <li className="text-sm" style={{ color: "var(--text-muted)" }}>
                    · and {emptyFields.length - 8} more
                  </li>
                )}
              </ul>
              <Link href="/portal/application" className="btn btn-secondary mt-3">
                Fill in my details
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-bold">What you complete by hand</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          These print as blank ruled lines. We do not collect or store them.
        </p>
        <ul className="mt-3 space-y-1">
          {packet.blanksToComplete.map((blank) => (
            <li key={blank} className="text-sm" style={{ color: "var(--text-muted)" }}>
              · {blank}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
