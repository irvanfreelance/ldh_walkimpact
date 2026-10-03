import sql from '@/lib/db/client'

/**
 * Generates an available 3-digit random unique code (100 - 999)
 * for a manual bank transfer on a specific bank account / payment method today.
 * Guarantees NO duplicate unique code on the same day for the same bank account.
 */
export async function generateDailyUniqueCode(paymentMethodId: number | null, paymentMethodCode: string | null): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  // Query all registrations today with this payment method where status is pending or paid
  const rows = await sql`
    SELECT (total_amount % 1000)::int AS code
    FROM registrations
    WHERE (
      (${paymentMethodId}::bigint IS NOT NULL AND payment_method_id = ${paymentMethodId})
      OR (${paymentMethodCode}::varchar IS NOT NULL AND payment_method_code = ${paymentMethodCode})
    )
    AND created_at >= ${startOfDay.toISOString()}
    AND created_at <= ${endOfDay.toISOString()}
    AND status IN ('pending', 'paid')
  `

  const usedCodes = new Set<number>(rows.map((r: any) => Number(r.code)))

  // Available candidate numbers from 101 to 999
  const candidates: number[] = []
  for (let i = 101; i <= 999; i++) {
    if (!usedCodes.has(i)) {
      candidates.push(i)
    }
  }

  if (candidates.length === 0) {
    // Highly improbable fallback: pick from 1 to 100
    for (let i = 1; i <= 100; i++) {
      if (!usedCodes.has(i)) {
        candidates.push(i)
      }
    }
  }

  if (candidates.length === 0) {
    throw new Error('Kode unik transaksi untuk rekening ini hari ini sudah penuh. Silakan gunakan metode pembayaran lainnya.')
  }

  // Pick a random available candidate
  const randomIndex = Math.floor(Math.random() * candidates.length)
  return candidates[randomIndex]
}
