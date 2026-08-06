import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getObject } from "@/lib/storage";

/**
 * Download an uploaded document.
 *
 * Files are streamed through this route rather than served from a public
 * folder, so access is checked on every request. A client can read their own
 * documents; an admin can read any.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Sign in required.", { status: 401 });

  const { id } = await params;

  const document = await db.document.findFirst({
    where:
      user.role === "ADMIN"
        ? { id }
        : { id, application: { userId: user.id } },
  });

  // Same response whether it does not exist or is not theirs — no probing.
  if (!document) return new NextResponse("Not found.", { status: 404 });

  const data = await getObject(document.storageKey);
  if (!data) {
    console.error(`[documents] Missing file for document ${document.id} (${document.storageKey}).`);
    return new NextResponse("That file is no longer available.", { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": document.mimeType,
      // `inline` so PDFs and photos open in the browser rather than forcing a
      // download. The filename is already sanitized at upload.
      "Content-Disposition": `inline; filename="${document.filename}"`,
      "Content-Length": String(data.length),
      "Cache-Control": "private, no-store",
    },
  });
}
