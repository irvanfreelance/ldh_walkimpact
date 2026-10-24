import sql from '@/lib/db/client'
import { getRedis } from '@/lib/cache/redis'
import { CACHE_KEYS, SITE_SETTINGS_TTL } from '@/lib/cache/keys'

export async function getSiteSetting(key: string): Promise<string | null> {
  const cacheKey = CACHE_KEYS.SITE_SETTINGS + key
  const redis = getRedis()
  if (redis) {
    try {
      const cached = await redis.get<string>(cacheKey)
      if (cached !== null && cached !== undefined) return cached
    } catch {}
  }

  try {
    const rows = await sql`SELECT value FROM site_settings WHERE key = ${key}`
    const value = rows[0]?.value ?? null
    if (value !== null && redis) {
      try { await redis.set(cacheKey, value, { ex: SITE_SETTINGS_TTL }) } catch {}
    }
    return value
  } catch {
    return null
  }
}

export async function setSiteSetting(key: string, value: string): Promise<void> {
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (${key}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `
  const redis = getRedis()
  if (redis) {
    try { await redis.del(CACHE_KEYS.SITE_SETTINGS + key) } catch {}
  }
}

export async function getAllSiteSettings(): Promise<Record<string, string>> {
  const rows = await sql`SELECT key, value FROM site_settings`
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}
