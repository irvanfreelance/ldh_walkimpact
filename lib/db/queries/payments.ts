import sql from '@/lib/db/client'
import { updateRegistrationPaymentData } from './registrations'

export interface PaymentMethod {
  id: number
  code: string
  name: string
  logo_url: string | null
  type: string
  provider: string
  admin_fee_flat: number
  admin_fee_pct: number
  is_active: boolean
  is_redirect: boolean
  sort_order: number
}

export interface PaymentInstruction {
  id: number
  payment_method_id: number
  title: string
  content: string
  sort_order: number
}

import { getRedis } from '@/lib/cache/redis'
import { CACHE_KEYS, PAYMENT_METHODS_TTL } from '@/lib/cache/keys'

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const redis = getRedis()
    if (redis) {
      const cached = await redis.get<PaymentMethod[]>(CACHE_KEYS.PAYMENT_METHODS)
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached
      }
    }
  } catch (err) {
    console.warn('[Cache] getPaymentMethods redis error:', err)
  }

  const rows = await sql`
    SELECT id, code, name, logo_url, type, provider, admin_fee_flat, admin_fee_pct, is_active, is_redirect, sort_order
    FROM payment_methods
    WHERE is_active = TRUE
    ORDER BY sort_order ASC
  `
  const result = rows as unknown as PaymentMethod[]

  try {
    const redis = getRedis()
    if (redis && result.length > 0) {
      await redis.set(CACHE_KEYS.PAYMENT_METHODS, result, { ex: PAYMENT_METHODS_TTL })
    }
  } catch (err) {
    console.warn('[Cache] getPaymentMethods set error:', err)
  }

  return result
}

export async function getPaymentInstructions(paymentMethodId: number): Promise<PaymentInstruction[]> {
  const rows = await sql`
    SELECT id, payment_method_id, title, content, sort_order
    FROM payment_instructions
    WHERE payment_method_id = ${paymentMethodId}
    ORDER BY sort_order ASC
  `
  return rows as unknown as PaymentInstruction[]
}

export async function logPaymentTransaction(data: {
  invoiceCode: string
  endpoint?: string | null
  type?: string | null
  requestPayload?: Record<string, unknown> | string | null
  responsePayload?: Record<string, unknown> | string | null
  httpStatus?: number | null
}) {
  const reqStr =
    typeof data.requestPayload === 'object' && data.requestPayload !== null
      ? JSON.stringify(data.requestPayload)
      : data.requestPayload || null

  const resStr =
    typeof data.responsePayload === 'object' && data.responsePayload !== null
      ? JSON.stringify(data.responsePayload)
      : data.responsePayload || null

  await sql`
    INSERT INTO payment_logs (
      invoice_code, endpoint, type, request_payload, response_payload, http_status
    ) VALUES (
      ${data.invoiceCode}, ${data.endpoint || null}, ${data.type || null},
      ${reqStr}, ${resStr}, ${data.httpStatus || null}
    )
  `
}

export async function updatePaymentFromWebhook(data: {
  orderId: string
  transactionId: string
  paymentType: string
  bank: string | null
  vaNumber: string | null
  status: string
  fraudStatus: string | null
  settlementTime: Date | null
  midtransResponse: Record<string, unknown>
}) {
  return await updateRegistrationPaymentData(data.orderId, {
    transactionId: data.transactionId,
    paymentType: data.paymentType,
    bank: data.bank,
    vaNumber: data.vaNumber,
    status: data.status,
    fraudStatus: data.fraudStatus,
    settlementTime: data.settlementTime,
    midtransResponse: data.midtransResponse,
  })
}

export async function logPaymentNotification(data: {
  paymentId: number | null
  orderId: string
  transactionStatus: string
  fraudStatus: string | null
  signatureValid: boolean
  payload: Record<string, unknown>
}) {
  // Log into payment_logs
  await logPaymentTransaction({
    invoiceCode: data.orderId,
    endpoint: '/api/payments/notification',
    type: 'WEBHOOK_NOTIFICATION',
    requestPayload: data.payload,
    responsePayload: { signatureValid: data.signatureValid, status: data.transactionStatus },
    httpStatus: data.signatureValid ? 200 : 401,
  })
}
