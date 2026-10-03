import { Redis } from '@upstash/redis'
import { revalidatePath } from 'next/cache'
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
    revalidatePath('/')
    revalidatePath('/daftar')
  } catch (error) {
    console.warn('Failed to invalidate quota cache:', error)
  }
}

export async function invalidatePaymentMethodsCache(): Promise<void> {
  try {
    const r = getRedis()
    if (r) {
      await r.del(CACHE_KEYS.PAYMENT_METHODS)
    }
    revalidatePath('/')
    revalidatePath('/daftar')
  } catch (error) {
    console.warn('Failed to invalidate payment methods cache:', error)
  }
}

export async function invalidateEventCache(): Promise<void> {
  try {
    const r = getRedis()
    if (r) {
      await r.del(CACHE_KEYS.EVENT_DATA)
      await r.del(CACHE_KEYS.FAQS)
      await r.del(CACHE_KEYS.PAYMENT_METHODS)
    }
    revalidatePath('/')
    revalidatePath('/daftar')
  } catch (error) {
    console.warn('Failed to invalidate event cache:', error)
  }
}

/**
 * Flush all walkimpact:* cache keys and trigger on-demand page revalidation
 */
export async function flushAllWalkImpactCache(): Promise<number> {
  let deletedCount = 0
  try {
    const r = getRedis()
    if (r) {
      const keys = await r.keys('walkimpact:*')
      if (keys.length > 0) {
        deletedCount = await r.del(...keys)
      }
    }
    revalidatePath('/')
    revalidatePath('/daftar')
  } catch (error) {
    console.warn('Failed to flush walkimpact cache:', error)
  }
  return deletedCount
}
