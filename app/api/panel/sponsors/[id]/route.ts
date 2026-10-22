import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const VALID_ROLES = ['penyelenggara', 'pendukung']

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await req.formData()
    const name = formData.get('name') as string
    const role = (formData.get('role') as string) || 'pendukung'
    const displayOrder = parseInt((formData.get('display_order') as string) || '0', 10)
    const isActive = formData.get('is_active') === 'true'
    const file = formData.get('logo') as File | null

    if (!name) {
      return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 })
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Peran tidak valid' }, { status: 400 })
    }

    const [existing] = await sql`SELECT logo_url FROM sponsors WHERE id = ${id}`
    if (!existing) {
      return NextResponse.json({ error: 'Sponsor tidak ditemukan' }, { status: 404 })
    }

    let logoUrl = existing.logo_url

    if (file && file.size > 0) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Format file tidak didukung.' }, { status: 400 })
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: 'Ukuran file maksimal 2MB.' }, { status: 400 })
      }
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      logoUrl = `data:${file.type};base64,${base64}`
    }

    const [row] = await sql`
      UPDATE sponsors
      SET name = ${name}, logo_url = ${logoUrl}, role = ${role}, display_order = ${displayOrder}, is_active = ${isActive}
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json(row)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal mengupdate sponsor' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [existing] = await sql`SELECT id FROM sponsors WHERE id = ${id}`
    if (!existing) {
      return NextResponse.json({ error: 'Sponsor tidak ditemukan' }, { status: 404 })
    }

    await sql`DELETE FROM sponsors WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal menghapus sponsor' }, { status: 500 })
  }
}
