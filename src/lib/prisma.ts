/**
 * @file prisma.ts
 * @description Prisma client singleton for database access.
 * Prevents multiple instances during development hot-reloading.
 * This is the single source of truth for database connections.
 */

import { PrismaClient } from "@prisma/client";

/* Extend the global namespace to store the Prisma client instance */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma client singleton.
 * In development, stores the client on globalThis to survive hot-reloads.
 * In production, creates a single instance per process.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    /* Log queries in development for debugging */
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

/* Preserve the client instance across hot-reloads in development */
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
