import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const adminSession = request.cookies.get("admin_session")
  const isAuthenticated = adminSession?.value === "authenticated"
  const pathname = request.nextUrl.pathname

  // Protect admin routes - redirect to admin login if not authenticated
  if (
    pathname.startsWith('/admin') &&
    pathname !== '/admin/login' &&
    !pathname.startsWith('/admin/login/') &&
    !isAuthenticated
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // If authenticated and trying to access login page, redirect to admin dashboard
  if (pathname === '/admin/login' && isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  // For authenticated admin requests, ensure the response carries the cookie forward
  const response = NextResponse.next()
  
  return response
}

export const config = {
  matcher: [
    // Match all admin routes
    '/admin/:path*',
  ],
}
