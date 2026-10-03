# TRD — Walk Impact 2026
## Technical Requirements Document

**Stack:** Next.js 15 App Router · Neon PostgreSQL · Upstash Redis · Midtrans · Vercel  
**Architecture:** SSR-first, raw SQL, no ORM at runtime  
**Deploy:** Vercel (prod + preview)

---

## 1. Stack Decision Summary

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 App Router (SSR) | SEO-first, no SPA, fast TTFB |
| Database | Neon PostgreSQL serverless | Irvan's standard, scales cold starts |
| Query layer | Raw SQL via `@neondatabase/serverless` | No ORM overhead, full control |
| Migration/Seed | Drizzle Kit only | Schema versioning, idempotent seeds — not used as ORM |
| Cache | Upstash Redis (REST) | Quota counter, CMS cache, rate limit |
| Payment | Midtrans Snap | Indonesian payment standard |
| File storage | Vercel Blob | Images, ticket PDFs, exports |
| Styling | Tailwind CSS v4 | Brand tokens, utility-first |
| PDF | `@react-pdf/renderer` | Ticket PDF generation |
| Spreadsheet | `xlsx` (SheetJS) | Admin export |
| Rich text | TipTap | FAQ editor in CMS |
| DnD | `dnd-kit` | FAQ/rundown reorder in CMS |
| Charts | Recharts | Admin dashboard stats |
| Deployment | Vercel | Irvan's standard infra |

---

## 2. Repository Structure

```
walkimpact/
├── app/
│   ├── (public)/                        # Public-facing pages (SSR)
│   │   ├── layout.tsx                   # Root layout: Navbar + Footer
│   │   ├── page.tsx                     # Landing page /
│   │   ├── daftar/
│   │   │   └── page.tsx                 # Registration wizard /daftar
│   │   └── konfirmasi/
│   │       └── page.tsx                 # Success page /konfirmasi?order_id=
│   │
│   ├── admin/                           # Internal CMS (restricted)
│   │   ├── layout.tsx                   # Admin layout: sidebar + auth guard
│   │   ├── page.tsx                     # Dashboard /admin
│   │   ├── peserta/
│   │   │   └── page.tsx                 # Participant list, export
│   │   └── konten/
│   │       ├── faq/page.tsx
│   │       ├── rundown/page.tsx
│   │       └── event/page.tsx
│   │
│   └── api/
│       ├── events/
│       │   └── route.ts                 # GET  /api/events (active event data)
│       ├── quota/
│       │   └── route.ts                 # GET  /api/quota (Redis-cached)
│       ├── registrations/
│       │   ├── route.ts                 # POST /api/registrations (create)
│       │   └── [id]/
│       │       ├── route.ts             # GET  /api/registrations/:id
│       │       └── ticket/
│       │           └── route.ts         # GET  /api/registrations/:id/ticket (PDF)
│       ├── payments/
│       │   ├── route.ts                 # POST /api/payments (create Midtrans txn)
│       │   └── notification/
│       │       └── route.ts             # POST /api/payments/notification (webhook)
│       └── admin/
│           ├── export/
│           │   └── route.ts             # GET  /api/admin/export (xlsx)
│           └── stats/
│               └── route.ts             # GET  /api/admin/stats
│
├── lib/
│   ├── db/
│   │   ├── client.ts                    # Neon client singleton
│   │   └── queries/
│   │       ├── events.ts                # All event-related queries
│   │       ├── registrations.ts         # All registration queries
│   │       ├── payments.ts              # All payment queries
│   │       ├── quota.ts                 # Quota count queries
│   │       └── admin.ts                 # Admin-only queries (export, stats)
│   │
│   ├── cache/
│   │   ├── redis.ts                     # Upstash Redis client
│   │   └── keys.ts                      # Cache key constants
│   │
│   ├── midtrans/
│   │   ├── client.ts                    # Midtrans Snap client
│   │   ├── create-transaction.ts        # Build Midtrans payload
│   │   └── verify-signature.ts          # Webhook signature verification
│   │
│   ├── blob/
│   │   └── client.ts                    # Vercel Blob put/del helpers
│   │
│   ├── pdf/
│   │   └── ticket-pdf.tsx               # React PDF ticket template
│   │
│   └── utils/
│       ├── registration-number.ts       # WI-YYYY-NNNN generator
│       ├── format.ts                    # Currency, date, phone formatters
│       └── rate-limit.ts               # Upstash rate limiter helper
│
├── components/
│   ├── ui/                              # Primitive reusable components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Accordion.tsx
│   │   ├── StepIndicator.tsx
│   │   ├── CountdownTimer.tsx           # Client component
│   │   ├── Spinner.tsx
│   │   └── Toast.tsx
│   │
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   │
│   ├── sections/                        # Landing page sections (server components)
│   │   ├── HeroSection.tsx
│   │   ├── ImpactSection.tsx
│   │   ├── ConceptSection.tsx
│   │   ├── RundownSection.tsx
│   │   ├── AudienceSection.tsx
│   │   ├── QuotaSection.tsx             # Needs client for real-time polling
│   │   ├── AboutSection.tsx
│   │   └── FAQSection.tsx
│   │
│   ├── registration/                    # Registration wizard components
│   │   ├── RegistrationWizard.tsx       # Client component, manages step state
│   │   ├── StepDataPeserta.tsx
│   │   ├── StepRingkasan.tsx
│   │   ├── OrderSidebar.tsx             # Sticky sidebar summary
│   │   └── ShirtSizePicker.tsx
│   │
│   ├── confirmation/
│   │   ├── ConfirmationHero.tsx
│   │   ├── RegistrationCard.tsx
│   │   └── NextSteps.tsx
│   │
│   └── admin/
│       ├── DashboardStats.tsx           # Recharts-powered
│       ├── ParticipantTable.tsx
│       ├── ExportButton.tsx
│       └── cms/
│           ├── FAQEditor.tsx            # TipTap + dnd-kit
│           └── RundownEditor.tsx        # dnd-kit reorder
│
├── drizzle/
│   ├── schema.ts                        # Drizzle schema (for migrate only)
│   ├── migrations/                      # Generated migration files
│   └── seed.ts                          # Idempotent seed script
│
├── public/
│   ├── fonts/
│   ├── icons/
│   └── og-image.jpg
│
├── middleware.ts                         # Admin auth guard + rate limiting
├── next.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
└── .env.local (template below)
```

