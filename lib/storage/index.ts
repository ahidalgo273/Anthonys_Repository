import { randomUUID } from "node:crypto";
import { localDriver } from "./drivers/local";
import type { StorageDriver } from "./types";

/**
 * Storing the documents clients upload.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NON-DEVELOPER NOTE
 * Set STORAGE_DRIVER in your .env file:
 *
 *   local  (default) — saves files to a `storage/` folder on this machine.
 *                      Back that folder up. On Vercel it is wiped on every
 *                      deploy, so do not use it there.
 *
 * Moving to S3 or Vercel Blob later means writing one file in drivers/ and
 * adding it to the switch below. Nothing that uploads or downloads a document
 * needs to change.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type { StorageDriver } from "./types";

/** What a client is allowed to upload. Matches the wording in the portal. */
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
] as const;

/** Upload ceiling. A phone photo of a bond is comfortably under this. */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

function resolveDriver(): StorageDriver {
  const configured = (process.env.STORAGE_DRIVER ?? "local").toLowerCase();

  switch (configured) {
    case "local":
      return localDriver;

    default:
      // Falling back rather than throwing, for the same reason as email: a
      // typo in .env should not take the whole site down.
      console.warn(
        `[storage] Unknown STORAGE_DRIVER "${configured}". Using the local driver. Valid values: local.`,
      );
      return localDriver;
  }
}

/**
 * Make a client-supplied filename safe to store and to echo back in a
 * Content-Disposition header.
 *
 * Strips directory separators and control characters, collapses the rest to a
 * conservative set, and caps the length. Never returns an empty string.
 */
export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "";

  // The whitelist below is the real guard: anything outside it — including
  // control characters, quotes, and the CR/LF that would let a filename break
  // out of a Content-Disposition header — becomes an underscore.
  const cleaned = base
    .replace(/[^A-Za-z0-9._ -]/g, "_")
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+/, "")
    .trim();

  if (!cleaned) return "upload";

  // Keep the extension readable if we have to truncate a very long name.
  if (cleaned.length <= 120) return cleaned;

  const dot = cleaned.lastIndexOf(".");
  if (dot > 0 && cleaned.length - dot <= 12) {
    return cleaned.slice(0, 120 - (cleaned.length - dot)) + cleaned.slice(dot);
  }
  return cleaned.slice(0, 120);
}

/**
 * Build the opaque key a document is stored under.
 *
 * Grouped by application so a client's files sit together, and prefixed with a
 * UUID so re-uploading the same filename never overwrites the earlier version —
 * important when a document was already reviewed.
 */
export function buildStorageKey({
  applicationId,
  requirementId,
  filename,
}: {
  applicationId: string;
  requirementId: string;
  filename: string;
}): string {
  const safeApplication = applicationId.replace(/[^A-Za-z0-9_-]/g, "");
  const safeRequirement = requirementId.replace(/[^A-Za-z0-9_-]/g, "");

  return [
    "applications",
    safeApplication || "unknown",
    safeRequirement || "unknown",
    `${randomUUID()}-${sanitizeFilename(filename)}`,
  ].join("/");
}

/** Store an uploaded document. */
export async function putObject(
  key: string,
  data: Buffer,
  contentType: string,
): Promise<void> {
  await resolveDriver().put(key, data, contentType);
}

/** Read a stored document, or `null` if it is no longer there. */
export async function getObject(key: string): Promise<Buffer | null> {
  return resolveDriver().get(key);
}

/** Remove a stored document. */
export async function deleteObject(key: string): Promise<void> {
  await resolveDriver().delete(key);
}

/** Which driver is active, for the admin settings screen and the README. */
export function activeStorageDriver(): string {
  return resolveDriver().name;
}
