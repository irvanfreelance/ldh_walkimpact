import { NextResponse } from 'next/server'
import sql from '@/lib/db/client'
import { invalidateQuotaCache } from '@/lib/cache/redis'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const regId = parseInt(id, 10)
    if (isNaN(regId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    const regRows = await sql`
      SELECT
        r.*,
        COALESCE(pc.label, '-') AS category_label,
        COALESCE(tt.name, '-')  AS ticket_tier_name
      FROM registrations r
      LEFT JOIN participant_categories pc ON pc.id = r.category_id
      LEFT JOIN ticket_tiers tt ON tt.id = r.ticket_tier_id
      WHERE r.id = ${regId}
      LIMIT 1
    `

    if (regRows.length === 0) {
      return NextResponse.json({ error: 'Registrasi tidak ditemukan' }, { status: 404 })
    }

    const registration = regRows[0]

    const participantRows = await sql`
      SELECT
        rp.id,
        rp.slot_number,
        rp.name,
        rp.gender,
        rp.bib_number,
        rp.shirt_size_id,
        ss.code AS shirt_size_code,
        ss.label AS shirt_size_label
      FROM registration_participants rp
      LEFT JOIN shirt_sizes ss ON ss.id = rp.shirt_size_id
      WHERE rp.registration_id = ${regId}
      ORDER BY rp.slot_number ASC
    `

    return NextResponse.json({
      registration,
      participants: participantRows,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat detail registrasi' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const regId = parseInt(id, 10)
    if (isNaN(regId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    const body = await req.json()
    const {
      status,
      contact_name,
      contact_whatsapp,
      contact_email,
      community_name,
      participants,
    } = body

    // 1. Update master registration
    if (status === 'paid') {
      const { markRegistrationPaid } = await import('@/lib/db/queries/registrations')
      await markRegistrationPaid(regId, new Date(), {
        paymentType: 'manual_transfer',
      })
    }

    const updateResult = await sql`
      UPDATE registrations
      SET
        status = COALESCE(${status}, status),
        contact_name = COALESCE(${contact_name}, contact_name),
        contact_whatsapp = COALESCE(${contact_whatsapp}, contact_whatsapp),
        contact_email = COALESCE(${contact_email}, contact_email),
        community_name = COALESCE(${community_name}, community_name),
        paid_at = CASE
          WHEN ${status} = 'paid' AND paid_at IS NULL THEN NOW()
          WHEN ${status} != 'paid' AND ${status} IS NOT NULL THEN NULL
          ELSE paid_at
        END,
        updated_at = NOW()
      WHERE id = ${regId}
      RETURNING id, registration_number, status, paid_at
    `

    if (updateResult.length === 0) {
      return NextResponse.json({ error: 'Registrasi tidak ditemukan' }, { status: 404 })
    }

    // 2. Update participants if provided
    if (Array.isArray(participants)) {
      for (const p of participants) {
        if (p.id) {
          await sql`
            UPDATE registration_participants
            SET
              name = ${p.name ?? null},
              gender = ${p.gender ?? null},
              bib_number = ${p.bib_number ?? null},
              shirt_size_id = ${p.shirt_size_id ? parseInt(p.shirt_size_id, 10) : null}
            WHERE id = ${p.id} AND registration_id = ${regId}
          `
        }
      }
    }

    // Always invalidate quota cache on update
    await invalidateQuotaCache()

    return NextResponse.json({
      success: true,
      message: 'Data registrasi berhasil diperbarui',
      data: updateResult[0],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui registrasi' },
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
    const regId = parseInt(id, 10)
    if (isNaN(regId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    await sql`DELETE FROM registration_participants WHERE registration_id = ${regId}`
    await sql`DELETE FROM registrations WHERE id = ${regId}`

    await invalidateQuotaCache()

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil dihapus',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus registrasi' },
      { status: 500 }
    )
  }
}
