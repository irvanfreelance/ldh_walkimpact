import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50', 10)))

    const rows = await sql`
      SELECT
        nl.*,
        nt.event_trigger
      FROM notification_logs nl
      LEFT JOIN notification_templates nt ON nt.id = nl.template_id
      ORDER BY nl.created_at DESC
      LIMIT ${limit}
    `
    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat log notifikasi' },
      { status: 500 }
    )
  }
}
