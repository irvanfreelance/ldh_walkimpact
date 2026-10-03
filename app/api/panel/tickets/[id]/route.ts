import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'
import { invalidateEventCache } from '@/lib/cache/redis'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tierId = parseInt(id, 10)
    if (isNaN(tierId)) {
      return NextResponse.json({ error: 'ID tiket tidak valid' }, { status: 400 })
    }

    const body = await req.json()
    const {
      name,
      description,
      price,
      max_per_order,
      available_from,
      available_until,
      is_active,
      sort_order,
    } = body

    const updated = await sql`
      UPDATE ticket_tiers
      SET
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        price = CASE WHEN ${price !== undefined} THEN ${price ? parseInt(price, 10) : 0} ELSE price END,
        max_per_order = CASE WHEN ${max_per_order !== undefined} THEN ${parseInt(max_per_order, 10)} ELSE max_per_order END,
        available_from = CASE WHEN ${available_from !== undefined} THEN ${available_from ? new Date(available_from).toISOString() : null} ELSE available_from END,
        available_until = CASE WHEN ${available_until !== undefined} THEN ${available_until ? new Date(available_until).toISOString() : null} ELSE available_until END,
        is_active = CASE WHEN ${is_active !== undefined} THEN ${is_active} ELSE is_active END,
        sort_order = CASE WHEN ${sort_order !== undefined} THEN ${parseInt(sort_order, 10)} ELSE sort_order END,
        updated_at = NOW()
      WHERE id = ${tierId}
      RETURNING *
    `

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Tiket tidak ditemukan' }, { status: 404 })
    }

    await invalidateEventCache()
    revalidatePath('/')
    revalidatePath('/daftar')

    return NextResponse.json({
      success: true,
      message: 'Tiket berhasil diperbarui',
      data: updated[0],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui tiket' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tierId = parseInt(id, 10)
    if (isNaN(tierId)) {
      return NextResponse.json({ error: 'ID tiket tidak valid' }, { status: 400 })
    }

    // Check if any registrations use this ticket
    const check = await sql`
      SELECT count(*)::int AS count FROM registrations WHERE ticket_tier_id = ${tierId}
    `
    if (Number(check[0]?.count || 0) > 0) {
      return NextResponse.json(
        { error: 'Tiket tidak dapat dihapus karena sudah ada data pendaftaran yang menggunakannya. Anda dapat menonaktifkannya saja.' },
        { status: 400 }
      )
    }

    await sql`DELETE FROM ticket_tiers WHERE id = ${tierId}`

    await invalidateEventCache()
    revalidatePath('/')
    revalidatePath('/daftar')

    return NextResponse.json({
      success: true,
      message: 'Tiket berhasil dihapus',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus tiket' },
      { status: 500 }
    )
  }
}
