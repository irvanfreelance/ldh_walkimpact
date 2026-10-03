import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'

export const dynamic = 'force-dynamic'

const VALID_TYPES = ['categories', 'shirt-sizes', 'payment-methods']

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Tipe master tidak valid' }, { status: 400 })
    }

    let rows: any[] = []
    if (type === 'categories') {
      rows = await sql`SELECT * FROM participant_categories ORDER BY sort_order ASC, id ASC`
    } else if (type === 'shirt-sizes') {
      rows = await sql`SELECT * FROM shirt_sizes ORDER BY sort_order ASC, id ASC`
    } else if (type === 'payment-methods') {
      rows = await sql`SELECT * FROM payment_methods ORDER BY sort_order ASC, id ASC`
    }

    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat master data' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Tipe master tidak valid' }, { status: 400 })
    }

    const body = await req.json()
    let inserted: any

    if (type === 'categories') {
      const { slug, label, description = '', is_active = true, sort_order = 0 } = body
      if (!slug || !label) {
        return NextResponse.json({ error: 'Slug dan Label kategori wajib diisi' }, { status: 400 })
      }
      const res = await sql`
        INSERT INTO participant_categories (slug, label, description, is_active, sort_order)
        VALUES (${slug.toLowerCase().trim()}, ${label}, ${description || null}, ${is_active}, ${parseInt(sort_order, 10) || 0})
        RETURNING *
      `
      inserted = res[0]
    } else if (type === 'shirt-sizes') {
      const { code, label, sort_order = 0 } = body
      if (!code || !label) {
        return NextResponse.json({ error: 'Kode dan Label ukuran baju wajib diisi' }, { status: 400 })
      }
      const res = await sql`
        INSERT INTO shirt_sizes (code, label, sort_order)
        VALUES (${code.toUpperCase().trim()}, ${label}, ${parseInt(sort_order, 10) || 0})
        RETURNING *
      `
      inserted = res[0]
    } else if (type === 'payment-methods') {
      const { code, name, logo_url = null, provider = 'Midtrans', type: payType = 'bank_transfer', admin_fee_flat = 0, is_active = true, sort_order = 0 } = body
      if (!code || !name) {
        return NextResponse.json({ error: 'Kode dan Nama metode pembayaran wajib diisi' }, { status: 400 })
      }
      const res = await sql`
        INSERT INTO payment_methods (code, name, logo_url, provider, type, admin_fee_flat, is_active, sort_order)
        VALUES (${code}, ${name}, ${logo_url || null}, ${provider}, ${payType}, ${parseInt(admin_fee_flat, 10) || 0}, ${is_active}, ${parseInt(sort_order, 10) || 0})
        RETURNING *
      `
      inserted = res[0]
    }

    // Auto-invalidate related caches and revalidate pages
    const { invalidateEventCache, invalidatePaymentMethodsCache } = await import('@/lib/cache/redis')
    await invalidatePaymentMethodsCache()
    await invalidateEventCache()

    return NextResponse.json({
      success: true,
      message: 'Master data berhasil ditambahkan',
      data: inserted,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menambahkan master data' },
      { status: 500 }
    )
  }
}
