import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { verifyMagicLink } from "@/lib/auth/magic-link";
import { db } from "@/lib/db";

/**
 * Where a sign-in link lands.
 *
 * Redirects rather than rendering, so the token never stays in the address bar
 * of a page the user might bookmark or share.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const next = url.searchParams.get("next");

  const result = await verifyMagicLink(token);

  if (!result.ok) {
    return NextResponse.redirect(new URL(`/signin?error=${result.reason}`, url.origin));
  }

  await createSession(result.userId);

  const user = await db.user.findUnique({ where: { id: result.userId } });
  const fallback = user?.role === "ADMIN" ? "/admin" : "/portal";

  // Only allow same-site relative paths, so a crafted link cannot bounce a
  // freshly signed-in user to another domain.
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;

  return NextResponse.redirect(new URL(destination, url.origin));
}
