// src/lib/cache.ts
import { redis } from "./redis";
import { logger } from "./logger";

const CACHE_PREFIX = "cache:";
const DEFAULT_TTL = 3600; // 1 hour in seconds

/**
 * Set cache with TTL
 */
export async function setCache(
  key: string,
  value: any,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    await redis.set(cacheKey, JSON.stringify(value), { ex: ttl });
  } catch (error) {
    logger.error("Cache set error", error, { key });
  }
}

/**
 * Get cache value
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const value = await redis.get(cacheKey);
    if (value === null) return null;
    return JSON.parse(value as string) as T;
  } catch (error) {
    logger.error("Cache get error", error, { key });
    return null;
  }
}

/**
 * Delete cache key
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    await redis.del(cacheKey);
  } catch (error) {
    logger.error("Cache delete error", error, { key });
  }
}

/**
 * Delete cache by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(`${CACHE_PREFIX}${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logger.error("Cache pattern delete error", error, { pattern });
  }
}

/**
 * Cache wrapper - get from cache or compute and store
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const result = await fn();
  await setCache(key, result, ttl);
  return result;
}

/**
 * Invalidate profile cache
 */
export async function invalidateProfileCache(profileId: string): Promise<void> {
  await deleteCachePattern(`profile:${profileId}:*`);
  await deleteCachePattern(`dashboard:${profileId}:*`);
  await deleteCachePattern(`parties:${profileId}:*`);
  await deleteCachePattern(`items:${profileId}:*`);
  await deleteCachePattern(`sales:${profileId}:*`);
}

/**
 * Cache stats
 */
export async function getCacheStats(): Promise<{
  keys: number;
  memory: number;
}> {
  try {
    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    return {
      keys: keys.length,
      memory: 0, // Upstash doesn't provide memory usage
    };
  } catch (error) {
    logger.error("Cache stats error", error);
    return { keys: 0, memory: 0 };
  }
}
