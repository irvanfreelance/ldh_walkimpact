import { NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import sql from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await req.formData()
    const name = formData.get('name') as string
    const displayOrder = parseInt((formData.get('display_order') as string) || '0', 10)
    const isActive = formData.get('is_active') === 'true'
    const file = formData.get('logo') as File | null

    if (!name) {
      return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 })
    }

    const [existing] = await sql`SELECT * FROM sponsors WHERE id = ${id}`
    if (!existing) {
      return NextResponse.json({ error: 'Sponsor tidak ditemukan' }, { status: 404 })
    }

    let logoUrl = existing.logo_url

    if (file && file.size > 0) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const allowedExts = ['png', 'jpg', 'jpeg', 'webp', 'svg']
      if (!allowedExts.includes(ext)) {
        return NextResponse.json({ error: 'Format file tidak didukung.' }, { status: 400 })
      }

      const filename = `${randomUUID()}.${ext}`
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'sponsors')
      const bytes = await file.arrayBuffer()
      await writeFile(join(uploadDir, filename), Buffer.from(bytes))
      logoUrl = `/uploads/sponsors/${filename}`

      // delete old file if it's in our uploads directory
      if (existing.logo_url?.startsWith('/uploads/sponsors/')) {
        const oldPath = join(process.cwd(), 'public', existing.logo_url)
        unlink(oldPath).catch(() => {})
      }
    }

    const [row] = await sql`
      UPDATE sponsors
      SET name = ${name}, logo_url = ${logoUrl}, display_order = ${displayOrder}, is_active = ${isActive}
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

    const [existing] = await sql`SELECT * FROM sponsors WHERE id = ${id}`
    if (!existing) {
      return NextResponse.json({ error: 'Sponsor tidak ditemukan' }, { status: 404 })
    }

    await sql`DELETE FROM sponsors WHERE id = ${id}`

    if (existing.logo_url?.startsWith('/uploads/sponsors/')) {
      const filePath = join(process.cwd(), 'public', existing.logo_url)
      unlink(filePath).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal menghapus sponsor' }, { status: 500 })
  }
}
