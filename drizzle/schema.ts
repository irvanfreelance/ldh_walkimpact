import { pgTable, serial, varchar, text, numeric, integer, boolean, timestamp, time, date, jsonb, unique } from 'drizzle-orm/pg-core'

// 1. Shirt Sizes
export const shirtSizes = pgTable('shirt_sizes', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  label: varchar('label', { length: 20 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// 2. Participant Categories
export const participantCategories = pgTable('participant_categories', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  label: varchar('label', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 3. Events
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  tagline: varchar('tagline', { length: 255 }),
  description: text('description'),
  heroImageUrl: text('hero_image_url'),
  eventDate: date('event_date').notNull(),
  assemblyTime: time('assembly_time').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  timezone: varchar('timezone', { length: 50 }).notNull().default('Asia/Jakarta'),
  venueName: varchar('venue_name', { length: 255 }).notNull(),
  venueAddress: text('venue_address').notNull(),
  venueCity: varchar('venue_city', { length: 100 }).notNull().default('Bandung'),
  venueMapsUrl: text('venue_maps_url'),
  routeKm: numeric('route_km', { precision: 4, scale: 1 }).notNull().default('7.0'),
  maxQuota: integer('max_quota').notNull().default(750),
  registrationOpensAt: timestamp('registration_opens_at', { withTimezone: true }).notNull(),
  registrationClosesAt: timestamp('registration_closes_at', { withTimezone: true }).notNull(),
  rpcStartsAt: timestamp('rpc_starts_at', { withTimezone: true }),
  rpcEndsAt: timestamp('rpc_ends_at', { withTimezone: true }),
  rpcLocationNote: text('rpc_location_note'),
  contactName: varchar('contact_name', { length: 255 }),
  contactWhatsapp: varchar('contact_whatsapp', { length: 20 }),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  ogImageUrl: text('og_image_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 4. Event Stats
export const eventStats = pgTable('event_stats', {
  id: serial('id').primaryKey(),
  eventId: serial('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  iconName: varchar('icon_name', { length: 50 }).notNull(),
  value: varchar('value', { length: 50 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 5. Event Concepts
export const eventConcepts = pgTable('event_concepts', {
  id: serial('id').primaryKey(),
  eventId: serial('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  iconName: varchar('icon_name', { length: 50 }),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 6. Event Rundowns
export const eventRundowns = pgTable('event_rundowns', {
  id: serial('id').primaryKey(),
  eventId: serial('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  iconName: varchar('icon_name', { length: 50 }),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  activity: varchar('activity', { length: 255 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 7. Event FAQs
export const eventFaqs = pgTable('event_faqs', {
  id: serial('id').primaryKey(),
  eventId: serial('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: varchar('category', { length: 50 }).notNull().default('general'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 8. Ticket Tiers
export const ticketTiers = pgTable('ticket_tiers', {
  id: serial('id').primaryKey(),
  eventId: serial('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  price: serial('price').notNull(),
  maxPerOrder: integer('max_per_order').notNull().default(5),
  availableFrom: timestamp('available_from', { withTimezone: true }).notNull(),
  availableUntil: timestamp('available_until', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 9. Admins
export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('SUPERADMIN'),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// 10. Payment Methods
export const paymentMethods = pgTable('payment_methods', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  logoUrl: varchar('logo_url', { length: 255 }),
  type: varchar('type', { length: 50 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  adminFeeFlat: serial('admin_fee_flat').default(0 as unknown as number),
  adminFeePct: numeric('admin_fee_pct', { precision: 5, scale: 2 }).default('0.00'),
  isActive: boolean('is_active').default(true),
  isRedirect: boolean('is_redirect').default(false),
  sortOrder: integer('sort_order').default(0),
})

// 11. Payment Instructions
export const paymentInstructions = pgTable('payment_instructions', {
  id: serial('id').primaryKey(),
  paymentMethodId: serial('payment_method_id').notNull().references(() => paymentMethods.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// 12. Payment Logs
export const paymentLogs = pgTable('payment_logs', {
  id: serial('id').primaryKey(),
  invoiceCode: varchar('invoice_code', { length: 50 }).notNull(),
  endpoint: varchar('endpoint', { length: 255 }),
  type: varchar('type', { length: 50 }),
  requestPayload: text('request_payload'),
  responsePayload: text('response_payload'),
  httpStatus: integer('http_status'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// 13. Notification Templates
export const notificationTemplates = pgTable('notification_templates', {
  id: serial('id').primaryKey(),
  eventTrigger: varchar('event_trigger', { length: 50 }).notNull().unique(),
  channel: varchar('channel', { length: 20 }).notNull(),
  messageContent: text('message_content').notNull(),
  isActive: boolean('is_active').default(true),
})

// 14. Notification Logs
export const notificationLogs = pgTable('notification_logs', {
  id: serial('id').primaryKey(),
  templateId: serial('template_id').references(() => notificationTemplates.id, { onDelete: 'set null' }),
  invoiceCode: varchar('invoice_code', { length: 50 }),
  recipient: varchar('recipient', { length: 150 }).notNull(),
  channel: varchar('channel', { length: 20 }).notNull(),
  requestPayload: text('request_payload'),
  responsePayload: text('response_payload'),
  status: varchar('status', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// 15. Unified Registrations Table (Order + Payment Gateway interaction in one table)
export const registrations = pgTable('registrations', {
  id: serial('id').primaryKey(),
  registrationNumber: varchar('registration_number', { length: 50 }).notNull().unique(), // acts as invoice_code / order_id
  eventId: serial('event_id').notNull().references(() => events.id),
  ticketTierId: serial('ticket_tier_id').notNull().references(() => ticketTiers.id),
  categoryId: serial('category_id').notNull().references(() => participantCategories.id),

  // Contact info
  contactName: varchar('contact_name', { length: 255 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactWhatsapp: varchar('contact_whatsapp', { length: 20 }).notNull(),
  communityName: varchar('community_name', { length: 255 }),

  // Order Details
  ticketQty: integer('ticket_qty').notNull().default(1),
  unitPrice: serial('unit_price').notNull(),
  adminFee: serial('admin_fee').notNull().default(0 as unknown as number),
  totalAmount: serial('total_amount').notNull(),

  // Payment Gateway fields (unified)
  paymentMethodId: serial('payment_method_id').references(() => paymentMethods.id),
  paymentMethodCode: varchar('payment_method_code', { length: 50 }),
  paymentType: varchar('payment_type', { length: 50 }),
  bank: varchar('bank', { length: 50 }),
  vaNumber: varchar('va_number', { length: 100 }),
  billerCode: varchar('biller_code', { length: 50 }),
  billKey: varchar('bill_key', { length: 50 }),
  snapToken: varchar('snap_token', { length: 255 }),
  qrUrl: text('qr_url'),
  paymentUrl: text('payment_url'),
  transactionId: varchar('transaction_id', { length: 255 }),
  fraudStatus: varchar('fraud_status', { length: 30 }),

  // Status lifecycle: pending | paid | expired | cancelled
  status: varchar('status', { length: 30 }).notNull().default('pending'),

  // Timestamps
  transactionTime: timestamp('transaction_time', { withTimezone: true }),
  settlementTime: timestamp('settlement_time', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  expiredAt: timestamp('expired_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelReason: text('cancel_reason'),

  // Raw PG response
  midtransResponse: jsonb('midtrans_response'),

  // Tracking
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referrerUrl: text('referrer_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 16. Registration Participants (Per-ticket participant with BIB number)
export const registrationParticipants = pgTable('registration_participants', {
  id: serial('id').primaryKey(),
  registrationId: serial('registration_id').notNull().references(() => registrations.id, { onDelete: 'cascade' }),
  slotNumber: integer('slot_number').notNull().default(1),
  name: varchar('name', { length: 255 }),
  gender: varchar('gender', { length: 20 }),
  shirtSizeId: serial('shirt_size_id').notNull().references(() => shirtSizes.id),
  bibNumber: varchar('bib_number', { length: 20 }).unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique().on(t.registrationId, t.slotNumber),
])
