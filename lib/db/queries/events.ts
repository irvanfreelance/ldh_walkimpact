import sql from '@/lib/db/client'

export interface EventStat {
  id: number
  icon_name: string
  value: string
  label: string
  description: string | null
}

export interface EventConcept {
  id: number
  icon_name: string | null
  title: string
  body: string
}

export interface EventRundown {
  id: number
  icon_name: string | null
  start_time: string
  end_time: string
  activity: string
  description: string | null
}

export interface EventFaq {
  id: number
  question: string
  answer: string
  category: string
}

export interface ActiveEvent {
  id: number
  slug: string
  name: string
  tagline: string | null
  description: string | null
  hero_image_url: string | null
  event_date: string
  assembly_time: string
  start_time: string
  end_time: string
  timezone: string
  venue_name: string
  venue_address: string
  venue_city: string
  venue_maps_url: string | null
  route_km: string
  max_quota: number
  registration_opens_at: string
  registration_closes_at: string
  rpc_starts_at: string | null
  rpc_ends_at: string | null
  rpc_location_note: string | null
  contact_name: string | null
  contact_whatsapp: string | null
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  is_active: boolean
  stats: EventStat[]
  concepts: EventConcept[]
  rundowns: EventRundown[]
  faqs: EventFaq[]
}

export interface TicketTier {
  id: number
  event_id: number
  name: string
  description: string | null
  price: number
  max_per_order: number
  available_from: string
  available_until: string
  is_active: boolean
  sort_order: number
}

export interface ParticipantCategory {
  id: number
  slug: string
  label: string
  description: string | null
  is_active: boolean
  sort_order: number
}

export interface ShirtSize {
  id: number
  code: string
  label: string
  sort_order: number
}

export async function getActiveEvent(): Promise<ActiveEvent | null> {
  const rows = await sql`
    SELECT
      e.id,
      e.slug,
      e.name,
      e.tagline,
      e.description,
      e.hero_image_url,
      e.event_date,
      e.assembly_time,
      e.start_time,
      e.end_time,
      e.timezone,
      e.venue_name,
      e.venue_address,
      e.venue_city,
      e.venue_maps_url,
      e.route_km,
      e.max_quota,
      e.registration_opens_at,
      e.registration_closes_at,
      e.rpc_starts_at,
      e.rpc_ends_at,
      e.rpc_location_note,
      e.contact_name,
      e.contact_whatsapp,
      e.meta_title,
      e.meta_description,
      e.og_image_url,
      e.is_active,
      COALESCE(
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id',          es.id,
              'icon_name',   es.icon_name,
              'value',       es.value,
              'label',       es.label,
              'description', es.description
            ) ORDER BY es.sort_order
          )
          FROM event_stats es
          WHERE es.event_id = e.id
        ),
        '[]'::json
      ) AS stats,
      COALESCE(
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id',        ec.id,
              'icon_name', ec.icon_name,
              'title',     ec.title,
              'body',      ec.body
            ) ORDER BY ec.sort_order
          )
          FROM event_concepts ec
          WHERE ec.event_id = e.id
        ),
        '[]'::json
      ) AS concepts,
      COALESCE(
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id',         er.id,
              'icon_name',  er.icon_name,
              'start_time', er.start_time::text,
              'end_time',   er.end_time::text,
              'activity',   er.activity,
              'description', er.description
            ) ORDER BY er.sort_order
          )
          FROM event_rundowns er
          WHERE er.event_id = e.id
        ),
        '[]'::json
      ) AS rundowns,
      COALESCE(
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id',       ef.id,
              'question', ef.question,
              'answer',   ef.answer,
              'category', ef.category
            ) ORDER BY ef.sort_order
          )
          FROM event_faqs ef
          WHERE ef.event_id = e.id AND ef.is_active = TRUE
        ),
        '[]'::json
      ) AS faqs
    FROM events e
    WHERE e.is_active = TRUE
    LIMIT 1
  `
  return (rows[0] as unknown as ActiveEvent) ?? null
}

export async function getActiveTicketTier(eventId: number): Promise<TicketTier | null> {
  const rows = await sql`
    SELECT
      id, event_id, name, description,
      price::bigint AS price,
      max_per_order, available_from, available_until,
      is_active, sort_order
    FROM ticket_tiers
    WHERE event_id = ${eventId}
      AND is_active = TRUE
    ORDER BY sort_order
    LIMIT 1
  `
  if (!rows[0]) return null
  return {
    ...rows[0],
    price: Number(rows[0].price),
  } as TicketTier
}

export async function getParticipantCategories(): Promise<ParticipantCategory[]> {
  const rows = await sql`
    SELECT id, slug, label, description, is_active, sort_order
    FROM participant_categories
    WHERE is_active = TRUE
    ORDER BY sort_order ASC
  `
  return rows as unknown as ParticipantCategory[]
}

export async function getShirtSizes(): Promise<ShirtSize[]> {
  const rows = await sql`
    SELECT id, code, label, sort_order
    FROM shirt_sizes
    ORDER BY sort_order ASC
  `
  return rows as unknown as ShirtSize[]
}
