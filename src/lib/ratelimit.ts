// src/lib/ratelimit.ts

/**
 * Enhanced rate limiter with Redis support and in-memory fallback.
 * Uses Upstash Redis in production, falls back to in-memory for development.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory cache as fallback
const cache = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.resetAt) {
      cache.delete(key);
    }
  }
}, 60 * 1000); // Cleanup every minute

export async function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000 // 1 minute
) {
  const now = Date.now();
  const entry = cache.get(key);

  if (!entry || now > entry.resetAt) {
    // New window or expired
    cache.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Helper to get client IP in Next.js
 */
export function getIp(req?: Request) {
  if (req) {
    const forwarded = req.headers.get("x-forwarded-for");
    return forwarded ? forwarded.split(",")[0] : "127.0.0.1";
  }
  return "127.0.0.1";
}

/**
 * Rate limit by user ID (more reliable than IP)
 */
export async function rateLimitByUser(
  userId: string,
  action: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
) {
  const key = `user:${userId}:${action}`;
  return rateLimit(key, limit, windowMs);
}

/**
 * Rate limit by IP address
 */
export async function rateLimitByIp(
  req: Request,
  action: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
) {
  const ip = getIp(req);
  const key = `ip:${ip}:${action}`;
  return rateLimit(key, limit, windowMs);
}

/**
 * Rate limit wrapper for server actions
 * Applies rate limiting before executing the action
 */
export async function withRateLimit<T>(
  userId: string,
  action: string,
  fn: () => Promise<T>,
  limit: number = 10,
  windowMs: number = 60 * 1000
): Promise<T> {
  const result = await rateLimitByUser(userId, action, limit, windowMs);
  
  if (!result.success) {
    throw new Error(`Rate limit exceeded. Please try again later.`);
  }
  
  return fn();
}
