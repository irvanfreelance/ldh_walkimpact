import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Overall stats
    const statsRows = await sql`
      SELECT
        COUNT(*)::int                                                  AS total_registrations,
        COALESCE(SUM(ticket_qty), 0)::int                             AS total_tickets,
        COUNT(*) FILTER (WHERE status = 'paid')::int                  AS paid_registrations,
        COALESCE(SUM(ticket_qty) FILTER (WHERE status = 'paid'), 0)::int AS paid_tickets,
        COUNT(*) FILTER (WHERE status = 'pending')::int               AS pending_registrations,
        COUNT(*) FILTER (WHERE status = 'expired')::int               AS expired_registrations,
        COUNT(*) FILTER (WHERE status = 'cancelled')::int             AS cancelled_registrations,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0)::bigint AS total_revenue
      FROM registrations
    `

    // 2. Active event & quota
    const eventRows = await sql`
      SELECT id, name, slug, max_quota, event_date, is_active
      FROM events
      ORDER BY id ASC
      LIMIT 1
    `
    const currentEvent = eventRows[0] || null
    const maxQuota = currentEvent ? Number(currentEvent.max_quota) : 750
    const paidTickets = Number(statsRows[0]?.paid_tickets || 0)
    const remainingQuota = Math.max(0, maxQuota - paidTickets)
    const quotaPercentage = maxQuota > 0 ? Math.min(100, Math.round((paidTickets / maxQuota) * 100)) : 0

    // 3. Payment methods distribution
    const paymentRows = await sql`
      SELECT
        COALESCE(payment_type, 'belum bayar') AS payment_type,
        COUNT(*)::int AS count,
        COALESCE(SUM(total_amount), 0)::bigint AS total_amount
      FROM registrations
      WHERE status = 'paid'
      GROUP BY payment_type
      ORDER BY count DESC
    `

    // 4. Category breakdown
    const categoryRows = await sql`
      SELECT
        COALESCE(pc.label, 'Umum') AS category,
        COUNT(r.id)::int AS count
      FROM registrations r
      LEFT JOIN participant_categories pc ON pc.id = r.category_id
      GROUP BY pc.label
      ORDER BY count DESC
    `

    // 5. Recent 8 registrations
    const recentRows = await sql`
      SELECT
        r.id,
        r.registration_number,
        r.contact_name,
        r.contact_whatsapp,
        r.ticket_qty,
        r.total_amount,
        r.status,
        r.payment_type,
        r.bank,
        r.created_at,
        r.paid_at,
        COALESCE(pc.label, '-') AS category_label
      FROM registrations r
      LEFT JOIN participant_categories pc ON pc.id = r.category_id
      ORDER BY r.created_at DESC
      LIMIT 8
    `

    return NextResponse.json({
      stats: {
        total_registrations: Number(statsRows[0]?.total_registrations || 0),
        total_tickets: Number(statsRows[0]?.total_tickets || 0),
        paid_registrations: Number(statsRows[0]?.paid_registrations || 0),
        paid_tickets: paidTickets,
        pending_registrations: Number(statsRows[0]?.pending_registrations || 0),
        expired_registrations: Number(statsRows[0]?.expired_registrations || 0),
        cancelled_registrations: Number(statsRows[0]?.cancelled_registrations || 0),
        total_revenue: Number(statsRows[0]?.total_revenue || 0),
      },
      quota: {
        max_quota: maxQuota,
        paid_count: paidTickets,
        remaining: remainingQuota,
        percentage: quotaPercentage,
      },
      event: currentEvent,
      payment_distribution: paymentRows,
      category_distribution: categoryRows,
      recent_registrations: recentRows,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch admin stats' },
      { status: 500 }
    )
  }
}
