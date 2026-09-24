import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// Ordered most-specific-first: the first matching prefix wins.
const API_RATE_LIMITS: { prefix: string; limit: number; windowSeconds: number }[] = [
  // Login attempts — stricter, to slow down brute-force guessing.
  { prefix: '/api/auth', limit: 10, windowSeconds: 300 },
  // Sign-ups — stricter, to slow down spam account creation.
  { prefix: '/api/register', limit: 5, windowSeconds: 3600 },
  // Everything else under /api — generous, just to catch runaway abuse/scraping.
  { prefix: '/api', limit: 120, windowSeconds: 60 },
]

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/')) {
    const rule = API_RATE_LIMITS.find((r) => pathname.startsWith(r.prefix))
    if (rule) {
      const ip = getClientIp(req.headers)
      const key = `${rule.prefix}:${ip}`
      const result = await checkRateLimit(key, rule.limit, rule.windowSeconds)

      if (!result.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again shortly.' },
          { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } }
        )
      }
    }
    return NextResponse.next()
  }

  // Page-level auth gate — equivalent to the previous middleware.ts's withAuth behavior.
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/tickets/:path*',
    '/board/:path*',
    '/team/:path*',
    '/reports/:path*',
    '/workload/:path*',
    '/api/:path*',
  ],
}
