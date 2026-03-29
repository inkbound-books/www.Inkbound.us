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
      // NOTE: 'unsafe-inline' on style-src is needed for Tailwind/shadcn inline styles.
      // Tighten further once you have a nonce-based setup or move to CSS modules.
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval'", // 'unsafe-eval' required by Next.js dev mode; remove in prod if possible
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self'",
          "connect-src 'self'",
          "frame-src 'none'",
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
      // VULN-01: Lock down CORS on all /admin routes — no wildcard origin
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
