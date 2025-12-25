/**
 * Simple encryption/decryption utilities for localStorage data
 * Uses AES-like encryption with browser's SubtleCrypto API
 */

// Generate a key from the user's browser fingerprint
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(
      `smbowner-${navigator.userAgent}-${window.location.hostname}`
    )
  );

  return crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data for secure storage
 */
export async function encryptData(data: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    // Fallback to unencrypted if encryption fails
    return data;
  }
}

/**
 * Decrypt data from secure storage
 */
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    // Fallback to assuming unencrypted data
    return encryptedData;
  }
}

/**
 * Securely store data in localStorage with encryption
 */
export async function secureSetItem(key: string, value: string): Promise<void> {
  const encrypted = await encryptData(value);
  localStorage.setItem(key, encrypted);
}

/**
 * Securely retrieve data from localStorage with decryption
 */
export async function secureGetItem(key: string): Promise<string | null> {
  const encrypted = localStorage.getItem(key);
  if (!encrypted) return null;

  return await decryptData(encrypted);
}

/**
 * Check if browser supports encryption
 */
export function isEncryptionSupported(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
}
