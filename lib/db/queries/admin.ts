import sql from '@/lib/db/client'

export interface AdminStats {
  total_paid: number
  total_pending: number
  total_expired: number
  total_cancelled: number
  total_revenue: number
}

export interface ParticipantRow {
  registration_number: string
  contact_name: string
  contact_whatsapp: string
  category: string
  community_name: string
  ticket_qty: number
  unit_price: number
  total_amount: number
  status: string
  payment_type: string
  bank: string
  va_number: string
  settlement_time: string | null
  shirt_sizes: string
  created_at: string
}

export async function getAdminStats(eventId: number): Promise<AdminStats> {
  const rows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'paid')::int      AS total_paid,
      COUNT(*) FILTER (WHERE status = 'pending')::int   AS total_pending,
      COUNT(*) FILTER (WHERE status = 'expired')::int   AS total_expired,
      COUNT(*) FILTER (WHERE status = 'cancelled')::int AS total_cancelled,
      COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0)::bigint AS total_revenue
    FROM registrations
    WHERE event_id = ${eventId}
  `
  const r = rows[0]
  return {
    total_paid: Number(r?.total_paid || 0),
    total_pending: Number(r?.total_pending || 0),
    total_expired: Number(r?.total_expired || 0),
    total_cancelled: Number(r?.total_cancelled || 0),
    total_revenue: Number(r?.total_revenue || 0),
  }
}

export async function getParticipantsForExport(eventId: number): Promise<ParticipantRow[]> {
  const rows = await sql`
    SELECT
      r.registration_number,
      r.contact_name,
      r.contact_whatsapp,
      pc.label                                                   AS category,
      COALESCE(r.community_name, '-')                            AS community_name,
      r.ticket_qty,
      r.unit_price,
      r.total_amount,
      r.status,
      COALESCE(p.payment_type, '-')                              AS payment_type,
      COALESCE(p.bank, '-')                                      AS bank,
      COALESCE(p.va_number, '-')                                 AS va_number,
      p.settlement_time::text,
      COALESCE(STRING_AGG(ss.code, ', ' ORDER BY rp.slot_number), '-') AS shirt_sizes,
      r.created_at::text
    FROM registrations r
    JOIN participant_categories pc         ON pc.id = r.category_id
    LEFT JOIN payments p                   ON p.registration_id = r.id
    LEFT JOIN registration_participants rp ON rp.registration_id = r.id
    LEFT JOIN shirt_sizes ss               ON ss.id = rp.shirt_size_id
    WHERE r.event_id = ${eventId}
    GROUP BY r.id, pc.label, p.id
    ORDER BY r.created_at DESC
  `
  return rows as unknown as ParticipantRow[]
}
