import { db } from './db'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Fixed-window rate limiter backed by the database, so it works identically
 * across serverless (Vercel) and long-running (cPanel) deployments without
 * needing any external service like Redis.
 *
 * `key` should uniquely identify the thing being limited, e.g. "/api/auth:1.2.3.4".
 * `limit` is the max requests allowed within `windowSeconds`.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = new Date()
  const windowMs = windowSeconds * 1000
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs)

  let count: number
  try {
    const entry = await db.rateLimitEntry.upsert({
      where: { key_windowStart: { key, windowStart } },
      create: { key, windowStart, count: 1 },
      update: { count: { increment: 1 } },
    })
    count = entry.count
  } catch (err) {
    // If the rate-limit table/DB has an issue, fail OPEN rather than taking
    // the whole app down — availability matters more than this protection.
    console.error('Rate limit check failed, allowing request:', err)
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 }
  }

  // Best-effort cleanup of old windows so this table doesn't grow forever.
  // Only runs occasionally, and never blocks the actual response.
  if (Math.random() < 0.01) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    db.rateLimitEntry.deleteMany({ where: { windowStart: { lt: cutoff } } }).catch(() => {})
  }

  const allowed = count <= limit
  const retryAfterSeconds = allowed
    ? 0
    : Math.ceil((windowStart.getTime() + windowMs - now.getTime()) / 1000)

  return { allowed, remaining: Math.max(0, limit - count), retryAfterSeconds }
}

/** Best-effort extraction of the client's IP from standard proxy headers. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const real = headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}
