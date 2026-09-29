// app/booking/actions.ts
'use server'

import { bookingSchema, type BookingFormValues } from '../schemas/booking.schema'
import { prisma } from '../prisma/prisma'
import {
  contactLimiter,
  getClientIp,
  ipLimiter,
  verifyTurnstile,
} from '../security/security'

// ── Anti-abuse metadata ───────────────────────────────────────────────────────
// Kept separate from BookingFormValues on purpose: `honeypot` and
// `turnstileToken` aren't trip data, and folding them into bookingSchema
// would leak security plumbing into every other place that schema is reused
// (admin views, emails, exports, etc).
export interface SubmitMeta {
  honeypot: string        // must arrive empty — a bot fills every field
  turnstileToken: string
}

// ── Reference number generator ──────────────────────────────────────────────
// Human-readable, shown to the customer immediately and used if they call
// in to ask about their request. Not cryptographically unique — collision
// risk is negligible at this volume, and the DB's unique constraint on
// `ref` will catch the rare clash and this can be retried.
function generateReference(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `SFW-${year}-${rand}`
}

export interface SubmitResult {
  success: boolean
  reference?: string
  error?: string
}

export async function submitTripRequest(
  raw: BookingFormValues,
  meta: SubmitMeta
): Promise<SubmitResult> {
  // ── Step 1: honeypot ────────────────────────────────────────────────────────
  // Real users never see or fill this field. A bot filling every input on the
  // page trips it. Return a fake success so it doesn't learn to skip the field
  // next time — don't reveal that it was caught.
  if (meta.honeypot) {
    return { success: true, reference: generateReference() }
  }

  const ip = await getClientIp()

  // ── Step 2: per-IP rate limit ───────────────────────────────────────────────
  // Cheapest real check, so it runs before the Turnstile network call.
  const ipResult = await ipLimiter.limit(ip)
  if (!ipResult.success) {
    return {
      success: false,
      error: 'Too many requests from your connection. Please try again in a few minutes.',
    }
  }

  // ── Step 3: Turnstile ────────────────────────────────────────────────────────
  // Proves a real browser rendered the page and passed the challenge —
  // this is what actually stops a script from calling this action directly
  // with a freshly-generated fake name/phone/email on every attempt.
  const verified = await verifyTurnstile(meta.turnstileToken, ip)
  if (!verified) {
    return {
      success: false,
      error: 'Verification failed. Please refresh the page and try again.',
    }
  }

  // ── Step 4: re-validate server-side ─────────────────────────────────────────
  // Never trust that the client actually ran the Zod check — this action
  // can be called directly with any payload.
  const parsed = bookingSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'Some details look invalid. Please check the form and try again.' }
  }
  const data = parsed.data

  // ── Step 5: rate limit by phone AND email ───────────────────────────────────
  // Redis-backed via Upstash — works correctly across serverless instances,
  // unlike an in-memory Map which resets per invocation on Vercel.
  const [phoneResult, emailResult] = await Promise.all([
    contactLimiter.limit(data.phone),
    contactLimiter.limit(data.email),
  ])
  if (!phoneResult.success || !emailResult.success) {
    return {
      success: false,
      error: 'You\u2019ve submitted a few requests recently. Please wait a bit before sending another, or call us directly.',
    }
  }

  // ── Step 6: write to the database ───────────────────────────────────────────
  try {
    const ref = generateReference()

    await prisma.tripRequest.create({
      data: {
        ref,
        pickup: data.pickup,
        destination: data.destination,
        isRoundTrip: data.isRoundTrip,
        departureDate: new Date(data.departureDate),
        returnDate: data.returnDate ? new Date(data.returnDate) : null,
        vehicleType: data.vehicleType,
        passengerCount: data.passengerCount,
        specialRequirements: data.specialRequirements || null,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        // status omitted: the schema default is 'new'
      },
    })

    // ── Step 7: notify — customer + your team ─────────────────────────────────
    // TODO: wire up actual email/SMS sending here. Two messages worth sending:
    //   1. To the customer: "We got your request, reference SFW-2026-00123,
    //      we'll call within 24h" — sets expectation, reduces "did this even
    //      submit?" anxiety.
    //   2. To your team (email, Slack webhook, or the admin dashboard) — so a
    //      new pending request doesn't sit unnoticed.
    // Resend is a clean fit for the customer email. Left out of this action
    // so it doesn't fail if that integration isn't set up yet — wire it in
    // wrapped in its own try/catch so an email failure never blocks the
    // request from being saved (the DB write above is the important part).

    return { success: true, reference: ref }
  } catch (err) {
    console.error('[submitTripRequest]', err)
    return {
      success: false,
      error: 'Something went wrong on our end. Please try again, or call us directly.',
    }
  }
}
