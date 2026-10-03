import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'
import { invalidateEventCache } from '@/lib/cache/redis'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

const VALID_TYPES = ['faqs', 'rundowns', 'stats', 'concepts']

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Tipe CMS tidak valid' }, { status: 400 })
    }

    const itemId = parseInt(id, 10)
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    const body = await req.json()
    let updated: any

    if (type === 'faqs') {
      const { question, answer, category, sort_order, is_active } = body
      const res = await sql`
        UPDATE event_faqs
        SET
          question = COALESCE(${question}, question),
          answer = COALESCE(${answer}, answer),
          category = COALESCE(${category}, category),
          sort_order = CASE WHEN ${sort_order !== undefined} THEN ${parseInt(sort_order, 10)} ELSE sort_order END,
          is_active = CASE WHEN ${is_active !== undefined} THEN ${is_active} ELSE is_active END,
          updated_at = NOW()
        WHERE id = ${itemId}
        RETURNING *
      `
      updated = res[0]
    } else if (type === 'rundowns') {
      const { start_time, end_time, activity, description, sort_order } = body
      const res = await sql`
        UPDATE event_rundowns
        SET
          start_time = COALESCE(${start_time}, start_time),
          end_time = COALESCE(${end_time}, end_time),
          activity = COALESCE(${activity}, activity),
          description = COALESCE(${description}, description),
          sort_order = CASE WHEN ${sort_order !== undefined} THEN ${parseInt(sort_order, 10)} ELSE sort_order END,
          updated_at = NOW()
        WHERE id = ${itemId}
        RETURNING *
      `
      updated = res[0]
    } else if (type === 'stats') {
      const { icon_name, value, label, description, sort_order } = body
      const res = await sql`
        UPDATE event_stats
        SET
          icon_name = COALESCE(${icon_name}, icon_name),
          value = COALESCE(${value}, value),
          label = COALESCE(${label}, label),
          description = COALESCE(${description}, description),
          sort_order = CASE WHEN ${sort_order !== undefined} THEN ${parseInt(sort_order, 10)} ELSE sort_order END,
          updated_at = NOW()
        WHERE id = ${itemId}
        RETURNING *
      `
      updated = res[0]
    } else if (type === 'concepts') {
      const { icon_name, title, body: contentBody, sort_order } = body
      const res = await sql`
        UPDATE event_concepts
        SET
          icon_name = COALESCE(${icon_name}, icon_name),
          title = COALESCE(${title}, title),
          body = COALESCE(${contentBody}, body),
          sort_order = CASE WHEN ${sort_order !== undefined} THEN ${parseInt(sort_order, 10)} ELSE sort_order END,
          updated_at = NOW()
        WHERE id = ${itemId}
        RETURNING *
      `
      updated = res[0]
    }

    if (!updated) {
      return NextResponse.json({ error: 'Item CMS tidak ditemukan' }, { status: 404 })
    }

    await invalidateEventCache()
    revalidatePath('/')

    return NextResponse.json({
      success: true,
      message: 'Data CMS berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui CMS' },
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
      return NextResponse.json({ error: 'Tipe CMS tidak valid' }, { status: 400 })
    }

    const itemId = parseInt(id, 10)
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    if (type === 'faqs') {
      await sql`DELETE FROM event_faqs WHERE id = ${itemId}`
    } else if (type === 'rundowns') {
      await sql`DELETE FROM event_rundowns WHERE id = ${itemId}`
    } else if (type === 'stats') {
      await sql`DELETE FROM event_stats WHERE id = ${itemId}`
    } else if (type === 'concepts') {
      await sql`DELETE FROM event_concepts WHERE id = ${itemId}`
    }

    await invalidateEventCache()
    revalidatePath('/')

    return NextResponse.json({
      success: true,
      message: 'Item berhasil dihapus',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus item CMS' },
      { status: 500 }
    )
  }
}
