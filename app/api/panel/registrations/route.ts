import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit

    const searchPattern = search ? `%${search}%` : null

    const rows = await sql`
      SELECT
        r.id,
        r.registration_number,
        r.event_id,
        r.ticket_tier_id,
        r.category_id,
        r.contact_name,
        r.contact_email,
        r.contact_whatsapp,
        r.community_name,
        r.ticket_qty,
        r.unit_price,
        r.admin_fee,
        r.total_amount,
        r.status,
        r.payment_method_code,
        r.payment_type,
        r.bank,
        r.va_number,
        r.transaction_id,
        r.paid_at,
        r.created_at,
        COALESCE(pc.label, '-') AS category_label,
        COALESCE(tt.name, '-')  AS ticket_tier_name,
        COALESCE(
          (SELECT STRING_AGG(CONCAT(ss.code, ': ', COALESCE(rp.name, 'Tiket')), ', ')
           FROM registration_participants rp
           LEFT JOIN shirt_sizes ss ON ss.id = rp.shirt_size_id
           WHERE rp.registration_id = r.id),
          '-'
        ) AS participant_summary
      FROM registrations r
      LEFT JOIN participant_categories pc ON pc.id = r.category_id
      LEFT JOIN ticket_tiers tt ON tt.id = r.ticket_tier_id
      WHERE
        (${status}::text = '' OR r.status = ${status}::text)
        AND (${category}::text = '' OR pc.slug = ${category}::text OR r.category_id::text = ${category}::text)
        AND (
          ${searchPattern}::text IS NULL
          OR r.registration_number ILIKE ${searchPattern}::text
          OR r.contact_name ILIKE ${searchPattern}::text
          OR r.contact_whatsapp ILIKE ${searchPattern}::text
          OR r.community_name ILIKE ${searchPattern}::text
        )
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countResult = await sql`
      SELECT COUNT(*)::int AS total
      FROM registrations r
      LEFT JOIN participant_categories pc ON pc.id = r.category_id
      WHERE
        (${status}::text = '' OR r.status = ${status}::text)
        AND (${category}::text = '' OR pc.slug = ${category}::text OR r.category_id::text = ${category}::text)
        AND (
          ${searchPattern}::text IS NULL
          OR r.registration_number ILIKE ${searchPattern}::text
          OR r.contact_name ILIKE ${searchPattern}::text
          OR r.contact_whatsapp ILIKE ${searchPattern}::text
          OR r.community_name ILIKE ${searchPattern}::text
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
    console.error('Error fetching registrations:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch registrations' },
      { status: 500 }
    )
  }
}
