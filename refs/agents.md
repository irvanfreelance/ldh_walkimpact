# agents.md — Walk Impact 2026
## AI Agent Task Definitions & Development Workflow

> This file defines how AI agents (Claude) should approach tasks in this project.
> Each agent definition scopes a specific domain, lists its responsibilities,
> the files it owns, and the rules it must follow.

---

## 0. Before Any Task

Every agent session starts with:

```
1. Read claude.md          → understand project rules
2. Read prd.md             → understand what is being built
3. Read erd.md             → understand the data model
4. Read trd.md             → understand the architecture
5. Identify which agent scope covers the current task
6. Execute within that scope's rules
```

Never write code before reading the relevant docs. Never skip the schema — always check if a table/column already exists before suggesting a new one.

---

## 1. Agent: Schema & Migration

**Trigger phrases:** "add column", "new table", "change schema", "migrate", "seed", "index"

**Owns:**
- `drizzle/schema.ts`
- `drizzle/migrations/`
- `drizzle/seed.ts`
- `erd.md` (reference, not generated)

**Responsibilities:**
- Write or modify Drizzle schema for migration purposes only
- Generate idempotent seed scripts
- Add or optimize indexes
- Never introduce ORM usage beyond migrate/seed

**Rules:**
- All PKs → `serial('id')` in Drizzle schema (maps to BIGSERIAL)
- All status/type → `varchar` (never `pgEnum`)
- All monetary → `bigint` (full IDR, no decimals)
- All timestamps → `timestamp('...', { withTimezone: true }).defaultNow()`
- Seeds must use `ON CONFLICT DO NOTHING` — idempotent
- After any schema change, update `erd.md` to reflect it
- Never use `drizzle.query.*` or `db.select()` — schema only

**Output checklist:**
- [ ] New/modified Drizzle schema in `drizzle/schema.ts`
- [ ] Migration file (generated via `db:generate`)
- [ ] Seed data updated in `drizzle/seed.ts`
- [ ] Matching raw query updated in `lib/db/queries/*.ts`
- [ ] New indexes added if the column will be queried heavily
- [ ] `erd.md` updated with new table/column

---

## 2. Agent: Query Layer

**Trigger phrases:** "write a query", "fetch from DB", "SQL for", "query to get", "update registration", "count quota"

**Owns:**
- `lib/db/queries/events.ts`
- `lib/db/queries/registrations.ts`
- `lib/db/queries/payments.ts`
- `lib/db/queries/quota.ts`
- `lib/db/queries/admin.ts`

**Responsibilities:**
- Write all SQL query functions
- Maintain type safety of query return values
- Keep queries performant (use indexes, avoid N+1)

**Rules:**
- All SQL in named functions, exported from the correct file
- No `SELECT *` — always name columns
- Always use tagged template literals via the Neon `sql` client
- Return typed objects, not raw database rows
- Handle `null` results explicitly — return `null`, never throw for "not found"
- Use aggregated JSON for related data (avoid N+1 round-trips)
- Quota count query MUST use: `WHERE status = 'paid'` — pending/expired do not count

**Query function naming:**
```
get{Entity}By{Field}    → getRegistrationByNumber
get{Entity}List         → getParticipantsForExport
create{Entity}          → createRegistration
update{Entity}{Action}  → updatePaymentFromWebhook
mark{Entity}{State}     → markRegistrationPaid
generate{Thing}         → generateNextRegistrationNumber
```

**Output checklist:**
- [ ] Function is in the correct query file (match domain)
- [ ] Function is exported as a named export
- [ ] Return type is explicitly typed
- [ ] `null` case is handled
- [ ] No ORM syntax (`drizzle.query`, `db.select`) present

---

## 3. Agent: API Routes

**Trigger phrases:** "create API route", "POST endpoint", "webhook handler", "GET /api/", "route handler"

**Owns:**
- `app/api/**/*.ts`

**Responsibilities:**
- Write Next.js App Router route handlers
- Validate input with Zod
- Orchestrate calls to query functions and external services
- Handle errors and return proper status codes

**Rules:**
- No SQL inside route.ts — import from `lib/db/queries/`
- No business logic inside route.ts beyond orchestration
- All POST endpoints: validate with Zod first, then check auth/rate-limit, then DB
- Midtrans webhook: log first (always), verify signature second, process third
- Quota check in registration POST must be inside the same async context as insert
- Use `NextResponse.json()` for all responses
- Set `export const runtime = 'edge'` for stateless, fast routes (quota, events)
- Set `export const runtime = 'nodejs'` for PDF, Excel generation routes
- Rate-limit POST endpoints: `5 requests / IP / 600 seconds`

