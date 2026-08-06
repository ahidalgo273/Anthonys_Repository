import { NextResponse } from "next/server";
import { getState } from "@/config/states";
import { logActivity } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { assemblePacket } from "@/lib/packet/assemble";
import { renderPacketPdf } from "@/lib/packet/render";

/**
 * Generate and stream an application packet PDF.
 *
 * Generated on demand rather than stored, so a packet always reflects the
 * current data and the current state rules. Regenerating after a rule change
 * costs a second and removes any chance of handing someone a stale document.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Sign in required.", { status: 401 });

  const { applicationId } = await params;

  const application = await db.application.findFirst({
    where: user.role === "ADMIN" ? { id: applicationId } : { id: applicationId, userId: user.id },
    include: { documents: true, user: true },
  });

  if (!application) return new NextResponse("Not found.", { status: 404 });

  const state = getState(application.stateCode);
  if (!state) return new NextResponse("Unknown state for this application.", { status: 400 });

  const packet = assemblePacket({
    stateCode: application.stateCode,
    packetData: application.packetData as Record<string, unknown> | null,
    applicantName: application.user.name,
    businessName: application.businessName,
    documents: application.documents.map((doc) => ({
      requirementId: doc.requirementId,
      status: doc.status,
    })),
    generatedAt: new Date(),
  });

  const pdf = await renderPacketPdf(packet);

  // Record that a packet exists, and advance the stage the first time one is
  // produced with the documents in place.
  if (!application.packetGeneratedAt) {
    await db.application.update({
      where: { id: application.id },
      data: {
        packetGeneratedAt: new Date(),
        ...(application.stage === "DOCUMENTS" ? { stage: "PACKET_READY" } : {}),
      },
    });
  }

  await logActivity({
    actorType: user.role === "ADMIN" ? "admin" : "client",
    actorEmail: user.email,
    entityType: "application",
    entityId: application.id,
    action: "packet_generated",
  });

  const filename = `${state.code}-application-packet-${application.id.slice(-6)}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "private, no-store",
    },
  });
}
