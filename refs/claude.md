# claude.md — Walk Impact 2026
## Project Context for AI Assistant

> This file is the first thing to read in every session.
> It tells you what this project is, how it's built, and what the rules are.
> Never deviate from these rules unless the developer explicitly changes them.

---

## 1. What This Project Is

**Walk Impact 2026** is a public event website + ticketing platform for a 7KM charity walk event in Bandung, Indonesia, organized by LAZ Darul Hikam on 7 November 2026.

The platform has two main surfaces:
1. **Public landing page** — informs visitors and converts them to register
2. **Ticketing flow** — 3-step registration form with Midtrans payment integration

There is also an internal **admin CMS** for managing content and exporting participant data.

The client is **LAZ Darul Hikam**, an Indonesian zakat management organization (NGO).
The developer is **Irvan**, an independent full-stack developer based in Indonesia.

---

## 2. Key Documents (Always Reference These)

| File | Purpose |
|---|---|
| `prd.md` | Product requirements — pages, features, user stories, states |
| `erd.md` | Database schema, seeds, indexes, useful queries |
| `trd.md` | Technical architecture, file structure, API contracts, code patterns |
| `claude.md` | This file — rules and context |
| `agents.md` | AI agent task definitions and workflow |

**When working on any feature, read the relevant doc first before writing code.**

---

## 3. Hard Rules — Never Break These

### 3.1 Architecture
- **No SPA.** This is Next.js App Router with SSR. No client-side routing for page changes.
- **No ORM at runtime.** Drizzle is for migrations and seeds only. At runtime, use raw SQL via `@neondatabase/serverless`.
- **No inline SQL in route.ts or components.** All SQL lives in `lib/db/queries/*.ts`. Route handlers import query functions.
- **No SQL in components.** Components receive data as props from server components or via fetch from API routes.
- **Edge runtime** for lightweight API routes (`/api/quota`, `/api/events`). Node runtime for heavy ones (PDF, export).

### 3.2 Database
- All PKs are `BIGSERIAL` — never UUID.
- All status/type columns are `VARCHAR` — never PostgreSQL `ENUM`.
- All timestamps are `TIMESTAMPTZ` stored as UTC.
- All monetary values (prices) are stored in full IDR (Rupiah) as `BIGINT` — no cents, no float.
- Every query function must be in the correct file under `lib/db/queries/`.
- Never write `SELECT *` in production queries — always name columns explicitly.

### 3.3 TypeScript
- Strict mode on. No `any`. No `as unknown as X`.
- Zod for all API input validation — validate before touching the database.
- All database row shapes must have a corresponding TypeScript type defined near the query function.

### 3.4 API Routes
- All API routes return JSON.
- Errors always return `{ error: string }` with the appropriate HTTP status.
- Quota check must happen before creating a registration — check atomically.
- Midtrans webhook must verify signature before processing. Log every webhook regardless of validity.
- Rate-limit POST endpoints that create records (registrations, etc.).

### 3.5 Frontend
- Mobile-first. All components must be tested at 375px width.
- No hardcoded colors — use Tailwind brand tokens from `tailwind.config.ts`.
- Server components by default. Add `'use client'` only when the component needs interactivity (CountdownTimer, QuotaSection polling, RegistrationWizard).
- No `useEffect` for data fetching. Use server components or SWR/fetch in client components.
- Form validation must exist on both client (UX) and server (security).

### 3.6 Payment
- Registration number format: `WI-{YEAR}-{4-digit-zero-padded}`. Example: `WI-2026-0842`.
- The `order_id` sent to Midtrans must equal the `registration_number`.
- Payment status must only be updated via verified Midtrans webhook — never via client-side redirect alone.
- After settlement webhook → mark registration `paid` + bust quota Redis cache.
- After expire webhook → mark registration `expired`.

### 3.7 Caching
- Quota is cached in Upstash Redis with 60s TTL (`walkimpact:quota`).
- CMS content (event data, FAQs) is cached with 300s TTL.
- Cache must be invalidated after: registration paid (quota), admin saves CMS content (event data).
- Never cache transactional data (individual registration records, payment status).

---

## 4. Code Style

```ts
// Naming
camelCase           → variables, functions, params
PascalCase          → React components, TypeScript types/interfaces
SCREAMING_SNAKE     → constants (CACHE_KEYS, QUOTA_TTL)
kebab-case          → file names, route segments

// Function shape for query files
export async function verbNoun(param: Type): Promise<ReturnType> { ... }
// Examples: getActiveEvent, createRegistration, markRegistrationPaid

// API route shape
export async function GET(req: NextRequest): Promise<Response>
export async function POST(req: NextRequest): Promise<Response>

// No default exports in query files — named exports only
// Default exports only in page.tsx and layout.tsx files (Next.js convention)
```

