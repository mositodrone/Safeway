// lib/prisma.ts  (Prisma 7 version — driver adapter required)
//
// WHAT CHANGED FROM THE PRISMA 6 VERSION:
// Prisma 7 removed the ability for PrismaClient to read DATABASE_URL
// implicitly. It now REQUIRES a driver adapter to be passed in explicitly —
// this is a deliberate design change to keep the core client lean and to
// let each database (Postgres, SQLite, Neon, etc.) plug in its own
// optimized driver rather than Prisma bundling a generic one for everyone.
//
// For Neon specifically, @prisma/adapter-neon is the recommended adapter —
// it uses Neon's own serverless driver under the hood, which matters if
// this ever runs in a serverless/edge environment (e.g. Vercel functions),
// since a normal long-lived TCP connection pool doesn't behave well there.
//
// The singleton pattern (avoiding multiple clients during Next.js dev
// hot-reload) is unchanged from before — only the construction changed.

import { PrismaClient } from '../generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const connectionString = process.env.DATABASE_URL!

const adapter = new PrismaNeon({ connectionString })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
