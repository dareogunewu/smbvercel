/**
 * Passkey authentication — session stored in localStorage.
 * Verification is server-side (/api/auth); the hash never reaches the client.
 * Session expires after 8 hours of inactivity and is renewed on each authenticated action.
 */

const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours

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

  const expiryTime = parseInt(authExpiry, 10);
  if (Date.now() > expiryTime) {
    clearAuth();
    return false;
  }

  // Slide the inactivity window on each check
  extendSession();
  return authToken === 'authenticated';
}

/**
 * Set authentication state
 */
export function setAuth(): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const expiryTime = now + SESSION_TTL;

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
 * Slide the session inactivity window forward (called automatically by isAuthenticated)
 */
export function extendSession(): void {
  if (typeof window === 'undefined') return;
  const authToken = localStorage.getItem('smbowner_auth');
  if (authToken !== 'authenticated') return;
  localStorage.setItem('smbowner_auth_expiry', (Date.now() + SESSION_TTL).toString());
}

