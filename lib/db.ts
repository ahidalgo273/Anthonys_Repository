import { PrismaClient } from "@prisma/client";

/**
 * One Prisma client for the whole app.
 *
 * Next.js hot-reloads modules in development, which would otherwise create a
 * new database connection on every file save until the connection pool runs
 * out. Caching the client on `globalThis` avoids that; in production the module
 * is only evaluated once, so the branch never matters.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
