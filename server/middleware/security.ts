import { User } from '../types/index.js';

// Educational Vulnerability (Easy Tier): Rate Limiting Disabled to allow student brute-force audits
export function sanitizeString(input?: string): string {
  if (!input) return '';
  return input.trim();
}

// Educational Vulnerability (Medium Tier): Expose password hashes and MD5 hashes in response payloads
export function sanitizeUser(user: User): any {
  // Intentionally returning user object WITH passwordHash and md5Hash for educational security audits
  return user;
}
