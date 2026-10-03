import sql from '@/lib/db/client'

export interface ParticipantInput {
  slotNumber: number
  name?: string | null
  gender?: string | null
  shirtSizeId: number
  bibNumber?: string | null
}

export interface RegistrationParticipantDetail {
  slot: number
  name: string | null
  gender: string | null
  bib_number: string | null
  size_code: string
  size_label: string
}

export interface RegistrationDetail {
  id: number
  registration_number: string // invoice_code / order_id
  event_id: number
  ticket_tier_id: number
  category_id: number
  category_label: string
  contact_name: string
  contact_email: string | null
  contact_whatsapp: string
  community_name: string | null
  ticket_qty: number
  unit_price: number
  admin_fee: number
  total_amount: number
  status: string // pending | paid | expired | cancelled
  payment_method_id: number | null
  payment_method_code: string | null
  payment_type: string | null
  bank: string | null
  va_number: string | null
  biller_code: string | null
  bill_key: string | null
  snap_token: string | null
  qr_url: string | null
  payment_url: string | null
  transaction_id: string | null
  fraud_status: string | null
  transaction_time: string | null
  settlement_time: string | null
  paid_at: string | null
  expired_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  updated_at: string
  participants: RegistrationParticipantDetail[]
}

export async function createRegistration(data: {
  registrationNumber: string
  eventId: number
  ticketTierId: number
  categoryId: number
  contactName: string
  contactEmail?: string | null
  contactWhatsapp: string
  communityName: string | null
  ticketQty: number
  unitPrice: number
  adminFee?: number
  totalAmount: number
  paymentMethodId?: number | null
  paymentMethodCode?: string | null
  paymentType?: string | null
  bank?: string | null
  vaNumber?: string | null
  snapToken?: string | null
  qrUrl?: string | null
  paymentUrl?: string | null
  ipAddress: string
  userAgent: string
}) {
  const adminFee = data.adminFee || 0

  const rows = await sql`
    INSERT INTO registrations (
      registration_number, event_id, ticket_tier_id, category_id,
      contact_name, contact_email, contact_whatsapp, community_name,
      ticket_qty, unit_price, admin_fee, total_amount,
      payment_method_id, payment_method_code, payment_type, bank, va_number,
      snap_token, qr_url, payment_url,
      ip_address, user_agent, status
    ) VALUES (
      ${data.registrationNumber}, ${data.eventId}, ${data.ticketTierId}, ${data.categoryId},
      ${data.contactName}, ${data.contactEmail || null}, ${data.contactWhatsapp}, ${data.communityName},
      ${data.ticketQty}, ${data.unitPrice}, ${adminFee}, ${data.totalAmount},
      ${data.paymentMethodId || null}, ${data.paymentMethodCode || null}, ${data.paymentType || null},
      ${data.bank || null}, ${data.vaNumber || null},
      ${data.snapToken || null}, ${data.qrUrl || null}, ${data.paymentUrl || null},
      ${data.ipAddress}, ${data.userAgent}, 'pending'
    )
    RETURNING id, registration_number, event_id, ticket_tier_id, category_id,
              contact_name, contact_email, contact_whatsapp, community_name,
              ticket_qty, unit_price, admin_fee, total_amount, status, snap_token, created_at
  `
  return rows[0]
}

export async function createRegistrationParticipants(
  registrationId: number,
  participants: ParticipantInput[]
) {
  for (const p of participants) {
    await sql`
      INSERT INTO registration_participants (
        registration_id, slot_number, name, gender, shirt_size_id, bib_number
      ) VALUES (
        ${registrationId}, ${p.slotNumber}, ${p.name || null}, ${p.gender || null},
        ${p.shirtSizeId}, ${p.bibNumber || null}
      )
      ON CONFLICT (registration_id, slot_number) DO UPDATE
      SET shirt_size_id = EXCLUDED.shirt_size_id,
          name = EXCLUDED.name,
          gender = EXCLUDED.gender,
          bib_number = EXCLUDED.bib_number
    `
  }
}

export async function getRegistrationByNumber(number: string): Promise<RegistrationDetail | null> {
  const rows = await sql`
    SELECT
      r.id,
      r.registration_number,
      r.event_id,
      r.ticket_tier_id,
      r.category_id,
      r.contact_name,
      r.contact_email,
      r.contact_whatsapp,
      r.community_name,
      r.ticket_qty,
      r.unit_price,
      COALESCE(r.admin_fee, 0)::bigint AS admin_fee,
      r.total_amount,
      r.status,
      r.payment_method_id,
      r.payment_method_code,
      r.payment_type,
      r.bank,
      r.va_number,
      r.biller_code,
      r.bill_key,
      r.snap_token,
      r.qr_url,
      r.payment_url,
      r.transaction_id,
      r.fraud_status,
      r.transaction_time,
      r.settlement_time,
      r.paid_at,
      r.expired_at,
      r.cancelled_at,
      r.cancel_reason,
      r.ip_address,
      r.user_agent,
      r.created_at,
      r.updated_at,
      pc.label AS category_label,
      COALESCE(
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'slot',       rp.slot_number,
              'name',       rp.name,
              'gender',     rp.gender,
              'bib_number', rp.bib_number,
              'size_code',  ss.code,
              'size_label', ss.label
            ) ORDER BY rp.slot_number
          )
          FROM registration_participants rp
          JOIN shirt_sizes ss ON ss.id = rp.shirt_size_id
          WHERE rp.registration_id = r.id
        ),
        '[]'::json
      ) AS participants
    FROM registrations r
    JOIN participant_categories pc ON pc.id = r.category_id
    WHERE r.registration_number = ${number}
    LIMIT 1
  `
  return (rows[0] as unknown as RegistrationDetail) ?? null
}

