// src/lib/db.ts
import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaRead: PrismaClient | undefined;
};

// Primary database with connection pooling
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Read replica for read operations (if available)
export const dbRead =
  globalForPrisma.prismaRead ??
  (process.env.DATABASE_READ_REPLICA_URL
    ? new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
        datasources: {
          db: {
            url: process.env.DATABASE_READ_REPLICA_URL,
          },
        },
      })
    : db);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaRead = dbRead;
}

// Graceful shutdown
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", async () => {
    await db.$disconnect();
    if (dbRead !== db) {
      await dbRead.$disconnect();
    }
  });
}

// Health check for database
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error("Database health check failed", error);
    return false;
  }
}
