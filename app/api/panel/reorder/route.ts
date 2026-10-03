import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'
import { invalidateEventCache } from '@/lib/cache/redis'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, items } = body // type: 'faqs' | 'rundowns' | 'stats' | 'concepts' | 'tickets'
    // items: Array<{ id: number, sort_order: number }>

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array required' }, { status: 400 })
    }

    if (type === 'faqs') {
      for (const item of items) {
        await sql`UPDATE event_faqs SET sort_order = ${item.sort_order} WHERE id = ${item.id}`
      }
    } else if (type === 'rundowns') {
      for (const item of items) {
        await sql`UPDATE event_rundowns SET sort_order = ${item.sort_order} WHERE id = ${item.id}`
      }
    } else if (type === 'stats') {
      for (const item of items) {
        await sql`UPDATE event_stats SET sort_order = ${item.sort_order} WHERE id = ${item.id}`
      }
    } else if (type === 'concepts') {
      for (const item of items) {
        await sql`UPDATE event_concepts SET sort_order = ${item.sort_order} WHERE id = ${item.id}`
      }
    } else if (type === 'tickets') {
      for (const item of items) {
        await sql`UPDATE ticket_tiers SET sort_order = ${item.sort_order} WHERE id = ${item.id}`
      }
    } else if (type === 'payment-methods' || type === 'payment_methods') {
      for (const item of items) {
        await sql`UPDATE payment_methods SET sort_order = ${item.sort_order} WHERE id = ${item.id}`
      }
      const { invalidatePaymentMethodsCache } = await import('@/lib/cache/redis')
      await invalidatePaymentMethodsCache()
    } else {
      return NextResponse.json({ error: 'Tipe tidak didukung' }, { status: 400 })
    }

    await invalidateEventCache()

    return NextResponse.json({
      success: true,
      message: 'Urutan berhasil disimpan & cache diperbarui',
    })
  } catch (error: any) {
    console.error('Error reordering:', error)
    return NextResponse.json(
      { error: error?.message || 'Gagal mengubah urutan' },
      { status: 500 }
    )
  }
}
