import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import sql from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || ''

    const rows = await sql`
      SELECT
        r.registration_number     AS "No. Registrasi",
        r.contact_name            AS "Nama Pemesan",
        r.contact_whatsapp        AS "No. WhatsApp",
        r.contact_email           AS "Email",
        COALESCE(pc.label, '-')   AS "Kategori",
        COALESCE(r.community_name, '-') AS "Komunitas",
        tt.name                   AS "Tiket",
        r.ticket_qty              AS "Jumlah Tiket",
        r.unit_price              AS "Harga Satuan",
        r.total_amount            AS "Total Bayar",
        r.status                  AS "Status",
        COALESCE(r.payment_type, '-') AS "Tipe Pembayaran",
        COALESCE(r.bank, '-')     AS "Bank/Channel",
        COALESCE(r.va_number, '-') AS "No VA/Billing",
        r.paid_at                 AS "Waktu Lunas",
        rp.slot_number            AS "Slot Ke",
        COALESCE(rp.name, '-')    AS "Nama Peserta",
        COALESCE(rp.gender, '-')  AS "Gender",
        COALESCE(ss.code, '-')    AS "Ukuran Kaos",
        COALESCE(rp.bib_number, '-') AS "No. BIB",
        r.created_at              AS "Tanggal Daftar"
      FROM registrations r
      LEFT JOIN participant_categories pc         ON pc.id = r.category_id
      LEFT JOIN ticket_tiers tt                   ON tt.id = r.ticket_tier_id
      LEFT JOIN registration_participants rp      ON rp.registration_id = r.id
      LEFT JOIN shirt_sizes ss                    ON ss.id = rp.shirt_size_id
      WHERE (${status} = '' OR r.status = ${status})
      ORDER BY r.created_at DESC, rp.slot_number ASC
    `

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Peserta Walk Impact')

    // Generate buffer
    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const dateStr = new Date().toISOString().slice(0, 10)
    const filename = `Peserta-WalkImpact-Export-${dateStr}.xlsx`

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal export data peserta' },
      { status: 500 }
    )
  }
}
