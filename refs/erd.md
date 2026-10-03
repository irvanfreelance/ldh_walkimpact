# ERD — Walk Impact 2026
## PostgreSQL Schema, Seeds & Index Strategy

**Database:** Neon PostgreSQL (Serverless)  
**Convention:** bigserial PK, varchar status, snake_case, all timestamps UTC  
**Language:** English (column names, seeds)

---

## 1. Table Classification

### Static Reference Data (seed once, rarely changes)
- `shirt_sizes` — S / M / L / XL / XXL
- `participant_categories` — Keluarga, Komunitas, Pelajar, etc.

### CMS-Managed Dynamic Data (admin can edit, no redeploy)
- `events` — core event info, dates, quota
- `event_stats` — impact numbers shown on landing (7KM, 1.000 paket, etc.)
- `event_concepts` — concept cards (Sehat Bersama, Berdampak Nyata, etc.)
- `event_rundowns` — schedule timeline items
- `event_faqs` — accordion FAQ items
- `ticket_tiers` — pricing tiers (Early Bird, Regular, etc.)

### Transactional Data (written by the app, high traffic)
- `registrations` — main booking record
- `registration_participants` — per-ticket size details
- `payments` — Midtrans payment record
- `payment_notifications` — raw Midtrans webhook log

---

## 2. Full Schema

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- ============================================================
-- STATIC REFERENCE TABLES
-- ============================================================

