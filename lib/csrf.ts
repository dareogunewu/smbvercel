/**
 * CSRF (Cross-Site Request Forgery) protection utilities
 */

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate Origin header to prevent CSRF attacks
 */
export function validateOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host) {
    // In development, allow missing origin
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    return false;
  }

  // Extract hostname from origin
  const originHost = new URL(origin).host;

  // Must match the request host
  return originHost === host;
}

/**
 * Validate request method for CSRF protection
 */
export function validateMethod(method: string): boolean {
  // Safe methods that don't need CSRF protection
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

  if (safeMethods.includes(method)) {
    return true;
  }

  // For unsafe methods (POST, PUT, DELETE), additional validation needed
  return false;
}
