import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getRedis } from '@/lib/cache/redis'
import { CACHE_KEYS } from '@/lib/cache/keys'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const redis = getRedis()
    if (!redis) {
      return NextResponse.json({
        configured: false,
        ping: null,
        keys: [],
        message: 'Redis credentials not set',
      })
    }

    const ping = await redis.ping()
    const keys = await redis.keys('walkimpact:*')

    const keyDetails = await Promise.all(
      keys.map(async (k) => {
        const ttl = await redis.ttl(k)
        const type = await redis.type(k)
        return { key: k, ttl, type }
      })
    )

    return NextResponse.json({
      configured: true,
      ping,
      keys: keyDetails,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to inspect cache' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { action, key } = body // action: 'purge_all' | 'delete_key' | 'clear_event' | 'clear_quota'
    const redis = getRedis()

    let deletedCount = 0

    if (redis) {
      if (action === 'delete_key' && key) {
        deletedCount = await redis.del(key)
      } else if (action === 'clear_event') {
        deletedCount = await redis.del(CACHE_KEYS.EVENT_DATA, CACHE_KEYS.FAQS)
      } else if (action === 'clear_quota') {
        deletedCount = await redis.del(CACHE_KEYS.QUOTA)
      } else {
        // default / purge_all: delete all walkimpact:* keys
        const keys = await redis.keys('walkimpact:*')
        if (keys.length > 0) {
          deletedCount = await redis.del(...keys)
        }
      }
    }

    // Always revalidate homepage and registration page cache
    try {
      revalidatePath('/')
      revalidatePath('/daftar')
    } catch (e) {
      console.warn('Revalidate path error:', e)
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      action: action || 'purge_all',
      revalidated: ['/', '/daftar'],
      message: 'Cache successfully invalidated and homepage revalidated',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to purge cache' },
      { status: 500 }
    )
  }
}