export async function markRegistrationPaid(
  registrationId: number,
  paidAt: Date = new Date(),
  paymentInfo?: {
    transactionId?: string
    paymentType?: string
    bank?: string | null
    vaNumber?: string | null
    settlementTime?: Date | null
    midtransResponse?: Record<string, unknown>
  }
): Promise<void> {
  // Generate BIB numbers for all participants of this registration if not already generated
  const participants = await sql`
    SELECT id, slot_number, bib_number
    FROM registration_participants
    WHERE registration_id = ${registrationId}
    ORDER BY slot_number ASC
  `

  for (const p of participants) {
    if (!p.bib_number) {
      // Generate clean bib number format: WI-{4 digits}
      const countRow = await sql`
        SELECT COUNT(id) AS cnt FROM registration_participants WHERE bib_number IS NOT NULL
      `
      const nextBib = String(Number(countRow[0]?.cnt || 0) + 1).padStart(4, '0')
      await sql`
        UPDATE registration_participants
        SET bib_number = ${nextBib}
        WHERE id = ${p.id}
      `
    }
  }

  await sql`
    UPDATE registrations
    SET
      status = 'paid',
      paid_at = ${paidAt.toISOString()},
      transaction_id = COALESCE(${paymentInfo?.transactionId || null}, transaction_id),
      payment_type = COALESCE(${paymentInfo?.paymentType || null}, payment_type),
      bank = COALESCE(${paymentInfo?.bank || null}, bank),
      va_number = COALESCE(${paymentInfo?.vaNumber || null}, va_number),
      settlement_time = COALESCE(${paymentInfo?.settlementTime ? paymentInfo.settlementTime.toISOString() : null}, settlement_time),
      midtrans_response = COALESCE(${paymentInfo?.midtransResponse ? JSON.stringify(paymentInfo.midtransResponse) : null}::jsonb, midtrans_response),
      updated_at = NOW()
    WHERE id = ${registrationId}
  `
}

export async function markRegistrationExpired(registrationId: number): Promise<void> {
  await sql`
    UPDATE registrations
    SET status = 'expired', expired_at = NOW(), updated_at = NOW()
    WHERE id = ${registrationId} AND status = 'pending'
  `
}

export async function updateRegistrationPaymentData(
  registrationNumber: string,
  data: {
    snapToken?: string
    paymentUrl?: string
    qrUrl?: string
    transactionId?: string
    paymentType?: string
    bank?: string | null
    vaNumber?: string | null
    status?: string
    fraudStatus?: string | null
    settlementTime?: Date | null
    midtransResponse?: Record<string, unknown>
  }
) {
  const rows = await sql`
    UPDATE registrations
    SET
      snap_token = COALESCE(${data.snapToken || null}, snap_token),
      payment_url = COALESCE(${data.paymentUrl || null}, payment_url),
      qr_url = COALESCE(${data.qrUrl || null}, qr_url),
      transaction_id = COALESCE(${data.transactionId || null}, transaction_id),
      payment_type = COALESCE(${data.paymentType || null}, payment_type),
      bank = COALESCE(${data.bank || null}, bank),
      va_number = COALESCE(${data.vaNumber || null}, va_number),
      status = COALESCE(${data.status || null}, status),
      fraud_status = COALESCE(${data.fraudStatus || null}, fraud_status),
      settlement_time = COALESCE(${data.settlementTime ? data.settlementTime.toISOString() : null}, settlement_time),
      midtrans_response = COALESCE(${data.midtransResponse ? JSON.stringify(data.midtransResponse) : null}::jsonb, midtrans_response),
      updated_at = NOW()
    WHERE registration_number = ${registrationNumber}
    RETURNING id, registration_number, status, total_amount
  `
  return rows[0] ?? null
}

export async function generateNextRegistrationNumber(
  eventId: number,
  year: number
): Promise<string> {
  const rows = await sql`
    SELECT COUNT(*) AS cnt
    FROM registrations
    WHERE event_id = ${eventId}
  `
  const next = Number(rows[0]?.cnt || 0) + 1
  return `WI-${year}-${String(next).padStart(4, '0')}`
}
