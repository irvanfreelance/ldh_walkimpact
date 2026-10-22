import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import sql from '@/lib/db/client'

export const dynamic = 'force-dynamic'

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

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const allowedExts = ['png', 'jpg', 'jpeg', 'webp', 'svg']
    if (!allowedExts.includes(ext)) {
      return NextResponse.json({ error: 'Format file tidak didukung. Gunakan PNG, JPG, WEBP, atau SVG.' }, { status: 400 })
    }

    const filename = `${randomUUID()}.${ext}`
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'sponsors')
    const bytes = await file.arrayBuffer()
    await writeFile(join(uploadDir, filename), Buffer.from(bytes))

    const logoUrl = `/uploads/sponsors/${filename}`

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