---

## 3. Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...@...neon.tech/walkimpact?sslmode=require

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Midtrans
MIDTRANS_SERVER_KEY=SB-Mid-server-...       # or production key
MIDTRANS_CLIENT_KEY=SB-Mid-client-...
MIDTRANS_IS_PRODUCTION=false                # true in prod
MIDTRANS_SIGNATURE_KEY=...                  # for webhook verification

# Vercel Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Admin
ADMIN_PASSWORD_HASH=...                     # bcrypt hash for simple admin auth
ADMIN_SECRET=...                            # JWT secret

# App
NEXT_PUBLIC_BASE_URL=https://walkimpact.id
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
NEXT_PUBLIC_WA_CONTACT=6281572225545
```

---

## 4. Database Layer

### 4.1 Neon Client

```ts
// lib/db/client.ts
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)
export default sql
```

### 4.2 Query File Pattern

All raw SQL lives in `lib/db/queries/*.ts`. Route handlers import query functions — never write inline SQL in route.ts or components.

```ts
// lib/db/queries/events.ts
import sql from '@/lib/db/client'

export async function getActiveEvent() {
  const rows = await sql`
    SELECT
      e.*,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id',          es.id,
            'icon_name',   es.icon_name,
            'value',       es.value,
            'label',       es.label,
            'description', es.description
          ) ORDER BY es.sort_order
        ) FILTER (WHERE es.id IS NOT NULL),
        '[]'
      ) AS stats,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id',       ec.id,
            'icon_name',ec.icon_name,
            'title',    ec.title,
            'body',     ec.body
          ) ORDER BY ec.sort_order
        ) FILTER (WHERE ec.id IS NOT NULL),
        '[]'
      ) AS concepts,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id',         er.id,
            'icon_name',  er.icon_name,
            'start_time', er.start_time,
            'end_time',   er.end_time,
            'activity',   er.activity
          ) ORDER BY er.sort_order
        ) FILTER (WHERE er.id IS NOT NULL),
        '[]'
      ) AS rundowns,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id',       ef.id,
            'question', ef.question,
            'answer',   ef.answer,
            'category', ef.category
          ) ORDER BY ef.sort_order
        ) FILTER (WHERE ef.id IS NOT NULL AND ef.is_active = TRUE),
        '[]'
      ) AS faqs
    FROM events e
    LEFT JOIN event_stats es    ON es.event_id = e.id
    LEFT JOIN event_concepts ec ON ec.event_id = e.id
    LEFT JOIN event_rundowns er ON er.event_id = e.id
    LEFT JOIN event_faqs ef     ON ef.event_id = e.id
    WHERE e.is_active = TRUE
    GROUP BY e.id
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function getActiveTicketTier(eventId: number) {
  const rows = await sql`
    SELECT * FROM ticket_tiers
    WHERE event_id       = ${eventId}
      AND is_active      = TRUE
      AND available_from <= NOW()
      AND available_until >= NOW()
    ORDER BY sort_order
    LIMIT 1
  `
  return rows[0] ?? null
}
```

```ts
// lib/db/queries/registrations.ts
import sql from '@/lib/db/client'

export async function createRegistration(data: {
  registrationNumber: string
  eventId: number
  ticketTierId: number
  categoryId: number
  contactName: string
  contactWhatsapp: string
  communityName: string | null
  ticketQty: number
  unitPrice: number
  totalAmount: number
  ipAddress: string
  userAgent: string
}) {
  const rows = await sql`
    INSERT INTO registrations (
      registration_number, event_id, ticket_tier_id, category_id,
      contact_name, contact_whatsapp, community_name,
      ticket_qty, unit_price, total_amount,
      ip_address, user_agent
    ) VALUES (
      ${data.registrationNumber}, ${data.eventId}, ${data.ticketTierId}, ${data.categoryId},
      ${data.contactName}, ${data.contactWhatsapp}, ${data.communityName},
      ${data.ticketQty}, ${data.unitPrice}, ${data.totalAmount},
      ${data.ipAddress}, ${data.userAgent}
    )
    RETURNING *
  `
  return rows[0]
}

export async function createRegistrationParticipants(
  registrationId: number,
  shirtSizeIds: number[]
) {
  const values = shirtSizeIds.map((sizeId, i) =>
    sql`(${registrationId}, ${sizeId}, ${i + 1})`
  )
  await sql`
    INSERT INTO registration_participants (registration_id, shirt_size_id, slot_number)
    VALUES ${sql.join(values, sql`, `)}
  `
}

export async function getRegistrationByNumber(number: string) {
  const rows = await sql`
    SELECT
      r.*,
      pc.label  AS category_label,
      p.status  AS payment_status,
      p.payment_type,
      p.bank,
      p.va_number,
      p.gross_amount,
      p.settlement_time,
      p.expiry_time,
      p.snap_token,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'slot',      rp.slot_number,
            'size_code', ss.code,
            'size_label',ss.label
          ) ORDER BY rp.slot_number
        ) FILTER (WHERE rp.id IS NOT NULL),
        '[]'
      ) AS participants
    FROM registrations r
    JOIN participant_categories pc ON pc.id = r.category_id
    LEFT JOIN payments p           ON p.registration_id = r.id
    LEFT JOIN registration_participants rp ON rp.registration_id = r.id
    LEFT JOIN shirt_sizes ss       ON ss.id = rp.shirt_size_id
    WHERE r.registration_number = ${number}
    GROUP BY r.id, pc.label, p.id
  `
  return rows[0] ?? null
}

export async function markRegistrationPaid(
  registrationId: number,
  paidAt: Date
) {
  await sql`
    UPDATE registrations
    SET status = 'paid', paid_at = ${paidAt}, updated_at = NOW()
    WHERE id = ${registrationId}
  `
}

export async function markRegistrationExpired(registrationId: number) {
  await sql`
    UPDATE registrations
    SET status = 'expired', expired_at = NOW(), updated_at = NOW()
    WHERE id = ${registrationId} AND status = 'pending'
  `
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
  const next = Number(rows[0].cnt) + 1
  return `WI-${year}-${String(next).padStart(4, '0')}`
}
```

```ts
// lib/db/queries/quota.ts
import sql from '@/lib/db/client'

export async function getQuotaFromDB(eventId: number) {
  const rows = await sql`
    SELECT
      e.max_quota,
      COUNT(r.id) FILTER (WHERE r.status = 'paid') AS paid_count
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    WHERE e.id = ${eventId}
    GROUP BY e.id, e.max_quota
  `
  const row = rows[0]
  if (!row) return null
  return {
    maxQuota:  Number(row.max_quota),
    paidCount: Number(row.paid_count),
    remaining: Number(row.max_quota) - Number(row.paid_count),
  }
}
```

```ts
// lib/db/queries/payments.ts
import sql from '@/lib/db/client'

export async function createPayment(data: {
  registrationId: number
  orderId: string
  snapToken: string
  grossAmount: number
  expiryTime: Date
}) {
  const rows = await sql`
    INSERT INTO payments (
      registration_id, order_id, snap_token,
      gross_amount, status, transaction_time, expiry_time
    ) VALUES (
      ${data.registrationId}, ${data.orderId}, ${data.snapToken},
      ${data.grossAmount}, 'pending', NOW(), ${data.expiryTime}
    )
    RETURNING *
  `
  return rows[0]
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
  const rows = await sql`
    UPDATE payments SET
      transaction_id       = ${data.transactionId},
      payment_type         = ${data.paymentType},
      bank                 = ${data.bank},
      va_number            = ${data.vaNumber},
      status               = ${data.status},
      fraud_status         = ${data.fraudStatus},
      settlement_time      = ${data.settlementTime},
      midtrans_response    = ${JSON.stringify(data.midtransResponse)},
      updated_at           = NOW()
    WHERE order_id = ${data.orderId}
    RETURNING registration_id, id
  `
  return rows[0] ?? null
}

export async function logPaymentNotification(data: {
  paymentId: number | null
  orderId: string
  transactionStatus: string
  fraudStatus: string | null
  signatureValid: boolean
  payload: Record<string, unknown>
}) {
  await sql`
    INSERT INTO payment_notifications (
      payment_id, order_id, transaction_status, fraud_status,
      signature_valid, payload
    ) VALUES (
      ${data.paymentId}, ${data.orderId}, ${data.transactionStatus},
      ${data.fraudStatus}, ${data.signatureValid}, ${JSON.stringify(data.payload)}
    )
  `
}

export async function markNotificationProcessed(
  notificationId: number,
  error: string | null = null
) {
  await sql`
    UPDATE payment_notifications
    SET is_processed = TRUE, processed_at = NOW(), process_error = ${error}
    WHERE id = ${notificationId}
  `
}
```

```ts
// lib/db/queries/admin.ts
import sql from '@/lib/db/client'

export async function getAdminStats(eventId: number) {
  const rows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'paid')      AS total_paid,
      COUNT(*) FILTER (WHERE status = 'pending')   AS total_pending,
      COUNT(*) FILTER (WHERE status = 'expired')   AS total_expired,
      COUNT(*) FILTER (WHERE status = 'cancelled') AS total_cancelled,
      COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0) AS total_revenue
    FROM registrations
    WHERE event_id = ${eventId}
  `
  return rows[0]
}

export async function getParticipantsForExport(eventId: number) {
  const rows = await sql`
    SELECT
      r.registration_number,
      r.contact_name,
      r.contact_whatsapp,
      pc.label                                                   AS category,
      COALESCE(r.community_name, '-')                            AS community_name,
      r.ticket_qty,
      r.unit_price,
      r.total_amount,
      r.status,
      COALESCE(p.payment_type, '-')                              AS payment_type,
      COALESCE(p.bank, '-')                                      AS bank,
      COALESCE(p.va_number, '-')                                 AS va_number,
      p.settlement_time,
      STRING_AGG(ss.code, ', ' ORDER BY rp.slot_number)         AS shirt_sizes,
      r.created_at
    FROM registrations r
    JOIN participant_categories pc     ON pc.id = r.category_id
    LEFT JOIN payments p               ON p.registration_id = r.id
    LEFT JOIN registration_participants rp ON rp.registration_id = r.id
    LEFT JOIN shirt_sizes ss           ON ss.id = rp.shirt_size_id
    WHERE r.event_id = ${eventId}
    GROUP BY r.id, pc.label, p.id
    ORDER BY r.created_at DESC
  `
  return rows
}
```

---

## 5. API Route Contracts

### Rule: No raw SQL in route.ts. Import from `lib/db/queries/`.

```ts
// app/api/quota/route.ts
import { NextResponse } from 'next/server'
import { getRedis } from '@/lib/cache/redis'
import { CACHE_KEYS, QUOTA_TTL } from '@/lib/cache/keys'
import { getQuotaFromDB } from '@/lib/db/queries/quota'
import { getActiveEvent } from '@/lib/db/queries/events'

export const runtime = 'edge'

export async function GET() {
  const redis = getRedis()
  const cached = await redis.get(CACHE_KEYS.QUOTA)
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'Cache-Control': 'public, s-maxage=30' }
    })
  }
  const event = await getActiveEvent()
  if (!event) return NextResponse.json({ error: 'No active event' }, { status: 404 })
  const quota = await getQuotaFromDB(event.id)
  await redis.set(CACHE_KEYS.QUOTA, quota, { ex: QUOTA_TTL })
  return NextResponse.json(quota, {
    headers: { 'Cache-Control': 'public, s-maxage=30' }
  })
}
```

```ts
// app/api/registrations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActiveEvent, getActiveTicketTier } from '@/lib/db/queries/events'
import {
  createRegistration,
  createRegistrationParticipants,
  generateNextRegistrationNumber,
} from '@/lib/db/queries/registrations'
import { createPayment }    from '@/lib/db/queries/payments'
import { getQuotaFromDB }   from '@/lib/db/queries/quota'
import { createSnapTransaction } from '@/lib/midtrans/create-transaction'
import { invalidateQuotaCache }  from '@/lib/cache/redis'
import { rateLimit }             from '@/lib/utils/rate-limit'

const BodySchema = z.object({
  contactName:     z.string().min(3).max(255),
  contactWhatsapp: z.string().regex(/^(08|628)\d{8,13}$/),
  categoryId:      z.number().int().positive(),
  ticketQty:       z.number().int().min(1).max(5),
  shirtSizeIds:    z.array(z.number().int().positive()),
  communityName:   z.string().max(255).optional().nullable(),
})

export async function POST(req: NextRequest) {
  // Rate limit: 5 requests per IP per 10 minutes
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const limited = await rateLimit(ip, 5, 600)
  if (limited) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const body = await req.json()
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // Validate shirt size count matches qty
  if (data.shirtSizeIds.length !== data.ticketQty) {
    return NextResponse.json(
      { error: 'shirtSizeIds length must match ticketQty' },
      { status: 400 }
    )
  }

  const event = await getActiveEvent()
  if (!event) return NextResponse.json({ error: 'No active event' }, { status: 404 })

  // Check registration window
  const now = new Date()
  if (now < new Date(event.registration_opens_at) || now > new Date(event.registration_closes_at)) {
    return NextResponse.json({ error: 'Registration is closed' }, { status: 403 })
  }

  // Atomic quota check
  const quota = await getQuotaFromDB(event.id)
  if (!quota || quota.remaining < data.ticketQty) {
    return NextResponse.json({ error: 'Insufficient quota' }, { status: 409 })
  }

  const tier = await getActiveTicketTier(event.id)
  if (!tier) return NextResponse.json({ error: 'No active ticket tier' }, { status: 404 })

  const regNumber = await generateNextRegistrationNumber(event.id, new Date().getFullYear())
  const totalAmount = tier.price * data.ticketQty

  const registration = await createRegistration({
    registrationNumber: regNumber,
    eventId:       event.id,
    ticketTierId:  tier.id,
    categoryId:    data.categoryId,
    contactName:   data.contactName,
    contactWhatsapp: data.contactWhatsapp,
    communityName: data.communityName ?? null,
    ticketQty:     data.ticketQty,
    unitPrice:     tier.price,
    totalAmount,
    ipAddress:     ip,
    userAgent:     req.headers.get('user-agent') ?? '',
  })

  await createRegistrationParticipants(registration.id, data.shirtSizeIds)

  // Create Midtrans Snap transaction
  const snap = await createSnapTransaction({
    orderId:     regNumber,
    grossAmount: totalAmount,
    customerName:   data.contactName,
    customerPhone:  data.contactWhatsapp,
    itemDetails: [{
      id:       String(tier.id),
      name:     `${event.name} - ${tier.name}`,
      price:    tier.price,
      quantity: data.ticketQty,
    }],
  })

  const expiryTime = new Date(snap.expiry_time ?? Date.now() + 86400000)

  await createPayment({
    registrationId: registration.id,
    orderId:   regNumber,
    snapToken: snap.token,
    grossAmount: totalAmount,
    expiryTime,
  })

  // Invalidate quota cache
  await invalidateQuotaCache()

  return NextResponse.json({
    registrationNumber: regNumber,
    snapToken:  snap.token,
    redirectUrl: snap.redirect_url,
    totalAmount,
    expiryTime,
  }, { status: 201 })
}
```

```ts
// app/api/payments/notification/route.ts  — Midtrans webhook
import { NextRequest, NextResponse } from 'next/server'
import { verifyMidtransSignature } from '@/lib/midtrans/verify-signature'
import { updatePaymentFromWebhook, logPaymentNotification } from '@/lib/db/queries/payments'
import { markRegistrationPaid } from '@/lib/db/queries/registrations'
import { invalidateQuotaCache } from '@/lib/cache/redis'

export async function POST(req: NextRequest) {
  const payload = await req.json()
  const { order_id, transaction_status, fraud_status, gross_amount, signature_key } = payload

  const isValid = verifyMidtransSignature({ order_id, status_code: payload.status_code, gross_amount, signature_key })

  // Log all incoming notifications (audit trail)
  await logPaymentNotification({
    paymentId: null,
    orderId: order_id,
    transactionStatus: transaction_status,
    fraudStatus: fraud_status ?? null,
    signatureValid: isValid,
    payload,
  })

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const result = await updatePaymentFromWebhook({
    orderId: order_id,
    transactionId: payload.transaction_id,
    paymentType:   payload.payment_type,
    bank:          payload.bank ?? null,
    vaNumber:      payload.va_numbers?.[0]?.va_number ?? null,
    status:        transaction_status,
    fraudStatus:   fraud_status ?? null,
    settlementTime: payload.settlement_time ? new Date(payload.settlement_time) : null,
    midtransResponse: payload,
  })

  if (!result) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

  // If settled + accepted → mark registration paid + bust quota cache
  const isSettled = transaction_status === 'settlement' || transaction_status === 'capture'
  const isAccepted = !fraud_status || fraud_status === 'accept'

  if (isSettled && isAccepted) {
    await markRegistrationPaid(result.registration_id, new Date())
    await invalidateQuotaCache()
    // TODO: trigger WhatsApp notification here
  }

  return NextResponse.json({ ok: true })
}
```

---

## 6. Cache Strategy

```ts
// lib/cache/keys.ts
export const CACHE_KEYS = {
  QUOTA:       'walkimpact:quota',
  EVENT_DATA:  'walkimpact:event:active',
  FAQS:        'walkimpact:faqs',
} as const

export const QUOTA_TTL     = 60      // seconds — quota polling interval
export const EVENT_DATA_TTL = 300    // 5 minutes — CMS content
export const FAQS_TTL       = 600    // 10 minutes
```

```ts
// lib/cache/redis.ts
import { Redis } from '@upstash/redis'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return redis
}

export async function invalidateQuotaCache() {
  const r = getRedis()
  await r.del(CACHE_KEYS.QUOTA)
}

export async function invalidateEventCache() {
  const r = getRedis()
  await r.del(CACHE_KEYS.EVENT_DATA)
  await r.del(CACHE_KEYS.FAQS)
}
```

---

## 7. Page Rendering Strategy

| Page | Strategy | Revalidation |
|---|---|---|
| `/` Landing | `fetch` with ISR revalidation | `revalidate: 300` (5 min) |
| `/daftar` | Server render shell, wizard is Client Component | On demand |
| `/konfirmasi` | Dynamic SSR (reads order_id from searchParams) | No cache |
| `/admin/*` | Dynamic SSR (authenticated) | No cache |
| `/api/quota` | Edge function + Redis cache | Redis TTL 60s |
| `/api/events` | Edge function + Redis cache | Redis TTL 300s |

```ts
// app/(public)/page.tsx
import { getActiveEvent } from '@/lib/db/queries/events'
import { getRedis }       from '@/lib/cache/redis'
import { CACHE_KEYS, EVENT_DATA_TTL } from '@/lib/cache/keys'

// ISR: revalidate every 5 minutes
export const revalidate = 300

export default async function LandingPage() {
  const redis = getRedis()
  let event = await redis.get(CACHE_KEYS.EVENT_DATA)

  if (!event) {
    event = await getActiveEvent()
    if (event) await redis.set(CACHE_KEYS.EVENT_DATA, event, { ex: EVENT_DATA_TTL })
  }

  if (!event) return <div>Event tidak ditemukan.</div>

  return (
    <>
      <HeroSection event={event} />
      <ImpactSection stats={event.stats} />
      <ConceptSection concepts={event.concepts} />
      <RundownSection rundowns={event.rundowns} />
      <AudienceSection />
      <QuotaSection eventId={event.id} />   {/* client component, polls /api/quota */}
      <AboutSection />
      <FAQSection faqs={event.faqs} />
    </>
  )
}
```

---

## 8. Midtrans Integration

```ts
// lib/midtrans/client.ts
import midtransClient from 'midtrans-client'

