import nodemailer from 'nodemailer'
import { getRegistrationByNumber } from '@/lib/db/queries/registrations'
import sql from '@/lib/db/client'
import { formatEventDate, formatIDR, formatTimeWib } from '@/lib/utils/format'
import { getNotificationTemplate, logNotification } from '@/lib/db/queries/notifications'

export interface EmailTemplateContent {
  subject: string
  header_title: string
  body: string
  barcode_note: string
  jersey_heading: string
  jersey_contact: string
  cta_note: string
  cta_label: string
  footer: string
}

const SUCCESS_DEFAULTS: EmailTemplateContent = {
  subject: '✅ Pendaftaran Berhasil – {nama_program} | {nomor_daftar}',
  header_title: '✅ Pendaftaran Berhasil!',
  body: 'Pembayaran Kakak telah berhasil kami terima. Terima kasih telah mendaftar acara {nama_program} – Walk Together and Create Impact! sekaligus ikut berbagi paket sembako secara langsung kepada keluarga yang membutuhkan.',
  barcode_note: 'Mohon simpan barcode untuk proses penukaran jersey {nama_program} dan tunjukkan saat pengambilan jersey.',
  jersey_heading: 'Pengambilan Jersey',
  jersey_contact: 'Info selengkapnya: Instagram @lazdarulhikam',
  cta_note: 'Sampai bertemu di {nama_program}! Download barcode penukaran jersey melalui button di bawah ini.',
  cta_label: 'Download Barcode',
  footer: 'LAZ Darul Hikam — Bersama Membantu Sesama',
}

const PENDING_DEFAULTS: EmailTemplateContent = {
  subject: '⏳ Selesaikan Pembayaran – {nama_program} | {nomor_daftar}',
  header_title: '⏳ Selesaikan Pembayaran Anda',
  body: 'Terima kasih telah mendaftar acara {nama_program}. Pendaftaran Kakak belum aktif sampai pembayaran diselesaikan. Segera lakukan pembayaran sesuai instruksi berikut ini.',
  barcode_note: 'Konfirmasi pembayaran dilakukan otomatis oleh sistem setelah transfer diterima. Kakak akan mendapat email konfirmasi terpisah setelah pembayaran berhasil.',
  jersey_heading: 'Cek Status Pembayaran',
  jersey_contact: 'Info selengkapnya: Instagram @lazdarulhikam',
  cta_note: 'Klik tombol di bawah untuk melihat status dan instruksi pembayaran lengkap.',
  cta_label: 'Cek Status Pembayaran',
  footer: 'LAZ Darul Hikam — Bersama Membantu Sesama',
}

function replacePlaceholders(text: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), val),
    text
  )
}

async function resolveEmailTemplate(
  trigger: string,
  defaults: EmailTemplateContent
): Promise<{ content: EmailTemplateContent; templateId: number | null }> {
  try {
    const tpl = await getNotificationTemplate(trigger, 'EMAIL')
    if (tpl) {
      const parsed: Partial<EmailTemplateContent> = JSON.parse(tpl.message_content)
      // Merge parsed with defaults so missing keys fall back gracefully
      return {
        content: { ...defaults, ...parsed } as EmailTemplateContent,
        templateId: tpl.id,
      }
    }
  } catch {}
  return { content: defaults, templateId: null }
}

function buildPaymentMethodLabel(reg: {
  payment_method_code: string | null
  payment_type: string | null
  bank: string | null
}): string {
  const parts: string[] = []
  if (reg.bank) parts.push(reg.bank.toUpperCase())
  if (reg.payment_method_code) parts.push(reg.payment_method_code)
  else if (reg.payment_type) parts.push(reg.payment_type)
  return parts.join(' ') || 'Transfer Manual'
}

