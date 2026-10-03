import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const templateId = parseInt(id, 10)
    if (isNaN(templateId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    const body = await req.json()
    const { event_trigger, channel, message_content, is_active } = body

    const updated = await sql`
      UPDATE notification_templates
      SET
        event_trigger = COALESCE(${event_trigger}, event_trigger),
        channel = COALESCE(${channel}, channel),
        message_content = COALESCE(${message_content}, message_content),
        is_active = CASE WHEN ${is_active !== undefined} THEN ${is_active} ELSE is_active END
      WHERE id = ${templateId}
      RETURNING *
    `

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Template berhasil diperbarui',
      data: updated[0],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui template notifikasi' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const templateId = parseInt(id, 10)
    if (isNaN(templateId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    await sql`DELETE FROM notification_templates WHERE id = ${templateId}`

    return NextResponse.json({
      success: true,
      message: 'Template berhasil dihapus',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus template' },
      { status: 500 }
    )
  }
}