export const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey:    process.env.MIDTRANS_SERVER_KEY!,
  clientKey:    process.env.MIDTRANS_CLIENT_KEY!,
})
```

```ts
// lib/midtrans/verify-signature.ts
import crypto from 'crypto'

export function verifyMidtransSignature(params: {
  order_id:    string
  status_code: string
  gross_amount:string
  signature_key: string
}): boolean {
  const hash = crypto
    .createHash('sha512')
    .update(`${params.order_id}${params.status_code}${params.gross_amount}${process.env.MIDTRANS_SIGNATURE_KEY}`)
    .digest('hex')
  return hash === params.signature_key
}
```

---

## 9. Drizzle — Migrate & Seed Only

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect:    'postgresql',
  schema:     './drizzle/schema.ts',
  out:        './drizzle/migrations',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

```ts
// drizzle/seed.ts — idempotent seed
import { drizzle } from 'drizzle-orm/neon-http'
import { neon }    from '@neondatabase/serverless'

// Seed runs only if data doesn't exist — INSERT ... ON CONFLICT DO NOTHING
const sql = neon(process.env.DATABASE_URL!)

async function seed() {
  await sql`
    INSERT INTO shirt_sizes (code, label, sort_order) VALUES
      ('S', 'Small', 1), ('M', 'Medium', 2), ('L', 'Large', 3),
      ('XL', 'X-Large', 4), ('XXL', 'XX-Large', 5)
    ON CONFLICT (code) DO NOTHING
  `
  // ... rest of seed data from erd.md
  console.log('✓ Seed complete')
}

