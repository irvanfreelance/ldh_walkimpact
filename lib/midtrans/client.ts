import midtransClient from 'midtrans-client'

export const hasMidtransConfig = Boolean(
  process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY
)

export const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-test',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-test',
})
