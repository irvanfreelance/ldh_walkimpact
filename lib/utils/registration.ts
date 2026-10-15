export type RegistrationWindowStatus = 'not_open' | 'open' | 'closed'

export function getRegistrationWindowStatus(
  opensAt: string | Date | null | undefined,
  closesAt: string | Date | null | undefined,
  now: Date = new Date()
): RegistrationWindowStatus {
  const t = now.getTime()
  const opens = opensAt ? new Date(opensAt).getTime() : NaN
  const closes = closesAt ? new Date(closesAt).getTime() : NaN

  if (!Number.isNaN(closes) && t > closes) return 'closed'
  if (!Number.isNaN(opens) && t < opens) return 'not_open'
  return 'open'
}

export function isRegistrationClosed(
  closesAt: string | Date | null | undefined,
  now: Date = new Date()
): boolean {
  return getRegistrationWindowStatus(null, closesAt, now) === 'closed'
}
