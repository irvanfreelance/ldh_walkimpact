import type { EventSummary } from '@/lib/db/queries/events'

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatEventDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    })
  } catch {
    return dateStr
  }
}

// '06:00:00' -> '06.00 WIB'
export function formatTimeWib(time: string | null | undefined): string {
  if (!time) return ''
  return `${time.slice(0, 5).replace(':', '.')} WIB`
}

// 2026-12-02..2026-12-03 -> '2–3 Desember 2026'; across months -> '30 November – 1 Desember 2026'
export function formatDateRange(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): string | null {
  if (!start || !end) return null
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null

  const fmt = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
  const part = (d: Date, type: string) => fmt.formatToParts(d).find((p) => p.type === type)?.value ?? ''

  const [sd, sm, sy] = [part(s, 'day'), part(s, 'month'), part(s, 'year')]
  const [ed, em, ey] = [part(e, 'day'), part(e, 'month'), part(e, 'year')]

  if (sy === ey && sm === em) {
    return sd === ed ? `${sd} ${sm} ${sy}` : `${sd}–${ed} ${sm} ${sy}`
  }
  if (sy === ey) return `${sd} ${sm} – ${ed} ${em} ${sy}`
  return `${sd} ${sm} ${sy} – ${ed} ${em} ${ey}`
}

export function formatRegistrationDeadline(value: string | Date): string {
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    })
  } catch {
    return String(value)
  }
}

export function formatTimeRange(start: string, end: string): string {
  const s = start.slice(0, 5).replace(':', '.')
  const e = end.slice(0, 5).replace(':', '.')
  return `${s} – ${e} WIB`
}

export function buildWhatsAppShareUrl(registrationNumber: string, event?: EventSummary | null): string {
  const lines = ['Aku baru daftar Walk Impact 2026! 🏃‍♂️', '', 'Walk Together and Create Impact']
  if (event?.event_date) {
    const when = [formatEventDate(event.event_date), formatTimeWib(event.start_time)].filter(Boolean).join(' · ')
    lines.push(`📅 ${when}`)
  }
  if (event?.venue_name) {
    lines.push(`📍 ${[event.venue_name, event.venue_city].filter(Boolean).join(', ')}`)
  }
  lines.push(
    '',
    `No. Pendaftaranku: ${registrationNumber}`,
    'Yuk ikut bareng! Daftar di: https://walkimpact.id',
    '',
    '#WalkImpact2026 #LAZDarulHikam'
  )
  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`
}

export function buildWhatsAppHelpUrl(waNumber = '6281572225545'): string {
  const text = 'Halo Admin Walk Impact 2026, saya ingin bertanya seputar pendaftaran event.'
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`
}
