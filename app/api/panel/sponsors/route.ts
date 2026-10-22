import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM sponsors ORDER BY display_order ASC, id ASC`
    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal memuat data sponsor' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const name = formData.get('name') as string
    const displayOrder = parseInt((formData.get('display_order') as string) || '0', 10)
    const file = formData.get('logo') as File | null

    if (!name || !file) {
      return NextResponse.json({ error: 'Nama dan logo wajib diisi' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Format file tidak didukung. Gunakan PNG, JPG, WEBP, atau SVG.' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Ukuran file maksimal 2MB.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const logoUrl = `data:${file.type};base64,${base64}`

    const [row] = await sql`
      INSERT INTO sponsors (name, logo_url, display_order, is_active)
      VALUES (${name}, ${logoUrl}, ${displayOrder}, true)
      RETURNING *
    `

    return NextResponse.json(row, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal menyimpan sponsor' }, { status: 500 })
  }
}
