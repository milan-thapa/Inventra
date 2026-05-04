// src/lib/ratelimit.ts

/**
 * A simple in-memory rate limiter for serverless environments.
 * Note: In a true multi-server/serverless environment, this should 
 * ideally use Redis (Upstash) for global state.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const cache = new Map<string, RateLimitEntry>();

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
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
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
