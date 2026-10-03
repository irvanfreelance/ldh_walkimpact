import { getRedis } from '@/lib/cache/redis'

export async function rateLimit(
  ip: string,
  limit = 5,
  windowSeconds = 600
): Promise<boolean> {
  try {
    const redis = getRedis()
    if (!redis) return false // Allow if Redis is not configured

    const key = `ratelimit:${ip}`
    const current = await redis.incr(key)
    if (current === 1) {
      await redis.expire(key, windowSeconds)
    }

    return current > limit
  } catch (error) {
    console.warn('Rate limit check failed, allowing request:', error)
    return false
  }
}
