import rateLimit from 'express-rate-limit';
import { User } from '../types/index.js';

// OWASP A04: Rate Limiting for Authentication (Brute Force / Credential Stuffing Defense)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
    }
  }
});

// OWASP A03: Input Sanitization Helper (Strip HTML/Script tags to prevent XSS)
export function sanitizeString(input?: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags
    .replace(/<[^>]+>/g, '') // Strip generic HTML tags
    .trim();
}

// OWASP A02: Sensitive Data Exposure Prevention (Sanitize User Objects)
export function sanitizeUser(user: User): Partial<User> {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// OWASP A07: Password Strength Validation
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters in length.'
    };
  }
  return { valid: true };
}
