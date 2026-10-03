import { NextRequest, NextResponse } from 'next/server'
import { verifyMidtransSignature } from '@/lib/midtrans/verify-signature'
import {
  logPaymentNotification,
  logPaymentTransaction,
} from '@/lib/db/queries/payments'
import {
  markRegistrationPaid,
  markRegistrationExpired,
  updateRegistrationPaymentData,
  getRegistrationByNumber,
} from '@/lib/db/queries/registrations'
import { triggerNotification } from '@/lib/db/queries/notifications'
import { invalidateQuotaCache } from '@/lib/cache/redis'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      signature_key,
      status_code,
      payment_type,
      transaction_id,
      settlement_time,
    } = payload

    const isValid = verifyMidtransSignature({
      order_id,
      status_code: status_code || '200',
      gross_amount: String(gross_amount),
      signature_key: signature_key || '',
    })

    // Log notification for audit
    await logPaymentNotification({
      paymentId: null,
      orderId: order_id,
      transactionStatus: transaction_status || 'unknown',
      fraudStatus: fraud_status || null,
      signatureValid: isValid,
      payload,
    })

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const reg = await getRegistrationByNumber(order_id)
    if (!reg) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Determine status
    const isSettled = transaction_status === 'settlement' || transaction_status === 'capture'
    const isAccepted = !fraud_status || fraud_status === 'accept'
    const isExpiredOrCancelled =
      transaction_status === 'expire' ||
      transaction_status === 'cancel' ||
      transaction_status === 'deny'

    if (isSettled && isAccepted) {
      // Mark registration as paid and assign BIB numbers for participants
      await markRegistrationPaid(reg.id, new Date(), {
        transactionId: transaction_id,
        paymentType: payment_type,
        bank: payload.bank || payload.va_numbers?.[0]?.bank || null,
        vaNumber: payload.va_numbers?.[0]?.va_number || null,
        settlementTime: settlement_time ? new Date(settlement_time) : new Date(),
        midtransResponse: payload,
      })

      // Log success payment
      await logPaymentTransaction({
        invoiceCode: order_id,
        endpoint: '/api/payments/notification',
        type: 'SETTLEMENT_SUCCESS',
        requestPayload: payload,
        responsePayload: { status: 'PAID' },
        httpStatus: 200,
      })

      // Trigger INVOICE_SUCCESS notification
      await triggerNotification({
        eventTrigger: 'INVOICE_SUCCESS',
        invoiceCode: order_id,
        recipient: reg.contact_whatsapp,
        variables: {
          nama: reg.contact_name,
          nominal: reg.total_amount,
          metode: payment_type || 'Midtrans',
          nomor_daftar: order_id,
          tiket_qty: reg.ticket_qty,
          va_number: payload.va_numbers?.[0]?.va_number || '-',
        },
      })

      await invalidateQuotaCache()
    } else if (isExpiredOrCancelled) {
      await markRegistrationExpired(reg.id)

      await logPaymentTransaction({
        invoiceCode: order_id,
        endpoint: '/api/payments/notification',
        type: 'SETTLEMENT_EXPIRED',
        requestPayload: payload,
        responsePayload: { status: 'EXPIRED' },
        httpStatus: 200,
      })

      await invalidateQuotaCache()
    } else {
      // Update ongoing state (e.g. pending VA / Echannel / QRIS)
      let detectedBank = payload.bank || payload.va_numbers?.[0]?.bank || null
      let detectedVaNumber = payload.va_numbers?.[0]?.va_number || null
      let detectedBillerCode = payload.biller_code || null
      let detectedBillKey = payload.bill_key || null

      if (payload.permata_va_number) {
        detectedBank = 'PERMATA'
        detectedVaNumber = payload.permata_va_number
      } else if (payload.payment_type === 'echannel' && payload.bill_key) {
        detectedBank = 'MANDIRI'
        detectedVaNumber = payload.biller_code
          ? `${payload.biller_code} - ${payload.bill_key}`
          : payload.bill_key
      }

      await updateRegistrationPaymentData(order_id, {
        transactionId: transaction_id,
        paymentType: payment_type,
        bank: detectedBank,
        vaNumber: detectedVaNumber,
        billerCode: detectedBillerCode,
        billKey: detectedBillKey,
        status: transaction_status,
        fraudStatus: fraud_status || null,
        midtransResponse: payload,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook notification error:', error)
    return NextResponse.json({ ok: false, error: 'Internal processing error' }, { status: 200 })
  }
}
