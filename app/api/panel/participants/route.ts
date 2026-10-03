import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const size = searchParams.get('size') || ''
    const status = searchParams.get('status') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit

    const searchPattern = search ? `%${search}%` : null

    const rows = await sql`
      SELECT
        rp.id,
        rp.registration_id,
        rp.slot_number,
        rp.name AS participant_name,
        rp.gender,
        rp.bib_number,
        r.registration_number,
        r.contact_name,
        r.contact_whatsapp,
        r.status AS registration_status,
        ss.code AS shirt_size,
        ss.label AS shirt_size_label,
        COALESCE(pc.label, '-') AS category_label,
        COALESCE(tt.name, '-') AS ticket_tier_name,
        r.created_at
      FROM registration_participants rp
      JOIN registrations r ON r.id = rp.registration_id
      LEFT JOIN shirt_sizes ss ON ss.id = rp.shirt_size_id
      LEFT JOIN participant_categories pc ON pc.id = r.category_id
      LEFT JOIN ticket_tiers tt ON tt.id = r.ticket_tier_id
      WHERE
        (${status}::text = '' OR r.status = ${status}::text)
        AND (${size}::text = '' OR ss.code = ${size}::text)
        AND (
          ${searchPattern}::text IS NULL
          OR rp.name ILIKE ${searchPattern}::text
          OR rp.bib_number ILIKE ${searchPattern}::text
          OR r.registration_number ILIKE ${searchPattern}::text
          OR r.contact_name ILIKE ${searchPattern}::text
          OR r.contact_whatsapp ILIKE ${searchPattern}::text
        )
      ORDER BY r.created_at DESC, rp.slot_number ASC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countResult = await sql`
      SELECT COUNT(*)::int AS total
      FROM registration_participants rp
      JOIN registrations r ON r.id = rp.registration_id
      LEFT JOIN shirt_sizes ss ON ss.id = rp.shirt_size_id
      WHERE
        (${status}::text = '' OR r.status = ${status}::text)
        AND (${size}::text = '' OR ss.code = ${size}::text)
        AND (
          ${searchPattern}::text IS NULL
          OR rp.name ILIKE ${searchPattern}::text
          OR rp.bib_number ILIKE ${searchPattern}::text
          OR r.registration_number ILIKE ${searchPattern}::text
          OR r.contact_name ILIKE ${searchPattern}::text
          OR r.contact_whatsapp ILIKE ${searchPattern}::text
        )
    `

    const total = Number(countResult[0]?.total || 0)

    return NextResponse.json({
      data: rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching participants:', error)
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat data peserta' },
      { status: 500 }
    )
  }
}
