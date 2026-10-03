import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'

export const dynamic = 'force-dynamic'

const VALID_TYPES = ['categories', 'shirt-sizes', 'payment-methods']

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Tipe master tidak valid' }, { status: 400 })
    }

    const itemId = parseInt(id, 10)
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    const body = await req.json()
    let updated: any

    if (type === 'categories') {
      const { slug, label, description, is_active, sort_order } = body
      const res = await sql`
        UPDATE participant_categories
        SET
          slug = COALESCE(${slug ? slug.toLowerCase().trim() : null}, slug),
          label = COALESCE(${label}, label),
          description = COALESCE(${description}, description),
          is_active = CASE WHEN ${is_active !== undefined} THEN ${is_active} ELSE is_active END,
          sort_order = CASE WHEN ${sort_order !== undefined} THEN ${parseInt(sort_order, 10)} ELSE sort_order END,
          updated_at = NOW()
        WHERE id = ${itemId}
        RETURNING *
      `
      updated = res[0]
    } else if (type === 'shirt-sizes') {
      const { code, label, sort_order } = body
      const res = await sql`
        UPDATE shirt_sizes
        SET
          code = COALESCE(${code ? code.toUpperCase().trim() : null}, code),
          label = COALESCE(${label}, label),
          sort_order = CASE WHEN ${sort_order !== undefined} THEN ${parseInt(sort_order, 10)} ELSE sort_order END
        WHERE id = ${itemId}
        RETURNING *
      `
      updated = res[0]
    } else if (type === 'payment-methods') {
      const { code, name, logo_url, provider, type: payType, admin_fee_flat, is_active, sort_order } = body
      const res = await sql`
        UPDATE payment_methods
        SET
          code = COALESCE(${code}, code),
          name = COALESCE(${name}, name),
          logo_url = CASE WHEN ${logo_url !== undefined} THEN ${logo_url || null} ELSE logo_url END,
          provider = COALESCE(${provider}, provider),
          type = COALESCE(${payType}, type),
          admin_fee_flat = CASE WHEN ${admin_fee_flat !== undefined} THEN ${parseInt(admin_fee_flat, 10)} ELSE admin_fee_flat END,
          is_active = CASE WHEN ${is_active !== undefined} THEN ${is_active} ELSE is_active END,
          sort_order = CASE WHEN ${sort_order !== undefined} THEN ${parseInt(sort_order, 10)} ELSE sort_order END
        WHERE id = ${itemId}
        RETURNING *
      `
      updated = res[0]
    }

    if (!updated) {
      return NextResponse.json({ error: 'Data master tidak ditemukan' }, { status: 404 })
    }

    const { invalidateEventCache, invalidatePaymentMethodsCache } = await import('@/lib/cache/redis')
    await invalidatePaymentMethodsCache()
    await invalidateEventCache()

    return NextResponse.json({
      success: true,
      message: 'Master data berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui master data' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Tipe master tidak valid' }, { status: 400 })
    }

    const itemId = parseInt(id, 10)
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    if (type === 'categories') {
      const check = await sql`SELECT count(*)::int AS count FROM registrations WHERE category_id = ${itemId}`
      if (Number(check[0]?.count || 0) > 0) {
        return NextResponse.json({ error: 'Kategori tidak dapat dihapus karena sudah dipakai oleh peserta' }, { status: 400 })
      }
      await sql`DELETE FROM participant_categories WHERE id = ${itemId}`
    } else if (type === 'shirt-sizes') {
      const check = await sql`SELECT count(*)::int AS count FROM registration_participants WHERE shirt_size_id = ${itemId}`
      if (Number(check[0]?.count || 0) > 0) {
        return NextResponse.json({ error: 'Ukuran kaos tidak dapat dihapus karena sudah dipakai oleh peserta' }, { status: 400 })
      }
      await sql`DELETE FROM shirt_sizes WHERE id = ${itemId}`
    } else if (type === 'payment-methods') {
      await sql`DELETE FROM payment_methods WHERE id = ${itemId}`
    }

    const { invalidateEventCache, invalidatePaymentMethodsCache } = await import('@/lib/cache/redis')
    await invalidatePaymentMethodsCache()
    await invalidateEventCache()

    return NextResponse.json({
      success: true,
      message: 'Master data berhasil dihapus',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus master data' },
      { status: 500 }
    )
  }
}
