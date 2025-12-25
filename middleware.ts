import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  const securityHeaders = {
    // HSTS - Force HTTPS for 1 year
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

    // Prevent clickjacking attacks
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // XSS Protection (legacy but still useful)
    'X-XSS-Protection': '1; mode=block',

    // Referrer Policy - Don't leak URLs to external sites
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions Policy - Disable unnecessary browser features
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',

    // Content Security Policy - Prevent XSS and other injection attacks
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval in dev
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api2.bankstatementconverter.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  };

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // HTTPS Enforcement (only in production)
  if (process.env.NODE_ENV === 'production') {
    const protocol = request.headers.get('x-forwarded-proto');
    if (protocol === 'http') {
      return NextResponse.redirect(
        `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
        301
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
