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
    })
  } catch {
    return dateStr
  }
}

export function formatTimeRange(start: string, end: string): string {
  const s = start.slice(0, 5).replace(':', '.')
  const e = end.slice(0, 5).replace(':', '.')
  return `${s} – ${e} WIB`
}

export function buildWhatsAppShareUrl(registrationNumber: string): string {
  const text = `Aku baru daftar Walk Impact 2026! 🏃‍♂️\n\nWalk Together and Create Impact\n📅 7 November 2026 · 06.00 WIB\n📍 Pasar Modern Batununggal Indah, Bandung\n\nNo. Pendaftaranku: ${registrationNumber}\nYuk ikut bareng! Daftar di: https://walkimpact.id\n\n#WalkImpact2026 #LAZDarulHikam`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function buildWhatsAppHelpUrl(waNumber = '6281572225545'): string {
  const text = 'Halo Admin Walk Impact 2026, saya ingin bertanya seputar pendaftaran event.'
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`
}
