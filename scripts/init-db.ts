import fs from 'fs'
import path from 'path'

if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=')
          const key = trimmed.slice(0, idx).trim()
          let val = trimmed.slice(idx + 1).trim()
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1)
          }
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    }
  } catch (e) {
    console.warn('Could not read .env.local', e)
  }
}

import { neon } from '@neondatabase/serverless'

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!connectionString) {
  console.error('DATABASE_URL is not defined in .env.local')
  process.exit(1)
}

const sql = neon(connectionString)

async function runInit() {
  console.log('Connecting to Neon PostgreSQL and creating schema...')

  // Extensions
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`

  // 1. shirt_sizes
  await sql`
    CREATE TABLE IF NOT EXISTS shirt_sizes (
      id           BIGSERIAL    PRIMARY KEY,
      code         VARCHAR(10)  NOT NULL UNIQUE,
      label        VARCHAR(20)  NOT NULL,
      sort_order   INT          NOT NULL DEFAULT 0,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `

  // 2. participant_categories
  await sql`
    CREATE TABLE IF NOT EXISTS participant_categories (
      id           BIGSERIAL    PRIMARY KEY,
      slug         VARCHAR(50)  NOT NULL UNIQUE,
      label        VARCHAR(100) NOT NULL,
      description  TEXT,
      is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
      sort_order   INT          NOT NULL DEFAULT 0,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `

  // 3. events
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id                          BIGSERIAL    PRIMARY KEY,
      slug                        VARCHAR(100) NOT NULL UNIQUE,
      name                        VARCHAR(255) NOT NULL,
      tagline                     VARCHAR(255),
      description                 TEXT,
      hero_image_url              TEXT,
      event_date                  DATE         NOT NULL,
      assembly_time               TIME         NOT NULL,
      start_time                  TIME         NOT NULL,
      end_time                    TIME         NOT NULL,
      timezone                    VARCHAR(50)  NOT NULL DEFAULT 'Asia/Jakarta',
      venue_name                  VARCHAR(255) NOT NULL,
      venue_address               TEXT         NOT NULL,
      venue_city                  VARCHAR(100) NOT NULL DEFAULT 'Bandung',
      venue_maps_url              TEXT,
      route_km                    NUMERIC(4,1) NOT NULL DEFAULT 7.0,
      max_quota                   INT          NOT NULL DEFAULT 750,
      registration_opens_at       TIMESTAMPTZ  NOT NULL,
      registration_closes_at      TIMESTAMPTZ  NOT NULL,
      rpc_starts_at               TIMESTAMPTZ,
      rpc_ends_at                 TIMESTAMPTZ,
      rpc_location_note           TEXT,
      contact_name                VARCHAR(255),
      contact_whatsapp            VARCHAR(20),
      meta_title                  VARCHAR(255),
      meta_description            TEXT,
      og_image_url                TEXT,
      is_active                   BOOLEAN      NOT NULL DEFAULT TRUE,
      created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `

  // 4. event_stats
  await sql`
    CREATE TABLE IF NOT EXISTS event_stats (
      id           BIGSERIAL    PRIMARY KEY,
      event_id     BIGINT       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      icon_name    VARCHAR(50)  NOT NULL,
      value        VARCHAR(50)  NOT NULL,
      label        VARCHAR(255) NOT NULL,
      description  TEXT,
      sort_order   INT          NOT NULL DEFAULT 0,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `

  // 5. event_concepts
  await sql`
    CREATE TABLE IF NOT EXISTS event_concepts (
      id           BIGSERIAL    PRIMARY KEY,
      event_id     BIGINT       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      icon_name    VARCHAR(50),
      title        VARCHAR(255) NOT NULL,
      body         TEXT         NOT NULL,
      sort_order   INT          NOT NULL DEFAULT 0,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `

  // 6. event_rundowns
  await sql`
    CREATE TABLE IF NOT EXISTS event_rundowns (
      id           BIGSERIAL    PRIMARY KEY,
      event_id     BIGINT       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      icon_name    VARCHAR(50),
      start_time   TIME         NOT NULL,
      end_time     TIME         NOT NULL,
      activity     VARCHAR(255) NOT NULL,
      description  TEXT,
      sort_order   INT          NOT NULL DEFAULT 0,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `

  // 7. event_faqs
  await sql`
    CREATE TABLE IF NOT EXISTS event_faqs (
      id           BIGSERIAL    PRIMARY KEY,
      event_id     BIGINT       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      question     TEXT         NOT NULL,
      answer       TEXT         NOT NULL,
      category     VARCHAR(50)  NOT NULL DEFAULT 'general',
      sort_order   INT          NOT NULL DEFAULT 0,
      is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `

  // 8. ticket_tiers
  await sql`
    CREATE TABLE IF NOT EXISTS ticket_tiers (
      id               BIGSERIAL    PRIMARY KEY,
      event_id         BIGINT       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name             VARCHAR(100) NOT NULL,
      description      TEXT,
      price            BIGINT       NOT NULL,
      max_per_order    INT          NOT NULL DEFAULT 5,
      available_from   TIMESTAMPTZ  NOT NULL,
      available_until  TIMESTAMPTZ  NOT NULL,
      is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
      sort_order       INT          NOT NULL DEFAULT 0,
      created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `

  // 9. registrations
  await sql`
    CREATE TABLE IF NOT EXISTS registrations (
      id                    BIGSERIAL    PRIMARY KEY,
      registration_number   VARCHAR(20)  NOT NULL UNIQUE,
      event_id              BIGINT       NOT NULL REFERENCES events(id),
      ticket_tier_id        BIGINT       NOT NULL REFERENCES ticket_tiers(id),
      category_id           BIGINT       NOT NULL REFERENCES participant_categories(id),
      contact_name          VARCHAR(255) NOT NULL,
      contact_whatsapp      VARCHAR(20)  NOT NULL,
      community_name        VARCHAR(255),
      ticket_qty            INT          NOT NULL DEFAULT 1,
      unit_price            BIGINT       NOT NULL,
      total_amount          BIGINT       NOT NULL,
      status                VARCHAR(30)  NOT NULL DEFAULT 'pending',
      ip_address            VARCHAR(45),
      user_agent            TEXT,
      referrer_url          TEXT,
      created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      paid_at               TIMESTAMPTZ,
      expired_at            TIMESTAMPTZ,
      cancelled_at          TIMESTAMPTZ,
      cancel_reason         TEXT
    );
  `

  // 10. registration_participants
  await sql`
    CREATE TABLE IF NOT EXISTS registration_participants (
      id               BIGSERIAL PRIMARY KEY,
      registration_id  BIGINT    NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
      shirt_size_id    BIGINT    NOT NULL REFERENCES shirt_sizes(id),
      slot_number      INT       NOT NULL DEFAULT 1,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (registration_id, slot_number)
    );
  `

  // 11. payments
  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id                  BIGSERIAL    PRIMARY KEY,
      registration_id     BIGINT       NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
      order_id            VARCHAR(100) NOT NULL UNIQUE,
      transaction_id      VARCHAR(255),
      snap_token          VARCHAR(255),
      payment_type        VARCHAR(50),
      bank                VARCHAR(50),
      va_number           VARCHAR(50),
      biller_code         VARCHAR(50),
      bill_key            VARCHAR(50),
      gross_amount        BIGINT       NOT NULL,
      status              VARCHAR(30)  NOT NULL DEFAULT 'pending',
      fraud_status        VARCHAR(30),
      transaction_time    TIMESTAMPTZ,
      settlement_time     TIMESTAMPTZ,
      expiry_time         TIMESTAMPTZ,
      midtrans_response   JSONB,
      created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `

  // 12. payment_notifications
  await sql`
    CREATE TABLE IF NOT EXISTS payment_notifications (
      id                   BIGSERIAL    PRIMARY KEY,
      payment_id           BIGINT       REFERENCES payments(id),
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
  `

  // Indexes
  console.log('Creating indexes...')
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_reg_number ON registrations(registration_number);`
  await sql`CREATE INDEX IF NOT EXISTS idx_registrations_event_status ON registrations(event_id, status);`
  await sql`CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);`
  await sql`CREATE INDEX IF NOT EXISTS idx_registrations_contact_whatsapp ON registrations(contact_whatsapp);`
  await sql`CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);`
  await sql`CREATE INDEX IF NOT EXISTS idx_registrations_category_id ON registrations(category_id);`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);`
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_registration_id ON payments(registration_id);`
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);`
  await sql`CREATE INDEX IF NOT EXISTS idx_event_stats_event_id ON event_stats(event_id, sort_order);`
  await sql`CREATE INDEX IF NOT EXISTS idx_event_concepts_event_id ON event_concepts(event_id, sort_order);`
  await sql`CREATE INDEX IF NOT EXISTS idx_event_rundowns_event_id ON event_rundowns(event_id, sort_order);`
  await sql`CREATE INDEX IF NOT EXISTS idx_event_faqs_event_active ON event_faqs(event_id, is_active, sort_order);`

  // Seed Data
  console.log('Seeding initial reference data...')

  // Shirt sizes
  await sql`
    INSERT INTO shirt_sizes (code, label, sort_order) VALUES
      ('S',   'Small',    1),
      ('M',   'Medium',   2),
      ('L',   'Large',    3),
      ('XL',  'X-Large',  4),
      ('XXL', 'XX-Large', 5)
    ON CONFLICT (code) DO NOTHING;
  `

  // Participant categories
  await sql`
    INSERT INTO participant_categories (slug, label, description, sort_order) VALUES
      ('keluarga',   'Keluarga',           'Peserta yang mendaftar bersama keluarga',          1),
      ('komunitas',  'Komunitas',          'Anggota komunitas olahraga atau sosial',           2),
      ('pelajar',    'Pelajar & Mahasiswa', 'Pelajar SMA, mahasiswa, atau civitas akademika',  3),
      ('pekerja',    'Pekerja',            'Karyawan perusahaan atau profesional',             4),
      ('umum',       'Masyarakat Umum',    'Peserta umum dari berbagai latar belakang',        5)
    ON CONFLICT (slug) DO NOTHING;
  `

  // Events
  await sql`
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
    )
    ON CONFLICT (slug) DO NOTHING;
  `

  // Event stats
  await sql`
    INSERT INTO event_stats (event_id, icon_name, value, label, description, sort_order)
    SELECT e.id, s.icon_name, s.value, s.label, s.description, s.sort_order
    FROM events e, (VALUES
      ('footprints', '7 KM',           'Jarak Tempuh',        'Berjalan bersama untuk hidup lebih sehat',                    1),
      ('box',        '1.000 Paket',    'Paket Sembako',        'Didistribusikan untuk warga yang membutuhkan',                2),
      ('users',      '3.000 Jiwa',     'Penerima Manfaat',     'Penerima manfaat di sekitar Batununggal, Bandung',            3)
    ) AS s(icon_name, value, label, description, sort_order)
    WHERE e.slug = 'walk-impact-2026'
    AND NOT EXISTS (SELECT 1 FROM event_stats WHERE event_id = e.id);
  `

  // Event concepts
  await sql`
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
    WHERE e.slug = 'walk-impact-2026'
    AND NOT EXISTS (SELECT 1 FROM event_concepts WHERE event_id = e.id);
  `

  // Event rundowns
  await sql`
    INSERT INTO event_rundowns (event_id, icon_name, start_time, end_time, activity, sort_order)
    SELECT e.id, r.icon_name, r.start_time::TIME, r.end_time::TIME, r.activity, r.sort_order
    FROM events e, (VALUES
      ('clipboard-list', '06:00', '06:30', 'Registrasi Peserta',              1),
      ('users',          '06:30', '07:00', 'Pemanasan Bersama',               2),
      ('footprints',     '07:00', '09:00', 'Walk Impact 7KM',                 3),
      ('music',          '09:00', '11:00', 'Panggung Komunitas dan Hiburan',  4),
      ('gift',           '11:00', '12:00', 'Penyerahan Paket Sembako',        5)
    ) AS r(icon_name, start_time, end_time, activity, sort_order)
    WHERE e.slug = 'walk-impact-2026'
    AND NOT EXISTS (SELECT 1 FROM event_rundowns WHERE event_id = e.id);
  `

  // Event faqs
  await sql`
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
    WHERE e.slug = 'walk-impact-2026'
    AND NOT EXISTS (SELECT 1 FROM event_faqs WHERE event_id = e.id);
  `

  // Ticket tiers
  await sql`
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
    WHERE e.slug = 'walk-impact-2026'
    AND NOT EXISTS (SELECT 1 FROM ticket_tiers WHERE event_id = e.id);
  `

  console.log('Database initialization and seeding completed successfully!')
}

runInit().catch((err) => {
  console.error('Error during init:', err)
  process.exit(1)
})
