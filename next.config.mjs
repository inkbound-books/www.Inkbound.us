/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // VULN-04: Suppress X-Powered-By: Next.js header
  poweredByHeader: false,

  async headers() {
    const securityHeaders = [
      // VULN-03: Clickjacking protection
      { key: "X-Frame-Options", value: "DENY" },
      // VULN-03: MIME sniffing protection
      { key: "X-Content-Type-Options", value: "nosniff" },
      // VULN-03: Referrer info leakage
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // VULN-03: Disable unnecessary browser features
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      // VULN-03: Basic XSS protection for older browsers
      { key: "X-XSS-Protection", value: "1; mode=block" },
      // VULN-03: Content Security Policy
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          // 'unsafe-inline' required by next-themes (injects inline script to set theme
          // before first paint to avoid flash). 'unsafe-eval' required by Next.js runtime.
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          // 'unsafe-inline' needed for Tailwind/shadcn. fonts.googleapis.com for Google Fonts CSS.
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          // fonts.gstatic.com serves the actual font files (Inter, Dancing Script)
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob:",
          // va.vercel-scripts.com = Vercel Analytics endpoint
          "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
          // VULN-06: epub-viewer uses blob: iframes for sandboxed EPUB rendering
          "frame-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; "),
      },
    ]

    return [
      // Apply security headers to all routes
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // VULN-01: Lock down CORS on all /admin routes â€” no wildcard origin
      {
        source: "/admin/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://www.inkbound.us",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
        ],
      },
    ]
  },
}

export default nextConfig