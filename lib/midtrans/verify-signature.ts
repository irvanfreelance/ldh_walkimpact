import crypto from 'crypto'

export function verifyMidtransSignature(params: {
  order_id: string
  status_code: string
  gross_amount: string
  signature_key: string
}): boolean {
  const signatureKey = process.env.MIDTRANS_SIGNATURE_KEY || process.env.MIDTRANS_SERVER_KEY || ''
  if (!signatureKey) {
    // If not configured, in development allow validation
    return true
  }

  const hash = crypto
    .createHash('sha512')
    .update(`${params.order_id}${params.status_code}${params.gross_amount}${signatureKey}`)
    .digest('hex')

  return hash === params.signature_key
}
