import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'
import { invalidateEventCache } from '@/lib/cache/redis'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await sql`
      SELECT *
      FROM ticket_tiers
      ORDER BY sort_order ASC, id ASC
    `
    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat tiket' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      eventId = 1,
      name,
      description,
      price,
      maxPerOrder = 5,
      availableFrom,
      availableUntil,
      isActive = true,
      sortOrder = 0,
    } = body

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Nama tiket dan harga wajib diisi' },
        { status: 400 }
      )
    }

    const inserted = await sql`
      INSERT INTO ticket_tiers (
        event_id,
        name,
        description,
        price,
        max_per_order,
        available_from,
        available_until,
        is_active,
        sort_order
      ) VALUES (
        ${eventId},
        ${name},
        ${description || null},
        ${parseInt(price, 10)},
        ${parseInt(maxPerOrder, 10)},
        ${availableFrom ? new Date(availableFrom).toISOString() : new Date().toISOString()},
        ${availableUntil ? new Date(availableUntil).toISOString() : new Date(Date.now() + 86400000 * 30).toISOString()},
        ${isActive},
        ${parseInt(sortOrder, 10) || 0}
      )
      RETURNING *
    `

    await invalidateEventCache()
    revalidatePath('/')
    revalidatePath('/daftar')

    return NextResponse.json({
      success: true,
      message: 'Tiket berhasil ditambahkan',
      data: inserted[0],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menambahkan tiket' },
      { status: 500 }
    )
  }
}
