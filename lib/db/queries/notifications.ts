import sql from '@/lib/db/client'

export interface NotificationTemplate {
  id: number
  event_trigger: string
  channel: string
  message_content: string
  is_active: boolean
}

export async function getNotificationTemplate(
  eventTrigger: string,
  channel = 'WHATSAPP'
): Promise<NotificationTemplate | null> {
  const rows = await sql`
    SELECT id, event_trigger, channel, message_content, is_active
    FROM notification_templates
    WHERE event_trigger = ${eventTrigger}
      AND channel = ${channel}
      AND is_active = TRUE
    LIMIT 1
  `
  return (rows[0] as unknown as NotificationTemplate) ?? null
}

export async function logNotification(data: {
  templateId?: number | null
  invoiceCode?: string | null
  recipient: string
  channel: string
  requestPayload?: Record<string, unknown> | string | null
  responsePayload?: Record<string, unknown> | string | null
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
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
    INSERT INTO notification_logs (
      template_id, invoice_code, recipient, channel,
      request_payload, response_payload, status
    ) VALUES (
      ${data.templateId || null}, ${data.invoiceCode || null}, ${data.recipient}, ${data.channel},
      ${reqStr}, ${resStr}, ${data.status}
    )
  `
}

export async function triggerNotification(params: {
  eventTrigger: 'INVOICE_SUCCESS' | 'INVOICE_PENDING'
  invoiceCode: string
  recipient: string
  variables: {
    nama: string
    nominal: string | number
    metode: string
    nomor_daftar: string
    tiket_qty: number
    va_number?: string
  }
}) {
  const template = await getNotificationTemplate(params.eventTrigger, 'WHATSAPP')
  if (!template) return

  let message = template.message_content
  message = message.replace(/{nama}/g, params.variables.nama)
  message = message.replace(/{nominal}/g, String(params.variables.nominal))
  message = message.replace(/{metode}/g, params.variables.metode)
  message = message.replace(/{nomor_daftar}/g, params.variables.nomor_daftar)
  message = message.replace(/{tiket_qty}/g, String(params.variables.tiket_qty))
  message = message.replace(/{va_number}/g, params.variables.va_number || '-')

  // Log notification entry
  await logNotification({
    templateId: template.id,
    invoiceCode: params.invoiceCode,
    recipient: params.recipient,
    channel: 'WHATSAPP',
    requestPayload: {
      target: params.recipient,
      message,
      countryCode: '62',
    },
    responsePayload: { status: true, message: 'Queued or logged' },
    status: 'SUCCESS',
  })
}
