import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await sql`
      SELECT *
      FROM notification_templates
      ORDER BY id ASC
    `
    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat template notifikasi' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { event_trigger, channel = 'WHATSAPP', message_content, is_active = true } = body

    if (!event_trigger || !message_content) {
      return NextResponse.json(
        { error: 'Event trigger dan message content wajib diisi' },
        { status: 400 }
      )
    }

    const inserted = await sql`
      INSERT INTO notification_templates (
        event_trigger, channel, message_content, is_active
      ) VALUES (
        ${event_trigger}, ${channel}, ${message_content}, ${is_active}
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: 'Template notifikasi berhasil dibuat',
      data: inserted[0],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal membuat template notifikasi' },
      { status: 500 }
    )
  }
}
