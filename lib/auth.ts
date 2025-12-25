/**
 * Simple passkey authentication system
 * Uses browser localStorage to track authentication state
 */

// Hash function for secure password comparison
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Set the site passkey (only needs to be done once)
 * This should be set via environment variable
 */
export function getPasskeyHash(): string {
  // In production, this should come from environment variable
  // For now, we'll use a default that you should change
  return process.env.NEXT_PUBLIC_PASSKEY_HASH || '';
}

/**
 * Verify if the provided passkey is correct
 */
export async function verifyPasskey(passkey: string): Promise<boolean> {
  const passkeyHash = getPasskeyHash();

  // If no passkey is set, allow access (for initial setup)
  if (!passkeyHash) {
    console.warn('No passkey configured! Set NEXT_PUBLIC_PASSKEY_HASH environment variable.');
    return true;
  }

  const inputHash = await hashPassword(passkey);
  return inputHash === passkeyHash;
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
