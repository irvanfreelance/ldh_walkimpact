import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'
import { invalidateEventCache } from '@/lib/cache/redis'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

const VALID_TYPES = ['faqs', 'rundowns', 'stats', 'concepts']

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Tipe CMS tidak valid' }, { status: 400 })
    }

    let rows: any[] = []
    if (type === 'faqs') {
      rows = await sql`SELECT * FROM event_faqs ORDER BY sort_order ASC, id ASC`
    } else if (type === 'rundowns') {
      rows = await sql`SELECT * FROM event_rundowns ORDER BY sort_order ASC, start_time ASC`
    } else if (type === 'stats') {
      rows = await sql`SELECT * FROM event_stats ORDER BY sort_order ASC, id ASC`
    } else if (type === 'concepts') {
      rows = await sql`SELECT * FROM event_concepts ORDER BY sort_order ASC, id ASC`
    }

    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat data CMS' },
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
      return NextResponse.json({ error: 'Tipe CMS tidak valid' }, { status: 400 })
    }

    const body = await req.json()
    const eventId = body.event_id || 1
    let inserted: any

    if (type === 'faqs') {
      const { question, answer, category = 'general', sort_order = 0, is_active = true } = body
      if (!question || !answer) {
        return NextResponse.json({ error: 'Pertanyaan dan jawaban wajib diisi' }, { status: 400 })
      }
      const res = await sql`
        INSERT INTO event_faqs (event_id, question, answer, category, sort_order, is_active)
        VALUES (${eventId}, ${question}, ${answer}, ${category}, ${parseInt(sort_order, 10) || 0}, ${is_active})
        RETURNING *
      `
      inserted = res[0]
    } else if (type === 'rundowns') {
      const { start_time, end_time, activity, description = '', sort_order = 0 } = body
      if (!start_time || !end_time || !activity) {
        return NextResponse.json({ error: 'Jam mulai, jam selesai, dan aktivitas wajib diisi' }, { status: 400 })
      }
      const res = await sql`
        INSERT INTO event_rundowns (event_id, start_time, end_time, activity, description, sort_order)
        VALUES (${eventId}, ${start_time}, ${end_time}, ${activity}, ${description || null}, ${parseInt(sort_order, 10) || 0})
        RETURNING *
      `
      inserted = res[0]
    } else if (type === 'stats') {
      const { icon_name = 'award', value, label, description = '', sort_order = 0 } = body
      if (!value || !label) {
        return NextResponse.json({ error: 'Value dan label wajib diisi' }, { status: 400 })
      }
      const res = await sql`
        INSERT INTO event_stats (event_id, icon_name, value, label, description, sort_order)
        VALUES (${eventId}, ${icon_name}, ${value}, ${label}, ${description || null}, ${parseInt(sort_order, 10) || 0})
        RETURNING *
      `
      inserted = res[0]
    } else if (type === 'concepts') {
      const { icon_name = 'star', title, body: contentBody, sort_order = 0 } = body
      if (!title || !contentBody) {
        return NextResponse.json({ error: 'Judul dan konten wajib diisi' }, { status: 400 })
      }
      const res = await sql`
        INSERT INTO event_concepts (event_id, icon_name, title, body, sort_order)
        VALUES (${eventId}, ${icon_name}, ${title}, ${contentBody}, ${parseInt(sort_order, 10) || 0})
        RETURNING *
      `
      inserted = res[0]
    }

    await invalidateEventCache()
    revalidatePath('/')

    return NextResponse.json({
      success: true,
      message: 'Data CMS berhasil ditambahkan',
      data: inserted,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menambahkan data CMS' },
      { status: 500 }
    )
  }
}
