import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import sql from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await sql`
      SELECT
        id,
        name,
        email,
        role,
        status,
        created_at
      FROM admins
      ORDER BY id ASC
    `
    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat daftar user' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, role = 'ADMIN', status = 'ACTIVE' } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nama, Email, dan Password wajib diisi' },
        { status: 400 }
      )
    }

    // Check existing email
    const existing = await sql`
      SELECT id FROM admins WHERE email = ${email.toLowerCase().trim()}
    `
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar digunakan oleh user lain' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    const inserted = await sql`
      INSERT INTO admins (name, email, password_hash, role, status)
      VALUES (${name}, ${email.toLowerCase().trim()}, ${passwordHash}, ${role}, ${status})
      RETURNING id, name, email, role, status, created_at
    `

    return NextResponse.json({
      success: true,
      message: 'User admin berhasil ditambahkan',
      data: inserted[0],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menambahkan user' },
      { status: 500 }
    )
  }
}
