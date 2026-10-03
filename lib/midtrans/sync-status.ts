import { getRegistrationByNumber, updateRegistrationPaymentData, markRegistrationPaid, markRegistrationExpired } from '@/lib/db/queries/registrations'
import { logPaymentTransaction } from '@/lib/db/queries/payments'

export async function syncMidtransTransactionStatus(orderId: string) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY
  if (!serverKey) return null

  const isProd =
    process.env.MIDTRANS_IS_PRODUCTION === 'true' ||
    process.env.MIDTRANS_IS_PRODUCTION === '1' ||
    !serverKey.startsWith('SB-')

  const baseUrl = isProd
    ? 'https://api.midtrans.com/v2'
    : 'https://api.sandbox.midtrans.com/v2'

  const authHeader = `Basic ${Buffer.from(serverKey + ':').toString('base64')}`

  try {
    const res = await fetch(`${baseUrl}/${orderId}/status`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return null
    }

    const payload = await res.json()
    const {
      transaction_status,
      payment_type,
      va_numbers,
      permata_va_number,
      bill_key,
      biller_code,
      transaction_id,
      fraud_status,
      settlement_time,
    } = payload

    // Determine bank and VA number
    let bank: string | null = null
    let vaNumber: string | null = null

    if (va_numbers && va_numbers.length > 0) {
      bank = va_numbers[0].bank?.toUpperCase() || null
      vaNumber = va_numbers[0].va_number || null
    } else if (permata_va_number) {
      bank = 'PERMATA'
      vaNumber = permata_va_number
    } else if (payment_type === 'echannel' && bill_key) {
      bank = 'MANDIRI'
      vaNumber = biller_code ? `${biller_code} - ${bill_key}` : bill_key
    }

    const isSettled =
      transaction_status === 'settlement' || transaction_status === 'capture'
    const isAccepted = !fraud_status || fraud_status === 'accept'
    const isExpiredOrCancelled =
      transaction_status === 'expire' ||
      transaction_status === 'cancel' ||
      transaction_status === 'deny'

    const reg = await getRegistrationByNumber(orderId)
    if (!reg) return payload

    if (isSettled && isAccepted) {
      await markRegistrationPaid(reg.id, new Date(), {
        transactionId: transaction_id,
        paymentType: payment_type,
        bank,
        vaNumber,
        settlementTime: settlement_time ? new Date(settlement_time) : new Date(),
        midtransResponse: payload,
      })
    } else if (isExpiredOrCancelled) {
      await markRegistrationExpired(reg.id)
    } else {
      // Update pending VA / echannel number to DB
      await updateRegistrationPaymentData(orderId, {
        transactionId: transaction_id,
        paymentType: payment_type,
        bank,
        vaNumber,
        billerCode: biller_code || null,
        billKey: bill_key || null,
        status: transaction_status,
        fraudStatus: fraud_status || null,
        midtransResponse: payload,
      })
    }

    return payload
  } catch (err) {
    console.warn(`[Midtrans Sync Status] Error syncing order ${orderId}:`, err)
    return null
  }
}
