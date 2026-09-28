// app/lib/auth/isAdmin.ts
//
// Second-layer admin check, used inside Server Actions specifically.
// middleware.ts already blocks non-admins from ever rendering /admin/*
// pages — but a Server Action is its own callable endpoint, independent
// of which page rendered the button that triggered it. This re-checks
// the same allowlist directly, so an action like updateRequestStatus
// can't run for anyone who isn't an authenticated admin, even if the
// middleware's route matcher is ever changed or misconfigured later.

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

const AUTHORIZED_ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  const email = (sessionClaims?.email as string | undefined)?.toLowerCase()

  if (!userId || !email || !AUTHORIZED_ADMIN_EMAILS.includes(email)) {
    redirect('/')
  }

  return { userId, email }
}