seed().catch(console.error)
```

**npm scripts:**
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate":  "drizzle-kit migrate",
    "db:seed":     "tsx drizzle/seed.ts",
    "db:studio":   "drizzle-kit studio"
  }
}
```

---

## 10. Middleware — Admin Auth + Rate Limiting

```ts
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect /admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const token = req.cookies.get('admin_token')?.value
    if (!token) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      return NextResponse.redirect(loginUrl)
    }
    // JWT verify happens in the route handler
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
```

---

## 11. Ticket PDF

```tsx
// lib/pdf/ticket-pdf.tsx
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page:    { backgroundColor: '#ffffff', padding: 40, fontFamily: 'Helvetica' },
  header:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  title:   { fontSize: 28, fontWeight: 'bold', color: '#3A7D0A' },
  number:  { fontSize: 20, fontWeight: 'bold', color: '#1A2714', marginBottom: 8 },
  label:   { fontSize: 10, color: '#5A6B4E', marginBottom: 2 },
  value:   { fontSize: 13, color: '#1A2714', marginBottom: 12 },
  divider: { borderBottom: 1, borderColor: '#E8EDE3', marginVertical: 16 },
  footer:  { fontSize: 9, color: '#5A6B4E', textAlign: 'center', marginTop: 24 },
})

export function TicketPDF({ registration }: { registration: RegistrationDetail }) {
  return (
    <Document>
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Walk Impact 2026</Text>
          <Text style={{ fontSize: 10, color: '#5A6B4E' }}>LAZ Darul Hikam</Text>
        </View>
        <Text style={styles.number}>{registration.registration_number}</Text>
        <View style={styles.divider} />
        <Text style={styles.label}>Nama Peserta</Text>
        <Text style={styles.value}>{registration.contact_name}</Text>
        <Text style={styles.label}>Tanggal</Text>
        <Text style={styles.value}>Sabtu, 7 November 2026 · 05.30 WIB</Text>
        <Text style={styles.label}>Lokasi</Text>
        <Text style={styles.value}>Pasar Modern Batununggal Indah, Bandung</Text>
        <Text style={styles.label}>Jumlah Tiket</Text>
        <Text style={styles.value}>{registration.ticket_qty} tiket</Text>
        <View style={styles.divider} />
        <Text style={styles.footer}>
          Tunjukkan tiket ini saat registrasi di hari-H · walkimpact.id
        </Text>
      </Page>
    </Document>
  )
}
```

