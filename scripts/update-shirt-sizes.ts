import fs from 'fs'
import path from 'path'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=')
          const key = trimmed.slice(0, idx).trim()
          let val = trimmed.slice(idx + 1).trim()
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1)
          }
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    }
  } catch (e) {
    console.warn('Could not read .env.local', e)
  }
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!connectionString) {
  console.error('DATABASE_URL is not defined in .env.local')
  process.exit(1)
}

const sql = neon(connectionString)

const SIZES = [
  { code: 'XS', label: 'X-Small', sortOrder: 1 },
  { code: 'S', label: 'Small', sortOrder: 2 },
  { code: 'M', label: 'Medium', sortOrder: 3 },
  { code: 'L', label: 'Large', sortOrder: 4 },
  { code: 'XL', label: 'X-Large', sortOrder: 5 },
  { code: '2XL', label: '2X-Large', sortOrder: 6 },
  { code: '3XL', label: '3X-Large', sortOrder: 7 },
  { code: '4XL', label: '4X-Large', sortOrder: 8 },
  { code: '5XL', label: '5X-Large', sortOrder: 9 },
]

async function run() {
  // Rename XXL -> 2XL in place (keeps the id, so existing registrations stay linked).
  // Skipped when 2XL already exists, which makes the script safe to re-run.
  await sql`
    UPDATE shirt_sizes
    SET code = '2XL', label = '2X-Large'
    WHERE code = 'XXL'
      AND NOT EXISTS (SELECT 1 FROM shirt_sizes WHERE code = '2XL')
  `

  for (const s of SIZES) {
    await sql`
      INSERT INTO shirt_sizes (code, label, sort_order)
      VALUES (${s.code}, ${s.label}, ${s.sortOrder})
      ON CONFLICT (code) DO UPDATE
        SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order
    `
  }

  const rows = await sql`SELECT id, code, label, sort_order FROM shirt_sizes ORDER BY sort_order, id`
  console.log('shirt_sizes now:')
  console.table(rows)
}

run().catch((err) => {
  console.error('Error updating shirt sizes:', err)
  process.exit(1)
})
