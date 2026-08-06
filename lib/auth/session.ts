import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { db } from "@/lib/db";
import {
  SESSION_TTL_MS,
  expiryFromNow,
  generateToken,
  hashToken,
  isExpired,
} from "./tokens";

/**
 * Sessions.
 *
 * A session is a random token in an httpOnly cookie; the database stores only
 * its hash and expiry. Signing out deletes the row, so a stolen cookie stops
 * working immediately rather than staying valid until it expires.
 */

const SESSION_COOKIE = "dd_session";

export async function createSession(userId: string): Promise<void> {
  const token = generateToken();

  await db.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: expiryFromNow(SESSION_TTL_MS),
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // `lax` still sends the cookie on the top-level navigation that a magic
    // link produces, while blocking cross-site form posts.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

/** The signed-in user, or null. Safe to call from any server component. */
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session) return null;

  if (isExpired(session.expiresAt)) {
    // Clean up as we go, so expired rows do not accumulate.
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {});
  }

  store.delete(SESSION_COOKIE);
}

/**
 * Require a signed-in user, or send them to sign in.
 *
 * `next` carries the page they were trying to reach, so the sign-in link
 * returns them there instead of dumping them on the dashboard.
 */
export async function requireUser(next?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(next ? `/signin?next=${encodeURIComponent(next)}` : "/signin");
  }
  return user;
}

/**
 * Require an admin.
 *
 * A signed-in client who reaches an admin URL gets sent to their own portal
 * rather than a "forbidden" page — it tells them nothing about what exists,
 * and it is what they actually wanted.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/admin");
  if (user.role !== ("ADMIN" satisfies Role)) redirect("/portal");
  return user;
}

/** Whether the current visitor is an admin, without redirecting. */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}