---

## 12. Admin Excel Export

```ts
// lib/utils/export.ts
import * as XLSX from 'xlsx'

export function buildParticipantWorkbook(rows: ParticipantRow[]): Buffer {
  const headers = [
    'No. Pendaftaran', 'Nama', 'WhatsApp', 'Kategori',
    'Komunitas', 'Jumlah Tiket', 'Ukuran Kaos',
    'Total (Rp)', 'Metode Bayar', 'Status', 'Tgl Daftar', 'Tgl Bayar',
  ]

  const data = rows.map((r, i) => [
    r.registration_number,
    r.contact_name,
    r.contact_whatsapp,
    r.category,
    r.community_name,
    r.ticket_qty,
    r.shirt_sizes,
    r.total_amount,
    r.payment_type,
    r.status,
    new Date(r.created_at).toLocaleString('id-ID'),
    r.settlement_time ? new Date(r.settlement_time).toLocaleString('id-ID') : '-',
  ])

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
  ws['!cols'] = headers.map(() => ({ wch: 20 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Peserta')
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}
```

---

## 13. Key npm Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@neondatabase/serverless": "^0.10.0",
    "@upstash/redis": "^1.34.0",
    "midtrans-client": "^1.4.2",
    "@vercel/blob": "^0.27.0",
    "@react-pdf/renderer": "^4.0.0",
    "xlsx": "^0.18.5",
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^8.0.0",
    "@tiptap/react": "^2.10.0",
    "@tiptap/starter-kit": "^2.10.0",
    "recharts": "^2.15.0",
    "zod": "^3.23.0",
    "jose": "^5.9.0",
    "bcryptjs": "^2.4.3",
    "tailwindcss": "^4.0.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.29.0",
    "drizzle-orm": "^0.38.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

