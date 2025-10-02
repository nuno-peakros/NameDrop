import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma client instance with connection pooling
 * Uses singleton pattern to prevent multiple instances in development
 * 
 * @returns {PrismaClient} Configured Prisma client instance
 * 
 * @example
 * ```typescript
 * import { db } from '@/lib/db';
 * 
 * const users = await db.user.findMany();
 * ```
 */
export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
