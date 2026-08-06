import { absoluteUrl } from "@/config/site";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { magicLinkEmail } from "@/lib/email/templates";
import { logActivity } from "@/lib/activity";
import {
  MAGIC_LINK_TTL_MS,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  expiryFromNow,
  generateToken,
  hashToken,
  isExpired,
} from "./tokens";

/**
 * Issuing and redeeming sign-in links.
 *
 * A deliberate design point: requesting a link for an address that has no
 * account returns the same success message as one that does. Otherwise this
 * endpoint becomes a way to test whether a given person is a client.
 */

export type RequestLinkResult = { ok: true } | { ok: false; error: string };

export async function requestMagicLink({
  email,
  next,
  ip,
}: {
  email: string;
  next?: string;
  ip?: string | null;
}): Promise<RequestLinkResult> {
  const normalized = email.toLowerCase().trim();

  // Rate limit per address, so nobody can flood someone's inbox with links.
  const recentCount = await db.magicLinkToken.count({
    where: {
      email: normalized,
      createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
    },
  });

  if (recentCount >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      ok: false,
      error: "Too many sign-in requests. Please wait 15 minutes and try again.",
    };
  }

  const user = await db.user.findUnique({ where: { email: normalized } });

  // No account: say nothing, do nothing, report success. The caller shows the
  // same "check your email" message either way.
  if (!user) {
    console.info(`[auth] Sign-in requested for unknown address ${normalized}. No email sent.`);
    return { ok: true };
  }

  const token = generateToken();

  await db.magicLinkToken.create({
    data: {
      email: normalized,
      tokenHash: hashToken(token),
      expiresAt: expiryFromNow(MAGIC_LINK_TTL_MS),
      requestIp: ip ?? null,
    },
  });

  const url = absoluteUrl(
    `/api/auth/verify?token=${encodeURIComponent(token)}${next ? `&next=${encodeURIComponent(next)}` : ""}`,
  );

  await sendEmail(magicLinkEmail({ to: normalized, url }));

  await logActivity({
    actorType: "system",
    entityType: "user",
    entityId: user.id,
    action: "magic_link_requested",
  });

  return { ok: true };
}

export type VerifyResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "expired" | "used" | "no_user" };

/**
 * Redeem a sign-in link.
 *
 * The token is consumed on the first successful use. A second click on the
 * same link — including one from an email scanner that pre-fetches URLs —
 * fails as "used" rather than signing anyone in.
 */
export async function verifyMagicLink(token: string): Promise<VerifyResult> {
  if (!token) return { ok: false, reason: "invalid" };

  const record = await db.magicLinkToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record) return { ok: false, reason: "invalid" };
  if (record.usedAt) return { ok: false, reason: "used" };
  if (isExpired(record.expiresAt)) return { ok: false, reason: "expired" };

  const user = await db.user.findUnique({ where: { email: record.email } });
  if (!user) return { ok: false, reason: "no_user" };

  // Mark used before creating the session, and only if it is still unused.
  // Two simultaneous clicks cannot both succeed.
  const consumed = await db.magicLinkToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  if (consumed.count === 0) return { ok: false, reason: "used" };

  await logActivity({
    actorType: "client",
    actorEmail: user.email,
    entityType: "user",
    entityId: user.id,
    action: "signed_in",
  });

  return { ok: true, userId: user.id };
}

/** Housekeeping: drop expired tokens. Called by the daily cron job. */
export async function purgeExpiredTokens(): Promise<number> {
  const result = await db.magicLinkToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return result.count;
}