---

## 14. Vercel Configuration

```json
// vercel.json
{
  "regions": ["sin1"],
  "functions": {
    "app/api/payments/notification/route.ts": {
      "maxDuration": 30
    },
    "app/api/registrations/route.ts": {
      "maxDuration": 15
    }
  },
  "headers": [
    {
      "source": "/admin/:path*",
      "headers": [
        { "key": "X-Robots-Tag", "value": "noindex, nofollow" }
      ]
    }
  ]
}
```

---

## 15. Brand & Styling Reference (Tailwind Tokens)

Append to `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.tsx', './components/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        brand: {
          green:      '#6DC230',   // Impact Green — CTA, accent
          'green-dark': '#3A7D0A', // Deep Green — header, footer bg
          'green-leaf': '#8ED63F', // Leaf Green — hover, gradient
          'off-white':  '#F5F7F2', // Alternating section bg
          'light-gray': '#E8EDE3', // Divider, border
          'text-dark':  '#1A2714', // Body text on light
          'text-muted': '#5A6B4E', // Subtext, caption
          'dot':        '#C8E6A0', // Dot pattern decoration
          amber:        '#F5A623', // Urgency badge, "1 tiket = 1 sembako"
        },
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'Poppins', 'sans-serif'],
        body:    ['Inter', 'DM Sans', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(40px,6vw,72px)', { lineHeight: '1.1', fontWeight: '800' }],
        'h1':      ['clamp(28px,4vw,48px)',  { lineHeight: '1.2', fontWeight: '700' }],
        'h2':      ['clamp(22px,3vw,32px)',  { lineHeight: '1.3', fontWeight: '700' }],
        'h3':      ['clamp(18px,2vw,24px)',  { lineHeight: '1.4', fontWeight: '600' }],
      },
      borderRadius: {
        'sm': '6px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      boxShadow: {
        'card':       '0 2px 12px rgba(61,125,10,0.08)',
        'card-hover': '0 6px 24px rgba(61,125,10,0.14)',
        'cta':        '0 4px 16px rgba(109,194,48,0.4)',
      },
      backgroundImage: {
        'hero-gradient':    'linear-gradient(135deg, #6DC230 0%, #3A7D0A 100%)',
        'hero-overlay':     'linear-gradient(180deg, rgba(61,125,10,0.75) 0%, rgba(109,194,48,0.4) 100%)',
        'dot-pattern':      'radial-gradient(circle, #C8E6A0 1.5px, transparent 1.5px)',
      },
      backgroundSize: {
        'dot-sm': '18px 18px',
      },
      animation: {
        'fade-up':     'fadeUp 0.5s ease-out',
        'count-pulse': 'pulse 1s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
} satisfies Config
```

