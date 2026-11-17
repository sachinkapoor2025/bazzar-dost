import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function databaseConfigured(): boolean {
  const url = process.env.DATABASE_URL || "";
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) return false;
  try {
    return Boolean(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function isUniqueConstraint(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002";
}

export async function readDatabase<T>(fallback: T, read: (client: PrismaClient) => Promise<T>): Promise<T> {
  if (!databaseConfigured()) return fallback;
  try {
    return await read(prisma);
  } catch (error) {
    console.error(error);
    return fallback;
  }
}
