// lib/security.ts
//
// Shared anti-abuse helpers for public Server Actions: rate limiters
// (Upstash Redis) and Cloudflare Turnstile verification.
//
// NOTE: getClientIp reads from next/headers, not a Request object — Server
// Actions don't receive one. This only works inside a Server Action or a
// Server Component render, not in a Route Handler (which gets Request
// directly instead).

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { headers } from 'next/headers'

// Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from the environment.
const redis = Redis.fromEnv()

// Per-IP: catches a single machine hammering the action directly.
export const ipLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  prefix: 'rl:booking:ip',
})

// Per phone/email: catches a botnet that rotates IPs but reuses contact info.
// Weak on its own against a script that fakes a new number every request —
// this is a second layer behind the honeypot and Turnstile, not the first.
export const contactLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'rl:booking:contact',
})

export async function getClientIp(): Promise<string> {
  const h = await headers()
  return (
    h.get('x-real-ip') ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

// Server-side Turnstile check. Tokens are single-use and expire after a few
// minutes, so a valid one proves a real browser just passed the challenge.
export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const params = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY ?? '',
    response: token,
  })
  if (ip !== 'unknown') params.set('remoteip', ip)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: params,
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    // Fail closed: if verification can't run, treat the request as unverified.
    return false
  }
}
