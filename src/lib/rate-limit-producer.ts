// src/lib/rate-limit-producer.ts
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// Create different rate limiters for different use cases
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "ratelimit",
});

export const strictRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
  prefix: "strict-ratelimit",
});

export const apiRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "api-ratelimit",
});

export const authRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "auth-ratelimit",
});

/**
 * Rate limit by identifier (user ID, IP, etc.)
 */
export async function rateLimitByIdentifier(
  identifier: string,
  limit: number = 10,
  window: string = "10 s"
) {
  const limiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
    prefix: `custom-${identifier}`,
  });

  const { success, remaining, reset } = await limiter.limit(identifier);
  
  return {
    success,
    remaining,
    reset: new Date(reset),
  };
}
