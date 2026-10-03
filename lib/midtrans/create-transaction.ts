export interface MidtransChargeParams {
  orderId: string
  amount: number
  paymentCode?: string | null
  paymentType?: string | null
  customerName: string
  customerEmail?: string | null
  customerPhone: string
  itemDetails?: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
}

export interface MidtransChargeResult {
  isSnapModal: boolean
  paymentUrl: string | null
  vaNumber: string | null
  bank: string | null
  billerCode: string | null
  billKey: string | null
  qrString: string | null
  snapToken: string | null
  rawResponse?: any
}

export function getSnapEnabledPayments(paymentCode?: string | null, paymentType?: string | null): string[] {
  const codeUpper = (paymentCode || '').toUpperCase()

  if (codeUpper.includes('QRIS') || paymentType === 'qr_code') return ['gopay', 'qris', 'shopeepay']
  if (codeUpper.includes('BCA')) return ['bca_va']
  if (codeUpper.includes('BNI')) return ['bni_va']
  if (codeUpper.includes('BRI')) return ['bri_va']
  if (codeUpper.includes('MANDIRI')) return ['echannel']
  if (codeUpper.includes('PERMATA')) return ['permata_va']
  if (codeUpper.includes('CIMB')) return ['cimb_va']
  if (codeUpper.includes('DANAMON')) return ['danamon_va']
  if (codeUpper.includes('BSI')) return ['other_va', 'bni_va']
  if (codeUpper.includes('DANA') || codeUpper.includes('OVO')) return ['gopay', 'shopeepay', 'qris']
  if (codeUpper.includes('CREDITCARD') || codeUpper.includes('CARD')) return ['credit_card']

  if (paymentType === 'va') return ['bca_va', 'bni_va', 'bri_va', 'echannel', 'permata_va', 'cimb_va']
  if (paymentType === 'qr_code') return ['gopay', 'qris']
  if (paymentType === 'E-Wallet' || paymentType === 'e_wallet') return ['gopay', 'shopeepay']

  return ['bca_va', 'bni_va', 'bri_va', 'echannel', 'permata_va', 'gopay', 'shopeepay', 'qris']
}

