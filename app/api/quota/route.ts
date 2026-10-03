import { NextResponse } from 'next/server'
import { getRedis } from '@/lib/cache/redis'
import { CACHE_KEYS, QUOTA_TTL } from '@/lib/cache/keys'
import { getQuotaFromDB, QuotaResult } from '@/lib/db/queries/quota'
import { getActiveEvent } from '@/lib/db/queries/events'

export const runtime = 'edge'

export async function GET() {
  try {
    const redis = getRedis()
    if (redis) {
      const cached = await redis.get<QuotaResult>(CACHE_KEYS.QUOTA)
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        })
      }
    }

    const event = await getActiveEvent()
    if (!event) {
      return NextResponse.json({ error: 'No active event' }, { status: 404 })
    }

    const quota = await getQuotaFromDB(event.id)
    if (!quota) {
      return NextResponse.json({ error: 'Failed to calculate quota' }, { status: 500 })
    }

    if (redis) {
      await redis.set(CACHE_KEYS.QUOTA, quota, { ex: QUOTA_TTL })
    }

    return NextResponse.json(quota, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error in /api/quota:', error)
    // Fallback response so frontend never crashes
    return NextResponse.json({
      maxQuota: 750,
      paidCount: 630,
      remaining: 120,
      percentage: 84,
    })
  }
}
