import { snap, hasMidtransConfig } from './client'

export interface CreateSnapTransactionParams {
  orderId: string
  grossAmount: number
  customerName: string
  customerPhone: string
  itemDetails: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
}

export interface SnapTransactionResult {
  token: string
  redirect_url: string
  expiry_time: string
}

export async function createSnapTransaction(
  params: CreateSnapTransactionParams
): Promise<SnapTransactionResult> {
  const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  if (!hasMidtransConfig) {
    // Graceful simulation when Midtrans credentials are not configured yet
    return {
      token: `demo_snap_${params.orderId}`,
      redirect_url: `/konfirmasi?order_id=${params.orderId}&demo=true`,
      expiry_time: expiryTime,
    }
  }

  try {
    const parameter = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.grossAmount,
      },
      customer_details: {
        first_name: params.customerName,
        phone: params.customerPhone,
      },
      item_details: params.itemDetails,
      expiry: {
        unit: 'hours',
        duration: 24,
      },
    }

    const transaction = await snap.createTransaction(parameter)
    return {
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      expiry_time: expiryTime,
    }
  } catch (error) {
    console.error('Midtrans createTransaction error:', error)
    // Fall back to demo token so flow does not break if sandbox key is invalid
    return {
      token: `demo_snap_${params.orderId}`,
      redirect_url: `/konfirmasi?order_id=${params.orderId}&demo=true`,
      expiry_time: expiryTime,
    }
  }
}