**Standard route structure:**
```ts
export async function POST(req: NextRequest) {
  // 1. Rate limit
  // 2. Parse + Zod validate body
  // 3. Auth/permission check (if needed)
  // 4. Business rule checks (window open? quota available?)
  // 5. DB writes (query functions only)
  // 6. External service calls (Midtrans, Blob)
  // 7. Cache invalidation
  // 8. Return response
}
```

**Error status codes:**
```
400 Bad Request      → validation failed (Zod)
401 Unauthorized     → invalid signature (webhook), no admin token
403 Forbidden        → registration window closed, insufficient permission
404 Not Found        → event/registration not found
409 Conflict         → quota exceeded, duplicate order
429 Too Many Requests → rate limit hit
500 Internal Server Error → unhandled exception (log it)
```

**Output checklist:**
- [ ] Zod schema covers all expected fields
- [ ] No inline SQL
- [ ] Correct runtime set (`edge` / `nodejs`)
- [ ] All error paths return typed error JSON
- [ ] Rate limiting applied on mutation routes
- [ ] Webhook logs notification before processing

---

## 4. Agent: Server Components (Landing Page)

**Trigger phrases:** "landing page section", "hero section", "impact section", "FAQ section", "rundown section", "audience section"

**Owns:**
- `app/(public)/page.tsx`
- `components/sections/*.tsx`

**Responsibilities:**
- Build SSR server components for all landing page sections
- Consume data from query functions (passed as props from page.tsx)
- Implement accurate brand styling using Tailwind tokens

**Rules:**
- All sections are React Server Components by default
- Do not add `'use client'` unless the section needs interactivity
- No `fetch()` calls inside section components — receive props from `page.tsx`
- `page.tsx` handles all data fetching (with Redis cache check)
- All text content comes from CMS data (event object) — no hardcoding
- Responsive: all sections must work at 375px (mobile), 768px (tablet), 1280px (desktop)
- Use Tailwind brand tokens (`bg-brand-green`, `text-brand-green-dark`, etc.)
- Follow the section background rhythm defined in TRD section 15

**Section background rhythm:**
```
Hero          → bg-hero-gradient text-white
Impact        → bg-white
Concept       → bg-brand-off-white
Rundown       → bg-brand-green-dark text-white
Audience      → bg-white
Quota CTA     → bg-brand-green text-white         ← most visually prominent
About         → bg-brand-off-white
FAQ           → bg-white
Footer        → bg-brand-green-dark text-white
```

**Section component signature:**
```tsx
// Always typed props — never `any`
interface HeroSectionProps {
  event: Pick<EventRow, 'name' | 'tagline' | 'event_date' | 'venue_name' | 'registration_closes_at'>
}
export function HeroSection({ event }: HeroSectionProps) { ... }
```

**Output checklist:**
- [ ] Component is a Server Component (no `'use client'` unless needed)
- [ ] All props are typed
- [ ] Mobile layout correct at 375px
- [ ] Uses brand Tailwind tokens only (no hardcoded hex)
- [ ] Dot pattern applied where appropriate
- [ ] CTA buttons follow button classes from TRD

---

## 5. Agent: Registration Wizard

**Trigger phrases:** "registration form", "step 1", "step 2", "ringkasan", "form peserta", "shirt size picker", "order sidebar"

**Owns:**
- `app/(public)/daftar/page.tsx`
- `components/registration/*.tsx`

**Responsibilities:**
- Build the 3-step registration wizard
- Manage step state client-side
- Submit to `/api/registrations` then redirect to Midtrans Snap
- Display order summary sidebar

**Rules:**
- `RegistrationWizard.tsx` is the root Client Component — holds all step state
- Each step (`StepDataPeserta`, `StepRingkasan`) receives state + dispatch as props
- Never lose form state when navigating between steps (hold in parent state)
- Submit to `/api/registrations` → receive `snapToken` → load Midtrans Snap
- Midtrans Snap: use `window.snap.pay(token, { onSuccess, onError, onPending })`
- On Midtrans success callback → redirect to `/konfirmasi?order_id=...`
- Do NOT trust Midtrans frontend callback as final — webhook is the truth
- Shirt size: one size selector per ticket slot (dynamic: show N selectors for N tickets)
- WhatsApp validation: accept `08xx` or `628xx` format, 10–15 digits
- Disable submit button while request is in-flight (prevent double submission)
- Show loading state clearly during payment initiation

