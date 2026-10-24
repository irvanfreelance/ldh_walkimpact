import { neon } from '@neondatabase/serverless'
import { put } from '@vercel/blob'
import { Redis } from '@upstash/redis'

delete process.env.VERCEL_OIDC_TOKEN

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL || '')

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
}

function parseDataUrl(value: string): { contentType: string; body: Buffer } | null {
  const match = /^data:([^;,]+);base64,([\s\S]+)$/.exec(value)
  if (!match) return null
  return {
    contentType: match[1],
    body: Buffer.from(match[2], 'base64'),
  }
}

async function storeImage(folder: string, name: string, value: string): Promise<string> {
  const parsed = parseDataUrl(value)
  if (!parsed) throw new Error(`Bukan data URL: ${name}`)
  const ext = EXTENSIONS[parsed.contentType] || 'bin'
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'image'
  const blob = await put(`${folder}/${base}.${ext}`, parsed.body, {
    access: 'public',
    addRandomSuffix: true,
    contentType: parsed.contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  return blob.url
}

async function main() {
  const sponsors = await sql`
    SELECT id, name, logo_url
    FROM sponsors
    WHERE logo_url LIKE 'data:%'
    ORDER BY id
  `
  for (const row of sponsors) {
    const url = await storeImage('sponsors', String(row.name), String(row.logo_url))
    await sql`UPDATE sponsors SET logo_url = ${url} WHERE id = ${row.id}`
    console.log(`sponsor ${row.id} ${row.name} -> ${url} (${String(row.logo_url).length} chars)`)
  }

  const settings = await sql`
    SELECT key, value
    FROM site_settings
    WHERE value LIKE 'data:%'
  `
  for (const row of settings) {
    const url = await storeImage('settings', String(row.key), String(row.value))
    await sql`
      UPDATE site_settings
      SET value = ${url}, updated_at = NOW()
      WHERE key = ${row.key}
    `
    console.log(`setting ${row.key} -> ${url} (${String(row.value).length} chars)`)
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (redisUrl && redisToken) {
    const redis = new Redis({ url: redisUrl, token: redisToken })
    const keys = await redis.keys('walkimpact:site_settings:*')
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    console.log(`redis keys cleared: ${keys.length}`)
  }

  console.log(`done sponsors=${sponsors.length} settings=${settings.length}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