CREATE TABLE shirt_sizes (
  id           BIGSERIAL    PRIMARY KEY,
  code         VARCHAR(10)  NOT NULL UNIQUE,  -- S, M, L, XL, XXL
  label        VARCHAR(20)  NOT NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE participant_categories (
  id           BIGSERIAL    PRIMARY KEY,
  slug         VARCHAR(50)  NOT NULL UNIQUE,  -- keluarga, komunitas, pelajar, pekerja, umum
  label        VARCHAR(100) NOT NULL,
  description  TEXT,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order   INT          NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ============================================================
-- CMS-MANAGED TABLES
-- ============================================================

CREATE TABLE events (
  id                          BIGSERIAL    PRIMARY KEY,
  slug                        VARCHAR(100) NOT NULL UNIQUE,       -- walk-impact-2026
  name                        VARCHAR(255) NOT NULL,
  tagline                     VARCHAR(255),
  description                 TEXT,
  hero_image_url              TEXT,

  -- Schedule
  event_date                  DATE         NOT NULL,
  assembly_time               TIME         NOT NULL,              -- 05:30:00
  start_time                  TIME         NOT NULL,              -- 06:00:00
  end_time                    TIME         NOT NULL,              -- 12:00:00
  timezone                    VARCHAR(50)  NOT NULL DEFAULT 'Asia/Jakarta',

  -- Location
  venue_name                  VARCHAR(255) NOT NULL,
  venue_address               TEXT         NOT NULL,
  venue_city                  VARCHAR(100) NOT NULL DEFAULT 'Bandung',
  venue_maps_url              TEXT,

  -- Route
  route_km                    NUMERIC(4,1) NOT NULL DEFAULT 7.0,

  -- Quota
  max_quota                   INT          NOT NULL DEFAULT 750,

  -- Registration window
  registration_opens_at       TIMESTAMPTZ  NOT NULL,
  registration_closes_at      TIMESTAMPTZ  NOT NULL,

  -- RPC (Race Packet Collection) distribution window
  rpc_starts_at               TIMESTAMPTZ,
  rpc_ends_at                 TIMESTAMPTZ,
  rpc_location_note           TEXT,

  -- Contact
  contact_name                VARCHAR(255),
  contact_whatsapp            VARCHAR(20),

  -- SEO
  meta_title                  VARCHAR(255),
  meta_description            TEXT,
  og_image_url                TEXT,

  -- Control
  is_active                   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Impact numbers displayed on landing (7KM / 1.000 Paket / 3.000 Jiwa)
CREATE TABLE event_stats (
  id           BIGSERIAL    PRIMARY KEY,
  event_id     BIGINT       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  icon_name    VARCHAR(50)  NOT NULL,          -- lucide icon name: footprints, box, users
  value        VARCHAR(50)  NOT NULL,          -- "7 KM", "1.000", "3.000"
  label        VARCHAR(255) NOT NULL,
  description  TEXT,
  sort_order   INT          NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Concept cards (Sehat Bersama, Berdampak Nyata, Komunitas Lebih Kuat)
CREATE TABLE event_concepts (
  id           BIGSERIAL    PRIMARY KEY,
  event_id     BIGINT       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  icon_name    VARCHAR(50),
  title        VARCHAR(255) NOT NULL,
  body         TEXT         NOT NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Timeline items for rundown section
CREATE TABLE event_rundowns (
  id           BIGSERIAL    PRIMARY KEY,
  event_id     BIGINT       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  icon_name    VARCHAR(50),
  start_time   TIME         NOT NULL,          -- 06:00:00
  end_time     TIME         NOT NULL,          -- 06:30:00
  activity     VARCHAR(255) NOT NULL,
  description  TEXT,
  sort_order   INT          NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- FAQ accordion items
CREATE TABLE event_faqs (
  id           BIGSERIAL    PRIMARY KEY,
  event_id     BIGINT       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question     TEXT         NOT NULL,
  answer       TEXT         NOT NULL,          -- TipTap rich text HTML
  category     VARCHAR(50)  NOT NULL DEFAULT 'general',  -- general, registration, technical
  sort_order   INT          NOT NULL DEFAULT 0,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Ticket pricing tiers
CREATE TABLE ticket_tiers (
  id               BIGSERIAL    PRIMARY KEY,
  event_id         BIGINT       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,       -- Regular, Early Bird
  description      TEXT,
  price            BIGINT       NOT NULL,       -- IDR in full rupiah (e.g. 75000)
  max_per_order    INT          NOT NULL DEFAULT 5,
  available_from   TIMESTAMPTZ  NOT NULL,
  available_until  TIMESTAMPTZ  NOT NULL,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order       INT          NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ============================================================
-- TRANSACTIONAL TABLES
-- ============================================================

-- Main booking record (one per checkout session)
CREATE TABLE registrations (
  id                    BIGSERIAL    PRIMARY KEY,
  registration_number   VARCHAR(20)  NOT NULL UNIQUE,  -- WI-2026-0001
  event_id              BIGINT       NOT NULL REFERENCES events(id),
  ticket_tier_id        BIGINT       NOT NULL REFERENCES ticket_tiers(id),
  category_id           BIGINT       NOT NULL REFERENCES participant_categories(id),

  -- Contact info (person who registers)
  contact_name          VARCHAR(255) NOT NULL,
  contact_whatsapp      VARCHAR(20)  NOT NULL,
  community_name        VARCHAR(255),

  -- Order summary
  ticket_qty            INT          NOT NULL DEFAULT 1,
  unit_price            BIGINT       NOT NULL,          -- snapshot at time of registration
  total_amount          BIGINT       NOT NULL,

  -- Lifecycle status
  -- pending | paid | expired | cancelled
  status                VARCHAR(30)  NOT NULL DEFAULT 'pending',

  -- Tracking
  ip_address            VARCHAR(45),
  user_agent            TEXT,
  referrer_url          TEXT,

  -- Timestamps
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  paid_at               TIMESTAMPTZ,
  expired_at            TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  cancel_reason         TEXT
);

-- Per-ticket participant details (shirt size per ticket slot)
CREATE TABLE registration_participants (
  id               BIGSERIAL PRIMARY KEY,
  registration_id  BIGINT    NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  shirt_size_id    BIGINT    NOT NULL REFERENCES shirt_sizes(id),
  slot_number      INT       NOT NULL DEFAULT 1,  -- 1, 2, 3 ... up to ticket_qty
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (registration_id, slot_number)
);

-- Midtrans payment record (one per registration)
CREATE TABLE payments (
  id                  BIGSERIAL    PRIMARY KEY,
  registration_id     BIGINT       NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,

  -- Midtrans identifiers
  order_id            VARCHAR(100) NOT NULL UNIQUE,  -- same as registration_number
  transaction_id      VARCHAR(255),                   -- returned by Midtrans
  snap_token          VARCHAR(255),                   -- Snap token for frontend

  -- Payment method info
  payment_type        VARCHAR(50),   -- bank_transfer, gopay, qris, cstore
  bank                VARCHAR(50),   -- BCA, BNI, BRI, MANDIRI
  va_number           VARCHAR(50),   -- virtual account number
  biller_code         VARCHAR(50),   -- for Mandiri Bill
  bill_key            VARCHAR(50),

  -- Amounts
  gross_amount        BIGINT       NOT NULL,

  -- Status
  -- pending | settlement | expire | cancel | deny | failure | refund
  status              VARCHAR(30)  NOT NULL DEFAULT 'pending',
  fraud_status        VARCHAR(30),   -- accept | deny | challenge

  -- Timestamps from Midtrans
  transaction_time    TIMESTAMPTZ,
  settlement_time     TIMESTAMPTZ,
  expiry_time         TIMESTAMPTZ,

  -- Raw Midtrans response (kept for audit)
  midtrans_response   JSONB,

  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Raw Midtrans webhook notification log (append-only audit)
CREATE TABLE payment_notifications (
  id                   BIGSERIAL    PRIMARY KEY,
  payment_id           BIGINT       REFERENCES payments(id),  -- nullable, resolved after lookup
  order_id             VARCHAR(100) NOT NULL,
  transaction_status   VARCHAR(50)  NOT NULL,
  fraud_status         VARCHAR(50),
  signature_valid      BOOLEAN      NOT NULL DEFAULT FALSE,
  payload              JSONB        NOT NULL,
  is_processed         BOOLEAN      NOT NULL DEFAULT FALSE,
  processed_at         TIMESTAMPTZ,
  process_error        TEXT,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

---

## 3. Indexes — High Traffic Optimization

```sql
-- ============================================================
-- REGISTRATION INDEXES (most queried table)
-- ============================================================

-- Primary lookups
CREATE UNIQUE INDEX idx_registrations_reg_number
  ON registrations(registration_number);

-- Quota count query: SELECT COUNT(*) WHERE event_id = ? AND status = 'paid'
CREATE INDEX idx_registrations_event_status
  ON registrations(event_id, status);

-- Admin filter by status
CREATE INDEX idx_registrations_status
  ON registrations(status);

-- Admin search by contact
CREATE INDEX idx_registrations_contact_whatsapp
  ON registrations(contact_whatsapp);

-- Admin list, sorted newest first
CREATE INDEX idx_registrations_created_at
  ON registrations(created_at DESC);

-- Lookup by category for reporting
CREATE INDEX idx_registrations_category_id
  ON registrations(category_id);

-- Expire job: find pending registrations past payment window
CREATE INDEX idx_registrations_pending_created
  ON registrations(created_at)
  WHERE status = 'pending';


-- ============================================================
-- PAYMENT INDEXES
-- ============================================================

-- Webhook lookup: find payment by order_id
CREATE UNIQUE INDEX idx_payments_order_id
  ON payments(order_id);

-- Join from registrations
CREATE INDEX idx_payments_registration_id
  ON payments(registration_id);

-- Midtrans transaction ID lookup
CREATE INDEX idx_payments_transaction_id
  ON payments(transaction_id)
  WHERE transaction_id IS NOT NULL;

-- Status filter for reporting
CREATE INDEX idx_payments_status
  ON payments(status);


-- ============================================================
-- PAYMENT NOTIFICATION INDEXES
-- ============================================================

-- Webhook deduplication and lookup
CREATE INDEX idx_payment_notif_order_id
  ON payment_notifications(order_id);

-- Background job: process unprocessed notifications
CREATE INDEX idx_payment_notif_unprocessed
  ON payment_notifications(created_at)
  WHERE is_processed = FALSE;


-- ============================================================
-- REGISTRATION PARTICIPANTS
-- ============================================================

CREATE INDEX idx_reg_participants_registration_id
  ON registration_participants(registration_id);

CREATE INDEX idx_reg_participants_shirt_size
  ON registration_participants(shirt_size_id);


-- ============================================================
-- CMS TABLE INDEXES (read-heavy, low write)
-- ============================================================

CREATE INDEX idx_event_stats_event_id
  ON event_stats(event_id, sort_order);

CREATE INDEX idx_event_concepts_event_id
  ON event_concepts(event_id, sort_order);

CREATE INDEX idx_event_rundowns_event_id
  ON event_rundowns(event_id, sort_order);

CREATE INDEX idx_event_faqs_event_active
  ON event_faqs(event_id, is_active, sort_order);

CREATE INDEX idx_ticket_tiers_event_active
  ON ticket_tiers(event_id, is_active);

CREATE INDEX idx_participant_categories_active
  ON participant_categories(is_active, sort_order);
```

---

## 4. Seed Data

```sql
-- ============================================================
-- SHIRT SIZES (static)
-- ============================================================

INSERT INTO shirt_sizes (code, label, sort_order) VALUES
  ('S',   'Small',    1),
  ('M',   'Medium',   2),
  ('L',   'Large',    3),
  ('XL',  'X-Large',  4),
  ('XXL', 'XX-Large', 5);


-- ============================================================
-- PARTICIPANT CATEGORIES (static reference, CMS editable label)
-- ============================================================

INSERT INTO participant_categories (slug, label, description, sort_order) VALUES
  ('keluarga',   'Keluarga',          'Peserta yang mendaftar bersama keluarga',              1),
  ('komunitas',  'Komunitas',         'Anggota komunitas olahraga atau sosial',               2),
  ('pelajar',    'Pelajar & Mahasiswa','Pelajar SMA, mahasiswa, atau civitas akademika',      3),
  ('pekerja',    'Pekerja',           'Karyawan perusahaan atau profesional',                 4),
  ('umum',       'Masyarakat Umum',   'Peserta umum dari berbagai latar belakang',            5);


-- ============================================================
-- EVENT
-- ============================================================

INSERT INTO events (
  slug, name, tagline, description, hero_image_url,
  event_date, assembly_time, start_time, end_time, timezone,
  venue_name, venue_address, venue_city, venue_maps_url,
  route_km, max_quota,
  registration_opens_at, registration_closes_at,
  rpc_starts_at, rpc_ends_at, rpc_location_note,
  contact_name, contact_whatsapp,
  meta_title, meta_description,
  is_active
) VALUES (
  'walk-impact-2026',
  'Walk Impact 2026',
  'Walk Together and Create Impact',
  'Event jalan santai sosial 7 KM yang memadukan olahraga, kepedulian, dan aksi nyata untuk masyarakat Bandung.',
  NULL,
  '2026-11-07',
  '05:30:00',
  '06:00:00',
  '12:00:00',
  'Asia/Jakarta',
  'Pasar Modern Batununggal Indah',
  'Jl. Batununggal Indah, Batununggal, Kec. Bandung Kidul, Kota Bandung',
  'Bandung',
  'https://maps.google.com/?q=Pasar+Modern+Batununggal+Indah+Bandung',
  7.0,
  750,
  '2026-10-01 00:00:00+07',
  '2026-10-23 23:59:59+07',
  '2026-11-02 08:00:00+07',
  '2026-11-03 17:00:00+07',
  'Lokasi pengambilan perlengkapan akan diinformasikan melalui WhatsApp.',
  'Andhika Pratama Putra',
  '6281572225545',
  'Walk Impact 2026 — Jalan Bersama, Ciptakan Dampak | LAZ Darul Hikam',
  'Event jalan santai sosial 7 KM di Bandung. 750 peserta, 1.000 paket sembako untuk keluarga pra-sejahtera. Daftar sekarang!',
  TRUE
);


-- ============================================================
-- EVENT STATS
-- ============================================================

INSERT INTO event_stats (event_id, icon_name, value, label, description, sort_order)
SELECT e.id, s.icon_name, s.value, s.label, s.description, s.sort_order
FROM events e, (VALUES
  ('footprints', '7 KM',           'Jarak Tempuh',        'Berjalan bersama untuk hidup lebih sehat',                    1),
  ('box',        '1.000 Paket',    'Paket Sembako',        'Didistribusikan untuk warga yang membutuhkan',                2),
  ('users',      '3.000 Jiwa',     'Penerima Manfaat',     'Penerima manfaat di sekitar Batununggal, Bandung',            3)
) AS s(icon_name, value, label, description, sort_order)
WHERE e.slug = 'walk-impact-2026';


-- ============================================================
-- EVENT CONCEPTS
-- ============================================================

INSERT INTO event_concepts (event_id, icon_name, title, body, sort_order)
SELECT e.id, c.icon_name, c.title, c.body, c.sort_order
FROM events e, (VALUES
  ('heart-pulse', 'Sehat Bersama',
   'Menjaga kesehatan fisik dan mental melalui aktivitas berjalan yang menyenangkan.',
   1),
  ('hand-heart',  'Berdampak Nyata',
   'Setiap langkahmu membantu distribusi 1.000 paket sembako untuk warga sekitar.',
   2),
  ('leaf',        'Komunitas Lebih Kuat',
   'Menyatukan keluarga, komunitas, dan masyarakat Bandung untuk dampak yang lebih luas.',
   3)
) AS c(icon_name, title, body, sort_order)
WHERE e.slug = 'walk-impact-2026';


-- ============================================================
-- EVENT RUNDOWNS
-- ============================================================

INSERT INTO event_rundowns (event_id, icon_name, start_time, end_time, activity, sort_order)
SELECT e.id, r.icon_name, r.start_time::TIME, r.end_time::TIME, r.activity, r.sort_order
FROM events e, (VALUES
  ('clipboard-list', '06:00', '06:30', 'Registrasi Peserta',              1),
  ('users',          '06:30', '07:00', 'Pemanasan Bersama',               2),
  ('footprints',     '07:00', '09:00', 'Walk Impact 7KM',                 3),
  ('music',          '09:00', '11:00', 'Panggung Komunitas dan Hiburan',  4),
  ('gift',           '11:00', '12:00', 'Penyerahan Paket Sembako',        5)
) AS r(icon_name, start_time, end_time, activity, sort_order)
WHERE e.slug = 'walk-impact-2026';


-- ============================================================
-- EVENT FAQS
-- ============================================================

INSERT INTO event_faqs (event_id, question, answer, category, sort_order)
SELECT e.id, f.question, f.answer, f.category, f.sort_order
FROM events e, (VALUES
  ('Siapa saja yang bisa ikut Walk Impact 2026?',
   '<p>Semua kalangan bisa ikut! Walk Impact 2026 dirancang untuk keluarga, komunitas olahraga, pelajar, mahasiswa, karyawan, dan masyarakat umum. Tidak perlu kondisi fisik khusus — ini jalan santai, bukan lomba lari.</p>',
   'general', 1),

  ('Di mana lokasi acara?',
   '<p>Acara dipusatkan di <strong>Pasar Modern Batununggal Indah, Bandung</strong>. Peserta berkumpul pukul 05.30 WIB. Detail parkir dan akses akan diinformasikan lebih lanjut via WhatsApp.</p>',
   'general', 2),

  ('Apakah ada biaya pendaftaran?',
   '<p>Ya, terdapat biaya pendaftaran. Setiap tiket sudah termasuk satu paket sembako yang akan kamu antarkan langsung kepada penerima manfaat di rute Walk Impact. Detail harga tersedia di halaman pendaftaran.</p>',
   'registration', 3),

  ('Bagaimana paket sembako didistribusikan?',
   '<p>Di titik tertentu sepanjang rute 7 KM, peserta akan menerima satu paket sembako dan mengantarkannya langsung ke rumah penerima manfaat yang telah ditandai. Kamu akan berinteraksi langsung dengan mereka — pengalaman yang tidak terlupakan!</p>',
   'general', 4),

  ('Kapan dan di mana pengambilan perlengkapan?',
   '<p>Pengambilan perlengkapan peserta (kaos, bib number, dll.) dilaksanakan pada <strong>2–3 November 2026</strong>. Lokasi dan jadwal detail akan diinformasikan melalui WhatsApp setelah pendaftaran dikonfirmasi.</p>',
   'registration', 5),

  ('Apakah pendaftaran bisa dibatalkan atau di-refund?',
   '<p>Pendaftaran yang sudah dibayarkan tidak dapat direfund. Namun jika ada kendala kehadiran, tiket dapat dialihkan ke peserta lain dengan menghubungi panitia melalui WhatsApp sebelum 1 November 2026.</p>',
   'registration', 6),

  ('Apakah acara tetap berjalan jika hujan?',
   '<p>Acara dirancang untuk tetap berjalan dalam cuaca apapun. Jika terjadi perubahan, panitia akan mengumumkan melalui akun Instagram resmi <strong>@walk.impact</strong> dan WhatsApp grup peserta.</p>',
   'technical', 7),

  ('Bagaimana cara menghubungi panitia?',
   '<p>Hubungi panitia melalui WhatsApp: <strong>+62 815-7222-5545</strong> (Andhika Pratama Putra) atau email <strong>lazisdarulhikamofficial@gmail.com</strong>. Jam respons: Senin–Jumat 09.00–17.00 WIB.</p>',
   'general', 8)
) AS f(question, answer, category, sort_order)
WHERE e.slug = 'walk-impact-2026';


-- ============================================================
-- TICKET TIERS
-- ============================================================

INSERT INTO ticket_tiers (event_id, name, description, price, max_per_order, available_from, available_until, is_active, sort_order)
SELECT e.id, t.name, t.description, t.price, t.max_per_order, t.available_from::TIMESTAMPTZ, t.available_until::TIMESTAMPTZ, t.is_active, t.sort_order
FROM events e, (VALUES
  ('Early Bird',
   'Harga spesial untuk 200 pendaftar pertama. Sudah termasuk 1 paket sembako dan kaos event.',
   50000, 3,
   '2026-10-01 00:00:00+07', '2026-10-10 23:59:59+07',
   FALSE, 1),

  ('Regular',
   'Tiket reguler Walk Impact 2026. Sudah termasuk 1 paket sembako dan kaos event.',
   75000, 5,
   '2026-10-11 00:00:00+07', '2026-10-23 23:59:59+07',
   TRUE, 2)
) AS t(name, description, price, max_per_order, available_from, available_until, is_active, sort_order)
WHERE e.slug = 'walk-impact-2026';


-- ============================================================
-- SAMPLE REGISTRATIONS (realistic seed, status mix)
-- ============================================================

DO $$
DECLARE
  v_event_id        BIGINT;
  v_tier_id         BIGINT;
  v_cat_keluarga    BIGINT;
  v_cat_komunitas   BIGINT;
  v_cat_pelajar     BIGINT;
  v_cat_pekerja     BIGINT;
  v_cat_umum        BIGINT;
  v_size_s          BIGINT;
  v_size_m          BIGINT;
  v_size_l          BIGINT;
  v_size_xl         BIGINT;
  v_reg_id          BIGINT;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE slug = 'walk-impact-2026';
  SELECT id INTO v_tier_id  FROM ticket_tiers WHERE event_id = v_event_id AND name = 'Regular';
  SELECT id INTO v_cat_keluarga  FROM participant_categories WHERE slug = 'keluarga';
  SELECT id INTO v_cat_komunitas FROM participant_categories WHERE slug = 'komunitas';
  SELECT id INTO v_cat_pelajar   FROM participant_categories WHERE slug = 'pelajar';
  SELECT id INTO v_cat_pekerja   FROM participant_categories WHERE slug = 'pekerja';
  SELECT id INTO v_cat_umum      FROM participant_categories WHERE slug = 'umum';
  SELECT id INTO v_size_s  FROM shirt_sizes WHERE code = 'S';
  SELECT id INTO v_size_m  FROM shirt_sizes WHERE code = 'M';
  SELECT id INTO v_size_l  FROM shirt_sizes WHERE code = 'L';
  SELECT id INTO v_size_xl FROM shirt_sizes WHERE code = 'XL';

  -- Registration 1: paid, keluarga, 2 tikets
  INSERT INTO registrations (
    registration_number, event_id, ticket_tier_id, category_id,
    contact_name, contact_whatsapp, community_name,
    ticket_qty, unit_price, total_amount, status,
    created_at, paid_at
  ) VALUES (
    'WI-2026-0001', v_event_id, v_tier_id, v_cat_keluarga,
    'Andi Pratama', '6281234567890', NULL,
    2, 75000, 150000, 'paid',
    '2026-10-11 08:23:00+07', '2026-10-11 08:35:00+07'
  ) RETURNING id INTO v_reg_id;

  INSERT INTO registration_participants (registration_id, shirt_size_id, slot_number) VALUES
    (v_reg_id, v_size_m, 1),
    (v_reg_id, v_size_s, 2);

  INSERT INTO payments (
    registration_id, order_id, transaction_id, snap_token,
    payment_type, bank, va_number,
    gross_amount, status, fraud_status,
    transaction_time, settlement_time, expiry_time
  ) VALUES (
    v_reg_id, 'WI-2026-0001', 'TXN-MDT-0001', 'snap-tok-0001',
    'bank_transfer', 'BCA', '12345678901',
    150000, 'settlement', 'accept',
    '2026-10-11 08:23:00+07', '2026-10-11 08:35:00+07', '2026-10-12 08:23:00+07'
  );

  -- Registration 2: paid, komunitas, 3 tikets
  INSERT INTO registrations (
    registration_number, event_id, ticket_tier_id, category_id,
    contact_name, contact_whatsapp, community_name,
    ticket_qty, unit_price, total_amount, status,
    created_at, paid_at
  ) VALUES (
    'WI-2026-0002', v_event_id, v_tier_id, v_cat_komunitas,
    'Siti Rahayu', '6289876543210', 'Komunitas Sehat Bandung',
    3, 75000, 225000, 'paid',
    '2026-10-11 10:00:00+07', '2026-10-11 10:15:00+07'
  ) RETURNING id INTO v_reg_id;

  INSERT INTO registration_participants (registration_id, shirt_size_id, slot_number) VALUES
    (v_reg_id, v_size_l,  1),
    (v_reg_id, v_size_m,  2),
    (v_reg_id, v_size_l,  3);

  INSERT INTO payments (
    registration_id, order_id, transaction_id,
    payment_type, gross_amount, status, fraud_status,
    transaction_time, settlement_time, expiry_time
  ) VALUES (
    v_reg_id, 'WI-2026-0002', 'TXN-MDT-0002',
    'qris', 225000, 'settlement', 'accept',
    '2026-10-11 10:00:00+07', '2026-10-11 10:02:00+07', '2026-10-12 10:00:00+07'
  );

  -- Registration 3: pending (unpaid)
  INSERT INTO registrations (
    registration_number, event_id, ticket_tier_id, category_id,
    contact_name, contact_whatsapp,
    ticket_qty, unit_price, total_amount, status,
    created_at
  ) VALUES (
    'WI-2026-0003', v_event_id, v_tier_id, v_cat_pelajar,
    'Rizky Fauzan', '6285555123456', NULL,
    1, 75000, 75000, 'pending',
    '2026-10-12 14:00:00+07'
  ) RETURNING id INTO v_reg_id;

  INSERT INTO registration_participants (registration_id, shirt_size_id, slot_number) VALUES
    (v_reg_id, v_size_s, 1);

  INSERT INTO payments (
    registration_id, order_id, snap_token,
    gross_amount, status,
    transaction_time, expiry_time
  ) VALUES (
    v_reg_id, 'WI-2026-0003', 'snap-tok-0003',
    75000, 'pending',
    '2026-10-12 14:00:00+07', '2026-10-13 14:00:00+07'
  );

  -- Registration 4: expired
  INSERT INTO registrations (
    registration_number, event_id, ticket_tier_id, category_id,
    contact_name, contact_whatsapp,
    ticket_qty, unit_price, total_amount, status,
    created_at, expired_at
  ) VALUES (
    'WI-2026-0004', v_event_id, v_tier_id, v_cat_umum,
    'Budi Santoso', '6281111222333', NULL,
    1, 75000, 75000, 'expired',
    '2026-10-12 09:00:00+07', '2026-10-13 09:00:00+07'
  ) RETURNING id INTO v_reg_id;

  INSERT INTO registration_participants (registration_id, shirt_size_id, slot_number) VALUES
    (v_reg_id, v_size_xl, 1);

  INSERT INTO payments (
    registration_id, order_id, gross_amount, status,
    transaction_time, expiry_time
  ) VALUES (
    v_reg_id, 'WI-2026-0004', 75000, 'expire',
    '2026-10-12 09:00:00+07', '2026-10-13 09:00:00+07'
  );

  -- Registration 5: paid, pekerja, 1 tiket
  INSERT INTO registrations (
    registration_number, event_id, ticket_tier_id, category_id,
    contact_name, contact_whatsapp, community_name,
    ticket_qty, unit_price, total_amount, status,
    created_at, paid_at
  ) VALUES (
    'WI-2026-0005', v_event_id, v_tier_id, v_cat_pekerja,
    'Dewi Kurniasih', '6287788991234', 'PT Maju Bersama',
    1, 75000, 75000, 'paid',
    '2026-10-13 11:30:00+07', '2026-10-13 11:45:00+07'
  ) RETURNING id INTO v_reg_id;

  INSERT INTO registration_participants (registration_id, shirt_size_id, slot_number) VALUES
    (v_reg_id, v_size_m, 1);

  INSERT INTO payments (
    registration_id, order_id, transaction_id,
    payment_type, bank, va_number,
    gross_amount, status, fraud_status,
    transaction_time, settlement_time, expiry_time
  ) VALUES (
    v_reg_id, 'WI-2026-0005', 'TXN-MDT-0005',
    'bank_transfer', 'BNI', '98765432109',
    75000, 'settlement', 'accept',
    '2026-10-13 11:30:00+07', '2026-10-13 11:45:00+07', '2026-10-14 11:30:00+07'
  );

END $$;
```

---

## 5. Useful Queries

```sql
-- Active quota count (used by Redis cache refresh job)
SELECT
  e.max_quota,
  COUNT(r.id) FILTER (WHERE r.status = 'paid') AS paid_count,
  e.max_quota - COUNT(r.id) FILTER (WHERE r.status = 'paid') AS remaining
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id
WHERE e.slug = 'walk-impact-2026'
GROUP BY e.id, e.max_quota;

-- Admin dashboard summary
SELECT
  COUNT(*) FILTER (WHERE status = 'paid')      AS total_paid,
  COUNT(*) FILTER (WHERE status = 'pending')   AS total_pending,
  COUNT(*) FILTER (WHERE status = 'expired')   AS total_expired,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS total_cancelled,
  SUM(total_amount) FILTER (WHERE status = 'paid') AS total_revenue
FROM registrations
WHERE event_id = (SELECT id FROM events WHERE slug = 'walk-impact-2026');

-- Shirt size distribution for logistics
SELECT
  ss.code,
  ss.label,
  COUNT(rp.id) AS total_qty
FROM registration_participants rp
JOIN shirt_sizes ss ON ss.id = rp.shirt_size_id
JOIN registrations r ON r.id = rp.registration_id
WHERE r.status = 'paid'
  AND r.event_id = (SELECT id FROM events WHERE slug = 'walk-impact-2026')
GROUP BY ss.id, ss.code, ss.label
ORDER BY ss.sort_order;

-- Admin participant export (full row)
SELECT
  r.registration_number,
  r.contact_name,
  r.contact_whatsapp,
  pc.label AS category,
  r.community_name,
  r.ticket_qty,
  r.total_amount,
  r.status,
  p.payment_type,
  p.bank,
  p.va_number,
  p.settlement_time,
  STRING_AGG(ss.code, ', ' ORDER BY rp.slot_number) AS shirt_sizes,
  r.created_at
FROM registrations r
JOIN participant_categories pc ON pc.id = r.category_id
LEFT JOIN payments p ON p.registration_id = r.id
LEFT JOIN registration_participants rp ON rp.registration_id = r.id
LEFT JOIN shirt_sizes ss ON ss.id = rp.shirt_size_id
WHERE r.event_id = (SELECT id FROM events WHERE slug = 'walk-impact-2026')
GROUP BY r.id, pc.label, p.id
ORDER BY r.created_at DESC;

-- Generate next registration number (atomic, used in API)
SELECT CONCAT(
  'WI-',
  EXTRACT(YEAR FROM NOW())::TEXT,
  '-',
  LPAD(
    (COUNT(*) + 1)::TEXT,
    4, '0'
  )
) AS next_number
FROM registrations
WHERE event_id = (SELECT id FROM events WHERE slug = 'walk-impact-2026');
```

---

## 6. CMS vs Static Reference Summary

| Table | Type | Who Changes It | Frequency |
|---|---|---|---|
| `shirt_sizes` | Static | Never / migration only | Never |
| `participant_categories` | Static+CMS | Admin (label only) | Rarely |
| `events` | CMS | Admin | Per-event / occasionally |
| `event_stats` | CMS | Admin | Per-event |
| `event_concepts` | CMS | Admin | Per-event |
| `event_rundowns` | CMS | Admin | Per-event / minor edits |
| `event_faqs` | CMS | Admin | Frequently during promo |
| `ticket_tiers` | CMS | Admin | Per-event / pricing changes |
| `registrations` | Transactional | App only | High frequency |
| `registration_participants` | Transactional | App only | High frequency |
| `payments` | Transactional | App + Midtrans webhook | High frequency |
| `payment_notifications` | Transactional (log) | Midtrans webhook only | High frequency |
