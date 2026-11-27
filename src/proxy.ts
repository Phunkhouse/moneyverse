import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Optimistic check only: sends visitors without a session cookie to the sign-in page. It does not
 * validate the session; every page and action does that through `requireUser()`.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next()
  return NextResponse.redirect(new URL('/prihlaseni', request.url))
}

export const config = {
  // Everything except the sign-in and invite pages, the auth API, Next's assets, the icons and
  // the manifest (browsers fetch those without cookies), and cron routes, which check their own
  // secret (Vercel Cron does not follow redirects).
  // Each exception matches a whole path segment, so `/prihlaseni-x` is still covered.
  matcher: [
    '/((?!(?:prihlaseni|pozvanka|api/auth|api/cron|_next/static|_next/image|icon\\.svg|apple-icon\\.png|favicon\\.ico|icons|manifest\\.webmanifest)(?:/|$)).*)',
  ],
}
