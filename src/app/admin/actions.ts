// app/admin/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '../lib/prisma/prisma'            // adjust to your prisma.ts location
import { requireAdmin } from '../lib/auth/isAdmin' // the helper from the Clerk setup; adjust path

// The allowed values mirror the TripRequestStatus enum in schema.prisma.
const updateSchema = z.object({
  ref: z.string().min(1),
  status: z.enum(['new', 'contacted', 'confirmed', 'cancelled']),
})

export interface UpdateResult {
  success: boolean
  error?: string
}

export async function updateRequestStatus(
  ref: string,
  status: string
): Promise<UpdateResult> {
  // Server Actions are callable endpoints, not just functions your UI happens
  // to use. Middleware protects the /admin pages, but the action re-checks
  // the allowlist itself so it can't be invoked by anyone else, even if the
  // middleware config is ever changed by mistake.
  await requireAdmin()

  // The dropdown only offers valid values, but the client is never trusted:
  // validate again here before anything touches the database.
  const parsed = updateSchema.safeParse({ ref, status })
  if (!parsed.success) {
    return { success: false, error: 'Invalid status update.' }
  }

  try {
    await prisma.tripRequest.update({
      where: { ref: parsed.data.ref },
      data: { status: parsed.data.status },
    })

    // Tells Next the /admin data changed, so the page re-queries Prisma and
    // the inbox receives fresh props.
    revalidatePath('/admin')
    return { success: true }
  } catch (err) {
    console.error('[updateRequestStatus]', err)
    return { success: false, error: 'Could not update the status. Please try again.' }
  }
}
