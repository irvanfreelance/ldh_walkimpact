import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  getActiveEvent,
  getActiveTicketTier,
  getParticipantCategories,
  getShirtSizes,
} from '@/lib/db/queries/events'
import { getQuotaFromDB } from '@/lib/db/queries/quota'
import { RegistrationWizard } from '@/components/registration/RegistrationWizard'

export const dynamic = 'force-dynamic'

export default async function DaftarPage() {
  const event = await getActiveEvent()

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Pendaftaran Belum Tersedia</h1>
          <p className="text-brand-text-muted">Event saat ini belum aktif.</p>
          <Link href="/" className="mt-4 inline-block text-brand-green font-bold text-sm">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    )
  }

  const [categories, shirtSizes, ticketTier, quota] = await Promise.all([
    getParticipantCategories(),
    getShirtSizes(),
    getActiveTicketTier(event.id),
    getQuotaFromDB(event.id),
  ])

  return (
    <div className="min-h-screen bg-brand-off-white flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-brand-light-gray py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo-walk-impact.png"
              alt="Walk Impact 2026"
              width={150}
              height={45}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            <Image
              src="/images/logo-laz-darul-hikam.png"
              alt="LAZ Darul Hikam"
              width={75}
              height={30}
              className="h-7 w-auto object-contain"
            />
            <Link
              href="/"
              className="text-xs sm:text-sm font-bold text-brand-text-dark hover:text-brand-green flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-brand-green" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Registration Wizard Content */}
      <main className="flex-1">
        <RegistrationWizard
          categories={categories}
          shirtSizes={shirtSizes}
          ticketTier={ticketTier}
          quota={
            quota || {
              maxQuota: event.max_quota,
              paidCount: 0,
              remaining: event.max_quota,
              percentage: 0,
            }
          }
        />
      </main>

      {/* Minimal Footer */}
      <footer className="py-6 border-t border-brand-light-gray bg-white text-center text-xs text-brand-text-muted">
        © 2026 Walk Impact · LAZ Darul Hikam. Hak Cipta Dilindungi.
      </footer>
    </div>
  )
}
