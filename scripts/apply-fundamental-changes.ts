import { neon } from '@neondatabase/serverless'
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

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!connectionString) {
  console.error('DATABASE_URL is not defined in .env.local')
  process.exit(1)
}

const sql = neon(connectionString)

async function applyFundamentalSchemaChanges() {
  console.log('Applying fundamental schema changes to Neon PostgreSQL...')

  // 1. admins
  await sql`
    CREATE TABLE IF NOT EXISTS admins (
      id             BIGSERIAL    PRIMARY KEY,
      name           VARCHAR(100) NOT NULL,
      email          VARCHAR(150) NOT NULL UNIQUE,
      password_hash  VARCHAR(255) NOT NULL,
      role           VARCHAR(50)  DEFAULT 'SUPERADMIN',
      status         VARCHAR(20)  DEFAULT 'ACTIVE',
      created_at     TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
    );
  `

  // 2. payment_methods
  await sql`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id             BIGSERIAL     PRIMARY KEY,
      code           VARCHAR(50)   NOT NULL UNIQUE,
      name           VARCHAR(100)  NOT NULL,
      logo_url       VARCHAR(255),
      type           VARCHAR(50)   NOT NULL,
      provider       VARCHAR(50)   NOT NULL,
      admin_fee_flat BIGINT        DEFAULT 0,
      admin_fee_pct  NUMERIC(5,2)  DEFAULT 0.00,
      is_active      BOOLEAN       DEFAULT TRUE,
      is_redirect    BOOLEAN       DEFAULT FALSE,
      sort_order     INT           DEFAULT 0
    );
  `

  // 3. payment_instructions
  await sql`
    CREATE TABLE IF NOT EXISTS payment_instructions (
      id                BIGSERIAL    PRIMARY KEY,
      payment_method_id BIGINT       NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
      title             VARCHAR(255) NOT NULL,
      content           TEXT         NOT NULL,
      sort_order        INT          DEFAULT 0,
      created_at        TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
    );
  `

  // 4. payment_logs
  await sql`
    CREATE TABLE IF NOT EXISTS payment_logs (
      id               BIGSERIAL    PRIMARY KEY,
      invoice_code     VARCHAR(50)  NOT NULL,
      endpoint         VARCHAR(255),
      type             VARCHAR(50),
      request_payload  TEXT,
      response_payload TEXT,
      http_status      INT,
      created_at       TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
    );
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_payment_logs_invoice ON payment_logs(invoice_code);`

  // 5. notification_templates
  await sql`
    CREATE TABLE IF NOT EXISTS notification_templates (
      id              BIGSERIAL    PRIMARY KEY,
      event_trigger   VARCHAR(50)  NOT NULL UNIQUE,
      channel         VARCHAR(20)  NOT NULL,
      message_content TEXT         NOT NULL,
      is_active       BOOLEAN      DEFAULT TRUE
    );
  `

  // 6. notification_logs
  await sql`
    CREATE TABLE IF NOT EXISTS notification_logs (
      id               BIGSERIAL    PRIMARY KEY,
      template_id      BIGINT       REFERENCES notification_templates(id) ON DELETE SET NULL,
      invoice_code     VARCHAR(50),
      recipient        VARCHAR(150) NOT NULL,
      channel          VARCHAR(20)  NOT NULL,
      request_payload  TEXT,
      response_payload TEXT,
      status           VARCHAR(20),
      created_at       TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
    );
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_notification_logs_template ON notification_logs(template_id);`
  await sql`CREATE INDEX IF NOT EXISTS idx_notification_logs_invoice ON notification_logs(invoice_code);`

  // 7. Update registrations table to merge order & payment fields into one unified table
  console.log('Ensuring unified registrations table (combining registration + payment gateway fields)...')
  await sql`
    ALTER TABLE registrations
      ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS admin_fee BIGINT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS payment_method_id BIGINT REFERENCES payment_methods(id),
      ADD COLUMN IF NOT EXISTS payment_method_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS bank VARCHAR(50),
      ADD COLUMN IF NOT EXISTS va_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS biller_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS bill_key VARCHAR(50),
      ADD COLUMN IF NOT EXISTS snap_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS qr_url TEXT,
      ADD COLUMN IF NOT EXISTS payment_url TEXT,
      ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS fraud_status VARCHAR(30),
      ADD COLUMN IF NOT EXISTS transaction_time TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS settlement_time TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS midtrans_response JSONB;
  `

  // 8. Update registration_participants to add bib_number, name, gender
  console.log('Updating registration_participants table with bib_number, name, gender...')
  await sql`
    ALTER TABLE registration_participants
      ADD COLUMN IF NOT EXISTS name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
      ADD COLUMN IF NOT EXISTS bib_number VARCHAR(20);
  `
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_registration_participants_bib ON registration_participants(bib_number);`

  // 9. Seeds: Admins
  console.log('Seeding admins...')
  await sql`
    INSERT INTO admins (id, name, email, password_hash, role, status, created_at) VALUES
      (1, 'Ahmad Fulan', 'ahmad@ngo.org', '$2a$12$Dummy', 'SUPERADMIN', 'ACTIVE', '2026-04-19 01:39:51.048594+00'),
      (2, 'Rina Keuangan', 'rina@ngo.org', '$2a$12$Dummy', 'FINANCE', 'ACTIVE', '2026-04-19 01:39:51.048594+00')
    ON CONFLICT (email) DO NOTHING;
  `

  // 10. Seeds: Payment Methods
  console.log('Seeding payment methods...')
  await sql`
    INSERT INTO payment_methods (id, code, name, logo_url, type, provider, admin_fee_flat, admin_fee_pct, is_active, is_redirect, sort_order) VALUES
      (1, 'GOPAY', 'GoPay', 'https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg', 'E-Wallet', 'Midtrans', 0, 0.00, true, false, 3),
      (2, 'BCA', 'BCA Virtual Account', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/bca9-IbKNyHu93Cn6SG23ej52n4WGSr9Q8i.jpg', 'va', 'Xendit', 0, 0.00, true, false, 4),
      (3, 'MANDIRI', 'Mandiri Virtual Account', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/mandiri-OiJcNXAXphLUz93kRkHBT0cDlelKq4.png', 'va', 'Xendit', 0, 0.00, true, false, 5),
      (4, 'BSI', 'BSI Virtual Account', 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg', 'va', 'Xendit', 0, 0.00, true, false, 2),
      (5, 'QR_CODE', 'QRIS Dynamic', 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg', 'qr_code', 'Xendit', 0, 0.00, true, false, 1),
      (6, 'SHOPEEPAY', 'ShopeePay', 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg', 'E-Wallet', 'Xendit', 0, 0.00, true, false, 6),
      (7, 'DANA', 'DANA', 'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg', 'E-Wallet', 'Xendit', 0, 0.00, true, false, 7),
      (8, 'LINKAJA', 'LinkAja', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/linkaja-logo-MQ0RdHT13BwF96O54LxltoM7rNK6JY.png', 'E-Wallet', 'Xendit', 0, 0.00, true, false, 8),
      (9, 'BRI', 'BRI Virtual Account', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/bri-PAGx45zIqEWTHhyJvBkbAXZouRYTfG.png', 'va', 'Xendit', 0, 0.00, true, false, 9),
      (10, 'BNI', 'BNI Virtual Account', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/bni-YU2aAc67bEdD0QHeYCWqhRRmpAErd0.png', 'va', 'Xendit', 0, 0.00, true, false, 10),
      (11, 'BJB', 'BJB Virtual Account', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/logo-bjb-5JyA52cVlLlt5wzrqmnqi012PX7CYu.png', 'va', 'Xendit', 0, 0.00, true, false, 11),
      (12, 'BNC', 'BNC Virtual Account', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/HematpayBNC-VxizZScZEL7HoFAGGe3R7XTkUTmDry.webp', 'va', 'Xendit', 0, 0.00, true, false, 12),
      (13, 'CIMB', 'CIMB Niaga Virtual Account', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/cimb-XgzzZPNYCj1lEgpL4qWDouCLTUwA4M.png', 'va', 'Xendit', 0, 0.00, true, false, 13),
      (14, 'MUAMALAT', 'Muamalat Virtual Account', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/muamalat-cYrxxhIFBpQYR2IIGIkIWV3KMsjDTP.png', 'va', 'Xendit', 0, 0.00, true, false, 14),
      (15, 'PERMATA', 'Permata Virtual Account', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/permata-0IaHmiPhtQlQLBmBp1vtp6nmfwosK2.jpg', 'va', 'Xendit', 0, 0.00, true, false, 15),
      (16, 'ALFAMART', 'Alfamart', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/alfamart-4jhk2YjGeoyKo8WEpjSrRNIB4Do5SL.png', 'retail_outlet', 'Xendit', 0, 0.00, true, false, 16),
      (17, 'INDOMARET', 'Indomaret', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/indomaret-6LTpkKX31ZqjHTVsiHwVow3jExN1ND.png', 'retail_outlet', 'Xendit', 0, 0.00, true, false, 17),
      (18, 'BCA_MANUAL', 'BCA (Transfer Manual)', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/bca9-Zi5EfD9vPgoDPwdsjIORMaXIj7mSoB.jpg', 'va', 'Manual', 0, 0.00, true, false, 18),
      (19, 'MANDIRI_MANUAL', 'Mandiri (Transfer Manual)', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/mandiri-qHIfJdlwKGHQU020btV9Yhr0iUwo4G.png', 'bank_transfer', 'Manual', 0, 0.00, true, false, 19)
    ON CONFLICT (code) DO NOTHING;
  `

  // 11. Seeds: Payment Instructions
  console.log('Seeding payment instructions...')
  await sql`
    INSERT INTO payment_instructions (id, payment_method_id, title, content, sort_order) VALUES
      (1, 2, 'Pembayaran via Mbanking', '<ol><li>Buka aplikasi BCA Mobile</li><li>Pilih m-BCA, lalu pilih m-Transfer</li><li>Masukkan nomor Virtual Account Anda</li><li>Klik tombol Kirim di pojok kanan atas untuk melanjutkan</li><li>Masukkan PIN m-BCA Anda</li></ol>', 1),
      (2, 2, 'Pembayaran via Ibanking', '<ol><li>Login ke KlikBCA Individual</li><li>Pilih menu Transfer, lalu pilih Transfer ke BCA Virtual Account</li><li>Masukkan nomor Virtual Account</li><li>Masukkan respon KEYBCA APPLI 1</li></ol>', 2),
      (3, 2, 'Pembayaran via Atm', '<ol><li>Masukkan kartu ATM BCA dan PIN Anda</li><li>Pilih menu Transaksi Lainnya > Transfer > Ke Rekening BCA Virtual Account</li><li>Masukkan nomor Virtual Account</li><li>Konfirmasi dan simpan struk</li></ol>', 3),
      (30, 1, 'Pembayaran via Gojek / GoPay', '<ol><li>Buka aplikasi Gojek / GoPay Anda.</li><li>Pilih menu <strong>Bayar / Scan</strong>.</li><li>Scan QR Code yang tampil di layar atau upload dari galeri.</li></ol>', 1),
      (34, 5, 'Pembayaran via QRIS', '<ol><li>Buka aplikasi pembayaran pilihan Anda (GoPay, OVO, DANA, LinkAja, BCA Mobile, dll).</li><li>Pilih menu <strong>Scan / Bayar</strong>.</li><li>Scan QR Code yang tampil di layar.</li><li>Konfirmasi pembayaran dan masukkan PIN Anda.</li></ol>', 1),
      (35, 18, 'Instruksi Transfer Manual BCA', '<ol><li>Transfer sesuai nominal ke Bank BCA: 1234567890 an Yayasan Peduli Sesama</li><li>Simpan bukti transfer Anda.</li><li>Konfirmasi pembayaran melalui WhatsApp.</li></ol>', 1)
    ON CONFLICT (id) DO NOTHING;
  `

  // 12. Seeds: Notification Templates
  console.log('Seeding notification templates...')
  await sql`
    INSERT INTO notification_templates (id, event_trigger, channel, message_content, is_active) VALUES
      (1, 'INVOICE_SUCCESS', 'WHATSAPP', 'Terima kasih {nama}, pendaftaran Walk Impact 2026 sebesar Rp {nominal} ({tiket_qty} tiket) via {metode} berhasil kami terima. No. Pendaftaran: {nomor_daftar}. Simpan nomor ini untuk pengambilan perlengkapan.', true),
      (2, 'INVOICE_PENDING', 'WHATSAPP', 'Halo {nama}, pendaftaran Walk Impact 2026 sebesar Rp {nominal} menunggu pembayaran. Silakan selesaikan pembayaran sebelum batas waktu.', true)
    ON CONFLICT (event_trigger) DO NOTHING;
  `

  console.log('Fundamental schema changes and seeds applied successfully!')
}

applyFundamentalSchemaChanges().catch((err) => {
  console.error('Error applying schema changes:', err)
  process.exit(1)
})
