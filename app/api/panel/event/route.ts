import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'
import { invalidateEventCache, invalidateQuotaCache } from '@/lib/cache/redis'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await sql`
      SELECT *
      FROM events
      ORDER BY id ASC
      LIMIT 1
    `
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(rows[0])
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat event' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const {
      id,
      name,
      tagline,
      description,
      event_date,
      assembly_time,
      start_time,
      end_time,
      venue_name,
      venue_address,
      venue_city,
      venue_maps_url,
      route_km,
      max_quota,
      contact_name,
      contact_whatsapp,
      is_active,
    } = body

    const eventId = id ? parseInt(id, 10) : 1

    const updated = await sql`
      UPDATE events
      SET
        name = COALESCE(${name}, name),
        tagline = COALESCE(${tagline}, tagline),
        description = COALESCE(${description}, description),
        event_date = COALESCE(${event_date}, event_date),
        assembly_time = COALESCE(${assembly_time}, assembly_time),
        start_time = COALESCE(${start_time}, start_time),
        end_time = COALESCE(${end_time}, end_time),
        venue_name = COALESCE(${venue_name}, venue_name),
        venue_address = COALESCE(${venue_address}, venue_address),
        venue_city = COALESCE(${venue_city}, venue_city),
        venue_maps_url = COALESCE(${venue_maps_url}, venue_maps_url),
        route_km = COALESCE(${route_km}, route_km),
        max_quota = COALESCE(${max_quota ? parseInt(max_quota, 10) : null}, max_quota),
        contact_name = COALESCE(${contact_name}, contact_name),
        contact_whatsapp = COALESCE(${contact_whatsapp}, contact_whatsapp),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${eventId}
      RETURNING *
    `

    // Invalidate Redis caches and Next.js ISR
    await invalidateEventCache()
    await invalidateQuotaCache()
    revalidatePath('/')
    revalidatePath('/daftar')

    return NextResponse.json({
      success: true,
      message: 'Pengaturan event berhasil diperbarui',
      data: updated[0],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui event' },
      { status: 500 }
    )
  }
}
