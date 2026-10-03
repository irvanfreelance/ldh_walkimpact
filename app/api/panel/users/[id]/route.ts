import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import sql from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adminId = parseInt(id, 10)
    if (isNaN(adminId)) {
      return NextResponse.json({ error: 'ID user tidak valid' }, { status: 400 })
    }

    const body = await req.json()
    const { name, email, password, role, status } = body

    let newPasswordHash: string | null = null
    if (password && password.trim() !== '') {
      newPasswordHash = await bcrypt.hash(password, 10)
    }

    const updated = await sql`
      UPDATE admins
      SET
        name = COALESCE(${name}, name),
        email = COALESCE(${email ? email.toLowerCase().trim() : null}, email),
        role = COALESCE(${role}, role),
        status = COALESCE(${status}, status),
        password_hash = CASE
          WHEN ${newPasswordHash}::text IS NOT NULL THEN ${newPasswordHash}::text
          ELSE password_hash
        END
      WHERE id = ${adminId}
      RETURNING id, name, email, role, status, created_at
    `

    if (updated.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Data user berhasil diperbarui',
      data: updated[0],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui user' },
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
    const adminId = parseInt(id, 10)
    if (isNaN(adminId)) {
      return NextResponse.json({ error: 'ID user tidak valid' }, { status: 400 })
    }

    // Ensure we don't delete the last admin
    const totalCount = await sql`SELECT count(*)::int AS count FROM admins`
    if (Number(totalCount[0]?.count || 0) <= 1) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus user terakhir dalam sistem' },
        { status: 400 }
      )
    }

    await sql`DELETE FROM admins WHERE id = ${adminId}`

    return NextResponse.json({
      success: true,
      message: 'User berhasil dihapus',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus user' },
      { status: 500 }
    )
  }
}
