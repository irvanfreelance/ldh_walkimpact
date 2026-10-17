import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getActiveEvent,
  getActiveTicketTier,
  getParticipantCategories,
  getShirtSizes,
} from '@/lib/db/queries/events'
import { getPaymentMethods } from '@/lib/db/queries/payments'
import { getRegistrationWindowStatus } from '@/lib/utils/registration'
import {
  createRegistration,
  createRegistrationParticipants,
  generateNextRegistrationNumber,
} from '@/lib/db/queries/registrations'
import { logPaymentTransaction } from '@/lib/db/queries/payments'
import { triggerNotification } from '@/lib/db/queries/notifications'
import { getQuotaFromDB } from '@/lib/db/queries/quota'
import { createMidtransTransaction } from '@/lib/midtrans/create-transaction'
import { invalidateQuotaCache } from '@/lib/cache/redis'
import { rateLimit } from '@/lib/utils/rate-limit'

const ParticipantItemSchema = z.object({
  slotNumber: z.coerce.number().int().positive(),
  name: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  shirtSizeId: z.coerce.number().int().positive(),
})

const BodySchema = z.object({
  contactName: z
    .string()
    .trim()
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter')
    .regex(/^[a-zA-Z\s'.]{3,100}$/, 'Nama hanya boleh berupa huruf, spasi, titik, atau petik'),
  contactEmail: z.string().trim().email('Format email tidak valid').optional().nullable(),
  contactWhatsapp: z
    .string()
    .trim()
    .regex(/^(?:08|\+628|628)[1-9][0-9]{7,12}$/, 'Format nomor WhatsApp tidak valid (contoh: 08123456789)'),
  categoryId: z.coerce.number().int().positive('Pilih kategori peserta'),
  ticketQty: z.coerce.number().int().min(1, 'Jumlah tiket minimal 1').max(5, 'Jumlah tiket maksimal 5'),
  shirtSizeIds: z.array(z.coerce.number().int().positive()).optional(),
  participants: z.array(ParticipantItemSchema).optional(),
  communityName: z
    .string()
    .trim()
    .max(100, 'Nama komunitas maksimal 100 karakter')
    .regex(/^[a-zA-Z0-9\s.,&()\-]{0,100}$/, 'Format nama komunitas tidak valid')
    .optional()
    .nullable(),
  paymentMethodId: z.coerce.number().int().positive().optional().nullable(),
  paymentMethodCode: z.string().optional().nullable(),
})

export async function POST(req: NextRequest) {
  let step = 'init'
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const limited = await rateLimit(ip, 5, 600)
    if (limited) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat.' }, { status: 429 })
    }

    const body = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Data tidak valid' }, { status: 400 })
    }

    const data = parsed.data

    // Normalize participants list
    const participantsList =
      data.participants && data.participants.length > 0
        ? data.participants
        : (data.shirtSizeIds || []).map((sizeId, idx) => ({
            slotNumber: idx + 1,
            name: idx === 0 ? data.contactName : `Peserta ${idx + 1}`,
            gender: null,
            shirtSizeId: sizeId,
          }))

    if (participantsList.length !== data.ticketQty) {
      return NextResponse.json(
        { error: 'Jumlah data peserta / ukuran kaos harus sesuai dengan jumlah tiket' },
        { status: 400 }
      )
    }

    const event = await getActiveEvent()
    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan atau belum aktif' }, { status: 404 })
    }

    const windowStatus = getRegistrationWindowStatus(
      event.registration_opens_at,
      event.registration_closes_at
    )
    if (windowStatus !== 'open') {
      return NextResponse.json(
        {
          error:
            windowStatus === 'closed'
              ? 'Pendaftaran telah ditutup'
              : 'Pendaftaran belum dibuka',
        },
        { status: 403 }
      )
    }

    // Validate references against the DB BEFORE creating any payment transaction.
    // A stale local draft (old category / shirt size / payment method ids) would otherwise
    // fail on a foreign key after the payment gateway transaction was already created.
    step = 'validate-references'
    const [categories, shirtSizes, paymentMethods] = await Promise.all([
      getParticipantCategories(),
      getShirtSizes(),
      data.paymentMethodId ? getPaymentMethods() : Promise.resolve(null),
    ])
    if (!categories.some((c) => Number(c.id) === data.categoryId)) {
      return NextResponse.json(
        { error: 'Kategori peserta tidak valid. Silakan muat ulang halaman lalu pilih kembali.' },
        { status: 400 }
      )
    }
    if (!participantsList.every((p) => shirtSizes.some((sz) => Number(sz.id) === p.shirtSizeId))) {
      return NextResponse.json(
        { error: 'Ukuran kaos tidak valid. Silakan muat ulang halaman lalu pilih kembali.' },
        { status: 400 }
      )
    }
    if (paymentMethods && !paymentMethods.some((m) => Number(m.id) === data.paymentMethodId)) {
      return NextResponse.json(
        { error: 'Metode pembayaran tidak tersedia. Silakan muat ulang halaman lalu pilih kembali.' },
        { status: 400 }
      )
    }

    // Atomic quota check
    step = 'quota-check'
    const quota = await getQuotaFromDB(event.id)
    if (!quota || quota.remaining < data.ticketQty) {
      return NextResponse.json({ error: 'Mohon maaf, kuota tiket sudah tidak mencukupi' }, { status: 409 })
    }

    step = 'ticket-tier'
    const tier = await getActiveTicketTier(event.id)
    if (!tier) {
      return NextResponse.json({ error: 'Kategori tiket tidak tersedia' }, { status: 404 })
    }

    const currentYear = new Date().getFullYear()
    step = 'registration-number'
    let regNumber = await generateNextRegistrationNumber(event.id, currentYear)

    // Normalize phone format to start with 628
    let normalizedPhone = data.contactWhatsapp.trim()
    if (normalizedPhone.startsWith('+62')) {
      normalizedPhone = normalizedPhone.slice(1)
    } else if (normalizedPhone.startsWith('08')) {
      normalizedPhone = '628' + normalizedPhone.slice(2)
    }

    const isManualBankTransfer =
      Boolean(
        data.paymentMethodCode?.toUpperCase().includes('MANUAL') ||
        data.paymentMethodCode === 'BCA_MANUAL' ||
        data.paymentMethodCode === 'MANDIRI_MANUAL'
      )

    let totalAmount = tier.price * data.ticketQty
    let uniqueCode = 0

    step = 'payment'
    if (isManualBankTransfer) {
      const { generateDailyUniqueCode } = await import('@/lib/payments/unique-code')
      uniqueCode = await generateDailyUniqueCode(data.paymentMethodId || null, data.paymentMethodCode || null)
      totalAmount = totalAmount + uniqueCode
    }

    // Process payment gateway (Midtrans) or Manual Bank Transfer
    let paymentResult: {
      isSnapModal?: boolean
      snapToken?: string | null
      paymentUrl?: string | null
      vaNumber?: string | null
      bank?: string | null
      billerCode?: string | null
      billKey?: string | null
      qrString?: string | null
    } = {}

    if (isManualBankTransfer) {
      const isBca = (data.paymentMethodCode || '').toUpperCase().includes('BCA')
      paymentResult = {
        isSnapModal: false,
        snapToken: null,
        paymentUrl: null,
        vaNumber: isBca ? '7772445588' : '1310012345678',
        bank: isBca ? 'BCA' : 'MANDIRI',
        billerCode: null,
        billKey: null,
        qrString: null,
      }
    } else {
      // The registration number is the Midtrans order_id. If Midtrans already knows it (orders from
      // earlier attempts are never forgotten), move on to the next number and try again.
      const MAX_ORDER_ID_ATTEMPTS = 10
      for (let attempt = 0; ; attempt++) {
        try {
          paymentResult = await createMidtransTransaction({
            orderId: regNumber,
            amount: totalAmount,
            paymentCode: data.paymentMethodCode || null,
            customerName: data.contactName,
            customerEmail: data.contactEmail || null,
            customerPhone: normalizedPhone,
            itemDetails: [
              {
                id: String(tier.id),
                name: `${event.name} - ${tier.name}`,
                price: tier.price,
                quantity: data.ticketQty,
              },
            ],
          })
          break
        } catch (midtransErr: any) {
          const msg = String(midtransErr?.message || '')
          const orderIdTaken = /order_id.*(already been taken|already exist)|duplicate order/i.test(msg)
          if (orderIdTaken && attempt < MAX_ORDER_ID_ATTEMPTS) {
            console.warn(`Midtrans order_id ${regNumber} already used, trying the next number`)
            regNumber = await generateNextRegistrationNumber(event.id, currentYear, attempt + 1)
            continue
          }
          console.error('Midtrans transaction error:', midtransErr)
          return NextResponse.json(
            { error: msg || 'Gagal memproses pembayaran melalui Midtrans. Silakan coba lagi.' },
            { status: 502 }
          )
        }
      }
    }

    const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000)

    step = 'insert-registration'
    // Save unified registration record (Order + Payment Gateway details combined in 1 table)
    const registration = await createRegistration({
      registrationNumber: regNumber,
      eventId: event.id,
      ticketTierId: tier.id,
      categoryId: data.categoryId,
      contactName: data.contactName,
      contactEmail: data.contactEmail || null,
      contactWhatsapp: normalizedPhone,
      communityName: data.communityName || null,
      ticketQty: data.ticketQty,
      unitPrice: tier.price,
      adminFee: uniqueCode,
      totalAmount,
      paymentMethodId: data.paymentMethodId || null,
      paymentMethodCode: data.paymentMethodCode || (isManualBankTransfer ? 'MANUAL_TRANSFER' : 'MIDTRANS'),
      paymentType: isManualBankTransfer
        ? 'manual_transfer'
        : paymentResult.isSnapModal
        ? 'snap'
        : data.paymentMethodCode?.toLowerCase().includes('qris')
        ? 'qris'
        : 'bank_transfer',
      bank: paymentResult.bank || null,
      vaNumber: paymentResult.vaNumber || null,
      billerCode: paymentResult.billerCode || null,
      billKey: paymentResult.billKey || null,
      snapToken: paymentResult.snapToken || null,
      qrUrl: paymentResult.qrString || null,
      paymentUrl: paymentResult.paymentUrl || null,
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') || '',
    })

    if (!registration) {
      return NextResponse.json({ error: 'Gagal membuat pendaftaran' }, { status: 500 })
    }

    // Save participants with initial slot details
    step = 'insert-participants'
    await createRegistrationParticipants(
      Number(registration.id),
      participantsList.map((p) => ({
        slotNumber: p.slotNumber,
        name: p.name || (p.slotNumber === 1 ? data.contactName : `Peserta ${p.slotNumber}`),
        gender: p.gender || null,
        shirtSizeId: p.shirtSizeId,
        bibNumber: null, // assigned upon confirmation / payment
      }))
    )

    // Non-critical follow-ups: the registration and payment transaction already exist at this point,
    // so a failure here must not turn into a 500 for the user.
    try {
      step = 'log-payment'
      // Log into payment_logs
      await logPaymentTransaction({
        invoiceCode: regNumber,
        endpoint: '/api/registrations',
        type: 'CHECKOUT_INITIALIZE',
        requestPayload: {
          registrationNumber: regNumber,
          totalAmount,
          ticketQty: data.ticketQty,
          contactName: data.contactName,
        },
        responsePayload: {
          isSnapModal: paymentResult.isSnapModal,
          snapToken: paymentResult.snapToken,
          redirectUrl: paymentResult.paymentUrl,
          vaNumber: paymentResult.vaNumber,
          bank: paymentResult.bank,
        },
        httpStatus: 201,
      })

      step = 'notification'
      // Trigger INVOICE_PENDING notification
      await triggerNotification({
        eventTrigger: 'INVOICE_PENDING',
        invoiceCode: regNumber,
        recipient: normalizedPhone,
        variables: {
          nama: data.contactName,
          nominal: totalAmount,
          metode: data.paymentMethodCode || (paymentResult.isSnapModal ? 'Midtrans Snap' : 'Midtrans Core API'),
          nomor_daftar: regNumber,
          tiket_qty: data.ticketQty,
          va_number: paymentResult.vaNumber || '-',
        },
      })

      // Send pending payment email (fire-and-forget)
      const { sendRegistrationPendingEmail } = await import('@/lib/email/send-registration-email')
      sendRegistrationPendingEmail(regNumber, {
        paymentType: data.paymentMethodCode,
        bank: paymentResult.bank,
        vaNumber: paymentResult.vaNumber,
        snapToken: paymentResult.snapToken,
        paymentUrl: paymentResult.paymentUrl,
        qrUrl: paymentResult.qrString,
      }).catch(console.error)

    } catch (followUpErr) {
      console.error(`Registration ${regNumber} created, but follow-up step '${step}' failed:`, followUpErr)
    }

    // Invalidate quota cache (independent of the log/notification steps above)
    try {
      await invalidateQuotaCache()
    } catch (cacheErr) {
      console.warn('Quota cache invalidation failed:', cacheErr)
    }

    return NextResponse.json(
      {
        registrationNumber: regNumber,
        isSnapModal: paymentResult.isSnapModal,
        snapToken: paymentResult.snapToken,
        redirectUrl: paymentResult.paymentUrl,
        vaNumber: paymentResult.vaNumber,
        bank: paymentResult.bank,
        billerCode: paymentResult.billerCode,
        billKey: paymentResult.billKey,
        qrString: paymentResult.qrString,
        totalAmount,
        expiryTime,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(`Registration POST error at step '${step}':`, error)
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan sistem saat memproses pendaftaran',
        ...(process.env.NODE_ENV !== 'production' ? { detail: `[${step}] ${detail}` } : {}),
      },
      { status: 500 }
    )
  }
}
