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

const sql = neon(process.env.DATABASE_URL!)

async function check() {
  const regs = await sql`
    SELECT id, registration_number, contact_name, total_amount, status
    FROM registrations
    ORDER BY id DESC
    LIMIT 2
  `
  const participants = await sql`
    SELECT slot_number, name, bib_number, shirt_size_id
    FROM registration_participants
    WHERE registration_id = ${regs[0].id}
  `
  const logs = await sql`
    SELECT invoice_code, type, endpoint, http_status
    FROM payment_logs
    ORDER BY id DESC
    LIMIT 3
  `
  const notifs = await sql`
    SELECT invoice_code, recipient, channel, status
    FROM notification_logs
    ORDER BY id DESC
    LIMIT 2
  `
  console.log('--- RECENT REGISTRATIONS (UNIFIED ORDER) ---')
  console.log(JSON.stringify(regs, null, 2))
  console.log('--- PARTICIPANTS (WITH BIB) ---')
  console.log(JSON.stringify(participants, null, 2))
  console.log('--- PAYMENT LOGS ---')
  console.log(JSON.stringify(logs, null, 2))
  console.log('--- NOTIFICATION LOGS ---')
  console.log(JSON.stringify(notifs, null, 2))
}

check().catch(console.error)