### Section Layout Pattern
```
Hero          → bg-hero-gradient text-white
Impact        → bg-white text-brand-text-dark
Concept       → bg-brand-off-white
Rundown       → bg-brand-green-dark text-white
Audience      → bg-white
Quota CTA     → bg-brand-green text-white
About         → bg-brand-off-white
FAQ           → bg-white
Footer        → bg-brand-green-dark text-white
```

### Button Classes
```tsx
// Primary CTA
<button className="bg-brand-green hover:bg-brand-green-leaf active:scale-[0.98] text-white font-bold text-base px-8 py-3.5 rounded-md shadow-cta transition-all duration-200">
  Daftar Sekarang →
</button>

// On dark/green background
<button className="bg-white text-brand-green-dark hover:bg-brand-off-white font-bold text-base px-8 py-3.5 rounded-md transition-colors duration-200">
  Daftar Sekarang →
</button>

// Ghost
<button className="border-2 border-brand-green text-brand-green hover:bg-brand-green/10 font-semibold text-base px-7 py-3 rounded-md transition-colors duration-200">
  Pelajari Lebih Lanjut
</button>
```

### Card Component
```tsx
<div className="bg-white rounded-lg p-6 shadow-card border border-brand-light-gray hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
  {children}
</div>
```

### Section Title with Accent Bar
```tsx
<h2 className="text-h2 font-bold text-brand-text-dark border-l-[5px] border-brand-green pl-4">
  {title}
</h2>
```

### Dot Pattern Overlay
```tsx
<div className="absolute inset-0 bg-dot-pattern bg-dot-sm opacity-60 pointer-events-none" />
```
