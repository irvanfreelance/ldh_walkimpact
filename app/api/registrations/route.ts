import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActiveEvent, getActiveTicketTier } from '@/lib/db/queries/events'
import {
  createRegistration,
  createRegistrationParticipants,
  generateNextRegistrationNumber,
} from '@/lib/db/queries/registrations'
import { logPaymentTransaction } from '@/lib/db/queries/payments'
import { triggerNotification } from '@/lib/db/queries/notifications'
import { getQuotaFromDB } from '@/lib/db/queries/quota'
import { createSnapTransaction } from '@/lib/midtrans/create-transaction'
import { invalidateQuotaCache } from '@/lib/cache/redis'
import { rateLimit } from '@/lib/utils/rate-limit'

const ParticipantItemSchema = z.object({
  slotNumber: z.number().int().positive(),
  name: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  shirtSizeId: z.number().int().positive(),
})

const BodySchema = z.object({
  contactName: z.string().min(3, 'Nama minimal 3 karakter').max(255),
  contactEmail: z.string().email('Format email tidak valid').optional().nullable(),
  contactWhatsapp: z.string().regex(/^(08|628|\+628)\d{8,13}$/, 'Format WhatsApp tidak valid (contoh: 08123456789)'),
  categoryId: z.number().int().positive('Pilih kategori peserta'),
  ticketQty: z.number().int().min(1).max(5),
  shirtSizeIds: z.array(z.number().int().positive()).optional(),
  participants: z.array(ParticipantItemSchema).optional(),
  communityName: z.string().max(255).optional().nullable(),
  paymentMethodId: z.number().int().positive().optional().nullable(),
  paymentMethodCode: z.string().optional().nullable(),
})

export async function POST(req: NextRequest) {
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

    // Atomic quota check
    const quota = await getQuotaFromDB(event.id)
    if (!quota || quota.remaining < data.ticketQty) {
      return NextResponse.json({ error: 'Mohon maaf, kuota tiket sudah tidak mencukupi' }, { status: 409 })
    }

    const tier = await getActiveTicketTier(event.id)
    if (!tier) {
      return NextResponse.json({ error: 'Kategori tiket tidak tersedia' }, { status: 404 })
    }

    const currentYear = new Date().getFullYear()
    const regNumber = await generateNextRegistrationNumber(event.id, currentYear)
    const totalAmount = tier.price * data.ticketQty

    // Normalize phone format to start with 628
    let normalizedPhone = data.contactWhatsapp.trim()
    if (normalizedPhone.startsWith('+62')) {
      normalizedPhone = normalizedPhone.slice(1)
    } else if (normalizedPhone.startsWith('08')) {
      normalizedPhone = '628' + normalizedPhone.slice(2)
    }

    // Create Midtrans Snap transaction
    const snap = await createSnapTransaction({
      orderId: regNumber,
      grossAmount: totalAmount,
      customerName: data.contactName,
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

    const expiryTime = new Date(snap.expiry_time || Date.now() + 24 * 60 * 60 * 1000)

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
      adminFee: 0,
      totalAmount,
      paymentMethodId: data.paymentMethodId || null,
      paymentMethodCode: data.paymentMethodCode || 'MIDTRANS_SNAP',
      paymentType: 'snap',
      snapToken: snap.token,
      paymentUrl: snap.redirect_url,
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') || '',
    })

    if (!registration) {
      return NextResponse.json({ error: 'Gagal membuat pendaftaran' }, { status: 500 })
    }

    // Save participants with initial slot details
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
        snapToken: snap.token,
        redirectUrl: snap.redirect_url,
      },
      httpStatus: 201,
    })

    // Trigger INVOICE_PENDING notification
    await triggerNotification({
      eventTrigger: 'INVOICE_PENDING',
      invoiceCode: regNumber,
      recipient: normalizedPhone,
      variables: {
        nama: data.contactName,
        nominal: totalAmount,
        metode: 'Midtrans Snap',
        nomor_daftar: regNumber,
        tiket_qty: data.ticketQty,
      },
    })

    // Invalidate quota cache
    await invalidateQuotaCache()

    return NextResponse.json(
      {
        registrationNumber: regNumber,
        snapToken: snap.token,
        redirectUrl: snap.redirect_url,
        totalAmount,
        expiryTime,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration POST error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan sistem saat memproses pendaftaran' }, { status: 500 })
  }
}
