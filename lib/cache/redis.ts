import { Redis } from '@upstash/redis'
import { CACHE_KEYS } from './keys'

let redis: Redis | null = null

export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    return null
  }

  if (!redis) {
    redis = new Redis({
      url,
      token,
    })
  }
  return redis
}

export async function invalidateQuotaCache(): Promise<void> {
  try {
    const r = getRedis()
    if (r) {
      await r.del(CACHE_KEYS.QUOTA)
    }
  } catch (error) {
    console.warn('Failed to invalidate quota cache:', error)
  }
}

export async function invalidateEventCache(): Promise<void> {
  try {
    const r = getRedis()
    if (r) {
      await r.del(CACHE_KEYS.EVENT_DATA)
      await r.del(CACHE_KEYS.FAQS)
    }
  } catch (error) {
    console.warn('Failed to invalidate event cache:', error)
  }
}
