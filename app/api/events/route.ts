import { NextResponse } from 'next/server'
import {
  getActiveEvent,
  getActiveTicketTier,
  getParticipantCategories,
  getShirtSizes,
} from '@/lib/db/queries/events'
import { getQuotaFromDB } from '@/lib/db/queries/quota'

export const runtime = 'edge'

export async function GET() {
  try {
    const event = await getActiveEvent()
    if (!event) {
      return NextResponse.json({ error: 'No active event' }, { status: 404 })
    }

    const [ticketTier, categories, shirtSizes, quota] = await Promise.all([
      getActiveTicketTier(event.id),
      getParticipantCategories(),
      getShirtSizes(),
      getQuotaFromDB(event.id),
    ])

    return NextResponse.json({
      event,
      ticketTier,
      categories,
      shirtSizes,
      quota,
    })
  } catch (error) {
    console.error('Error fetching event data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