**State shape:**
```ts
interface WizardState {
  step: 1 | 2 | 3
  contactName:     string
  contactWhatsapp: string
  categoryId:      number | null
  ticketQty:       number
  shirtSizeIds:    number[]      // length must equal ticketQty
  communityName:   string
  isSubmitting:    boolean
  error:           string | null
}
```

**Output checklist:**
- [ ] Form state preserved between step 1 → 2 navigation
- [ ] `shirtSizeIds.length === ticketQty` enforced before submit
- [ ] Midtrans Snap loaded via script tag in `layout.tsx`
- [ ] Loading state shown during `/api/registrations` POST
- [ ] WhatsApp format validated (regex)
- [ ] Order sidebar shows correct price calculation (unitPrice × qty)

---

## 6. Agent: Confirmation Page

**Trigger phrases:** "konfirmasi", "success page", "after payment", "registration number display", "next steps", "download tiket", "share WhatsApp"

**Owns:**
- `app/(public)/konfirmasi/page.tsx`
- `components/confirmation/*.tsx`

**Responsibilities:**
- Fetch registration data by `order_id` from searchParams (SSR)
- Display confirmation with personalized name, registration number, event details
- Show 4-step next-steps section
- Provide download ticket (PDF) and share to WhatsApp

**Rules:**
- This is a Server Component page — fetch registration via `getRegistrationByNumber(orderId)`
- If registration not found or status ≠ 'paid' → show appropriate message (do not 404)
- Registration number must be prominently displayed and copyable (client component for clipboard)
- "Bagikan ke WhatsApp" → `https://wa.me/?text=...` with pre-filled message
- Ticket PDF download → `/api/registrations/[id]/ticket` (GET, generates PDF on demand)
- The impact reminder ("1 tiketmu = 1 paket sembako") must be visible on this page
- Page must render well when shared as screenshot (structured layout)

**WhatsApp share message:**
```
Aku baru daftar Walk Impact 2026! 🏃‍♂️

Walk Together and Create Impact
📅 7 November 2026 · 06.00 WIB
📍 Pasar Modern Batununggal Indah, Bandung

No. Pendaftaranku: {registration_number}
Yuk ikut bareng! Daftar di: https://walkimpact.id

#WalkImpact2026 #LAZDarulHikam
```

**Output checklist:**
- [ ] Fetches registration server-side, not client-side
- [ ] Handles unpaid/not-found registration gracefully
- [ ] Registration number is copyable (copy-to-clipboard button)
- [ ] Next steps are numbered and clearly structured
- [ ] WhatsApp share link has pre-filled message
- [ ] PDF download link points to correct API route
- [ ] Page looks good on mobile (screenshot-shareable)

---

## 7. Agent: Admin CMS

**Trigger phrases:** "admin", "CMS", "edit FAQ", "reorder rundown", "dashboard stats", "export excel", "export peserta"

**Owns:**
- `app/admin/**/*.tsx`
- `app/api/admin/**/*.ts`
- `components/admin/*.tsx`

**Responsibilities:**
- Admin dashboard with key stats (Recharts charts)
- Participant table with filters and pagination
- Excel export of all participants
- CMS editors: FAQ (TipTap rich text + dnd-kit reorder), Rundown (dnd-kit reorder)
- Simple admin auth (cookie-based JWT)

**Rules:**
- All admin routes protected by middleware + JWT verification in route
- Admin routes must have `X-Robots-Tag: noindex, nofollow` header (configured in vercel.json)
- FAQ editor: TipTap for `answer` field (rich text HTML), plain text for `question`
- Drag-to-reorder: `dnd-kit` on FAQ and Rundown lists — updates `sort_order` via PATCH API
- Dashboard stats: Recharts `BarChart` for registrations per day, `PieChart` for category distribution
- Export: `/api/admin/export` → returns `.xlsx` file via `Content-Disposition: attachment`
- After saving CMS content → call `invalidateEventCache()` to bust Redis
- Participant table: server-side filter by status, category, date range (via query params)

**Admin auth flow:**
```
POST /api/admin/auth  → verify password (bcrypt) → set httpOnly cookie (JWT, 8h)
GET  /admin/*         → middleware checks cookie → verify JWT → allow or redirect
POST /api/admin/*     → route handler verifies JWT from cookie
```

