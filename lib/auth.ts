/**
 * Simple passkey authentication system
 * Uses browser localStorage to track authentication state
 * Passkey verification happens server-side via /api/auth (hash never exposed to client)
 */

/**
 * Verify if the provided passkey is correct (server-side comparison)
 */
export async function verifyPasskey(passkey: string): Promise<boolean> {
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passkey }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;

  const authToken = localStorage.getItem('smbowner_auth');
  const authExpiry = localStorage.getItem('smbowner_auth_expiry');

  if (!authToken || !authExpiry) return false;

  // Check if token has expired (24 hour session)
  const expiryTime = parseInt(authExpiry, 10);
  const now = Date.now();

  if (now > expiryTime) {
    // Token expired, clear it
    clearAuth();
    return false;
  }

  return authToken === 'authenticated';
}

/**
 * Set authentication state
 */
export function setAuth(): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const expiryTime = now + (24 * 60 * 60 * 1000); // 24 hours

  localStorage.setItem('smbowner_auth', 'authenticated');
  localStorage.setItem('smbowner_auth_expiry', expiryTime.toString());
}

/**
 * Clear authentication state
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('smbowner_auth');
  localStorage.removeItem('smbowner_auth_expiry');
}

/**
 * Get remaining session time in milliseconds
 */
export function getSessionTimeRemaining(): number {
  if (typeof window === 'undefined') return 0;

  const authExpiry = localStorage.getItem('smbowner_auth_expiry');
  if (!authExpiry) return 0;

  const expiryTime = parseInt(authExpiry, 10);
  const now = Date.now();

  return Math.max(0, expiryTime - now);
}

/**
 * Extend session by another 24 hours
 */
export function extendSession(): void {
  if (!isAuthenticated()) return;
  setAuth(); // This resets the expiry to 24 hours from now
}

/**
 * Generate a passkey hash for environment variable setup
 * This is a utility function for initial setup
 */
export async function generatePasskeyHash(passkey: string): Promise<string> {
  return await hashPassword(passkey);
}
