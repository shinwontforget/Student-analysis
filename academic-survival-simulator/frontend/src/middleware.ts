import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Routes that require an authenticated session. */
const PROTECTED_PREFIXES = ['/dashboard']

/** Routes that should redirect authenticated users away (e.g. already logged in). */
const AUTH_ROUTES = ['/login', '/signup']

/**
 * Middleware that:
 * 1. Refreshes the Supabase session on every request (required by @supabase/ssr).
 * 2. Redirects unauthenticated visitors away from /dashboard/** → /login.
 * 3. Redirects already-authenticated visitors away from /login and /signup → /dashboard.
 *
 * IMPORTANT: Keep the session refresh block (createServerClient → getUser) intact
 * with no logic inserted between them, or session tokens may become stale.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write cookies back to the request so downstream middleware can read them.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Re-create the response so the new cookies are included in the reply.
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT insert any code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Route protection ────────────────────────────────────────────────────────

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  if (!user && isProtected) {
    // Unauthenticated user hitting a protected route → send to /login.
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    // Preserve the intended destination so we can redirect back after login.
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isAuthRoute) {
    // Already authenticated user hitting /login or /signup → send to /dashboard.
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // ── Return the supabaseResponse (never NextResponse.next()) ─────────────────
  // This ensures refreshed session cookies are forwarded to the browser.
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static assets)
     * - _next/image   (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - common image extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
