/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Sanitize user input for safe display
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
}

/**
 * Validate and sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/\.{2,}/g, '.') // Prevent directory traversal
    .substring(0, 255); // Limit file name length
}

/**
 * Validate file type (only allow PDFs)
 */
export function isValidFileType(file: File): boolean {
  const allowedTypes = ['application/pdf'];
  const allowedExtensions = ['.pdf'];

  const hasValidType = allowedTypes.includes(file.type);
  const hasValidExtension = allowedExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );

  return hasValidType && hasValidExtension;
}

/**
 * Validate file size (max 10MB)
 */
export function isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes && file.size > 0;
}

/**
 * Comprehensive file validation
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!isValidFileType(file)) {
    return { valid: false, error: 'Invalid file type. Only PDF files are allowed.' };
  }

  if (!isValidFileSize(file)) {
    return { valid: false, error: 'File too large. Maximum size is 10MB.' };
  }

  return { valid: true };
}

/**
 * Sanitize category name
 */
export function sanitizeCategory(category: string): string {
  if (!category) return 'Uncategorized';

  return category
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 100);
}

/**
 * Sanitize transaction description
 */
export function sanitizeDescription(description: string): string {
  if (!description) return '';

  return description
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 500);
}

/**
 * Validate and sanitize amount
 */
export function sanitizeAmount(amount: number | string): number {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }

  // Limit to reasonable range (-1M to 1M)
  return Math.max(-1000000, Math.min(1000000, num));
}

/**
 * Validate email format (for future use)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Rate limit check for client-side operations
 */
const rateLimitMap = new Map<string, number[]>();

export function checkClientRateLimit(
  action: string,
  maxAttempts: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const attempts = rateLimitMap.get(action) || [];

  // Remove old attempts outside the window
  const recentAttempts = attempts.filter((time) => now - time < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    return false; // Rate limit exceeded
  }

  // Add new attempt
  recentAttempts.push(now);
  rateLimitMap.set(action, recentAttempts);

  return true; // Within rate limit
}
