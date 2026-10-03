import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { getRegistrationByNumber } from '@/lib/db/queries/registrations'
import { TicketPDF } from '@/lib/pdf/ticket-pdf'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ error: 'Nomor pendaftaran tidak valid' }, { status: 400 })
    }

    const registration = await getRegistrationByNumber(id)
    if (!registration) {
      return NextResponse.json({ error: 'Pendaftaran tidak ditemukan' }, { status: 404 })
    }

    // Render PDF buffer using React.createElement
    const element = React.createElement(TicketPDF, { registration })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(element as any)

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="tiket-${registration.registration_number}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('Error generating ticket PDF:', error)
    return NextResponse.json({ error: 'Gagal membuat tiket PDF' }, { status: 500 })
  }
}