export async function createMidtransTransaction(
  params: MidtransChargeParams
): Promise<MidtransChargeResult> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY
  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY is not configured')
  }

  const isProd =
    process.env.MIDTRANS_IS_PRODUCTION === 'true' ||
    process.env.MIDTRANS_IS_PRODUCTION === '1' ||
    !serverKey.startsWith('SB-')

  const baseUrl = isProd
    ? 'https://api.midtrans.com/v2'
    : 'https://api.sandbox.midtrans.com/v2'
  const snapUrl = isProd
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

  const authHeader = `Basic ${Buffer.from(serverKey + ':').toString('base64')}`
  const roundedAmount = Math.round(params.amount)
  const baseUrlApp = process.env.NEXT_PUBLIC_BASE_URL || ''

  const customerDetails = {
    first_name: params.customerName || 'Peserta',
    email: params.customerEmail || 'peserta@walkimpact.id',
    phone: params.customerPhone || '081234567890',
  }

  const codeUpper = (params.paymentCode || '').toUpperCase()

  // ==========================================
  // Step 1: Coba Core API Direct Charge Dulu
  // ==========================================
  let coreBody: any = null

  if (codeUpper.includes('QRIS') || params.paymentType === 'qr_code') {
    coreBody = {
      payment_type: 'qris',
      transaction_details: { order_id: params.orderId, gross_amount: roundedAmount },
      qris: { acquire_provider: 'gopay' },
      customer_details: customerDetails,
      item_details: params.itemDetails,
    }
  } else if (codeUpper === 'GOPAY' || codeUpper.includes('GOPAY')) {
    coreBody = {
      payment_type: 'gopay',
      transaction_details: { order_id: params.orderId, gross_amount: roundedAmount },
      gopay: {
        enable_callback: true,
        callback_url: baseUrlApp ? `${baseUrlApp}/konfirmasi?order_id=${params.orderId}` : undefined,
      },
      customer_details: customerDetails,
      item_details: params.itemDetails,
    }
  } else if (codeUpper.includes('SHOPEEPAY')) {
    coreBody = {
      payment_type: 'shopeepay',
      transaction_details: { order_id: params.orderId, gross_amount: roundedAmount },
      shopeepay: {
        callback_url: baseUrlApp ? `${baseUrlApp}/konfirmasi?order_id=${params.orderId}` : undefined,
      },
      customer_details: customerDetails,
      item_details: params.itemDetails,
    }
  } else if (codeUpper.includes('MANDIRI')) {
    coreBody = {
      payment_type: 'echannel',
      transaction_details: { order_id: params.orderId, gross_amount: roundedAmount },
      echannel: {
        bill_info1: 'Walk Impact',
        bill_info2: 'Registrasi Tiket',
      },
      customer_details: customerDetails,
      item_details: params.itemDetails,
    }
  } else if (codeUpper.includes('PERMATA')) {
    coreBody = {
      payment_type: 'permata',
      transaction_details: { order_id: params.orderId, gross_amount: roundedAmount },
      customer_details: customerDetails,
      item_details: params.itemDetails,
    }
  } else if (
    params.paymentType === 'va' ||
    codeUpper.includes('BNI') ||
    codeUpper.includes('BCA') ||
    codeUpper.includes('BRI') ||
    codeUpper.includes('CIMB') ||
    codeUpper.includes('DANAMON') ||
    codeUpper.includes('BSI')
  ) {
    let bankName = 'bni'
    if (codeUpper.includes('BCA')) bankName = 'bca'
    else if (codeUpper.includes('BRI')) bankName = 'bri'
    else if (codeUpper.includes('CIMB')) bankName = 'cimb'
    else if (codeUpper.includes('DANAMON')) bankName = 'danamon'
    else if (codeUpper.includes('BSI')) bankName = 'bsi'
    else if (codeUpper.includes('BNI')) bankName = 'bni'

    coreBody = {
      payment_type: 'bank_transfer',
      transaction_details: { order_id: params.orderId, gross_amount: roundedAmount },
      bank_transfer: { bank: bankName },
      customer_details: customerDetails,
      item_details: params.itemDetails,
    }
  }

  if (coreBody) {
    try {
      console.log(`[Midtrans Core API Charge] Request for order ${params.orderId}:`, JSON.stringify(coreBody))
      const res = await fetch(`${baseUrl}/charge`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(coreBody),
      })

      const resData = await res.json()
      console.log(`[Midtrans Core API Charge] Response (${res.status}):`, JSON.stringify(resData))

      // Sukses jika status_code 200 / 201 (bukan 402/channel belum aktif)
      if (res.ok && (resData.status_code === '200' || resData.status_code === '201') && resData.status_code !== '402') {
        let paymentUrl: string | null = null
        let vaNumber: string | null = null
        let bank: string | null = null
        let billerCode: string | null = null
        let billKey: string | null = null
        let qrString: string | null = null

        if (resData.payment_type === 'qris') {
          const qrAction =
            resData.actions?.find((a: any) => a.name === 'generate-qr-code') || resData.actions?.[0]
          paymentUrl = qrAction?.url || resData.qr_string || null
          qrString = resData.qr_string || qrAction?.url || null
        } else if (['gopay', 'shopeepay', 'deeplink'].includes(resData.payment_type)) {
          const deeplinkAction =
            resData.actions?.find((a: any) => a.name === 'deeplink-redirect' || a.name === 'qr-code') ||
            resData.actions?.[0]
          paymentUrl = deeplinkAction?.url || resData.redirect_url || null
          if (resData.qr_string) qrString = resData.qr_string
        } else if (resData.payment_type === 'bank_transfer') {
          if (resData.va_numbers && resData.va_numbers.length > 0) {
            vaNumber = resData.va_numbers[0].va_number
            bank = resData.va_numbers[0].bank?.toUpperCase() || null
          } else if (resData.permata_va_number) {
            vaNumber = resData.permata_va_number
            bank = 'PERMATA'
          }
        } else if (resData.payment_type === 'echannel') {
          billerCode = resData.biller_code || null
          billKey = resData.bill_key || null
          vaNumber = billKey ? `${billerCode ? billerCode + ' - ' : ''}${billKey}` : null
          bank = 'MANDIRI'
        } else if (resData.payment_type === 'permata') {
          vaNumber = resData.permata_va_number || null
          bank = 'PERMATA'
        }

        if (vaNumber || paymentUrl || qrString) {
          return {
            isSnapModal: false,
            paymentUrl,
            vaNumber,
            bank,
            billerCode,
            billKey,
            qrString,
            snapToken: null,
            rawResponse: resData,
          }
        }
      } else {
        console.warn(
          `[Midtrans Core API] Channel not active or returned status ${resData.status_code} (${resData.status_message}). Falling back to Snap API...`
        )
      }
    } catch (err: any) {
      console.warn(`[Midtrans Core API Error] ${err.message}. Falling back to Snap API...`)
    }
  }

  // ==========================================
  // Step 2: Fallback ke Snap API (Modal Pop-up)
  // ==========================================
  const enabledPayments = getSnapEnabledPayments(params.paymentCode, params.paymentType)
  const snapBody = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: roundedAmount,
    },
    enabled_payments: enabledPayments,
    customer_details: customerDetails,
    item_details: params.itemDetails,
    expiry: {
      unit: 'hours',
      duration: 24,
    },
  }

  console.log(`[Midtrans Snap API Request] for order ${params.orderId}:`, JSON.stringify(snapBody))

  const snapRes = await fetch(snapUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(snapBody),
  })

  const snapData = await snapRes.json()
  console.log(`[Midtrans Snap API Response] Status: ${snapRes.status}`, JSON.stringify(snapData))

  if (!snapRes.ok || !snapData.token) {
    throw new Error(
      snapData.error_messages?.join(', ') ||
        snapData.status_message ||
        'Gagal membuat transaksi Midtrans Snap'
    )
  }

  return {
    isSnapModal: true,
    paymentUrl: snapData.redirect_url,
    vaNumber: null,
    bank: null,
    billerCode: null,
    billKey: null,
    qrString: null,
    snapToken: snapData.token,
    rawResponse: snapData,
  }
}