**Output checklist:**
- [ ] Route is protected (middleware + JWT verify in handler)
- [ ] CMS save triggers cache invalidation
- [ ] TipTap editor for FAQ answer field
- [ ] dnd-kit reorder updates sort_order via PATCH
- [ ] Excel export uses SheetJS (`buildParticipantWorkbook`)
- [ ] Recharts components are Client Components
- [ ] Table pagination is server-side (LIMIT/OFFSET in query)

---

## 8. Agent: Payment & Webhook

**Trigger phrases:** "Midtrans", "payment", "webhook", "snap token", "settlement", "expire", "verify signature", "notification endpoint"

**Owns:**
- `lib/midtrans/client.ts`
- `lib/midtrans/create-transaction.ts`
- `lib/midtrans/verify-signature.ts`
- `app/api/payments/route.ts`
- `app/api/payments/notification/route.ts`

**Responsibilities:**
- Create Midtrans Snap transactions
- Verify webhook signatures
- Process payment status updates
- Log all webhook notifications

**Rules:**
- Create transaction: `order_id` = `registration_number`, `gross_amount` in IDR integer
- Snap token returned to frontend for `window.snap.pay()`
- Webhook `/api/payments/notification`:
  1. Parse payload
  2. `logPaymentNotification()` — ALWAYS, even if invalid
  3. `verifyMidtransSignature()` — return 401 if invalid
  4. `updatePaymentFromWebhook()` — update payments table
  5. If `settlement` + `fraud_status = accept` → `markRegistrationPaid()` + `invalidateQuotaCache()`
  6. If `expire` / `cancel` / `deny` → `markRegistrationExpired()`
  7. Return `{ ok: true }` with 200
- Signature: `SHA512(order_id + status_code + gross_amount + MIDTRANS_SIGNATURE_KEY)`
- Midtrans may send duplicate webhooks — idempotent handling required (UPDATE is safe)
- expiry_time for Snap: default 24 hours from transaction creation

**Midtrans transaction payload:**
```ts
{
  transaction_details: {
    order_id:     registrationNumber,
    gross_amount: totalAmount,
  },
  customer_details: {
    first_name: contactName,
    phone:      contactWhatsapp,
  },
  item_details: [{
    id:       String(tierId),
    name:     `Walk Impact 2026 - ${tierName}`,
    price:    unitPrice,
    quantity: ticketQty,
  }],
  expiry: {
    unit:     'hours',
    duration: 24,
  },
}
```

**Output checklist:**
- [ ] Webhook logs notification before any processing
- [ ] Signature verified before any DB writes
- [ ] Payment update is idempotent (UPDATE not INSERT)
- [ ] Quota cache busted after settlement
- [ ] Registration marked paid only after verified settlement
- [ ] Webhook returns 200 always (even on errors — otherwise Midtrans retries endlessly)

---

## 9. Agent: Caching & Performance

**Trigger phrases:** "cache", "Redis", "quota refresh", "invalidate", "rate limit", "ISR", "revalidate"

**Owns:**
- `lib/cache/redis.ts`
- `lib/cache/keys.ts`
- `lib/utils/rate-limit.ts`

**Responsibilities:**
- Manage Upstash Redis cache
- Define and enforce cache TTLs
- Implement rate limiting for mutation endpoints
- Guide ISR revalidation strategy

**Cache keys and TTLs:**
```
walkimpact:quota         → 60s   — refreshed after every paid registration
walkimpact:event:active  → 300s  — refreshed after any admin CMS save
walkimpact:faqs          → 600s  — refreshed after FAQ CMS save
```

**Rate limits:**
```
POST /api/registrations  → 5 req / IP / 10 min
POST /api/admin/auth     → 10 req / IP / 15 min
```

**ISR revalidation:**
```
app/(public)/page.tsx    → export const revalidate = 300  (5 min)
```

**Rules:**
- Redis client must be a singleton (`let redis: Redis | null = null`)
- Always handle Redis failures gracefully — fall back to DB if Redis is down
- Rate limiter uses Upstash `@upstash/ratelimit` with sliding window
- Never cache individual registration records (user-specific, sensitive)
- Cache invalidation must be `await`ed before returning API response

**Output checklist:**
- [ ] Redis client is singleton
- [ ] TTL set on every `redis.set()` call
- [ ] Quota cache busted in both: `markRegistrationPaid` flow AND `markRegistrationExpired` flow
- [ ] Rate limit applied before Zod validation in POST handlers
- [ ] Redis failure does not crash the API (try-catch, fall through to DB)

---

## 10. Agent: PDF & File Export

