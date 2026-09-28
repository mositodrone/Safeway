// app/admin/page.tsx
//
// Server Component (deliberately NO 'use client'). Runs on the server, so it
// can query Prisma directly. It fetches the rows, converts them into plain
// serializable values, and hands them to the client component that owns
// all the interactivity (filters, search, status dropdowns).

import { prisma } from '../lib/prisma/prisma' // adjust if your prisma.ts lives elsewhere
import RequestsInbox, { type InboxRequest } from './_components/RequestsInbox'

// Admin data must always be live. Without this, Next can try to render the
// page once at build time and serve that stale (or empty) snapshot.
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const rows = await prisma.tripRequest.findMany({
    orderBy: { submittedAt: 'desc' },
  })

  // Prisma returns Date objects; the client component works with ISO strings,
  // so convert once here at the server/client boundary.
  const requests: InboxRequest[] = rows.map(r => ({
    ref: r.ref,
    fullName: r.fullName,
    email: r.email,
    phone: r.phone,
    pickup: r.pickup,
    destination: r.destination,
    departureDate: r.departureDate.toISOString(),
    returnDate: r.returnDate?.toISOString(),
    isRoundTrip: r.isRoundTrip,
    vehicleType: r.vehicleType,
    passengerCount: r.passengerCount,
    specialRequirements: r.specialRequirements ?? undefined,
    status: r.status,
    submittedAt: r.submittedAt.toISOString(),
  }))

  return <RequestsInbox initialRequests={requests} />
}
