// src/lib/security.ts
import { headers } from "next/headers";

/**
 * Get client IP address from request headers
 */
export function getClientIp(): string {
  const headersList = headers();
  const forwarded = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return "127.0.0.1";
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(): string {
  const headersList = headers();
  return headersList.get("user-agent") || "Unknown";
}

/**
 * Validate CSRF token (basic implementation)
 */
export function validateCsrfToken(token: string): boolean {
  // In production, use a proper CSRF library like csrf-csrf
  // This is a placeholder for demonstration
  const sessionToken = headers().get("x-csrf-token");
  return sessionToken === token;
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone);
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return "*".repeat(data.length);
  }
  return data.substring(0, visibleChars) + "*".repeat(data.length - visibleChars);
}
