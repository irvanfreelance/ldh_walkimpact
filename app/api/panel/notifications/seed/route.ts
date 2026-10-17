import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'

export const dynamic = 'force-dynamic'

const SUCCESS_CONTENT = JSON.stringify({
  subject: '✅ Pendaftaran Berhasil – {nama_program} | {nomor_daftar}',
  header_title: '✅ Pendaftaran Berhasil!',
  body: 'Pembayaran Kakak telah berhasil kami terima. Terima kasih telah mendaftar acara {nama_program} – Walk Together and Create Impact! sekaligus ikut berbagi paket sembako secara langsung kepada keluarga yang membutuhkan.',
  barcode_note: 'Mohon simpan barcode untuk proses penukaran jersey {nama_program} dan tunjukkan saat pengambilan jersey.',
  jersey_heading: 'Pengambilan Jersey',
  jersey_contact: 'Info selengkapnya: Instagram @lazdarulhikam',
  cta_note: 'Sampai bertemu di {nama_program}! Download barcode penukaran jersey melalui button di bawah ini.',
  cta_label: 'Download Barcode',
  footer: 'LAZ Darul Hikam — Bersama Membantu Sesama',
})

const PENDING_CONTENT = JSON.stringify({
  subject: '⏳ Selesaikan Pembayaran – {nama_program} | {nomor_daftar}',
  header_title: '⏳ Selesaikan Pembayaran Anda',
  body: 'Terima kasih telah mendaftar acara {nama_program}. Pendaftaran Kakak belum aktif sampai pembayaran diselesaikan. Segera lakukan pembayaran sesuai instruksi berikut ini.',
  barcode_note: 'Konfirmasi pembayaran dilakukan otomatis oleh sistem setelah transfer diterima. Kakak akan mendapat email konfirmasi terpisah setelah pembayaran berhasil.',
  jersey_heading: 'Cek Status Pembayaran',
  jersey_contact: 'Info selengkapnya: Instagram @lazdarulhikam',
  cta_note: 'Klik tombol di bawah untuk melihat status dan instruksi pembayaran lengkap.',
  cta_label: 'Cek Status Pembayaran',
  footer: 'LAZ Darul Hikam — Bersama Membantu Sesama',
})

export async function POST() {
  try {
    await sql`
      INSERT INTO notification_templates (event_trigger, channel, message_content, is_active)
      VALUES
        ('EMAIL_INVOICE_SUCCESS', 'EMAIL', ${SUCCESS_CONTENT}, true),
        ('EMAIL_INVOICE_PENDING', 'EMAIL', ${PENDING_CONTENT}, true)
      ON CONFLICT (event_trigger) DO NOTHING
    `

    return NextResponse.json({ success: true, message: 'Email templates seeded' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal seed email templates' },
      { status: 500 }
    )
  }
}
