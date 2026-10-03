import sql from '@/lib/db/client'

export interface QuotaResult {
  maxQuota: number
  paidCount: number
  remaining: number
  percentage: number
}

export async function getQuotaFromDB(eventId: number): Promise<QuotaResult | null> {
  const rows = await sql`
    SELECT
      e.max_quota,
      COUNT(r.id) FILTER (WHERE r.status = 'paid') AS paid_count
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    WHERE e.id = ${eventId}
    GROUP BY e.id, e.max_quota
  `
  const row = rows[0]
  if (!row) return null

  const maxQuota = Number(row.max_quota) || 750
  const paidCount = Number(row.paid_count) || 0
  const remaining = Math.max(0, maxQuota - paidCount)
  const percentage = Math.min(100, Math.round((paidCount / maxQuota) * 100))

  return {
    maxQuota,
    paidCount,
    remaining,
    percentage,
  }
}
