import { NextResponse, type NextRequest } from "next/server"

// ─── VULN-02: In-memory rate limiter ─────────────────────────────────────────
// Edge runtime shares memory per isolate, so this is best-effort on Vercel.
// For production-grade limiting use Upstash Redis (@upstash/ratelimit).
// This still blocks most scripted brute-force that hits the same edge instance.
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 5            // attempts per window

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  record.count++
  if (record.count > RATE_LIMIT_MAX) return true

  return false
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  )
}

// ─── Main middleware ──────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const adminSession = request.cookies.get("admin_session")
  const isAuthenticated = adminSession?.value === "authenticated"

  // VULN-02: Rate-limit POST /admin/login
  if (pathname === "/admin/login" && request.method === "POST") {
    const ip = getClientIp(request)
    if (isRateLimited(ip)) {
      return new NextResponse(
        JSON.stringify({ error: "Too many login attempts. Try again in a minute." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      )
    }
  }

  // Protect admin routes
  if (
    pathname.startsWith("/admin") &&
    pathname !== "/admin/login" &&
    !pathname.startsWith("/admin/login/") &&
    !isAuthenticated
  ) {
    // VULN-07: Always redirect to login — never 404 — so route existence isn't leaked.
    // Unauthenticated requests to ANY /admin/* path (real or not) get the same response.
    const url = request.nextUrl.clone()
    url.pathname = "/admin/login"
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login
  if (pathname === "/admin/login" && isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = "/admin"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