function buildEmailHtml(opts: {
  contactName: string
  registrationNumber: string
  totalAmount: number
  paymentMethodLabel: string
  assemblyTime: string
  eventDate: string
  startTime: string
  endTime: string
  venueName: string
  rpcLocationNote: string | null
  ticketUrl: string
  tpl: EmailTemplateContent
}): string {
  const {
    contactName,
    registrationNumber,
    totalAmount,
    paymentMethodLabel,
    assemblyTime,
    eventDate,
    startTime,
    endTime,
    venueName,
    rpcLocationNote,
    ticketUrl,
    tpl,
  } = opts

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${tpl.header_title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:#4caf22;padding:28px 32px;text-align:center;">
          <p style="margin:0;font-size:28px;font-weight:bold;color:#ffffff;">${tpl.header_title}</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:28px 32px;">

          <p style="margin:0 0 16px;font-size:16px;color:#222;">Halo Kak ${contactName}, &#x1F44B;</p>

          <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">${tpl.body}</p>

          <!-- Info Card -->
          <table width="100%" cellpadding="12" cellspacing="0"
            style="background:#f0f9e8;border:1px solid #c5e5a0;border-radius:8px;margin-bottom:24px;">
            <tr>
              <td style="font-size:14px;color:#555;">Nama Program</td>
              <td style="font-size:14px;font-weight:bold;color:#2e7d00;text-align:right;">${registrationNumber.split('-')[0] === 'WI' ? 'WALK IMPACT ' + registrationNumber.split('-')[1] : registrationNumber}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#555;">Kode Registrasi</td>
              <td style="font-size:14px;color:#222;text-align:right;">${registrationNumber}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#555;">Jumlah Pembayaran</td>
              <td style="font-size:14px;font-weight:bold;color:#c0392b;text-align:right;">${formatIDR(totalAmount)}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#555;">Metode Pembayaran</td>
              <td style="font-size:14px;color:#222;text-align:right;">${paymentMethodLabel}</td>
            </tr>
          </table>

          <!-- Event Info -->
          <p style="margin:0 0 8px;font-size:15px;font-weight:bold;color:#222;">
            Registration: ${formatTimeWib(assemblyTime)} - ${formatTimeWib(startTime)}
          </p>
          <p style="margin:0 0 4px;font-size:14px;color:#444;">&#x1F4C5; ${eventDate}</p>
          <p style="margin:0 0 4px;font-size:14px;color:#444;">&#x23F0; ${formatTimeWib(startTime)} - Selesai ${formatTimeWib(endTime)}</p>
          <p style="margin:0 0 20px;font-size:14px;color:#444;">&#x1F4CD; ${venueName}</p>

          <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6;">${tpl.barcode_note}</p>

          <!-- Jersey Pickup -->
          <p style="margin:0 0 6px;font-size:15px;font-weight:bold;color:#222;">${tpl.jersey_heading}</p>
          ${rpcLocationNote ? `<p style="margin:0 0 4px;font-size:14px;color:#444;">&#x1F4CD; ${rpcLocationNote}</p>` : ''}
          <p style="margin:0 0 24px;font-size:14px;color:#444;">&#x1F4F2; ${tpl.jersey_contact}</p>

          <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6;">${tpl.cta_note}</p>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="${ticketUrl}"
                  style="display:inline-block;background:#4caf22;color:#ffffff;font-size:16px;font-weight:bold;
                  padding:14px 40px;border-radius:8px;text-decoration:none;">
                  &#x2261; ${tpl.cta_label}
                </a>
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:16px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;font-size:13px;color:#888;">${tpl.footer}</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  }
  return transporter
}

export async function sendRegistrationSuccessEmail(registrationNumber: string): Promise<void> {
  const gmailUser = process.env.GMAIL_USER
  if (!gmailUser || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[email] GMAIL_USER or GMAIL_APP_PASSWORD not set, skipping email')
    return
  }

  const registration = await getRegistrationByNumber(registrationNumber)
  if (!registration) {
    console.warn(`[email] Registration not found: ${registrationNumber}`)
    return
  }
  if (!registration.contact_email) {
    console.warn(`[email] No contact_email for ${registrationNumber}, skipping success email`)
    return
  }

  const eventRows = await sql`
    SELECT name, end_time, assembly_time, start_time, event_date, venue_name, rpc_location_note, contact_name
    FROM events WHERE id = ${registration.event_id} LIMIT 1
  `
  const event = eventRows[0] as {
    name: string
    end_time: string
    assembly_time: string
    start_time: string
    event_date: string
    venue_name: string
    rpc_location_note: string | null
    contact_name: string | null
  } | undefined
  if (!event) return

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://walkimpact.lazdarulhikam.or.id'
  const ticketUrl = `${baseUrl}/api/registrations/${registrationNumber}/ticket`

  const { content: rawTpl, templateId } = await resolveEmailTemplate('EMAIL_INVOICE_SUCCESS', SUCCESS_DEFAULTS)

  // Replace all placeholders in every field
  const vars: Record<string, string> = {
    nama: registration.contact_name,
    nama_program: event.name,
    nomor_daftar: registration.registration_number,
    nominal: formatIDR(registration.total_amount),
    metode: buildPaymentMethodLabel(registration),
    tanggal_acara: formatEventDate(event.event_date),
    jam_registrasi: `${formatTimeWib(event.assembly_time)} - ${formatTimeWib(event.start_time)}`,
    jam_acara: `${formatTimeWib(event.start_time)} - ${formatTimeWib(event.end_time)}`,
    lokasi: event.venue_name,
    rpc_lokasi: event.rpc_location_note || '',
    ticket_url: ticketUrl,
  }
  const tpl = Object.fromEntries(
    Object.entries(rawTpl).map(([k, v]) => [k, replacePlaceholders(v, vars)])
  ) as unknown as EmailTemplateContent

  const subject = tpl.subject

  const html = buildEmailHtml({
    contactName: registration.contact_name,
    registrationNumber: registration.registration_number,
    totalAmount: registration.total_amount,
    paymentMethodLabel: buildPaymentMethodLabel(registration),
    assemblyTime: event.assembly_time,
    eventDate: formatEventDate(event.event_date),
    startTime: event.start_time,
    endTime: event.end_time,
    venueName: event.venue_name,
    rpcLocationNote: event.rpc_location_note,
    ticketUrl,
    tpl,
  })

  const fromName = process.env.EMAIL_FROM_NAME || 'LAZ Darul Hikam'
  await getTransporter().sendMail({
    from: `"${fromName}" <${gmailUser}>`,
    to: registration.contact_email,
    subject,
    html,
  })

  await logNotification({
    templateId,
    invoiceCode: registrationNumber,
    recipient: registration.contact_email,
    channel: 'EMAIL',
    requestPayload: { trigger: 'EMAIL_INVOICE_SUCCESS', to: registration.contact_email, subject },
    responsePayload: { status: 'SENT' },
    status: 'SUCCESS',
  })

  console.log(`[email] Sent success email to ${registration.contact_email} for ${registrationNumber}`)
}

// ---------------------------------------------------------------------------
// Pending email
// ---------------------------------------------------------------------------

interface PendingPaymentInfo {
  paymentType?: string | null
  bank?: string | null
  vaNumber?: string | null
  billerCode?: string | null
  billKey?: string | null
  snapToken?: string | null
  paymentUrl?: string | null
  qrUrl?: string | null
}

function buildPendingEmailHtml(opts: {
  contactName: string
  registrationNumber: string
  totalAmount: number
  adminFee: number
  paymentMethodLabel: string
  payment: PendingPaymentInfo
  konfirmasiUrl: string
  tpl: EmailTemplateContent
  vars: Record<string, string>
}): string {
  const {
    contactName,
    registrationNumber,
    totalAmount,
    adminFee,
    paymentMethodLabel,
    payment,
    konfirmasiUrl,
    tpl,
    vars,
  } = opts

  const codeUpper = (payment.paymentType || '').toUpperCase()
  const isManual =
    codeUpper.includes('MANUAL') ||
    codeUpper === 'MANUAL_TRANSFER'

  const isVA = !isManual && Boolean(payment.vaNumber)
  const isSnap = !isManual && !isVA && Boolean(payment.snapToken)
  const isQris = !isManual && !isVA && !isSnap && Boolean(payment.qrUrl)

  const bankName = payment.bank
    ? payment.bank.toUpperCase()
    : codeUpper.includes('BCA')
    ? 'BCA'
    : codeUpper.includes('MANDIRI')
    ? 'Mandiri'
    : 'Transfer Bank'

  const accountNumber = payment.vaNumber || '-'
  const uniqueCode = adminFee > 0 ? adminFee : totalAmount % 1000
  const uniqueNote =
    uniqueCode > 0
      ? `<p style="margin:0 0 8px;font-size:13px;color:#b45309;">
          &#x26A0;&#xFE0F; Nominal sudah termasuk kode unik <strong>Rp ${uniqueCode}</strong> agar pembayaran terkonfirmasi otomatis.
          Mohon transfer <strong>sesuai nominal di atas</strong>.
        </p>`
      : ''

  let paymentBlock = ''
  if (isManual || isVA) {
    const label = isManual ? 'Nomor Rekening' : `Virtual Account ${bankName}`
    // Mandiri echannel
    const billKeyBlock =
      payment.billerCode && payment.billKey
        ? `<tr>
            <td style="font-size:14px;color:#555;padding:8px 12px;">Biller Code</td>
            <td style="font-size:14px;font-weight:bold;color:#1a1a1a;text-align:right;padding:8px 12px;">${payment.billerCode}</td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#555;padding:8px 12px;">Bill Key</td>
            <td style="font-size:14px;font-weight:bold;color:#1a1a1a;text-align:right;padding:8px 12px;">${payment.billKey}</td>
          </tr>`
        : ''

    paymentBlock = `
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;margin-bottom:16px;">
        <tr>
          <td style="font-size:13px;color:#92400e;padding:8px 12px;font-weight:bold;" colspan="2">Instruksi Pembayaran</td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#555;padding:8px 12px;">Bank</td>
          <td style="font-size:14px;font-weight:bold;color:#1a1a1a;text-align:right;padding:8px 12px;">${bankName}</td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#555;padding:8px 12px;">${label}</td>
          <td style="font-size:16px;font-weight:bold;color:#1a1a1a;text-align:right;padding:8px 12px;letter-spacing:1px;">${accountNumber}</td>
        </tr>
        ${billKeyBlock}
        ${isManual ? `<tr>
          <td style="font-size:14px;color:#555;padding:8px 12px;">Atas Nama</td>
          <td style="font-size:14px;font-weight:bold;color:#1a1a1a;text-align:right;padding:8px 12px;">LAZ Darul Hikam</td>
        </tr>` : ''}
        <tr>
          <td style="font-size:14px;color:#555;padding:8px 12px;">Jumlah Transfer</td>
          <td style="font-size:16px;font-weight:bold;color:#c0392b;text-align:right;padding:8px 12px;">${formatIDR(totalAmount)}</td>
        </tr>
      </table>
      ${uniqueNote}`
  } else if (isSnap && payment.paymentUrl) {
    paymentBlock = `
      <p style="margin:0 0 16px;font-size:14px;color:#444;">Klik tombol di bawah untuk menyelesaikan pembayaran melalui halaman Midtrans:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr><td align="center">
          <a href="${payment.paymentUrl}"
            style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;
            padding:12px 32px;border-radius:8px;text-decoration:none;">
            &#x1F4B3; Bayar Sekarang
          </a>
        </td></tr>
      </table>`
  } else if (isQris && payment.qrUrl) {
    paymentBlock = `
      <p style="margin:0 0 8px;font-size:14px;color:#444;">Scan QR Code berikut untuk membayar:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr><td align="center">
          <img src="${payment.qrUrl}" alt="QR Code Pembayaran" width="200" height="200"
            style="border-radius:8px;border:1px solid #e5e7eb;" />
        </td></tr>
      </table>`
  } else {
    paymentBlock = `<p style="margin:0 0 16px;font-size:14px;color:#444;">
      Silakan selesaikan pembayaran Anda. Cek detail di halaman konfirmasi.
    </p>`
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${tpl.header_title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:#f59e0b;padding:28px 32px;text-align:center;">
          <p style="margin:0;font-size:26px;font-weight:bold;color:#ffffff;">${tpl.header_title}</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:28px 32px;">

          <p style="margin:0 0 16px;font-size:16px;color:#222;">Halo Kak ${contactName}, &#x1F44B;</p>

          <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">${tpl.body}</p>

          <!-- Info Card -->
          <table width="100%" cellpadding="0" cellspacing="0"
            style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;margin-bottom:24px;">
            <tr>
              <td style="font-size:14px;color:#555;padding:8px 12px;">Nama Program</td>
              <td style="font-size:14px;font-weight:bold;color:#92400e;text-align:right;padding:8px 12px;">${vars.nama_program}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#555;padding:8px 12px;">Kode Registrasi</td>
              <td style="font-size:14px;color:#222;text-align:right;padding:8px 12px;">${registrationNumber}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#555;padding:8px 12px;">Jumlah Pembayaran</td>
              <td style="font-size:14px;font-weight:bold;color:#c0392b;text-align:right;padding:8px 12px;">${formatIDR(totalAmount)}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#555;padding:8px 12px;">Metode Pembayaran</td>
              <td style="font-size:14px;color:#222;text-align:right;padding:8px 12px;">${paymentMethodLabel}</td>
            </tr>
          </table>

          ${paymentBlock}

          <p style="margin:0 0 20px;font-size:13px;color:#6b7280;line-height:1.6;background:#f9fafb;border-radius:8px;padding:12px;">
            &#x2139;&#xFE0F; ${tpl.barcode_note}
          </p>

          <!-- CTA -->
          <p style="margin:0 0 16px;font-size:14px;color:#444;">${tpl.cta_note}</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="${konfirmasiUrl}"
                  style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:15px;font-weight:bold;
                  padding:12px 32px;border-radius:8px;text-decoration:none;">
                  ${tpl.cta_label}
                </a>
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:16px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;font-size:13px;color:#888;">${tpl.footer}</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

export async function sendRegistrationPendingEmail(
  registrationNumber: string,
  paymentInfo?: PendingPaymentInfo
): Promise<void> {
  const gmailUser = process.env.GMAIL_USER
  if (!gmailUser || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[email] GMAIL_USER or GMAIL_APP_PASSWORD not set, skipping email')
    return
  }

  const registration = await getRegistrationByNumber(registrationNumber)
  if (!registration || !registration.contact_email) return

  const eventRows = await sql`
    SELECT name FROM events WHERE id = ${registration.event_id} LIMIT 1
  `
  const event = eventRows[0] as { name: string } | undefined
  if (!event) return

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://walkimpact.lazdarulhikam.or.id'
  const konfirmasiUrl = `${baseUrl}/konfirmasi?order_id=${registrationNumber}`

  // Merge DB payment data with any fresh paymentInfo passed from the caller
  const payment: PendingPaymentInfo = {
    paymentType: paymentInfo?.paymentType ?? registration.payment_type,
    bank: paymentInfo?.bank ?? registration.bank,
    vaNumber: paymentInfo?.vaNumber ?? registration.va_number,
    billerCode: paymentInfo?.billerCode ?? registration.biller_code,
    billKey: paymentInfo?.billKey ?? registration.bill_key,
    snapToken: paymentInfo?.snapToken ?? registration.snap_token,
    paymentUrl: paymentInfo?.paymentUrl ?? registration.payment_url,
    qrUrl: paymentInfo?.qrUrl ?? registration.qr_url,
  }

  const { content: rawTpl, templateId } = await resolveEmailTemplate('EMAIL_INVOICE_PENDING', PENDING_DEFAULTS)

  const paymentMethodLabel = buildPaymentMethodLabel({
    payment_method_code: registration.payment_method_code,
    payment_type: payment.paymentType ?? null,
    bank: payment.bank ?? null,
  })

  const vars: Record<string, string> = {
    nama: registration.contact_name,
    nama_program: event.name,
    nomor_daftar: registration.registration_number,
    nominal: formatIDR(registration.total_amount),
    metode: paymentMethodLabel,
    ticket_url: konfirmasiUrl,
  }
  const tpl = Object.fromEntries(
    Object.entries(rawTpl).map(([k, v]) => [k, replacePlaceholders(v, vars)])
  ) as unknown as EmailTemplateContent

  const subject = tpl.subject

  const html = buildPendingEmailHtml({
    contactName: registration.contact_name,
    registrationNumber: registration.registration_number,
    totalAmount: registration.total_amount,
    adminFee: registration.admin_fee,
    paymentMethodLabel,
    payment,
    konfirmasiUrl,
    tpl,
    vars,
  })

  const fromName = process.env.EMAIL_FROM_NAME || 'LAZ Darul Hikam'
  await getTransporter().sendMail({
    from: `"${fromName}" <${gmailUser}>`,
    to: registration.contact_email,
    subject,
    html,
  })

  await logNotification({
    templateId,
    invoiceCode: registrationNumber,
    recipient: registration.contact_email,
    channel: 'EMAIL',
    requestPayload: { trigger: 'EMAIL_INVOICE_PENDING', to: registration.contact_email, subject },
    responsePayload: { status: 'SENT' },
    status: 'SUCCESS',
  })

  console.log(`[email] Sent pending email to ${registration.contact_email} for ${registrationNumber}`)
}
