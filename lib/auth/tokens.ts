import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Token generation and hashing for magic-link sign-in.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS IS HAND-WRITTEN
 * There are no passwords in this system — sign-in is entirely "we email you a
 * link". That is one of the few auth flows small enough to implement correctly
 * in one readable file, and doing so avoids depending on a beta release of an
 * auth library for a business that has to keep running for years.
 *
 * The rules it follows:
 *   - Tokens are 32 random bytes from the OS random source, not a counter or a
 *     timestamp.
 *   - Only a SHA-256 hash is stored. Someone who steals a database backup
 *     cannot sign in as anyone.
 *   - Sign-in links are single use and expire in 15 minutes.
 *   - Comparisons are constant time, so response timing does not leak whether
 *     a token was close.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** How long a sign-in link stays valid. */
export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

/** How long a signed-in session lasts before requiring a new link. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Sign-in links a single email address may request per window. */
export const RATE_LIMIT_MAX_REQUESTS = 5;
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/** A new random token. Return it to the user once; store only its hash. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 of a token. Fast is fine here: the token is 256 bits of entropy, not a password. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time comparison of two hex hashes. */
export function hashesEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "hex");
  const bufferB = Buffer.from(b, "hex");
  // timingSafeEqual throws on length mismatch, which would itself leak length.
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function expiryFromNow(ttlMs: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + ttlMs);
}

export function isExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