**Trigger phrases:** "ticket PDF", "download tiket", "export xlsx", "Excel export", "generate PDF", "Vercel Blob"

**Owns:**
- `lib/pdf/ticket-pdf.tsx`
- `lib/utils/export.ts`
- `lib/blob/client.ts`
- `app/api/registrations/[id]/ticket/route.ts`
- `app/api/admin/export/route.ts`

**Responsibilities:**
- Generate ticket PDF on demand
- Build Excel export for admin
- Upload/serve files via Vercel Blob

**Rules:**
- PDF routes must use `runtime = 'nodejs'` (not edge — `@react-pdf/renderer` requires Node)
- Ticket PDF: render via `@react-pdf/renderer`, stream as response, do not store in Blob for on-demand
- Excel: generated in memory via SheetJS, returned as buffer — no temp file needed
- Vercel Blob: use only for hero images uploaded by admin via CMS
- PDF response headers: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="tiket-WI-2026-XXXX.pdf"`
- Excel response headers: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="peserta-walk-impact-2026.xlsx"`

**Output checklist:**
- [ ] PDF route has `runtime = 'nodejs'`
- [ ] PDF uses brand colors from the design guide
- [ ] Excel headers match participant data columns from `erd.md`
- [ ] Response headers set correctly for both PDF and Excel
- [ ] File size reasonable (ticket PDF < 200KB, Excel < 2MB for 750 rows)

---

## 11. Agent: UI Components (Primitives)

**Trigger phrases:** "create component", "Button component", "ProgressBar", "Accordion", "CountdownTimer", "badge", "card component"

**Owns:**
- `components/ui/*.tsx`

**Responsibilities:**
- Build reusable primitive components
- Ensure all primitives use brand Tailwind tokens
- Keep components focused — no business logic in ui/ components

**Rules:**
- No business logic, no API calls, no DB access
- All styling via Tailwind brand tokens
- All components accept standard HTML props via `...props` spread (extensible)
- `CountdownTimer` must be `'use client'` (uses `setInterval`)
- `Accordion` can be server-rendered with CSS-only expand (details/summary) or client for animation
- `ProgressBar` takes `value` (0–100) and `label` as props
- `StepIndicator` takes `steps: string[]` and `currentStep: number`
- `Badge` variants: `default` (green), `warning` (amber), `danger` (red), `muted` (gray)
- `Toast` is a client component for success/error feedback

**Component interface pattern:**
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'on-dark'
  size?:    'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, children, ...props }: ButtonProps) {
  // ...
}
```

**Output checklist:**
- [ ] No business logic
- [ ] All colors via brand Tailwind tokens
- [ ] Loading/disabled states handled
- [ ] Mobile-responsive (no fixed widths)
- [ ] Accessible (aria-label, role where needed)
- [ ] TypeScript props fully typed

---

## 12. Common Multi-Agent Tasks

### Task: "Build the registration flow end-to-end"
```
Order of execution:
1. Schema Agent     → verify registrations, registration_participants tables exist
2. Query Agent      → createRegistration, createRegistrationParticipants, generateNextRegistrationNumber
3. API Agent        → POST /api/registrations (Zod + quota check + Midtrans)
4. Midtrans Agent   → createSnapTransaction
5. API Agent        → POST /api/payments/notification (webhook)
6. Wizard Agent     → RegistrationWizard, StepDataPeserta, StepRingkasan
7. Confirmation Agent → /konfirmasi page
8. Cache Agent      → invalidateQuotaCache after settlement
```

### Task: "Add a new FAQ item from admin"
```
1. CMS Admin Agent  → FAQEditor with TipTap + save to /api/admin/content/faqs (PATCH)
2. Query Agent      → updateEventFaq in lib/db/queries/events.ts
3. Cache Agent      → invalidateEventCache() after save
4. Landing Agent    → FAQSection already reads from CMS, no change needed
```

### Task: "Show real-time quota on landing page"
```
1. Cache Agent      → CACHE_KEYS.QUOTA, TTL 60s
2. API Agent        → GET /api/quota (edge runtime, Redis-backed)
3. Landing Agent    → QuotaSection ('use client', polls /api/quota every 60s with SWR)
```

### Task: "Export all paid participants to Excel"
```
1. Query Agent      → getParticipantsForExport in lib/db/queries/admin.ts
2. Export Agent     → buildParticipantWorkbook in lib/utils/export.ts
3. API Agent        → GET /api/admin/export (nodejs runtime, auth-guarded)
4. Admin Agent      → ExportButton in components/admin/ExportButton.tsx
```