---

## 5. What to Do When Asked to Build Something

1. **Identify which doc covers it** — prd.md for features, erd.md for schema, trd.md for implementation
2. **Check existing query files** — don't write a new query that already exists
3. **Check existing components** — reuse `components/ui/*` before creating new primitives
4. **Write the query first** (if DB access needed), then the route, then the component
5. **Mobile-first CSS** — write mobile styles first, add `md:` / `lg:` breakpoints for larger screens
6. **Validate on server** — always add Zod schema to POST routes even if client already validates

---

## 6. Indonesian Language Context

This is an Indonesian product. Know these terms:
- **Sembako** = basic food staples package (rice, oil, sugar, etc.)
- **Dhuafa / Kaum dhuafa** = economically disadvantaged people
- **LAZ** = Lembaga Amil Zakat (Zakat collection institution)
- **Pra-sejahtera** = pre-prosperous (below poverty threshold)
- **Paket pangan** = food package
- **Infaq / Sedekah / Zakat** = Islamic charitable giving categories
- **WIB** = Waktu Indonesia Barat (UTC+7, Jakarta timezone)
- **Hari-H** = D-day / event day
- **Pendaftaran** = registration
- **Peserta** = participant
- **Penerima manfaat** = beneficiary

UI copy is in Indonesian. Code, comments, variable names, DB columns are in English.

---

## 7. Project-Specific Business Rules

| Rule | Detail |
|---|---|
| Max quota | 750 paid registrations per event |
| Max per order | 5 tickets per single registration |
| Registration number | `WI-{YEAR}-{4-digit seq}`, server-generated |
| Payment timeout | 24 hours (Midtrans default) |
| Shirt sizes | S, M, L, XL, XXL — one per ticket slot |
| Registration window | 1 Oct 2026 – 23 Oct 2026 |
| RPC distribution | 2–3 Nov 2026 |
| Event date | 7 Nov 2026, assembly at 05:30 WIB |
| "1 tiket = 1 paket sembako" | Core value proposition — must be visible on registration page |
| Quota display | Show as `X dari 750 tempat terisi` with progress bar |

---

## 8. Common Pitfalls to Avoid

| ❌ Wrong | ✅ Correct |
|---|---|
| `import { db } from '@/lib/db'` using Drizzle ORM | `import sql from '@/lib/db/client'` raw Neon client |
| `await db.select().from(registrations).where(...)` | `await sql\`SELECT ... FROM registrations WHERE ...\`` |
| Writing SQL inside `app/api/registrations/route.ts` | Import `createRegistration` from `lib/db/queries/registrations.ts` |
| Checking quota only on client | Check quota server-side in the POST /api/registrations handler |
| Updating payment status from redirect URL | Only update payment status from verified Midtrans webhook |
| `id UUID DEFAULT gen_random_uuid()` | `id BIGSERIAL PRIMARY KEY` |
| `status payment_status_enum` | `status VARCHAR(30) NOT NULL DEFAULT 'pending'` |
| Storing price as `75000.00 NUMERIC` | `75000 BIGINT` (full IDR, no decimals) |
| `useEffect(() => { fetch('/api/...') }, [])` in server component | Make it a proper client component with `'use client'` |
| Hardcoding `#6DC230` in JSX | `className="text-brand-green"` from Tailwind config |

---

## 9. External Services Quick Reference

| Service | Purpose | Env var prefix |
|---|---|---|
| Neon PostgreSQL | Primary database | `DATABASE_URL` |
| Upstash Redis | Quota cache, rate limiting | `UPSTASH_REDIS_*` |
| Midtrans | Payment gateway | `MIDTRANS_*` |
| Vercel Blob | Images, PDF storage | `BLOB_*` |
| WhatsApp (wa.me) | Post-payment notification link | Hardcoded WA number |

---

## 10. When You Are Unsure

- **Schema question** → check `erd.md` first
- **Feature scope question** → check `prd.md` first
- **Where to put code** → check `trd.md` file structure
- **Styling** → check section 15 of `trd.md` for tokens
- **Indonesian term** → ask Irvan, don't guess
- **Payment flow edge case** → Midtrans documentation, then ask Irvan

Always prefer explicit over implicit. If a requirement is ambiguous, state your assumption before writing code.
